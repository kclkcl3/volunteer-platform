'use client';

import Link from 'next/link';
import { Bell, CheckCircle, LayoutDashboard, ListChecks, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/my-tasks', label: 'My Tasks', icon: User },
  { href: '/completed-tasks', label: 'Completed', icon: CheckCircle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 hidden w-64 border-r bg-background p-4 md:block">
        <Link href="/dashboard" className="mb-8 block text-xl font-semibold">UniHelp</Link>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted')}>
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
