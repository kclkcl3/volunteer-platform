import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const [tasksByStatus, topHelpers, averageRatings, tasksByCategory, deadlineSoon, overdue, activeUsers] =
      await this.prisma.$transaction([
        this.prisma.task.groupBy({ by: ['status'], where: { deletedAt: null }, _count: true, orderBy: { status: 'asc' } }),
        this.prisma.user.findMany({
          where: { deletedAt: null, isBlocked: false },
          select: { id: true, firstName: true, lastName: true, rating: true, completedTasksCount: true },
          orderBy: [{ completedTasksCount: 'desc' }, { rating: 'desc' }],
          take: 10,
        }),
        this.prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
        this.prisma.task.groupBy({ by: ['categoryId'], where: { deletedAt: null }, _count: true, orderBy: { categoryId: 'asc' } }),
        this.prisma.task.findMany({
          where: { deletedAt: null, status: { in: [TaskStatus.published, TaskStatus.executor_selected, TaskStatus.in_progress, TaskStatus.on_review] }, deadline: { gte: now, lte: in24h } },
          select: { id: true, title: true, deadline: true, status: true },
          orderBy: { deadline: 'asc' },
        }),
        this.prisma.task.findMany({
          where: { deletedAt: null, status: { not: TaskStatus.completed }, deadline: { lt: now } },
          select: { id: true, title: true, deadline: true, status: true },
          orderBy: { deadline: 'asc' },
        }),
        this.prisma.user.count({ where: { deletedAt: null, lastSeenAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } }),
      ]);
    return { tasksByStatus, topHelpers, averageRatings, tasksByCategory, deadlineSoon, overdue, activeUsers };
  }

  async publishedByDate(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.task.findMany({
      where: { publishedAt: { gte: since }, deletedAt: null },
      select: { publishedAt: true },
      orderBy: { publishedAt: 'asc' },
    });
    return rows.reduce<Record<string, number>>((acc, row) => {
      const key = row.publishedAt?.toISOString().slice(0, 10) ?? 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }
}
