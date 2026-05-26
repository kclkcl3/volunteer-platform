import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

export type WorkflowTask = {
	status: TaskStatus;
	customerId: string;
	executorId: string | null;
};

export function assertTaskTransition(
	task: WorkflowTask,
	userId: string,
	next: TaskStatus,
	allowBack = false,
) {
	const isCustomer = task.customerId === userId;
	const isExecutor = task.executorId === userId;
	const allowed: Record<TaskStatus, TaskStatus[]> = {
		draft: [TaskStatus.published],
		published: [TaskStatus.in_progress], // При выборе исполнителя сразу переходим в работу
		in_progress: [TaskStatus.on_review],
		on_review: allowBack
			? [TaskStatus.in_progress]
			: [TaskStatus.published, TaskStatus.completed], // Можно вернуть в работу или обратно опубликовать (для смены исполнителя)
		completed: [],
	};
	if (!allowed[task.status].includes(next))
		throw new BadRequestException(
			`Invalid workflow transition ${task.status} -> ${next}`,
		);

	const customerOnlyStatuses: TaskStatus[] = [
		TaskStatus.published,
		TaskStatus.completed,
	];
	if (customerOnlyStatuses.includes(next) && !isCustomer)
		throw new ForbiddenException('Only customer can perform this action');

	// Если возвращаем задачу в published (смена исполнителя) - может только заказчик
	if (
		next === TaskStatus.published &&
		task.status === TaskStatus.on_review &&
		!isCustomer
	) {
		throw new ForbiddenException(
			'Only customer can reset task to published to change executor',
		);
	}

	if (next === TaskStatus.on_review && !isExecutor)
		throw new ForbiddenException('Only executor can send work to review');
	if (task.status === TaskStatus.on_review && !isCustomer)
		throw new ForbiddenException('Only customer can approve or request rework');
}
