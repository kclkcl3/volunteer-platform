'use client';

import { useQuery } from '@tanstack/react-query';
import { TaskCard } from '@/features/tasks/task-card';
import { tasksApi } from '@/lib/api';

export default function CompletedTasksPage() {
  const tasks = useQuery({ queryKey: ['completed-tasks'], queryFn: () => tasksApi.my('completed') });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Completed Tasks</h1>
      <div className="grid gap-4">{tasks.data?.data.map((task) => <TaskCard key={task.id} task={task} />)}</div>
    </div>
  );
}
