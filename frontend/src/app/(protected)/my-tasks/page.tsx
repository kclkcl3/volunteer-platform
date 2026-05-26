'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TaskCard } from '@/features/tasks/task-card';
import { tasksApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MyTasksPage() {
	const [page, setPage] = useState(1);
	const limit = 10;
	const tasks = useQuery({
		queryKey: ['my-tasks', page],
		queryFn: () => tasksApi.my(),
	});
	const totalPages = tasks.data?.data.length
		? Math.ceil(tasks.data.data.length / limit)
		: 0;
	const paginatedTasks = tasks.data?.data.slice(
		(page - 1) * limit,
		page * limit,
	);

	return (
		<div className='space-y-6'>
			<h1 className='text-3xl font-semibold'>Мои задачи</h1>
			<div className='grid gap-4'>
				{tasks.isLoading &&
					[1, 2, 3].map((i) => (
						<div key={i} className='h-36 animate-pulse bg-muted rounded-lg' />
					))}
				{!tasks.isLoading && paginatedTasks?.length === 0 && (
					<div className='text-center py-12 text-slate-500 dark:text-slate-400'>
						<p className='text-lg'>У вас пока нет активных задач</p>
					</div>
				)}
				{paginatedTasks?.map((task) => (
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
