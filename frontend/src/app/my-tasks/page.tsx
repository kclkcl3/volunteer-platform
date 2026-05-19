'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { tasksApi } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const TAB_LABELS = [
  { key: 'customer', label: 'Я заказчик' },
  { key: 'executor', label: 'Я исполнитель' },
];

export default function MyTasksPage() {
  const { student, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'customer' | 'executor'>('customer');

  useEffect(() => {
    if (!authLoading && !student) router.push('/login');
  }, [student, authLoading, router]);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => tasksApi.getMy().then((r) => r.data),
    enabled: !!student,
  });

  const customerTasks = tasks?.filter((t: any) => t.customerStudentId === student?.id) || [];
  const executorTasks = tasks?.filter((t: any) => t.executorStudentId === student?.id) || [];

  const currentTasks = tab === 'customer' ? customerTasks : executorTasks;

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Мои задачи</h1>
        <Link href="/tasks/new" className="btn-primary flex items-center gap-1 text-sm">
          <Plus className="w-4 h-4" /> Новая задача
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {TAB_LABELS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'customer' | 'executor')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.key === 'customer' && customerTasks.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                {customerTasks.length}
              </span>
            )}
            {t.key === 'executor' && executorTasks.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'executor' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                {executorTasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-40" />)}
        </div>
      ) : currentTasks.length === 0 ? (
        <div className="text-center py-16">
          {tab === 'customer' ? (
            <>
              <p className="text-gray-400 text-lg mb-3">У вас пока нет задач</p>
              <Link href="/tasks/new" className="btn-primary">
                Создать первую задачу
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-400 text-lg mb-3">Вы ещё не являетесь исполнителем ни одной задачи</p>
              <Link href="/tasks" className="btn-primary">
                Найти задачи
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentTasks.map((t: any) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}
