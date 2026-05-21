import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto, PinCommentDto, UpdateCommentDto } from './dto/comment.dto';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('tasks/:taskId/comments')
  list(@Param('taskId') taskId: string) {
    return this.comments.list(taskId);
  }

  @Post('tasks/:taskId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateCommentDto) {
    return this.comments.create(taskId, user.id, dto);
  }

  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateCommentDto) {
    return this.comments.update(id, user.id, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  softDelete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.comments.softDelete(id, user.id, user.role);
  }

  @Delete('comments/:id/force')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  forceDelete(@Param('id') id: string) {
    return this.comments.forceDelete(id);
  }

  @Patch('comments/:id/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  pin(@Param('id') id: string, @Body() dto: PinCommentDto) {
    return this.comments.pin(id, dto.isPinned);
  }
}
