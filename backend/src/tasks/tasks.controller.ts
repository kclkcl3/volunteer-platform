import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List published tasks (paginated)' })
  findAll(@Query() query: TaskQueryDto, @Request() req) {
    const studentId = req.user?.id;
    return this.tasksService.findAll(query, studentId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my tasks (as customer or executor)' })
  getMyTasks(@Request() req) {
    return this.tasksService.getMyTasks(req.user.id);
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tasks recommended for me based on my skills' })
  getRecommended(@Request() req) {
    return this.tasksService.getRecommendedForStudent(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.findOne(id, req.user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new task' })
  create(@Request() req, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update task (draft only)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete task (draft/published only)' })
  delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.delete(id, req.user.id);
  }

  @Post(':id/reject-work')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject work and send back to in_progress (customer only)' })
  rejectWork(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.rejectWork(id, req.user.id);
  }

  @Get('completed/student/:studentId')
  @ApiOperation({ summary: 'Get completed tasks for a student' })
  getCompletedByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.tasksService.getCompletedByStudent(studentId);
  }

  @Post(':id/advance-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Advance task to next status in workflow' })
  advanceStatus(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.advanceStatus(id, req.user.id);
  }

  @Post(':id/select-executor/:executorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select executor from respondents' })
  selectExecutor(
    @Param('id', ParseIntPipe) id: number,
    @Param('executorId', ParseIntPipe) executorId: number,
    @Request() req,
  ) {
    return this.tasksService.selectExecutor(id, req.user.id, executorId);
  }
}
