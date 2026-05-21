import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  create(data: Prisma.NotificationUncheckedCreateInput) {
    return this.prisma.notification.create({ data });
  }

  async notifyMatchingSkills(taskId: string, skillIds: string[], customerId: string, title: string) {
    if (!skillIds.length) return { count: 0 };
    const students = await this.prisma.studentSkill.findMany({
      where: { skillId: { in: skillIds }, userId: { not: customerId }, user: { isBlocked: false, deletedAt: null } },
      distinct: ['userId'],
      select: { userId: true },
    });
    if (!students.length) return { count: 0 };
    await this.prisma.notification.createMany({
      data: students.map((student) => ({
        userId: student.userId,
        taskId,
        type: NotificationType.task_published_matching_skills,
        title: 'New matching task',
        body: `Task "${title}" matches your skills`,
      })),
      skipDuplicates: true,
    });
    return { count: students.length };
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.update({ where: { id, userId }, data: { readAt: new Date() } });
  }
}
