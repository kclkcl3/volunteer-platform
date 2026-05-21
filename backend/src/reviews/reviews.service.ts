import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, TaskStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(taskId: string, reviewerId: string, dto: CreateReviewDto) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, deletedAt: null }, include: { review: true } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.customerId !== reviewerId) throw new ForbiddenException('Only customer can leave review');
    if (task.status !== TaskStatus.completed || !task.executorId) throw new BadRequestException('Review is allowed only for completed task');
    if (task.review) throw new BadRequestException('Task already has review');
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: { taskId, reviewerId, reviewedId: task.executorId!, rating: dto.rating, text: dto.text },
      });
      const aggregate = await tx.review.aggregate({ where: { reviewedId: task.executorId! }, _avg: { rating: true } });
      const completedTasksCount = await tx.task.count({
        where: { executorId: task.executorId!, status: TaskStatus.completed, deletedAt: null },
      });
      await tx.user.update({
        where: { id: task.executorId! },
        data: { rating: aggregate._avg.rating ?? 0, completedTasksCount },
      });
      await tx.notification.create({
        data: {
          userId: task.executorId!,
          taskId,
          type: NotificationType.task_reviewed,
          title: 'New review',
          body: `You received a ${dto.rating}/5 review`,
        },
      });
      return review;
    });
  }

  byUser(userId: string) {
    return this.prisma.review.findMany({
      where: { reviewedId: userId },
      include: { reviewer: { select: { id: true, firstName: true, lastName: true } }, task: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
