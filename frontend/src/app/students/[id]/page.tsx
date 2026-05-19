'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { studentsApi, tasksApi } from '@/lib/api';
import { Star, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { TaskCard } from '@/components/TaskCard';

type Tab = 'info' | 'completed';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const [tab, setTab] = useState<Tab>('info');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsApi.getById(studentId).then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', studentId],
    queryFn: () => studentsApi.getReviews(studentId).then((r) => r.data),
    enabled: !!profile,
  });

  const { data: completedTasks } = useQuery({
    queryKey: ['completed-tasks', studentId],
    queryFn: () => tasksApi.getCompletedByStudent(studentId).then((r) => r.data),
    enabled: tab === 'completed',
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="card animate-pulse h-40" />
        <div className="card animate-pulse h-32" />
      </div>
    );
  }

  if (!profile) return <div className="text-center py-20 text-gray-400">Пользователь не найден</div>;

  const totalCompleted = (profile.completedAsCustomer || 0) + (profile.completedAsExecutor || 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="card">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile.firstName?.[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {profile.lastName} {profile.firstName} {profile.middleName || ''}
            </h1>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {profile.rating ? (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <span className="font-semibold">{profile.rating}</span>
                  <span className="text-gray-400 text-sm">({profile.reviewsCount} отзывов)</span>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">Нет оценок</span>
              )}
              {totalCompleted > 0 && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {totalCompleted} выполнено
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('info')}
          className={clsx('px-5 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'info' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
          Профиль
        </button>
        <button onClick={() => setTab('completed')}
          className={clsx('px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1',
            tab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
          <CheckCircle className="w-4 h-4" /> Выполненные задачи
        </button>
      </div>

      {tab === 'info' && (
        <>
          {profile.studentSkills?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-3">Навыки</h2>
              <div className="flex flex-wrap gap-2">
                {profile.studentSkills.map((ss: any) => (
                  <span key={ss.skill.id} className="bg-blue-50 text-blue-600 text-sm px-3 py-1 rounded-full">
                    {ss.skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="font-semibold mb-4">Отзывы ({reviews?.length || 0})</h2>
            {reviews?.length === 0 ? (
              <p className="text-gray-400 text-sm">Отзывов пока нет.</p>
            ) : (
              <div className="space-y-3">
                {reviews?.map((r: any) => (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{r.reviewer?.firstName} {r.reviewer?.lastName}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={clsx('w-3.5 h-3.5', n <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} />
                        ))}
                      </div>
                    </div>
                    {r.reviewText && <p className="text-gray-600 text-sm">{r.reviewText}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'completed' && (
        <div>
          {!completedTasks ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-36" />)}
            </div>
          ) : completedTasks.length === 0 ? (
            <div className="card text-center py-10">
              <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Выполненных задач пока нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTasks.map((t: any) => <TaskCard key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
