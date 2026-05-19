import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResponsesService {
  constructor(private prisma: PrismaService) {}

  async create(taskId: number, studentId: number, commentText: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, deleted: false },
      include: { taskStatus: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    if (task.taskStatus.name !== 'published') {
      throw new BadRequestException('Откликаться можно только на опубликованные задачи');
    }
    if (task.customerStudentId === studentId) {
      throw new ForbiddenException('Нельзя откликнуться на собственную задачу');
    }

    const existing = await this.prisma.response.findUnique({
      where: { taskId_responderStudentId: { taskId, responderStudentId: studentId } },
    });
    if (existing) throw new ConflictException('Вы уже откликнулись на эту задачу');

    const pendingStatus = await this.prisma.responseStatus.findUnique({ where: { name: 'pending' } });

    return this.prisma.response.create({
      data: {
        taskId,
        responderStudentId: studentId,
        responseStatusId: pendingStatus!.id,
        commentText,
      },
      include: {
        responder: { select: { id: true, firstName: true, lastName: true, email: true } },
        responseStatus: true,
      },
    });
  }

  async findByTask(taskId: number, requestingStudentId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, deleted: false },
      include: { taskStatus: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    if (task.customerStudentId !== requestingStudentId) {
      throw new ForbiddenException('Только заказчик может просматривать отклики');
    }

    return this.prisma.response.findMany({
      where: { taskId },
      include: {
        responder: {
          select: { id: true, firstName: true, lastName: true, email: true, studentSkills: { include: { skill: true } } },
        },
        responseStatus: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(responseId: number, studentId: number) {
    const response = await this.prisma.response.findUnique({
      where: { id: responseId },
      include: { task: { include: { taskStatus: true } } },
    });
    if (!response) throw new NotFoundException('Отклик не найден');
    if (response.responderStudentId !== studentId) {
      throw new ForbiddenException('Это не ваш отклик');
    }
    if (!['draft', 'published'].includes(response.task.taskStatus.name)) {
      throw new ForbiddenException('Нельзя отозвать отклик после выбора исполнителя');
    }

    return this.prisma.response.delete({ where: { id: responseId } });
  }
}
