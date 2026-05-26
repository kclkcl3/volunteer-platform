import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	NotificationType,
	Prisma,
	ResponseStatus,
	TaskStatus,
	UserRole,
} from '@prisma/client';
import { getPagination } from '../common/pagination/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto';
import { assertTaskTransition } from './workflow';

const taskInclude = {
	skills: { include: { skill: true } },
	customer: {
		select: {
			id: true,
			firstName: true,
			lastName: true,
			rating: true,
			completedTasksCount: true,
		},
	},
	executor: {
		select: {
			id: true,
			firstName: true,
			lastName: true,
			rating: true,
			completedTasksCount: true,
		},
	},
	responses: {
		include: {
			responder: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					rating: true,
					completedTasksCount: true,
				},
			},
		},
		orderBy: { createdAt: 'desc' as const },
	},
	review: true,
	statusHistory: { orderBy: { createdAt: 'asc' as const } },
	_count: { select: { comments: true, responses: true } },
} satisfies Prisma.TaskInclude;

const ACTIVE_STATUSES: TaskStatus[] = [
	TaskStatus.published,
	TaskStatus.in_progress,
	TaskStatus.on_review,
];

@Injectable()
export class TasksService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notifications: NotificationsService,
	) {}

	private ensureDeadlineIsValid(deadline: string) {
		if (new Date(deadline).getTime() < Date.now())
			throw new BadRequestException('Publication date must be before deadline');
	}

	private async ensureSkillsExist(skillIds: string[]) {
		if (skillIds.length === 0) return;
		const skills = await this.prisma.skill.findMany({
			where: { id: { in: skillIds } },
		});
		if (skills.length !== skillIds.length)
			throw new BadRequestException('Some skills not found');
	}

	async create(customerId: string, dto: CreateTaskDto) {
		this.ensureDeadlineIsValid(dto.deadline);
		await this.ensureSkillsExist(dto.skillIds);
		const status = dto.publishImmediately
			? TaskStatus.published
			: TaskStatus.draft;
		const task = await this.prisma.task.create({
			data: {
				title: dto.title,
				description: dto.description,
				deadline: new Date(dto.deadline),
				status,
				publishedAt: status === TaskStatus.published ? new Date() : null,
				customerId,
				skills: { create: dto.skillIds.map((skillId) => ({ skillId })) },
				statusHistory: {
					create: {
						toStatus: status,
						changedById: customerId,
						reason: 'created',
					},
				},
			},
			include: taskInclude,
		});
		if (status === TaskStatus.published) {
			await this.notifications.notifyMatchingSkills(
				task.id,
				dto.skillIds,
				customerId,
				task.title,
			);
		}
		return task;
	}

	async findAll(query: TaskQueryDto, userId?: string, role?: UserRole) {
		const { skip, take } = getPagination(query);
		// Белый список для предотвращения SQL-инъекций
		const allowedSortColumns: Record<string, string> = {
			createdAt: 't."createdAt"',
			deadline: 't."deadline"',
			status: 't."status"',
		};
		const allowedSortOrders = ['ASC', 'DESC'];
		const sortColumn =
			allowedSortColumns[query.sortBy || 'deadline'] || 't."deadline"';
		const sortOrder = allowedSortOrders.includes(
			(query.order || 'asc').toUpperCase(),
		)
			? (query.order || 'asc').toUpperCase()
			: 'ASC';

		// Строим условия фильтрации для сырого SQL
		const conditions: string[] = ['t."deletedAt" IS NULL'];
		const params: any[] = [];

		if (query.activeOnly) {
			// В общем списке показываем только задачи, которые еще не имеют исполнителя (только опубликованные)
			conditions.push(`t.status = 'published' AND t."executorId" IS NULL`);
		}
		if (query.myTasks && userId) {
			conditions.push(
				`(t."customerId" = $${params.length + 1} OR t."executorId" = $${params.length + 1})`,
			);
			params.push(userId);
		}
		if (query.search) {
			conditions.push(
				`(t.title ILIKE $${params.length + 1} OR t.description ILIKE $${params.length + 1})`,
			);
			params.push(`%${query.search}%`);
		}
		if (query.categoryId) {
			conditions.push(`t."categoryId" = $${params.length + 1}`);
			params.push(query.categoryId);
		}
		if (query.status) {
			conditions.push(`t.status = $${params.length + 1}`);
			params.push(query.status);
		}
		if (query.deadlineSoon) {
			conditions.push(`t.deadline < NOW() + INTERVAL '24 hours'`);
		}
		if (query.skillIds?.length) {
			conditions.push(
				`EXISTS (SELECT 1 FROM task_skills ts JOIN skills s ON ts."skillId" = s.id WHERE ts."taskId" = t.id AND s.id = ANY($${params.length + 1}))`,
			);
			params.push(query.skillIds);
		}

		const whereClause = conditions.length
			? `WHERE ${conditions.join(' AND ')}`
			: '';

		// Получаем общее количество задач
		const totalResult = await this.prisma.$queryRaw<[{ count: bigint }]>(
			Prisma.sql`SELECT COUNT(*) as count FROM tasks t ${Prisma.raw(whereClause)}`,
			...params,
		);
		const total = Number(totalResult[0].count);

		// Основной запрос с пагинацией и сортировкой (добавили подгрузку skills в JSON!)
		const items = await this.prisma.$queryRaw<any[]>(
			Prisma.sql`
				SELECT 
					t.id, t.title, t.description, t."deadline", t."status", t."publishedAt", t."createdAt", t."updatedAt",
					json_build_object(
						'id', c.id, 'firstName', c."firstName", 'lastName', c."lastName", 'rating', c.rating, 'completedTasksCount', c."completedTasksCount"
					) as customer,
					CASE WHEN e.id IS NOT NULL THEN json_build_object(
						'id', e.id, 'firstName', e."firstName", 'lastName', e."lastName", 'rating', e.rating, 'completedTasksCount', e."completedTasksCount"
					) ELSE NULL END as executor,
					-- Подгружаем все навыки задачи в виде массива JSON объектов
					COALESCE((
						SELECT json_agg(json_build_object('skill', json_build_object('id', s.id, 'name', s.name)) )
						FROM task_skills ts
						JOIN skills s ON ts."skillId" = s.id
						WHERE ts."taskId" = t.id
					), '[]'::json) as skills,
					(SELECT COUNT(*) FROM comments WHERE "taskId" = t.id) as comments_count,
					(SELECT COUNT(*) FROM responses WHERE "taskId" = t.id) as responses_count
				FROM tasks t
				LEFT JOIN users c ON t."customerId" = c.id
				LEFT JOIN users e ON t."executorId" = e.id
				${Prisma.raw(whereClause)}
				ORDER BY ${Prisma.raw(sortColumn)} ${Prisma.raw(sortOrder)}
				LIMIT ${Prisma.raw(String(take))} OFFSET ${Prisma.raw(String(skip))}
			`,
			...params,
		);

		return {
			items: items.map((item) => ({
				...item,
				// Гарантируем, что все массивы всегда существуют
				skills: item.skills || [],
				responses: item.responses || [],
				_count: {
					comments: Number(item.comments_count),
					responses: Number(item.responses_count),
				},
			})),
			meta: { total, page: query.page, limit: query.limit },
		};
	}

	async findOne(id: string, userId?: string, role?: UserRole) {
		const task = await this.prisma.task.findFirst({
			where: { id, deletedAt: null },
			include: taskInclude,
		});
		if (!task) throw new NotFoundException('Task not found');
		if (
			task.status === TaskStatus.draft &&
			task.customerId !== userId &&
			role !== UserRole.admin
		) {
			throw new ForbiddenException('Draft tasks are visible only to owner');
		}
		// Гарантируем, что все массивы всегда существуют
		return {
			...task,
			skills: task.skills || [],
			responses: task.responses || [],
			_count: task._count || { comments: 0, responses: 0 },
		};
	}

	async myTasks(
		userId: string,
		status?: TaskStatus,
		taskType?: 'created' | 'work',
	) {
		const where: Prisma.TaskWhereInput = {
			deletedAt: null,
			status,
		};

		if (taskType === 'created') {
			where.customerId = userId;
		} else if (taskType === 'work') {
			where.executorId = userId;
		} else {
			where.OR = [{ customerId: userId }, { executorId: userId }];
		}

		const tasks = await this.prisma.task.findMany({
			where,
			include: taskInclude,
			orderBy: { createdAt: 'desc' },
		});
		// Гарантируем, что все массивы всегда существуют
		return tasks.map((task) => ({
			...task,
			skills: task.skills || [],
			responses: task.responses || [],
			_count: task._count || { comments: 0, responses: 0 },
		}));
	}

	async update(id: string, userId: string, dto: UpdateTaskDto) {
		const task = await this.findOwnedTask(id, userId);
		if (task.status !== TaskStatus.draft)
			throw new ForbiddenException('Only draft tasks can be edited');
		if (dto.deadline) this.ensureDeadlineIsValid(dto.deadline);
		if (dto.skillIds) await this.ensureSkillsExist(dto.skillIds);
		return this.prisma.task.update({
			where: { id },
			data: {
				title: dto.title,
				description: dto.description,
				deadline: dto.deadline ? new Date(dto.deadline) : undefined,
				skills: dto.skillIds
					? {
							deleteMany: {},
							create: dto.skillIds.map((skillId) => ({ skillId })),
						}
					: undefined,
			},
			include: taskInclude,
		});
	}

	async remove(id: string, userId: string, role: UserRole) {
		const task = await this.prisma.task.findFirst({
			where: { id, deletedAt: null },
		});
		if (!task) throw new NotFoundException('Task not found');
		if (role !== UserRole.admin && task.customerId !== userId)
			throw new ForbiddenException('Only owner can delete task');
		const deletableStatuses: TaskStatus[] = [
			TaskStatus.draft,
			TaskStatus.published,
		];
		if (role !== UserRole.admin && !deletableStatuses.includes(task.status)) {
			throw new ForbiddenException(
				'Cannot delete task after executor selection',
			);
		}
		return this.prisma.task.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}

	publish(id: string, userId: string) {
		return this.transition(id, userId, TaskStatus.published, 'publish');
	}

	start(id: string, userId: string) {
		return this.transition(id, userId, TaskStatus.in_progress, 'start');
	}

	sendToReview(id: string, userId: string) {
		return this.transition(id, userId, TaskStatus.on_review, 'send_to_review');
	}

	approve(id: string, userId: string) {
		return this.transition(id, userId, TaskStatus.completed, 'approve');
	}

	requestRework(id: string, userId: string, reason?: string) {
		return this.transition(
			id,
			userId,
			TaskStatus.in_progress,
			reason ?? 'request_rework',
			true,
		);
	}

	async resetExecutor(taskId: string, customerId: string) {
		const task = await this.findOwnedTask(taskId, customerId);
		if (task.status !== TaskStatus.on_review)
			throw new BadRequestException(
				'Can only reset executor for tasks that are on review',
			);

		return this.prisma.$transaction(async (tx) => {
			// Удаляем текущего исполнителя
			await tx.task.update({
				where: { id: taskId },
				data: {
					executorId: null,
					status: TaskStatus.published,
					statusHistory: {
						create: {
							fromStatus: task.status,
							toStatus: TaskStatus.published,
							changedById: customerId,
							reason: 'reset executor - want to change',
						},
					},
				},
			});

			// Все принятые/отклоненные отклики можно снова отправить? Нет, только новые, старые остаются отклоненными
			if (task.executorId) {
				await tx.notification.create({
					data: {
						userId: task.executorId,
						taskId: taskId,
						type: NotificationType.task_published_matching_skills,
						title: 'Задача снова опубликована',
						body: `Исполнитель для задачи "${task.title}" был сброшен, задача доступна для новых откликов`,
					},
				});
			}

			return this.findOne(taskId, customerId);
		});
	}

	async selectExecutor(taskId: string, customerId: string, responseId: string) {
		const task = await this.findOwnedTask(taskId, customerId);
		if (task.status !== TaskStatus.published)
			throw new BadRequestException(
				'Executor can be selected only for published task',
			);
		const response = await this.prisma.response.findUnique({
			where: { id: responseId },
		});
		if (
			!response ||
			response.taskId !== taskId ||
			response.status !== ResponseStatus.pending
		) {
			throw new BadRequestException('Pending response not found for this task');
		}
		return this.prisma.$transaction(async (tx) => {
			await tx.response.updateMany({
				where: {
					taskId,
					id: { not: responseId },
					status: ResponseStatus.pending,
				},
				data: { status: ResponseStatus.rejected },
			});
			const rejectedResponses = await tx.response.findMany({
				where: {
					taskId: taskId,
					id: { not: responseId },
					status: ResponseStatus.rejected,
				},
				select: { responderId: true },
			});
			for (const rejectedResponse of rejectedResponses) {
				await tx.notification.create({
					data: {
						userId: rejectedResponse.responderId,
						taskId: taskId,
						type: NotificationType.new_response,
						title: 'Ваш отклик отклонен',
						body: `На задачу "${task.title}" был выбран другой исполнитель`,
					},
				});
			}
			await tx.response.update({
				where: { id: responseId },
				data: {
					status: ResponseStatus.accepted,
					statusHistory: {
						create: {
							fromStatus: ResponseStatus.pending,
							toStatus: ResponseStatus.accepted,
							changedById: customerId,
						},
					},
				},
			});
			const updated = await tx.task.update({
				where: { id: taskId },
				data: {
					executorId: response.responderId,
					status: TaskStatus.in_progress,
					statusHistory: {
						create: {
							fromStatus: TaskStatus.published,
							toStatus: TaskStatus.in_progress,
							changedById: customerId,
						},
					},
					notifications: {
						create: {
							userId: response.responderId,
							type: NotificationType.executor_selected,
							title: 'Вы были выбраны исполнителем',
							body: `Вас выбрали для задачи "${task.title}"`,
						},
					},
				},
				include: taskInclude,
			});
			return updated;
		});
	}

	async recommended(userId: string) {
		const skillIds = (
			await this.prisma.studentSkill.findMany({
				where: { userId },
				select: { skillId: true },
			})
		).map((s) => s.skillId);
		const recommendedTasks = await this.prisma.task.findMany({
			where: {
				deletedAt: null,
				status: TaskStatus.published,
				customerId: { not: userId },
				skills: skillIds.length
					? { some: { skillId: { in: skillIds } } }
					: undefined,
			},
			include: taskInclude,
			orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
			take: 30,
		});
		// Гарантируем, что все массивы всегда существуют
		return recommendedTasks.map((task) => ({
			...task,
			skills: task.skills || [],
			responses: task.responses || [],
			_count: task._count || { comments: 0, responses: 0 },
		}));
	}

	private async transition(
		id: string,
		userId: string,
		next: TaskStatus,
		reason: string,
		allowBack = false,
	) {
		const task = await this.prisma.task.findFirst({
			where: { id, deletedAt: null },
		});
		if (!task) throw new NotFoundException('Task not found');
		assertTaskTransition(task, userId, next, allowBack);
		const updated = await this.prisma.task.update({
			where: { id },
			data: {
				status: next,
				publishedAt: next === TaskStatus.published ? new Date() : undefined,
				statusHistory: {
					create: {
						fromStatus: task.status,
						toStatus: next,
						changedById: userId,
						reason,
					},
				},
			},
			include: taskInclude,
		});
		if (next === TaskStatus.completed && task.executorId) {
			await this.notifications.create({
				userId: task.executorId,
				taskId: task.id,
				type: NotificationType.task_completed,
				title: 'Task completed',
				body: `Task "${task.title}" was completed`,
			});
		}
		return updated;
	}

	private buildWhere(
		query: TaskQueryDto,
		userId?: string,
		role?: UserRole,
	): Prisma.TaskWhereInput {
		const now = new Date();
		const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

		// В общем списке показываем только опубликованные задачи, которые еще не имеют исполнителя
		const isGeneralList = !query.myTasks && !userId;

		return {
			deletedAt: null,
			AND: [
				// Права доступа к задачам
				...(role === UserRole.admin
					? []
					: [
							{
								OR: [
									// Владелец видит все свои задачи
									...(userId ? [{ customerId: userId }] : []),
									// Исполнитель видит задачи, над которыми работает
									...(userId ? [{ executorId: userId }] : []),
									// Все остальные видят только опубликованные задачи без исполнителя
									{ status: TaskStatus.published, executorId: null },
								],
							},
						]),
				// Для общего списка дополнительно скрываем все, что не опубликовано
				isGeneralList ? { status: TaskStatus.published, executorId: null } : {},
				// Фильтры
				query.myTasks && userId
					? { OR: [{ customerId: userId }, { executorId: userId }] }
					: {},
				query.activeOnly ? { status: { in: ACTIVE_STATUSES } } : {},
				query.status ? { status: query.status } : {},
				{},
				query.skillIds?.length
					? { skills: { some: { skillId: { in: query.skillIds } } } }
					: {},
				query.deadlineSoon ? { deadline: { gte: now, lte: in24h } } : {},
				query.search
					? {
							OR: [
								{ title: { contains: query.search, mode: 'insensitive' } },
								{
									description: { contains: query.search, mode: 'insensitive' },
								},
							],
						}
					: {},
			],
		};
	}

	private async findOwnedTask(id: string, userId: string) {
		const task = await this.prisma.task.findFirst({
			where: { id, deletedAt: null },
		});
		if (!task) throw new NotFoundException('Task not found');
		if (task.customerId !== userId)
			throw new ForbiddenException('Only customer can perform this action');
		return task;
	}
}
