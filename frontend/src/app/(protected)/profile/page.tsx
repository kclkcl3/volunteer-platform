'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { usersApi } from '@/lib/api';

export default function ProfilePage() {
	const me = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });
	const user = me.data?.data;
	return (
		<div className='space-y-6'>
			<h1 className='text-3xl font-semibold'>Профиль</h1>
			{user && (
				<Card>
					<h2 className='text-xl font-semibold'>
						{user.firstName} {user.lastName}
					</h2>
					<p>{user.email}</p>
					<p className='mt-2'>
						Рейтинг: {user.rating} · Завершено: {user.completedTasksCount}
					</p>
					<Badge className='mt-4'>{user.role}</Badge>
				</Card>
			)}
		</div>
	);
}
