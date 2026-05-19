import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const authorSelect = { id: true, firstName: true, lastName: true };

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(taskId: number, studentId: number, commentText: string, parentCommentId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, deleted: false },
      include: { taskStatus: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');

    const isParticipant =
      task.customerStudentId === studentId || task.executorStudentId === studentId;
    if (task.taskStatus.name === 'draft' && !isParticipant) {
      throw new ForbiddenException('Нельзя комментировать черновики');
    }

    if (parentCommentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: parentCommentId } });
      if (!parent || parent.taskId !== taskId)
        throw new NotFoundException('Родительский комментарий не найден');
    }

    return this.prisma.comment.create({
      data: {
        taskId,
        authorStudentId: studentId,
        commentText,
        parentCommentId: parentCommentId || null,
      },
      include: {
        author: { select: authorSelect },
        replies: {
          where: { deleted: false },
          include: { author: { select: authorSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findByTask(taskId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId, deleted: false } });
    if (!task) throw new NotFoundException('Задача не найдена');

    return this.prisma.comment.findMany({
      where: { taskId, deleted: false, parentCommentId: null },
      include: {
        author: { select: authorSelect },
        replies: {
          where: { deleted: false },
          include: { author: { select: authorSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async delete(commentId: number, studentId: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.deleted) throw new NotFoundException('Комментарий не найден');

    if (comment.authorStudentId !== studentId) {
      throw new ForbiddenException('Это не ваш комментарий');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { deleted: true, deletedAt: new Date() },
    });
  }
}
