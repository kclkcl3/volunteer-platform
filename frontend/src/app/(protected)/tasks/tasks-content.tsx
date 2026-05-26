'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from '@/features/tasks/task-card';
import { tasksApi, directoriesApi } from '@/lib/api';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export function TasksContent() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [search, setSearch] = useState(searchParams.get('search') || '');
	const [debouncedSearch, setDebouncedSearch] = useState(search);
	const [deadlineSoon, setDeadlineSoon] = useState(
		searchParams.get('deadlineSoon') === 'true',
	);
	const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
		searchParams.get('skillIds')
			? searchParams.get('skillIds')!.split(',')
			: [],
	);
	const [sortBy, setSortBy] = useState(
		searchParams.get('sortBy') || 'deadline',
	);
	const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
	const limit = 10;

	// Debounce для поиска, чтобы избежать лишних запросов
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	// Синхронизация состояния с URL-параметрами
	useEffect(() => {
		const params = new URLSearchParams();
		if (debouncedSearch) params.set('search', debouncedSearch);
		if (deadlineSoon) params.set('deadlineSoon', 'true');
		if (selectedSkillIds.length > 0)
			params.set('skillIds', selectedSkillIds.join(','));
		params.set('sortBy', sortBy);
		params.set('page', page.toString());
		router.replace(`?${params.toString()}`);
	}, [debouncedSearch, deadlineSoon, selectedSkillIds, sortBy, page, router]);

	const skills = useQuery({
		queryKey: ['skills'],
		queryFn: () => directoriesApi.skills(),
	});

	const tasks = useQuery({
		queryKey: [
			'tasks',
			debouncedSearch,
			deadlineSoon,
			selectedSkillIds,
			sortBy,
			page,
		],
		queryFn: () =>
			tasksApi.list({
				search: debouncedSearch,
				deadlineSoon,
				skillIds: selectedSkillIds,
				sortBy,
				page,
				limit,
			}),
	});

	const addSkill = (skillId: string) => {
		if (!selectedSkillIds.includes(skillId)) {
			setSelectedSkillIds([...selectedSkillIds, skillId]);
		}
	};

	const removeSkill = (skillId: string) => {
		setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId));
	};

	const totalPages = tasks.data?.data.meta.total
		? Math.ceil(tasks.data.data.meta.total / limit)
		: 1;

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-3xl font-semibold'>Доступные задачи</h1>
				<Link href='/tasks/new'>
					<Button>
						<Plus className='mr-2 h-4 w-4' /> Создать задачу
					</Button>
				</Link>
			</div>

			<Card className='p-6'>
				<div className='grid gap-4 md:grid-cols-4'>
					<div className='relative'>
						<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500' />
						<Input
							placeholder='Поиск задач...'
							className='pl-10'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<Select onValueChange={(value) => setSortBy(value)} value={sortBy}>
						<SelectTrigger>
							<SelectValue placeholder='Сортировка' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='deadline'>По дедлайну</SelectItem>
							<SelectItem value='publishedAt'>По дате создания</SelectItem>
						</SelectContent>
					</Select>

					<div className='flex items-center'>
						<label className='flex items-center gap-2 cursor-pointer'>
							<input
								type='checkbox'
								checked={deadlineSoon}
								onChange={(e) => setDeadlineSoon(e.target.checked)}
								className='h-4 w-4 rounded border-slate-300'
							/>
							<span className='text-sm'>Дедлайн &lt; 24ч</span>
						</label>
					</div>

					<Select onValueChange={addSkill}>
						<SelectTrigger>
							<SelectValue placeholder='Добавить навык' />
						</SelectTrigger>
						<SelectContent>
							{skills.data?.data.map((skill) => (
								<SelectItem
									key={skill.id}
									value={skill.id}
									disabled={selectedSkillIds.includes(skill.id)}
								>
									{skill.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{selectedSkillIds.length > 0 && (
						<div className='flex flex-wrap gap-2 md:col-span-4'>
							{selectedSkillIds.map((skillId) => {
								const skill = skills.data?.data.find((s) => s.id === skillId);
								return (
									<Badge
										key={skillId}
										variant='secondary'
										className='flex items-center gap-1'
									>
										{skill?.name}
										<X
											className='h-3 w-3 cursor-pointer'
											onClick={() => removeSkill(skillId)}
										/>
									</Badge>
								);
							})}
						</div>
					)}
				</div>
			</Card>
			<div className='grid gap-4'>
				{tasks.isLoading &&
					[1, 2, 3].map((i) => (
						<Card key={i} className='h-36 animate-pulse bg-muted' />
					))}
				{!tasks.isLoading && tasks.data?.data.items.length === 0 && (
					<Card className='p-12 text-center'>
						<p className='text-lg text-slate-500'>Пока нет доступных задач</p>
						<p className='text-sm text-slate-400 mt-1'>
							Создайте первую задачу или подождите, пока появятся новые
						</p>
					</Card>
				)}
				{tasks.data?.data.items?.map((task) => (
					<TaskCard key={task.id} task={task} />
				))}
			</div>
			{totalPages > 1 && (
				<div className='flex items-center justify-center gap-2 mt-8'>
					<Button
						className='bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
						disabled={page === 1}
						onClick={() => setPage((p) => Math.max(1, p - 1))}
					>
						<ChevronLeft className='h-4 w-4 mr-1' /> Назад
					</Button>
					<span className='text-sm'>
						Страница {page} из {totalPages}
					</span>
					<Button
						className='bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
						disabled={page === totalPages}
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
					>
						Вперед <ChevronRight className='h-4 w-4 ml-1' />
					</Button>
				</div>
			)}
		</div>
	);
}
