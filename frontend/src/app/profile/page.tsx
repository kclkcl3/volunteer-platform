'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { studentsApi, skillsApi, tasksApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Star, Plus, X, Award, CheckCircle, List } from 'lucide-react';
import { clsx } from 'clsx';
import { TaskCard } from '@/components/TaskCard';

type Tab = 'info' | 'completed';

export default function ProfilePage() {
  const { student, isLoading: authLoading, refreshMe } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('info');

  useEffect(() => {
    if (!authLoading && !student) router.push('/login');
  }, [student, authLoading, router]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', student?.id],
    queryFn: () => studentsApi.getMe().then((r) => r.data),
    enabled: !!student,
  });

  const { data: allSkills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillsApi.getAll().then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', student?.id],
    queryFn: () => studentsApi.getReviews(student!.id).then((r) => r.data),
    enabled: !!student,
  });

  const { data: completedTasks } = useQuery({
    queryKey: ['completed-tasks', student?.id],
    queryFn: () => tasksApi.getCompletedByStudent(student!.id).then((r) => r.data),
    enabled: !!student && tab === 'completed',
  });

  const invalidateProfile = () => {
    qc.invalidateQueries({ queryKey: ['profile', student?.id] });
    refreshMe();
  };

  const addSkillMutation = useMutation({
    mutationFn: (skillId: number) => studentsApi.addSkill(skillId),
    onSuccess: invalidateProfile,
  });

  const removeSkillMutation = useMutation({
    mutationFn: (skillId: number) => studentsApi.removeSkill(skillId),
    onSuccess: invalidateProfile,
  });

  if (authLoading || profileLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="card animate-pulse h-40" />
        <div className="card animate-pulse h-32" />
      </div>
    );
  }

  if (!profile) return null;

  const mySkillIds = new Set(profile.studentSkills?.map((ss: any) => ss.skillId));
  const availableSkills = allSkills?.filter((s: any) => !mySkillIds.has(s.id)) || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Profile header */}
      <div className="card">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile.firstName?.[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {profile.lastName} {profile.firstName} {profile.middleName || ''}
            </h1>
            <p className="text-gray-500 text-sm">{profile.email}</p>
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
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                {(profile.completedAsCustomer || 0) + (profile.completedAsExecutor || 0)} выполнено
              </div>
              <div className="text-xs text-gray-400">
                Заказчик: {profile.completedAsCustomer || 0} · Исполнитель: {profile.completedAsExecutor || 0}
              </div>
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
          {/* Skills */}
          <div className="card">
            <h2 className="font-semibold text-lg mb-4">Мои навыки</h2>

            {profile.studentSkills?.length === 0 && (
              <p className="text-gray-400 text-sm mb-4">Навыки не добавлены</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {profile.studentSkills?.map((ss: any) => (
                <div key={ss.skill.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                  {ss.skill.name}
                  <button onClick={() => removeSkillMutation.mutate(ss.skill.id)}
                    disabled={removeSkillMutation.isPending}
                    className="text-blue-400 hover:text-red-500 ml-1 disabled:opacity-50">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {availableSkills.length > 0 && (
              <>
                <p className="text-sm text-gray-500 mb-2">Добавить навык:</p>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((s: any) => (
                    <button key={s.id} onClick={() => addSkillMutation.mutate(s.id)}
                      disabled={addSkillMutation.isPending}
                      className="flex items-center gap-1 text-sm px-3 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                      <Plus className="w-3 h-3" /> {s.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Reviews */}
          <div className="card">
            <h2 className="font-semibold text-lg mb-4">Отзывы обо мне ({reviews?.length || 0})</h2>
            {reviews?.length === 0 ? (
              <p className="text-gray-400 text-sm">Отзывов пока нет. Выполните задачи, чтобы получить отзывы.</p>
            ) : (
              <div className="space-y-4">
                {reviews?.map((r: any) => (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{r.reviewer?.firstName} {r.reviewer?.lastName}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={clsx('w-4 h-4', n <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} />
                        ))}
                      </div>
                    </div>
                    {r.reviewText && <p className="text-gray-600 text-sm">{r.reviewText}</p>}
                    <p className="text-xs text-gray-400 mt-1">Задача: <span className="text-blue-500">{r.task?.title}</span></p>
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
            <div className="grid grid-cols-1 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-40" />)}
            </div>
          ) : completedTasks.length === 0 ? (
            <div className="card text-center py-10">
              <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Выполненных задач пока нет</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {completedTasks.map((t: any) => <TaskCard key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
