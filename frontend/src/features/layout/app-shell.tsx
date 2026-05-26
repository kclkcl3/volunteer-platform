'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	Bell,
	CheckCircle,
	LayoutDashboard,
	ListChecks,
	MessageSquare,
	User,
	FilePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
	{ href: '/dashboard', label: 'Панель управления', icon: LayoutDashboard },
	{ href: '/tasks', label: 'Задачи', icon: ListChecks },
	{ href: '/my-created-tasks', label: 'Созданные мной', icon: FilePlus },
	{ href: '/tasks-i-work-on', label: 'В работе', icon: CheckCircle },
	{ href: '/my-responses', label: 'Мои отклики', icon: MessageSquare },
	{ href: '/profile', label: 'Профиль', icon: User },
	{ href: '/notifications', label: 'Уведомления', icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	return (
		<div className='min-h-screen bg-muted/40'>
			<aside className='fixed inset-y-0 hidden w-64 border-r bg-background p-4 md:block'>
				<Link href='/dashboard' className='mb-8 block text-xl font-semibold'>
					UniHelp
				</Link>
				<nav className='space-y-1'>
					{nav.map((item) => {
						const isActive =
							pathname === item.href || pathname.startsWith(`${item.href}/`);
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
									isActive
										? 'bg-primary text-primary-foreground'
										: 'hover:bg-muted text-muted-foreground hover:text-foreground',
								)}
							>
								<item.icon className='h-4 w-4' /> {item.label}
							</Link>
						);
					})}
				</nav>
			</aside>
			<main className='md:pl-64'>
				<div className='mx-auto max-w-7xl p-4 md:p-8'>{children}</div>
			</main>
		</div>
	);
}
