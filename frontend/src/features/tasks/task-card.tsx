import Link from 'next/link';
import { Calendar, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Task } from '@/lib/api';

export function TaskCard({ task }: { task: Task }) {
  const deadline = new Date(task.deadline);
  const isSoon = deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/tasks/${task.id}`} className="text-lg font-semibold hover:underline">{task.title}</Link>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
        </div>
        <Badge>{task.status}</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge className="bg-muted">{task.category.name}</Badge>
        {task.skills.map(({ skill }) => <Badge key={skill.id}>{skill.name}</Badge>)}
      </div>
      <div className="mt-4 flex items-center gap-5 text-sm text-slate-600 dark:text-slate-300">
        <span className={isSoon ? 'font-medium text-red-600' : ''}><Calendar className="mr-1 inline h-4 w-4" />{deadline.toLocaleDateString()}</span>
        <span><MessageSquare className="mr-1 inline h-4 w-4" />{task._count?.responses ?? 0}</span>
        <span>{task.customer.firstName} {task.customer.lastName}</span>
      </div>
    </Card>
  );
}
