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
				categoryId: dto.categoryId,
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

		const where: Prisma.TaskWhereInput = {
			deletedAt: null,
		};

		if (!query.myTasks) {
			where.status = TaskStatus.published;
			where.executorId = null;
		} else if (userId) {
			where.OR = [{ customerId: userId }, { executorId: userId }];
		}

		if (query.search) {
			where.OR = [
				{ title: { contains: query.search, mode: 'insensitive' } },
				{ description: { contains: query.search, mode: 'insensitive' } },
			];
		}

		if (query.categoryId) {
			where.categoryId = query.categoryId;
		}

		if (query.status) {
			where.status = query.status;
		}

		if (query.deadlineSoon) {
			where.deadline = { lt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
		}

		if (query.skillIds?.length) {
			where.skills = {
				every: {
					skillId: {
						in: query.skillIds,
					},
				},
			};
		}

		const [total, items] = await this.prisma.$transaction([
			this.prisma.task.count({ where }),
			this.prisma.task.findMany({
				where,
				include: taskInclude,
				orderBy: { [query.sortBy || 'deadline']: query.order || 'asc' },
				skip,
				take,
			}),
		]);

		return {
			items,
			meta: { total, page: query.page, limit: query.limit },
		};
	}

	async findOne(id: string, userId?: string, role?: UserRole) {
		const tasks = await this.prisma.$queryRaw<any[]>(
			Prisma.sql`
				SELECT
					t.id, t.title, t.description, t.deadline, t.status, t."publishedAt", t."createdAt", t."updatedAt", t."customerId", t."executorId", t."categoryId",
					json_build_object(
						'id', c.id, 'firstName', c."firstName", 'lastName', c."lastName", 'rating', c.rating, 'completedTasksCount', c."completedTasksCount"
					) as customer,
					CASE WHEN e.id IS NOT NULL THEN json_build_object(
						'id', e.id, 'firstName', e."firstName", 'lastName', e."lastName", 'rating', e.rating, 'completedTasksCount', e."completedTasksCount"
					) ELSE NULL END as executor,
					COALESCE((
						SELECT json_agg(json_build_object('skill', s))
						FROM task_skills ts
						JOIN skills s ON ts."skillId" = s.id
						WHERE ts."taskId" = t.id
					), '[]'::json) as skills,
					COALESCE((
						SELECT json_agg(
							json_build_object(
								'id', r.id,
								'createdAt', r."createdAt",
								'status', r.status,
								'message', r.message,
								'responder', json_build_object(
									'id', resp.id, 'firstName', resp."firstName", 'lastName', resp."lastName", 'rating', resp.rating, 'completedTasksCount', resp."completedTasksCount"
								)
							) ORDER BY r."createdAt" DESC
						)
						FROM responses r
						JOIN users resp ON r."responderId" = resp.id
						WHERE r."taskId" = t.id
					), '[]'::json) as responses,
					(
						SELECT json_build_object('id', rev.id, 'rating', rev.rating, 'comment', rev.text, 'createdAt', rev."createdAt")
						FROM reviews rev
						WHERE rev."taskId" = t.id
						LIMIT 1
					) as review,
					COALESCE((
						SELECT json_agg(sh ORDER BY sh."createdAt" ASC)
						FROM task_status_history sh
						WHERE sh."taskId" = t.id
					), '[]'::json) as "statusHistory",
					(SELECT COUNT(*) FROM comments WHERE "taskId" = t.id)::int as "commentsCount",
					(SELECT COUNT(*) FROM responses WHERE "taskId" = t.id)::int as "responsesCount"
				FROM tasks t
				LEFT JOIN users c ON t."customerId" = c.id
				LEFT JOIN users e ON t."executorId" = e.id
				WHERE t.id = ${id} AND t."deletedAt" IS NULL
			`,
		);

		if (tasks.length === 0) {
			throw new NotFoundException('Task not found');
		}

		const task = tasks[0];

		if (
			task.status === TaskStatus.draft &&
			task.customerId !== userId &&
			role !== UserRole.admin
		) {
			throw new ForbiddenException('Draft tasks are visible only to owner');
		}

		return {
			...task,
			statusHistory: task.statusHistory,
			_count: {
				comments: task.commentsCount,
				responses: task.responsesCount,
			},
		};
	}

	async myTasks(
		userId: string,
		status?: TaskStatus,
		taskType?: 'created' | 'work',
	) {
		const conditions: string[] = ['t."deletedAt" IS NULL'];
		const params: any[] = [userId]; // userId is always $1

		if (taskType === 'created') {
			conditions.push(`t."customerId" = $1`);
		} else if (taskType === 'work') {
			conditions.push(`t."executorId" = $1`);
		} else {
			conditions.push(`(t."customerId" = $1 OR t."executorId" = $1)`);
		}

		if (status) {
			conditions.push(`t.status = $${params.length + 1}`);
			params.push(status);
		}

		const whereClause = `WHERE ${conditions.join(' AND ')}`;

		const items = await this.prisma.$queryRaw<any[]>(
			Prisma.sql`
            SELECT
                t.id, t.title, t.description, t.deadline, t.status, t."publishedAt", t."createdAt", t."updatedAt", t."customerId", t."executorId", t."categoryId",
                json_build_object(
                    'id', c.id, 'firstName', c."firstName", 'lastName', c."lastName", 'rating', c.rating, 'completedTasksCount', c."completedTasksCount"
                ) as customer,
                CASE WHEN e.id IS NOT NULL THEN json_build_object(
                    'id', e.id, 'firstName', e."firstName", 'lastName', e."lastName", 'rating', e.rating, 'completedTasksCount', e."completedTasksCount"
                ) ELSE NULL END as executor,
                COALESCE((
                    SELECT json_agg(json_build_object('skill', s))
                    FROM task_skills ts
                    JOIN skills s ON ts."skillId" = s.id
                    WHERE ts."taskId" = t.id
                ), '[]'::json) as skills,
                COALESCE((
                    SELECT json_agg(
                        json_build_object(
                            'id', r.id,
                            'createdAt', r."createdAt",
                            'status', r.status,
                            'message', r.message,
                            'responder', json_build_object(
                                'id', resp.id, 'firstName', resp."firstName", 'lastName', resp."lastName", 'rating', resp.rating, 'completedTasksCount', resp."completedTasksCount"
                            )
                        ) ORDER BY r."createdAt" DESC
                    )
                    FROM responses r
                    JOIN users resp ON r."responderId" = resp.id
                    WHERE r."taskId" = t.id
                ), '[]'::json) as responses,
                (
                    SELECT json_build_object('id', rev.id, 'rating', rev.rating, 'comment', rev.text, 'createdAt', rev."createdAt")
                    FROM reviews rev
                    WHERE rev."taskId" = t.id
                    LIMIT 1
                ) as review,
                COALESCE((
                    SELECT json_agg(sh ORDER BY sh."createdAt" ASC)
                    FROM task_status_history sh
                    WHERE sh."taskId" = t.id
                ), '[]'::json) as "statusHistory",
                (SELECT COUNT(*) FROM comments WHERE "taskId" = t.id)::int as "commentsCount",
                (SELECT COUNT(*) FROM responses WHERE "taskId" = t.id)::int as "responsesCount"
            FROM tasks t
            LEFT JOIN users c ON t."customerId" = c.id
            LEFT JOIN users e ON t."executorId" = e.id
            ${Prisma.raw(whereClause)}
            ORDER BY t."createdAt" DESC
        `,
			...params,
		);

		return items.map((item) => ({
			...item,
			statusHistory: item.statusHistory,
			_count: {
				comments: item.commentsCount,
				responses: item.responsesCount,
			},
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
				categoryId: dto.categoryId,
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
		const items = await this.prisma.$queryRaw<any[]>`
			WITH user_skills AS (
				SELECT "skillId" FROM student_skills WHERE "userId" = ${userId}
			)
			SELECT
				t.id, t.title, t.description, t."deadline", t."status", t."publishedAt", t."createdAt", t."updatedAt",
				json_build_object(
					'id', c.id, 'firstName', c."firstName", 'lastName', c."lastName", 'rating', c.rating, 'completedTasksCount', c."completedTasksCount"
				) as customer,
				COALESCE((
					SELECT json_agg(json_build_object('skill', json_build_object('id', s.id, 'name', s.name)))
					FROM task_skills ts
					JOIN skills s ON ts."skillId" = s.id
					WHERE ts."taskId" = t.id
				), '[]'::json) as skills,
				(SELECT COUNT(*) FROM comments WHERE "taskId" = t.id) as comments_count,
				(SELECT COUNT(*) FROM responses WHERE "taskId" = t.id) as responses_count
			FROM tasks t
			JOIN users c ON t."customerId" = c.id
			WHERE
				t."deletedAt" IS NULL
				AND t.status = 'published'
				AND t."customerId" != ${userId}
				AND EXISTS (
					SELECT 1
					FROM task_skills ts
					WHERE ts."taskId" = t.id AND ts."skillId" IN (SELECT "skillId" FROM user_skills)
				)
			ORDER BY t.deadline ASC, t."createdAt" DESC
			LIMIT 30
		`;

		return items.map((item) => ({
			...item,
			skills: item.skills || [],
			_count: {
				comments: Number(item.comments_count),
				responses: Number(item.responses_count),
			},
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
