'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Category, directoriesApi, Skill, tasksApi } from '@/lib/api';
import { isoToDateTimeLocal } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';

const schema = z.object({
	title: z.string().min(5),
	description: z.string().min(20),
	categoryId: z.string().min(1, 'Выберите категорию'),
	skillIds: z.array(z.string()).default([]),
	deadline: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export default function EditTaskPage() {
	const router = useRouter();
	const params = useParams();
	const taskId = params.id as string;

	const { data: task } = useQuery({
		queryKey: ['tasks', taskId],
		queryFn: () => tasksApi.findOne(taskId),
		select: (data) => data.data,
		enabled: !!taskId,
	});

	const { data: skills } = useQuery({
		queryKey: ['skills'],
		queryFn: () => directoriesApi.skills(),
		select: (data) => data.data,
	});
	const { data: categories } = useQuery({
		queryKey: ['categories'],
		queryFn: () => directoriesApi.categories(),
		select: (data) => data.data,
	});
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
	});

	useEffect(() => {
		if (task) {
			form.reset({
				title: task.title,
				description: task.description,
				categoryId: task.category?.id || '',
				skillIds: task.skills.map((s: any) => s.skill.id),
				deadline: isoToDateTimeLocal(task.deadline),
			});
		}
	}, [task, form]);

	const mutation = useMutation({
		mutationFn: (values: FormValues) => tasksApi.update(taskId, values),
		onSuccess: (data) => router.push(`/tasks/${data.data.id}`),
	});
	const selectedSkills = form.watch('skillIds');
	return (
		<div className='space-y-6'>
			<h1 className='text-3xl font-semibold'>Редактировать задачу</h1>
			<Card>
				<form
					className='space-y-4'
					onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
				>
					<Input placeholder='Заголовок' {...form.register('title')} />
					<textarea
						className='min-h-36 w-full rounded-md border bg-background p-3 text-sm'
						placeholder='Описание'
						{...form.register('description')}
					/>
					<select
						className='w-full rounded-md border bg-background p-3 text-sm'
						{...form.register('categoryId')}
					>
						<option value=''>Выберите категорию</option>
						{categories?.map((category: Category) => (
							<option key={category.id} value={category.id}>
								{category.name}
							</option>
						))}
					</select>
					<div className='grid gap-2 md:grid-cols-3'>
						{skills?.map((skill: Skill) => (
							<label
								key={skill.id}
								className='flex items-center gap-2 rounded-md border p-2 text-sm'
							>
								<input
									type='checkbox'
									checked={selectedSkills?.includes(skill.id)}
									onChange={(event) => {
										const next = event.target.checked
											? [...(selectedSkills || []), skill.id]
											: (selectedSkills || []).filter((id) => id !== skill.id);
										form.setValue('skillIds', next);
									}}
								/>
								{skill.name}
							</label>
						))}
					</div>

					<Input type='datetime-local' {...form.register('deadline')} />
					<Button type='submit' disabled={mutation.isPending}>
						{mutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
					</Button>
				</form>
			</Card>
		</div>
	);
}
