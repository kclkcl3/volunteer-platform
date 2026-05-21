import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(taskId: string, authorId: string, dto: CreateCommentDto) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
    if (!task) throw new NotFoundException('Task not found');
    const comment = await this.prisma.comment.create({
      data: { taskId, authorId, parentId: dto.parentId, body: dto.body },
      include: { author: { select: { id: true, firstName: true, lastName: true } }, replies: true },
    });
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (parent && parent.authorId !== authorId) {
        await this.notifications.create({
          userId: parent.authorId,
          taskId,
          type: NotificationType.comment_reply,
          title: 'New reply',
          body: 'Someone replied to your comment',
        });
      }
    }
    return comment;
  }

  list(taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId, parentId: null },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        replies: { include: { author: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async update(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Only author can edit comment');
    return this.prisma.comment.update({ where: { id }, data: { body: dto.body, editedAt: new Date() } });
  }

  async softDelete(id: string, userId: string, role: UserRole) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (role !== UserRole.admin && comment.authorId !== userId) throw new ForbiddenException('Only author or admin can delete comment');
    return this.prisma.comment.update({ where: { id }, data: { deletedAt: new Date(), body: '[deleted]' } });
  }

  forceDelete(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }

  pin(id: string, isPinned: boolean) {
    return this.prisma.comment.update({ where: { id }, data: { isPinned } });
  }
}
