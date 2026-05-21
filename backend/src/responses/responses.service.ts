import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, ResponseStatus, TaskStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResponseDto } from './dto/response.dto';

@Injectable()
export class ResponsesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(taskId: string, responderId: string, dto: CreateResponseDto) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.customerId === responderId) throw new BadRequestException('Student cannot respond to own task');
    if (task.status !== TaskStatus.published) throw new BadRequestException('Responses are allowed only for published tasks');
    const response = await this.prisma.response.create({
      data: {
        taskId,
        responderId,
        message: dto.message,
        statusHistory: { create: { toStatus: ResponseStatus.pending, changedById: responderId } },
      },
      include: { responder: { select: { id: true, firstName: true, lastName: true, rating: true, completedTasksCount: true } } },
    });
    await this.notifications.create({
      userId: task.customerId,
      taskId,
      type: NotificationType.new_response,
      title: 'New response',
      body: `A student responded to "${task.title}"`,
    });
    return response;
  }

  async byTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.customerId !== userId && task.executorId !== userId) throw new ForbiddenException('Only task participants can see responses');
    return this.prisma.response.findMany({
      where: { taskId },
      include: { responder: { select: { id: true, firstName: true, lastName: true, rating: true, completedTasksCount: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  myResponses(userId: string) {
    return this.prisma.response.findMany({
      where: { responderId: userId },
      include: { task: { include: { category: true, skills: { include: { skill: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async withdraw(id: string, userId: string) {
    const response = await this.prisma.response.findUnique({ where: { id } });
    if (!response) throw new NotFoundException('Response not found');
    if (response.responderId !== userId) throw new ForbiddenException('Response belongs only to its author');
    if (response.status !== ResponseStatus.pending) throw new BadRequestException('Only pending response can be withdrawn');
    return this.prisma.response.update({
      where: { id },
      data: {
        status: ResponseStatus.withdrawn,
        withdrawnAt: new Date(),
        statusHistory: { create: { fromStatus: response.status, toStatus: ResponseStatus.withdrawn, changedById: userId } },
      },
    });
  }
}
