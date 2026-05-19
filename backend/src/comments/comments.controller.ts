import { Controller, Post, Get, Delete, Param, ParseIntPipe, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  commentText: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  parentCommentId?: number;
}

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post('tasks/:taskId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a comment on a task' })
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Request() req,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, req.user.id, dto.commentText, dto.parentCommentId);
  }

  @Get('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Get comments for a task' })
  findByTask(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.commentsService.findByTask(taskId);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own comment (or admin deletes any)' })
  delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.commentsService.delete(id, req.user.id);
  }
}
