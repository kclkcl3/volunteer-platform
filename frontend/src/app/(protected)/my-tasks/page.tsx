'use client';

import { useQuery } from '@tanstack/react-query';
import { TaskCard } from '@/features/tasks/task-card';
import { tasksApi } from '@/lib/api';

export default function MyTasksPage() {
  const tasks = useQuery({ queryKey: ['my-tasks'], queryFn: () => tasksApi.my() });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">My Tasks</h1>
      <div className="grid gap-4">{tasks.data?.data.map((task) => <TaskCard key={task.id} task={task} />)}</div>
    </div>
  );
}
