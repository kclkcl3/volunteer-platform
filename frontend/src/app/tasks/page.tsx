'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi, categoriesApi, skillsApi } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';
import { Search, X, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { clsx } from 'clsx';

export default function TasksPage() {
  const { student } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [deadlineSoon, setDeadlineSoon] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', { search, categoryId, skillId, deadlineSoon, page }],
    queryFn: () =>
      tasksApi.getAll({
        search: search || undefined,
        categoryId: categoryId || undefined,
        skillId: skillId || undefined,
        deadlineSoon: deadlineSoon ? 'true' : undefined,
        page,
        limit: LIMIT,
      }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillsApi.getAll().then((r) => r.data),
  });

  const resetFilters = () => {
    setSearch(''); setCategoryId(''); setSkillId(''); setDeadlineSoon(false); setPage(1);
  };

  const hasFilters = search || categoryId || skillId || deadlineSoon;
  const totalPages = tasksData ? Math.ceil(tasksData.total / LIMIT) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Актуальные задачи</h1>
        {student && (
          <Link href="/tasks/new" className="btn-primary text-sm">+ Новая задача</Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Название или описание..." className="input pl-9" />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-2.5 text-gray-300 hover:text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="min-w-[180px]">
            <label className="label">Категория</label>
            <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="input">
              <option value="">Все категории</option>
              {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="label">Навык</label>
            <select value={skillId} onChange={(e) => { setSkillId(e.target.value); setPage(1); }} className="input">
              <option value="">Все навыки</option>
              {skills?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="btn-secondary flex items-center gap-1 self-end">
              <X className="w-4 h-4" /> Сбросить
            </button>
          )}
        </div>

        {/* Deadline filter toggle */}
        <div>
          <button
            onClick={() => { setDeadlineSoon(!deadlineSoon); setPage(1); }}
            className={clsx(
              'flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors',
              deadlineSoon
                ? 'bg-orange-100 border-orange-300 text-orange-700 font-medium'
                : 'bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600'
            )}
          >
            <Clock className="w-4 h-4" />
            Дедлайн в течение 24 часов
            {deadlineSoon && <X className="w-3 h-3 ml-1" />}
          </button>
        </div>
      </div>

      {tasksData && (
        <p className="text-sm text-gray-400 mb-4">
          {hasFilters ? `Найдено: ${tasksData.total}` : `Всего задач: ${tasksData.total}`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card animate-pulse h-52" />)}
        </div>
      ) : tasksData?.tasks?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">Задачи не найдены</p>
          {hasFilters && <button onClick={resetFilters} className="btn-secondary mt-2">Сбросить фильтры</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasksData?.tasks?.map((task: any) => <TaskCard key={task.id} task={task} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-40">← Назад</button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pageNum) => (
              <button key={pageNum} onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {pageNum}
              </button>
            ))}
          </div>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary disabled:opacity-40">Вперёд →</button>
        </div>
      )}
    </div>
  );
}
