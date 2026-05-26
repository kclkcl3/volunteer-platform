import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  middleName: true,
  email: true,
  avatar: true,
  bio: true,
  role: true,
  rating: true,
  completedTasksCount: true,
  registrationDate: true,
  lastSeenAt: true,
  skills: { include: { skill: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  me(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select: userSelect });
  }

  updateMe(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id }, data: dto, select: userSelect });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSelect });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  top(limit = 10) {
    return this.prisma.user.findMany({
      where: { deletedAt: null, isBlocked: false },
      select: userSelect,
      orderBy: [{ rating: 'desc' }, { completedTasksCount: 'desc' }],
      take: limit,
    });
  }

  addSkill(userId: string, skillId: string) {
    return this.prisma.studentSkill.upsert({
      where: { userId_skillId: { userId, skillId } },
      update: {},
      create: { userId, skillId },
      include: { skill: true },
    });
  }

  removeSkill(userId: string, skillId: string) {
    return this.prisma.studentSkill.delete({ where: { userId_skillId: { userId, skillId } } });
  }

  async getProfileStats(userId: string) {
    const baseUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId, deletedAt: null, isBlocked: false },
      select: userSelect,
    });

    const [reviewsGot, executorTasks, customerTasks, responses] = await Promise.all([
      this.prisma.review.findMany({
        where: { reviewedId: userId },
        select: {
          rating: true,
          text: true,
          createdAt: true,
          task: { select: { title: true } },
          reviewerId: true,
        },
      }),
      this.prisma.task.findMany({
        where: { executorId: userId, status: 'completed' },
        select: { id: true, title: true, deadline: true },
      }),
      this.prisma.task.findMany({
        where: { customerId: userId, status: 'completed' },
        select: { id: true, title: true },
      }),
      this.prisma.response.findMany({
        where: { responderId: userId },
        select: { id: true, status: true, task: { select: { title: true, status: true } } },
      }),
    ]);

    const avgRating = reviewsGot.length
      ? reviewsGot.reduce((sum, r) => sum + r.rating, 0) / reviewsGot.length
      : 0;

    return {
      ...baseUser,
      reviewsGot,
      calculatedRating: Number(avgRating.toFixed(2)),
      completedAsExecutor: executorTasks.length,
      completedAsCreator: customerTasks.length,
      totalResponses: responses.length,
    };
  }

  async updateRatingAfterReview(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { reviewedId: userId },
      select: { rating: true },
    });
    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { rating: Number(avgRating.toFixed(2)) },
      select: userSelect,
    });
  }
}
