'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { TaskCard } from '@/features/tasks/task-card';
import { analyticsApi, tasksApi, usersApi } from '@/lib/api';

export default function DashboardPage() {
  const recommended = useQuery({ queryKey: ['recommended'], queryFn: () => tasksApi.recommended() });
  const top = useQuery({ queryKey: ['top-users'], queryFn: () => usersApi.top() });
  const analytics = useQuery({ queryKey: ['analytics'], queryFn: () => analyticsApi.dashboard() });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-slate-500">Active users</p><p className="text-3xl font-semibold">{analytics.data?.data.activeUsers ?? 0}</p></Card>
        <Card><p className="text-sm text-slate-500">Deadline soon</p><p className="text-3xl font-semibold">{analytics.data?.data.deadlineSoon?.length ?? 0}</p></Card>
        <Card><p className="text-sm text-slate-500">Overdue</p><p className="text-3xl font-semibold">{analytics.data?.data.overdue?.length ?? 0}</p></Card>
      </div>
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recommended tasks</h2>
          {recommended.data?.data.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
        <Card>
          <h2 className="mb-3 text-xl font-semibold">Top helpers</h2>
          <div className="space-y-3">
            {top.data?.data.map((user) => <div key={user.id} className="flex justify-between text-sm"><span>{user.firstName} {user.lastName}</span><span>{user.rating}</span></div>)}
          </div>
        </Card>
      </section>
    </div>
  );
}
