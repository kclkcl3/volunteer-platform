'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { TaskCard } from '@/features/tasks/task-card';
import { tasksApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskStatus } from '@/lib/api';

const ALL_STATUSES = [
	{ value: 'draft', label: 'Черновики' },
	{ value: 'published', label: 'Опубликованные' },
	{ value: 'in_progress', label: 'В работе' },
	{ value: 'on_review', label: 'На проверке' },
	{ value: 'completed', label: 'Завершенные' },
];

export default function MyCreatedTasksPage() {
	const [page, setPage] = useState(1);
	const [activeStatuses, setActiveStatuses] = useState<string[]>(
		ALL_STATUSES.map((s) => s.value),
	);
	const limit = 10;

	const tasks = useQuery({
		queryKey: ['my-created-tasks'],
		queryFn: () => tasksApi.my('created'),
	});

	const filteredTasks = useMemo(() => {
		if (!tasks.data?.data) return [];
		return tasks.data.data.filter((task) =>
			activeStatuses.includes(task.status),
		);
	}, [tasks.data?.data, activeStatuses]);

	const toggleStatus = (status: string) => {
		setActiveStatuses((prev) =>
			prev.includes(status)
				? prev.filter((s) => s !== status)
				: [...prev, status],
		);
	};

	const toggleAll = () => {
		setActiveStatuses(
			activeStatuses.length === ALL_STATUSES.length
				? []
				: ALL_STATUSES.map((s) => s.value),
		);
	};

	const totalPages = filteredTasks.length
		? Math.ceil(filteredTasks.length / limit)
		: 0;
	const paginatedTasks = filteredTasks.slice((page - 1) * limit, page * limit);

	return (
		<div className='space-y-6'>
			<h1 className='text-3xl font-semibold'>Созданные мной задачи</h1>

			<div className='flex flex-wrap gap-2 items-center'>
				<Badge
					variant={
						activeStatuses.length === ALL_STATUSES.length
							? 'default'
							: 'outline'
					}
					className='cursor-pointer px-3 py-1 text-sm'
					onClick={toggleAll}
				>
					Все статусы
				</Badge>
				{ALL_STATUSES.map((status) => (
					<Badge
						key={status.value}
						variant={
							activeStatuses.includes(status.value) ? 'default' : 'outline'
						}
						className='cursor-pointer px-3 py-1 text-sm'
						onClick={() => toggleStatus(status.value)}
					>
						{status.label}
					</Badge>
				))}
			</div>

			<div className='grid gap-4'>
				{tasks.isLoading &&
					[1, 2, 3].map((i) => (
						<div key={i} className='h-36 animate-pulse bg-muted rounded-lg' />
					))}
				{!tasks.isLoading && paginatedTasks.length === 0 && (
					<div className='text-center py-12 text-slate-500 dark:text-slate-400'>
						<p className='text-lg'>Нет задач по выбранным фильтрам</p>
					</div>
				)}
				{paginatedTasks.map((task) => (
					<TaskCard key={task.id} task={task} />
				))}
			</div>
			{totalPages > 1 && (
				<div className='flex items-center justify-center gap-4 mt-8'>
					<Button
						className='border border-slate-300 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						<ChevronLeft className='h-4 w-4 mr-2' /> Назад
					</Button>
					<span className='text-sm text-slate-600 dark:text-slate-300'>
						Страница {page} из {totalPages}
					</span>
					<Button
						className='border border-slate-300 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page === totalPages}
					>
						Вперёд <ChevronRight className='h-4 w-4 ml-2' />
					</Button>
				</div>
			)}
		</div>
	);
}
