'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Send, Star, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	commentsApi,
	responsesApi,
	reviewsApi,
	tasksApi,
	usersApi,
} from '@/lib/api';

// Маппинг статусов на русский
const statusLabels: Record<string, string> = {
	draft: 'Черновик',
	published: 'Опубликована',
	in_progress: 'В работе',
	on_review: 'На проверке',
	completed: 'Завершена',
};

export default function TaskDetailsPage() {
	const params = useParams<{ id: string }>();
	const queryClient = useQueryClient();
	const [response, setResponse] = useState('');
	const [comment, setComment] = useState('');
	const [replyingTo, setReplyingTo] = useState<string | null>(null);
	const task = useQuery({
		queryKey: ['task', params.id],
		queryFn: () => tasksApi.get(params.id),
	});
	const comments = useQuery({
		queryKey: ['comments', params.id],
		queryFn: () => commentsApi.list(params.id),
	});
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ['task', params.id] });
	const respond = useMutation({
		mutationFn: () => responsesApi.create(params.id, response),
		onSuccess: () => {
			setResponse('');
			void invalidate();
		},
	});
	const addComment = useMutation({
		mutationFn: () =>
			commentsApi.create(params.id, {
				body: comment,
				parentId: replyingTo || undefined,
			}),
		onSuccess: () => {
			setComment('');
			setReplyingTo(null);
			void queryClient.invalidateQueries({ queryKey: ['comments', params.id] });
		},
	});
	const createReview = useMutation({
		mutationFn: () =>
			reviewsApi.create(params.id, { rating: 5, text: 'Great work' }),
		onSuccess: invalidate,
	});
	const resetExecutor = useMutation({
		mutationFn: () => tasksApi.resetExecutor(current!.id),
		onSuccess: invalidate,
	});
	const withdrawResponse = useMutation({
		mutationFn: (responseId: string) => responsesApi.withdraw(responseId),
		onSuccess: invalidate,
	});
	const currentUser = useQuery({
		queryKey: ['currentUser'],
		queryFn: () => usersApi.me(),
	});
	const current = task.data?.data;
	const isOwner = current?.customer.id === currentUser.data?.data.id;
	const isExecutor = current?.executor?.id === currentUser.data?.data.id;
	const userResponses = current?.responses?.filter(
		(item) => item.responder.id === currentUser.data?.data.id,
	);
	return (
		<div className='space-y-6'>
			{current && (
				<>
					<Card>
						<div className='flex flex-wrap justify-between gap-3'>
							<div>
								<h1 className='text-3xl font-semibold'>{current.title}</h1>
								<p className='mt-2 text-slate-600 dark:text-slate-300'>
									{current.description}
								</p>
							</div>
							<Badge className='px-2.5 py-1 text-xs font-medium rounded-md'>
								{statusLabels[current.status]}
							</Badge>
						</div>
						<div className='mt-4 flex flex-wrap gap-2'>
							{current.skills?.map(({ skill }) => (
								<Badge
									key={skill.id}
									variant='secondary'
									className='px-2.5 py-1 text-xs font-medium rounded-md'
								>
									{skill.name}
								</Badge>
							))}
						</div>
						<div className='mt-5 flex flex-wrap gap-2'>
							{current.status === 'draft' && (
								<Button
									onClick={() => tasksApi.publish(current.id).then(invalidate)}
								>
									Опубликовать
								</Button>
							)}
							{current.status === 'in_progress' && isExecutor && (
								<Button
									onClick={() =>
										tasksApi.sendToReview(current.id).then(invalidate)
									}
								>
									Отправить на проверку
								</Button>
							)}
							{current.status === 'on_review' && isOwner && (
								<>
									<Button
										onClick={() =>
											tasksApi.approve(current.id).then(invalidate)
										}
									>
										Принять работу
									</Button>
									<Button
										className='border bg-background text-foreground'
										onClick={() =>
											tasksApi
												.requestRework(current.id, 'Требуются доработки')
												.then(invalidate)
										}
									>
										Отправить на доработку
									</Button>
									<Button
										className='bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
										onClick={() => resetExecutor.mutate()}
										disabled={resetExecutor.isPending}
									>
										<RefreshCw className='h-4 w-4 mr-2' />
										Сбросить исполнителя
									</Button>
								</>
							)}
							{current.status === 'completed' && isOwner && !current.review && (
								<Button
									onClick={() => createReview.mutate()}
									disabled={createReview.isPending}
								>
									<Star className='h-4 w-4' /> Оставить отзыв
								</Button>
							)}
						</div>
					</Card>
					<Card>
						<h2 className='mb-3 text-lg font-semibold'>Отклики</h2>
						<div className='space-y-3'>
							{current.responses?.map((item) => (
								<div
									key={item.id}
									className='flex items-center justify-between rounded-md border p-3'
								>
									<div>
										<p className='font-medium'>
											{item.responder.firstName} {item.responder.lastName} ·{' '}
											{item.responder.rating}
										</p>
										<p className='text-sm text-slate-600 dark:text-slate-300'>
											{item.message}
										</p>
									</div>
									<div className='flex gap-2'>
										{current.status === 'published' && isOwner && (
											<Button
												onClick={() =>
													tasksApi
														.selectExecutor(current.id, item.id)
														.then(invalidate)
												}
											>
												Выбрать
											</Button>
										)}
										{current.status === 'published' &&
											item.responder.id === currentUser.data?.data.id && (
												<Button
													variant='destructive'
													onClick={() => withdrawResponse.mutate(item.id)}
													disabled={withdrawResponse.isPending}
												>
													Отозвать
												</Button>
											)}
									</div>
								</div>
							))}
						</div>
						{current.status === 'published' &&
							!isOwner &&
							!current.executor && (
								<div className='mt-4 flex gap-2'>
									<Input
										value={response}
										onChange={(event) => setResponse(event.target.value)}
										placeholder='Ваше сообщение'
										disabled={respond.isPending}
									/>
									<Button
										onClick={() => response.trim() && respond.mutate()}
										disabled={respond.isPending || !response.trim()}
									>
										<Send className='h-4 w-4' />
									</Button>
								</div>
							)}
					</Card>
					<Card>
						<h2 className='mb-3 text-lg font-semibold'>Комментарии</h2>
						<div className='space-y-4'>
							{comments.data?.data
								?.filter((item: { deletedAt?: string }) => !item.deletedAt)
								.map(
									(item: {
										id: string;
										body: string;
										editedAt?: string;
										deletedAt?: string;
										author: { firstName: string; lastName: string };
										replies: {
											id: string;
											body: string;
											editedAt?: string;
											deletedAt?: string;
											author: { firstName: string; lastName: string };
										}[];
									}) => (
										<div key={item.id} className='rounded-md border p-3'>
											<div className='flex items-center gap-2'>
												<p className='text-sm font-medium'>
													{item.author.firstName} {item.author.lastName}
												</p>
												{item.editedAt && (
													<span className='text-xs text-slate-500'>(ред.)</span>
												)}
											</div>
											<p>{item.body}</p>
											{!item.deletedAt && (
												<Button
													className='mt-1 h-auto p-0 text-xs bg-transparent text-slate-600 dark:text-slate-400 hover:bg-transparent hover:underline'
													onClick={() => setReplyingTo(item.id)}
												>
													Ответить
												</Button>
											)}
											<div className='mt-2 space-y-2'>
												{item.replies
													?.filter((reply) => !reply.deletedAt)
													.map((reply) => (
														<div
															key={reply.id}
															className='ml-4 mt-2 border-l pl-3 text-sm'
														>
															<div className='flex items-center gap-2'>
																<p className='text-sm font-medium'>
																	{reply.author.firstName}{' '}
																	{reply.author.lastName}
																</p>
																{reply.editedAt && (
																	<span className='text-xs text-slate-500'>
																		(ред.)
																	</span>
																)}
															</div>
															<p>{reply.body}</p>
														</div>
													))}
											</div>
										</div>
									),
								)}
						</div>
						{replyingTo && (
							<div className='mt-4 rounded-md border p-2 bg-slate-50 dark:bg-slate-800'>
								<p className='text-xs text-slate-500 mb-2'>
									Ответ на комментарий.{' '}
									<button
										className='text-red-500'
										onClick={() => setReplyingTo(null)}
									>
										Отмена
									</button>
								</p>
							</div>
						)}
						<div className='mt-4 flex gap-2'>
							<Input
								value={comment}
								onChange={(event) => setComment(event.target.value)}
								placeholder={
									replyingTo ? 'Ваш ответ...' : 'Напишите комментарий'
								}
								disabled={addComment.isPending}
							/>
							<Button
								onClick={() => comment.trim() && addComment.mutate()}
								disabled={addComment.isPending || !comment.trim()}
							>
								Отправить
							</Button>
						</div>
					</Card>
				</>
			)}
		</div>
	);
}
