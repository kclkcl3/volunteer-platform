'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { analyticsApi } from '@/lib/api';

export default function AdminPage() {
	const analytics = useQuery({
		queryKey: ['admin-analytics'],
		queryFn: () => analyticsApi.dashboard(),
	});
	return (
		<div className='space-y-6'>
			<h1 className='text-3xl font-semibold'>Панель администратора</h1>
			<div className='grid gap-4 md:grid-cols-3'>
				<Card>
					<p>Средний рейтинг</p>
					<strong>
						{analytics.data?.data.averageRatings?._avg?.rating ?? 0}
					</strong>
				</Card>
				<Card>
					<p>Отзывы</p>
					<strong>{analytics.data?.data.averageRatings?._count ?? 0}</strong>
				</Card>
				<Card>
					<p>Просроченные задачи</p>
					<strong>{analytics.data?.data.overdue?.length ?? 0}</strong>
				</Card>
			</div>
		</div>
	);
}
