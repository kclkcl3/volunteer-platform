import Link from 'next/link';
import { Calendar, Tag, Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { clsx } from 'clsx';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликована',
  executor_selected: 'Исполнитель выбран',
  in_progress: 'В работе',
  on_review: 'На проверке',
  completed: 'Выполнена',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-blue-100 text-blue-700',
  executor_selected: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  on_review: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
};

interface TaskCardProps {
  task: any;
}

export function TaskCard({ task }: TaskCardProps) {
  const statusName = task.taskStatus?.name || '';
  const isOverdue = new Date(task.deadline) < new Date() && statusName !== 'completed';

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="card hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 pr-2">{task.title}</h3>
          <span className={clsx('text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap', STATUS_COLORS[statusName])}>
            {STATUS_LABELS[statusName] || statusName}
          </span>
        </div>

        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{task.description}</p>

        {task.taskSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {task.taskSkills.slice(0, 4).map((ts: any) => (
              <span key={ts.skill.id} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                {ts.skill.name}
              </span>
            ))}
            {task.taskSkills.length > 4 && (
              <span className="text-xs text-gray-400">+{task.taskSkills.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            {task.category && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> {task.category.name}
              </span>
            )}
            {task._count && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {task._count.responses}
              </span>
            )}
          </div>
          <span className={clsx('flex items-center gap-1', isOverdue && 'text-red-500')}>
            <Calendar className="w-3 h-3" />
            {isOverdue ? 'Просрочена' : formatDistanceToNow(new Date(task.deadline), { addSuffix: true, locale: ru })}
          </span>
        </div>
      </div>
    </Link>
  );
}
