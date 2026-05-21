import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, ResponseStatus, TaskStatus, UserRole } from '@prisma/client';
import { getPagination } from '../common/pagination/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto';
import { assertTaskTransition } from './workflow';

const taskInclude = {
  category: true,
  skills: { include: { skill: true } },
  customer: { select: { id: true, firstName: true, lastName: true, rating: true, completedTasksCount: true } },
  executor: { select: { id: true, firstName: true, lastName: true, rating: true, completedTasksCount: true } },
  responses: {
    include: { responder: { select: { id: true, firstName: true, lastName: true, rating: true, completedTasksCount: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  review: true,
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
  _count: { select: { comments: true, responses: true } },
} satisfies Prisma.TaskInclude;

const ACTIVE_STATUSES: TaskStatus[] = [
  TaskStatus.published,
  TaskStatus.executor_selected,
  TaskStatus.in_progress,
  TaskStatus.on_review,
];

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(customerId: string, dto: CreateTaskDto) {
    this.ensureDeadlineIsValid(dto.deadline);
    await this.ensureCategoryAndSkills(dto.categoryId, dto.skillIds);
    const status = dto.publishImmediately ? TaskStatus.published : TaskStatus.draft;
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        deadline: new Date(dto.deadline),
        status,
        publishedAt: status === TaskStatus.published ? new Date() : null,
        categoryId: dto.categoryId,
        customerId,
        skills: { create: dto.skillIds.map((skillId) => ({ skillId })) },
        statusHistory: { create: { toStatus: status, changedById: customerId, reason: 'created' } },
      },
      include: taskInclude,
    });
    if (status === TaskStatus.published) {
      await this.notifications.notifyMatchingSkills(task.id, dto.skillIds, customerId, task.title);
    }
    return task;
  }

  async findAll(query: TaskQueryDto, userId?: string, role?: UserRole) {
    const where = this.buildWhere(query, userId, role);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: taskInclude,
        ...getPagination(query),
        orderBy: { [query.sortBy]: query.order },
      }),
      this.prisma.task.count({ where }),
    ]);
    return { items, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string, userId?: string, role?: UserRole) {
    const task = await this.prisma.task.findFirst({ where: { id, deletedAt: null }, include: taskInclude });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status === TaskStatus.draft && task.customerId !== userId && role !== UserRole.admin) {
      throw new ForbiddenException('Draft tasks are visible only to owner');
    }
    return task;
  }

  async myTasks(userId: string, status?: TaskStatus) {
    return this.prisma.task.findMany({
      where: { deletedAt: null, status, OR: [{ customerId: userId }, { executorId: userId }] },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.findOwnedTask(id, userId);
    if (task.status !== TaskStatus.draft) throw new ForbiddenException('Only draft tasks can be edited');
    if (dto.deadline) this.ensureDeadlineIsValid(dto.deadline);
    if (dto.categoryId || dto.skillIds) await this.ensureCategoryAndSkills(dto.categoryId ?? task.categoryId, dto.skillIds ?? []);
    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        skills: dto.skillIds ? { deleteMany: {}, create: dto.skillIds.map((skillId) => ({ skillId })) } : undefined,
      },
      include: taskInclude,
    });
  }

  async remove(id: string, userId: string, role: UserRole) {
    const task = await this.prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!task) throw new NotFoundException('Task not found');
    if (role !== UserRole.admin && task.customerId !== userId) throw new ForbiddenException('Only owner can delete task');
    const deletableStatuses: TaskStatus[] = [TaskStatus.draft, TaskStatus.published];
    if (role !== UserRole.admin && !deletableStatuses.includes(task.status)) {
      throw new ForbiddenException('Cannot delete task after executor selection');
    }
    return this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  publish(id: string, userId: string) {
    return this.transition(id, userId, TaskStatus.published, 'publish');
  }

  start(id: string, userId: string) {
    return this.transition(id, userId, TaskStatus.in_progress, 'start');
  }

  sendToReview(id: string, userId: string) {
    return this.transition(id, userId, TaskStatus.on_review, 'send_to_review');
  }

  approve(id: string, userId: string) {
    return this.transition(id, userId, TaskStatus.completed, 'approve');
  }

  requestRework(id: string, userId: string, reason?: string) {
    return this.transition(id, userId, TaskStatus.in_progress, reason ?? 'request_rework', true);
  }

  async selectExecutor(taskId: string, customerId: string, responseId: string) {
    const task = await this.findOwnedTask(taskId, customerId);
    if (task.status !== TaskStatus.published) throw new BadRequestException('Executor can be selected only for published task');
    const response = await this.prisma.response.findUnique({ where: { id: responseId } });
    if (!response || response.taskId !== taskId || response.status !== ResponseStatus.pending) {
      throw new BadRequestException('Pending response not found for this task');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.response.updateMany({
        where: { taskId, id: { not: responseId }, status: ResponseStatus.pending },
        data: { status: ResponseStatus.rejected },
      });
      await tx.response.update({
        where: { id: responseId },
        data: {
          status: ResponseStatus.accepted,
          statusHistory: { create: { fromStatus: ResponseStatus.pending, toStatus: ResponseStatus.accepted, changedById: customerId } },
        },
      });
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          executorId: response.responderId,
          status: TaskStatus.executor_selected,
          statusHistory: {
            create: { fromStatus: TaskStatus.published, toStatus: TaskStatus.executor_selected, changedById: customerId },
          },
          notifications: {
            create: {
              userId: response.responderId,
              type: NotificationType.executor_selected,
              title: 'You were selected',
              body: `You were selected for "${task.title}"`,
            },
          },
        },
        include: taskInclude,
      });
      return updated;
    });
  }

  async recommended(userId: string) {
    const skillIds = (await this.prisma.studentSkill.findMany({ where: { userId }, select: { skillId: true } })).map((s) => s.skillId);
    return this.prisma.task.findMany({
      where: {
        deletedAt: null,
        status: TaskStatus.published,
        customerId: { not: userId },
        skills: skillIds.length ? { some: { skillId: { in: skillIds } } } : undefined,
      },
      include: taskInclude,
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
      take: 30,
    });
  }

  private async transition(id: string, userId: string, next: TaskStatus, reason: string, allowBack = false) {
    const task = await this.prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!task) throw new NotFoundException('Task not found');
    assertTaskTransition(task, userId, next, allowBack);
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: next,
        publishedAt: next === TaskStatus.published ? new Date() : undefined,
        statusHistory: { create: { fromStatus: task.status, toStatus: next, changedById: userId, reason } },
      },
      include: taskInclude,
    });
    if (next === TaskStatus.completed && task.executorId) {
      await this.notifications.create({
        userId: task.executorId,
        taskId: task.id,
        type: NotificationType.task_completed,
        title: 'Task completed',
        body: `Task "${task.title}" was completed`,
      });
    }
    return updated;
  }

  private buildWhere(query: TaskQueryDto, userId?: string, role?: UserRole): Prisma.TaskWhereInput {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return {
      deletedAt: null,
      AND: [
        role === UserRole.admin
          ? {}
          : { OR: [{ status: { not: TaskStatus.draft } }, ...(userId ? [{ customerId: userId }] : [])] },
        query.myTasks && userId ? { OR: [{ customerId: userId }, { executorId: userId }] } : {},
        query.activeOnly ? { status: { in: ACTIVE_STATUSES } } : {},
        query.status ? { status: query.status } : {},
        query.categoryId ? { categoryId: query.categoryId } : {},
        query.skillIds?.length ? { skills: { some: { skillId: { in: query.skillIds } } } } : {},
        query.deadlineSoon ? { deadline: { gte: now, lte: in24h } } : {},
        query.search
          ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] }
          : {},
      ],
    };
  }

  private async findOwnedTask(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.customerId !== userId) throw new ForbiddenException('Only customer can perform this action');
    return task;
  }

  private ensureDeadlineIsValid(deadline: string) {
    if (new Date(deadline).getTime() < Date.now()) throw new BadRequestException('Publication date must be before deadline');
  }

  private async ensureCategoryAndSkills(categoryId: string, skillIds: string[]) {
    const [category, skills] = await Promise.all([
      this.prisma.category.findUnique({ where: { id: categoryId } }),
      skillIds.length ? this.prisma.skill.count({ where: { id: { in: skillIds } } }) : Promise.resolve(0),
    ]);
    if (!category) throw new BadRequestException('Category not found');
    if (skills !== skillIds.length) throw new BadRequestException('One or more skills not found');
  }
}
