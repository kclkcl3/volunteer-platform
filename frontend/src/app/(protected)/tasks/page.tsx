import { Suspense } from 'react';
import { TasksContent } from './tasks-content';

export default function TasksPage() {
	return (
		<Suspense
			fallback={
				<div className='space-y-6'>
					<div className='flex items-center justify-between'>
						<h1 className='text-3xl font-semibold'>Загрузка...</h1>
					</div>
					<div className='grid gap-4'>
						{[1, 2, 3].map((i) => (
							<div key={i} className='h-36 animate-pulse bg-muted rounded-lg' />
						))}
					</div>
				</div>
			}
		>
			<TasksContent />
		</Suspense>
	);
}
