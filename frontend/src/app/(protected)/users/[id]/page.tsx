'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { usersApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UserProfilePage() {
	const params = useParams<{ id: string }>();
	const user = useQuery({
		queryKey: ['user', params.id],
		queryFn: () => usersApi.get(params.id),
	});

	const u = user.data?.data;

	if (user.isLoading) {
		return <div>Загрузка...</div>;
	}

	if (!u) {
		return <div>Пользователь не найден</div>;
	}

	return (
		<div className='space-y-6'>
			<Card className='p-6'>
				<div className='flex items-center gap-6'>
					<div>
						<h1 className='text-3xl font-semibold'>
							{u.firstName} {u.lastName}
						</h1>
						<p className='text-lg text-slate-500'>
							Рейтинг: {u.rating ?? 'N/A'}
						</p>
					</div>
				</div>
			</Card>

			<Card className='p-6'>
				<h2 className='text-2xl font-semibold mb-4'>Навыки</h2>
				<div className='flex flex-wrap gap-2'>
					{u.skills && u.skills.length > 0 ? (
						u.skills
							.filter(Boolean)
							.map((skill: { id: string; name: string }) => (
								<Badge key={skill.id}>{skill.name}</Badge>
							))
					) : (
						<p>Навыки не указаны.</p>
					)}
				</div>
			</Card>

			<Card className='p-6'>
				<h2 className='text-2xl font-semibold mb-4'>Созданные задачи</h2>
				{u.createdTasks && u.createdTasks.length > 0 ? (
					<ul className='space-y-2'>
						{u.createdTasks
							.filter(Boolean)
							.map((task: { id: string; title: string }) => (
								<li key={task.id}>
									<Link
										href={`/tasks/${task.id}`}
										className='text-blue-500 hover:underline'
									>
										{task.title}
									</Link>
								</li>
							))}
					</ul>
				) : (
					<p>Пользователь еще не создавал задачи.</p>
				)}
			</Card>

			<Card className='p-6'>
				<h2 className='text-2xl font-semibold mb-4'>Выполненные задачи</h2>
				{u.completedTasks && u.completedTasks.length > 0 ? (
					<ul className='space-y-2'>
						{u.completedTasks
							.filter(Boolean)
							.map((task: { id: string; title: string }) => (
								<li key={task.id}>
									<Link
										href={`/tasks/${task.id}`}
										className='text-blue-500 hover:underline'
									>
										{task.title}
									</Link>
								</li>
							))}
					</ul>
				) : (
					<p>Пользователь еще не выполнял задачи.</p>
				)}
			</Card>

			<Card className='p-6'>
				<h2 className='text-2xl font-semibold mb-4'>Отзывы</h2>
				{u.reviews && u.reviews.length > 0 ? (
					<ul className='space-y-4'>
						{u.reviews
							.filter(Boolean)
							.map(
								(review: {
									id: string;
									rating: number;
									text: string;
									author: { id: string; firstName: string; lastName: string };
								}) => (
									<li key={review.id} className='border-b pb-4'>
										<div className='flex items-center justify-between'>
											<Link
												href={`/users/${review.author.id}`}
												className='font-semibold hover:underline'
											>
												{review.author.firstName} {review.author.lastName}
											</Link>
											<div className='flex items-center'>
												<span className='text-yellow-500'>★</span>
												<span className='ml-1 font-bold'>{review.rating}</span>
											</div>
										</div>
										<p className='mt-2 text-slate-600'>{review.text}</p>
									</li>
								),
							)}
					</ul>
				) : (
					<p>Об этом пользователе еще нет отзывов.</p>
				)}
			</Card>
		</div>
	);
}
