import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
	return (
		<main className='min-h-screen bg-background'>
			<section className='mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-6'>
				<div className='flex items-center gap-3 text-primary'>
					<GraduationCap className='h-9 w-9' />
					<span className='text-lg font-semibold'>UniHelp</span>
				</div>
				<div className='max-w-3xl'>
					<h1 className='text-5xl font-semibold tracking-tight md:text-7xl'>
						Студенческий обмен задачами для университетских команд
					</h1>
					<p className='mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300'>
						Публикуйте учебные задачи, откликайтесь по навыкам, выбирайте
						помощников, управляйте рабочим процессом и сохраняйте прозрачные
						рейтинги без платежей.
					</p>
				</div>
				<div className='flex gap-3'>
					<Link href='/register'>
						<Button>
							Присоединиться <ArrowRight className='h-4 w-4' />
						</Button>
					</Link>
					<Link href='/login'>
						<Button className='border bg-background text-foreground'>
							Войти
						</Button>
					</Link>
				</div>
			</section>
		</main>
	);
}
