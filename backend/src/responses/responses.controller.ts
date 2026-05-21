import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateResponseDto } from './dto/response.dto';
import { ResponsesService } from './responses.service';

@ApiTags('responses')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResponsesController {
  constructor(private readonly responses: ResponsesService) {}

  @Post('tasks/:taskId/responses')
  create(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateResponseDto) {
    return this.responses.create(taskId, user.id, dto);
  }

  @Get('tasks/:taskId/responses')
  byTask(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser) {
    return this.responses.byTask(taskId, user.id);
  }

  @Get('responses/my')
  myResponses(@CurrentUser() user: AuthUser) {
    return this.responses.myResponses(user.id);
  }

  @Delete('responses/:id')
  withdraw(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.responses.withdraw(id, user.id);
  }
}
