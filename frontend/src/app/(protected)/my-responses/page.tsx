'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { responsesApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const responseStatusMap: Record<string, string> = {
	pending: 'Ожидает рассмотрения',
	accepted: 'Принят',
	rejected: 'Отклонён',
	withdrawn: 'Отозван',
};

export default function MyResponsesPage() {
	const queryClient = useQueryClient();
	const responses = useQuery({
		queryKey: ['my-responses'],
		queryFn: () => responsesApi.my(),
	});

	const withdrawMutation = useMutation({
		mutationFn: (id: string) => responsesApi.withdraw(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['my-responses'] });
		},
	});

	return (
		<div className='space-y-6'>
			<h1 className='text-3xl font-semibold'>Мои отклики</h1>
			<div className='grid gap-4'>
				{responses.isLoading && <p>Загрузка...</p>}
				{responses.data?.data.map(
					(item: {
						id: string;
						status: string;
						message: string;
						task: { title: string; status: string };
					}) => (
						<Card key={item.id} className='p-4'>
							<div className='flex justify-between items-start'>
								<div>
									<strong className='font-semibold'>{item.task.title}</strong>
									<p className='mt-2 text-sm text-gray-600'>{item.message}</p>
								</div>
								<Badge>{responseStatusMap[item.status] || item.status}</Badge>
							</div>
							{item.status === 'pending' && (
								<div className='mt-4 flex justify-end'>
									<Button
										variant='destructive'
										size='sm'
										onClick={() => withdrawMutation.mutate(item.id)}
										disabled={withdrawMutation.isPending}
									>
										{withdrawMutation.isPending && (
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										)}
										Отозвать отклик
									</Button>
								</div>
							)}
						</Card>
					),
				)}
			</div>
		</div>
	);
}
