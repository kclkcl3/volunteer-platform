'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tasksApi, categoriesApi, skillsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

const schema = z.object({
  title: z.string().min(3, 'Минимум 3 символа'),
  description: z.string().min(10, 'Минимум 10 символов'),
  deadline: z.string().min(1, 'Укажите дедлайн'),
  categoryId: z.coerce.number().min(1, 'Выберите категорию'),
});
type FormData = z.infer<typeof schema>;

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);
  const router = useRouter();
  const { student } = useAuth();
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [serverError, setServerError] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getById(taskId).then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillsApi.getAll().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        deadline: new Date(task.deadline).toISOString().slice(0, 16),
        categoryId: task.categoryId,
      });
      setSelectedSkills(task.taskSkills?.map((ts: any) => ts.skillId) || []);
    }
  }, [task]);

  useEffect(() => {
    if (task && student && task.customerStudentId !== student.id) {
      router.push(`/tasks/${taskId}`);
    }
  }, [task, student]);

  const toggleSkill = (id: number) => {
    setSelectedSkills((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('');
      await tasksApi.update(taskId, { ...data, skillIds: selectedSkills });
      router.push(`/tasks/${taskId}`);
    } catch (e: any) {
      setServerError(e.response?.data?.message || 'Ошибка сохранения');
    }
  };

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="card animate-pulse h-64" /></div>;
  if (!task) return <div className="text-center py-20 text-gray-400">Задача не найдена</div>;
  if (task.taskStatus?.name !== 'draft') return <div className="text-center py-20 text-gray-400">Редактировать можно только черновики</div>;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Редактировать задачу</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="label">Название</label>
          <input {...register('title')} className="input" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="label">Описание</label>
          <textarea {...register('description')} rows={4} className="input resize-none" />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Категория</label>
            <select {...register('categoryId')} className="input">
              <option value="">Выберите категорию</option>
              {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
          </div>
          <div>
            <label className="label">Дедлайн</label>
            <input {...register('deadline')} type="datetime-local" className="input" min={minDate.toISOString().slice(0, 16)} />
            {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}
          </div>
        </div>
        <div>
          <label className="label">Навыки</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills?.map((s: any) => (
              <button key={s.id} type="button" onClick={() => toggleSkill(s.id)}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${selectedSkills.includes(s.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
        {serverError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{serverError}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? 'Сохраняем...' : 'Сохранить изменения'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">Отмена</button>
        </div>
      </form>
    </div>
  );
}
