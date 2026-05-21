'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TaskCard } from '@/features/tasks/task-card';
import { directoriesApi, tasksApi } from '@/lib/api';

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [deadlineSoon, setDeadlineSoon] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const tasks = useQuery({ queryKey: ['tasks', search, deadlineSoon, categoryId], queryFn: () => tasksApi.list({ search, deadlineSoon, categoryId: categoryId || undefined, activeOnly: true }) });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => directoriesApi.categories() });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Tasks</h1>
        <Link href="/tasks/new"><Button><Plus className="h-4 w-4" /> New task</Button></Link>
      </div>
      <Card className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.data?.data.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={deadlineSoon} onChange={(e) => setDeadlineSoon(e.target.checked)} /> Next 24h</label>
      </Card>
      <div className="grid gap-4">
        {tasks.isLoading && [1, 2, 3].map((i) => <Card key={i} className="h-36 animate-pulse bg-muted" />)}
        {tasks.data?.data.items.map((task) => <TaskCard key={task.id} task={task} />)}
      </div>
    </div>
  );
}
