import { Controller, Post, Get, Delete, Param, ParseIntPipe, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ResponsesService } from './responses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class CreateResponseDto {
  @ApiProperty({ example: 'Я умею работать с SQL, помогу!' })
  @IsString()
  @MinLength(5)
  commentText: string;
}

@ApiTags('responses')
@Controller()
export class ResponsesController {
  constructor(private responsesService: ResponsesService) {}

  @Post('tasks/:taskId/responses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to a published task' })
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Request() req,
    @Body() dto: CreateResponseDto,
  ) {
    return this.responsesService.create(taskId, req.user.id, dto.commentText);
  }

  @Get('tasks/:taskId/responses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all responses for a task (customer only)' })
  findByTask(@Param('taskId', ParseIntPipe) taskId: number, @Request() req) {
    return this.responsesService.findByTask(taskId, req.user.id);
  }

  @Delete('responses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw my response' })
  delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.responsesService.delete(id, req.user.id);
  }
}
