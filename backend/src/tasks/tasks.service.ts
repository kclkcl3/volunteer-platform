import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto/task.dto';

const STATUS_ORDER = [
  'draft',
  'published',
  'executor_selected',
  'in_progress',
  'on_review',
  'completed',
];

const taskInclude = {
  category: true,
  taskStatus: true,
  customer: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  executor: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  taskSkills: { include: { skill: true } },
  review: true,
  _count: { select: { responses: true, comments: true } },
};

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private async getStatusByName(name: string) {
    const status = await this.prisma.taskStatus.findUnique({ where: { name } });
    if (!status) throw new Error(`Task status "${name}" not seeded`);
    return status;
  }

  async create(studentId: number, dto: CreateTaskDto) {
    if (new Date(dto.deadline) <= new Date()) {
      throw new BadRequestException('Дедлайн должен быть в будущем');
    }

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Категория не найдена');

    const initialStatus = await this.getStatusByName(
      dto.publishImmediately ? 'published' : 'draft',
    );

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        deadline: new Date(dto.deadline),
        categoryId: dto.categoryId,
        taskStatusId: initialStatus.id,
        customerStudentId: studentId,
        taskSkills: dto.skillIds?.length
          ? { create: dto.skillIds.map((skillId) => ({ skillId })) }
          : undefined,
      },
      include: taskInclude,
    });
  }

  async findAll(query: TaskQueryDto, requestingStudentId?: number) {
    const { categoryId, skillId, search, page = 1, limit = 10, deadlineSoon } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const draftStatus = await this.getStatusByName('draft');

    // Visibility: all non-drafts + own drafts
    const visibilityConditions: any[] = [{ taskStatusId: { not: draftStatus.id } }];
    if (requestingStudentId) {
      visibilityConditions.push({ customerStudentId: requestingStudentId });
    }

    const andClauses: any[] = [];

    if (categoryId) andClauses.push({ categoryId: Number(categoryId) });

    if (skillId) {
      andClauses.push({ taskSkills: { some: { skillId: Number(skillId) } } });
    }

    if (search) {
      andClauses.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (deadlineSoon === 'true' || deadlineSoon === true) {
      const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
      andClauses.push({ deadline: { lte: in24h, gte: new Date() } });
    }

    const where: any = {
      deleted: false,
      OR: visibilityConditions,
      ...(andClauses.length > 0 ? { AND: andClauses } : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: Number(limit),
      }),
      this.prisma.task.count({ where }),
    ]);

    return { tasks, total, page: Number(page), limit: Number(limit) };
  }

  async findOne(id: number, requestingStudentId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id, deleted: false },
      include: taskInclude,
    });
    if (!task) throw new NotFoundException('Задача не найдена');

    const isDraft = task.taskStatus.name === 'draft';
    if (isDraft && task.customerStudentId !== requestingStudentId) {
      throw new ForbiddenException('Черновики видны только автору');
    }

    return task;
  }

  async update(id: number, studentId: number, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id, deleted: false },
      include: { taskStatus: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    if (task.customerStudentId !== studentId) throw new ForbiddenException('Это не ваша задача');
    if (task.taskStatus.name !== 'draft') {
      throw new ForbiddenException('Редактировать можно только черновики');
    }

    if (dto.deadline && new Date(dto.deadline) <= new Date()) {
      throw new BadRequestException('Дедлайн должен быть в будущем');
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.deadline && { deadline: new Date(dto.deadline) }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.skillIds !== undefined && {
          taskSkills: {
            deleteMany: {},
            create: dto.skillIds.map((skillId) => ({ skillId })),
          },
        }),
        updatedAt: new Date(),
      },
      include: taskInclude,
    });
  }

  async delete(id: number, studentId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id, deleted: false },
      include: { taskStatus: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    if (task.customerStudentId !== studentId) throw new ForbiddenException('Это не ваша задача');

    if (!['draft', 'published'].includes(task.taskStatus.name)) {
      throw new ForbiddenException('Нельзя удалить задачу после выбора исполнителя');
    }

    return this.prisma.task.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  async advanceStatus(id: number, studentId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id, deleted: false },
      include: { taskStatus: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');

    const currentStatus = task.taskStatus.name;
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === STATUS_ORDER.length - 1) {
      throw new BadRequestException('Задача уже в финальном статусе');
    }

    const nextStatusName = STATUS_ORDER[currentIndex + 1];
    const isCustomer = task.customerStudentId === studentId;
    const isExecutor = task.executorStudentId === studentId;

    // Права на переходы
    if (currentStatus === 'draft' && !isCustomer)
      throw new ForbiddenException('Только заказчик может опубликовать задачу');
    if (currentStatus === 'published')
      throw new BadRequestException('Выберите исполнителя из откликов для продолжения');
    if (currentStatus === 'executor_selected' && !isExecutor)
      throw new ForbiddenException('Только исполнитель может начать работу');
    if (currentStatus === 'in_progress' && !isExecutor)
      throw new ForbiddenException('Только исполнитель может отправить работу на проверку');
    if (currentStatus === 'on_review' && !isCustomer)
      throw new ForbiddenException('Только заказчик может завершить задачу');

    const nextStatus = await this.getStatusByName(nextStatusName);
    return this.prisma.task.update({
      where: { id },
      data: { taskStatusId: nextStatus.id },
      include: taskInclude,
    });
  }

  // Заказчик отклоняет работу и отправляет обратно на доработку
  async rejectWork(id: number, studentId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id, deleted: false },
      include: { taskStatus: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    if (task.customerStudentId !== studentId)
      throw new ForbiddenException('Только заказчик может отклонить работу');
    if (task.taskStatus.name !== 'on_review')
      throw new BadRequestException('Отклонить можно только задачу со статусом "На проверке"');

    const inProgressStatus = await this.getStatusByName('in_progress');
    return this.prisma.task.update({
      where: { id },
      data: { taskStatusId: inProgressStatus.id },
      include: taskInclude,
    });
  }

  async selectExecutor(taskId: number, customerId: number, executorId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, deleted: false },
      include: { taskStatus: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    if (task.customerStudentId !== customerId) throw new ForbiddenException('Это не ваша задача');
    if (task.taskStatus.name !== 'published') {
      throw new BadRequestException('Выбрать исполнителя можно только для опубликованной задачи');
    }

    const response = await this.prisma.response.findUnique({
      where: { taskId_responderStudentId: { taskId, responderStudentId: executorId } },
    });
    if (!response) throw new BadRequestException('Этот студент не откликался на задачу');

    const acceptedStatus = await this.prisma.responseStatus.findUnique({ where: { name: 'accepted' } });
    const rejectedStatus = await this.prisma.responseStatus.findUnique({ where: { name: 'rejected' } });
    const executorSelectedStatus = await this.getStatusByName('executor_selected');

    await this.prisma.response.updateMany({
      where: { taskId, responderStudentId: { not: executorId } },
      data: { responseStatusId: rejectedStatus!.id },
    });
    await this.prisma.response.update({
      where: { taskId_responderStudentId: { taskId, responderStudentId: executorId } },
      data: { responseStatusId: acceptedStatus!.id },
    });

    return this.prisma.task.update({
      where: { id: taskId },
      data: { executorStudentId: executorId, taskStatusId: executorSelectedStatus.id },
      include: taskInclude,
    });
  }

  async getRecommendedForStudent(studentId: number) {
    const studentSkills = await this.prisma.studentSkill.findMany({
      where: { studentId },
      select: { skillId: true },
    });
    const skillIds = studentSkills.map((s) => s.skillId);
    const publishedStatus = await this.getStatusByName('published');

    return this.prisma.task.findMany({
      where: {
        deleted: false,
        taskStatusId: publishedStatus.id,
        customerStudentId: { not: studentId },
        ...(skillIds.length ? { taskSkills: { some: { skillId: { in: skillIds } } } } : {}),
      },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getMyTasks(studentId: number) {
    return this.prisma.task.findMany({
      where: {
        deleted: false,
        OR: [{ customerStudentId: studentId }, { executorStudentId: studentId }],
      },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompletedByStudent(studentId: number) {
    const completedStatus = await this.getStatusByName('completed');
    return this.prisma.task.findMany({
      where: {
        deleted: false,
        taskStatusId: completedStatus.id,
        OR: [{ customerStudentId: studentId }, { executorStudentId: studentId }],
      },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
}
