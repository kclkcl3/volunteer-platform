import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import {
	AuthUser,
	CurrentUser,
} from '../common/decorators/current-user.decorator';
import {
	CreateTaskDto,
	SelectExecutorDto,
	TaskQueryDto,
	UpdateTaskDto,
	WorkflowReasonDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
	constructor(private readonly tasks: TasksService) {}

	@Get()
	@UseGuards(OptionalJwtAuthGuard)
	findAll(@Query() query: any, @Req() request: Request & { user?: AuthUser }) {
		const fixedQuery = {
			...query,
			page: Math.max(1, Number(query.page) || 1),
			limit: Math.min(100, Math.max(1, Number(query.limit) || 10)),
			deadlineSoon: query.deadlineSoon === 'true',
			activeOnly: query.activeOnly === 'true',
			myTasks: query.myTasks === 'true',
		};
		return this.tasks.findAll(fixedQuery, request.user?.id, request.user?.role);
	}

	@Get('my')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	myTasks(
		@CurrentUser() user: AuthUser,
		@Query('status') status?: TaskStatus,
		@Query('taskType') taskType?: 'created' | 'work',
	) {
		return this.tasks.myTasks(user.id, status, taskType);
	}
	@Get('recommended')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	recommended(@CurrentUser() user: AuthUser) {
		return this.tasks.recommended(user.id);
	}

	@Get(':id')
	@UseGuards(OptionalJwtAuthGuard)
	findOne(
		@Param('id') id: string,
		@Req() request: Request & { user?: AuthUser },
	) {
		return this.tasks.findOne(id, request.user?.id, request.user?.role);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
		return this.tasks.create(user.id, dto);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	update(
		@Param('id') id: string,
		@CurrentUser() user: AuthUser,
		@Body() dto: UpdateTaskDto,
	) {
		return this.tasks.update(id, user.id, dto);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
		return this.tasks.remove(id, user.id, user.role);
	}

	@Post(':id/publish')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	publish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
		return this.tasks.publish(id, user.id);
	}

	@Post(':id/select-executor')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	selectExecutor(
		@Param('id') id: string,
		@CurrentUser() user: AuthUser,
		@Body() dto: SelectExecutorDto,
	) {
		return this.tasks.selectExecutor(id, user.id, dto.responseId);
	}

	@Post(':id/start')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	start(@Param('id') id: string, @CurrentUser() user: AuthUser) {
		return this.tasks.start(id, user.id);
	}

	@Post(':id/send-to-review')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	sendToReview(@Param('id') id: string, @CurrentUser() user: AuthUser) {
		return this.tasks.sendToReview(id, user.id);
	}

	@Post(':id/approve')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
		return this.tasks.approve(id, user.id);
	}

	@Post(':id/request-rework')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	requestRework(
		@Param('id') id: string,
		@CurrentUser() user: AuthUser,
		@Body() dto?: WorkflowReasonDto,
	) {
		return this.tasks.requestRework(id, user.id, dto?.reason);
	}

	@Post(':id/reset-executor')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	resetExecutor(@Param('id') id: string, @CurrentUser() user: AuthUser) {
		return this.tasks.resetExecutor(id, user.id);
	}
}
