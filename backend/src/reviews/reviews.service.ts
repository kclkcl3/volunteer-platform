import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(taskId: number, reviewerId: number, rating: number, reviewText?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { taskStatus: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    if (task.taskStatus.name !== 'completed') {
      throw new BadRequestException('Отзыв можно оставить только по завершённой задаче');
    }
    if (task.customerStudentId !== reviewerId) {
      throw new ForbiddenException('Только заказчик может оставить отзыв');
    }
    if (!task.executorStudentId) {
      throw new BadRequestException('У задачи нет исполнителя');
    }

    const existing = await this.prisma.review.findUnique({ where: { taskId } });
    if (existing) throw new ConflictException('Отзыв для этой задачи уже существует');

    return this.prisma.review.create({
      data: {
        taskId,
        reviewerStudentId: reviewerId,
        reviewedStudentId: task.executorStudentId,
        rating,
        reviewText,
      },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        reviewed: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getByStudent(studentId: number) {
    return this.prisma.review.findMany({
      where: { reviewedStudentId: studentId },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
