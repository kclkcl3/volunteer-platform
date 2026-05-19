'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { tasksApi, categoriesApi, skillsApi } from '@/lib/api';
import { useState } from 'react';

const schema = z.object({
  title: z.string().min(3, 'Минимум 3 символа'),
  description: z.string().min(10, 'Минимум 10 символов'),
  deadline: z.string().min(1, 'Укажите дедлайн'),
  categoryId: z.coerce.number().min(1, 'Выберите категорию'),
  publishImmediately: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewTaskPage() {
  const router = useRouter();
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [serverError, setServerError] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillsApi.getAll().then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { publishImmediately: false },
  });

  const toggleSkill = (id: number) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('');
      const res = await tasksApi.create({ ...data, skillIds: selectedSkills });
      router.push(`/tasks/${res.data.id}`);
    } catch (e: any) {
      setServerError(e.response?.data?.message || 'Ошибка создания задачи');
    }
  };

  // Min deadline = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Новая задача</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="label">Название задачи</label>
          <input {...register('title')} className="input" placeholder="Например: Помогите разобраться с React hooks" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="label">Описание</label>
          <textarea
            {...register('description')}
            rows={4}
            className="input resize-none"
            placeholder="Подробно опишите задачу, что нужно сделать, какой результат ожидаете..."
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Категория</label>
            <select {...register('categoryId')} className="input">
              <option value="">Выберите категорию</option>
              {categories?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className="label">Дедлайн</label>
            <input {...register('deadline')} type="datetime-local" className="input" min={minDateStr} />
            {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Требуемые навыки</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills?.map((s: any) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSkill(s.id)}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  selectedSkills.includes(s.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input {...register('publishImmediately')} type="checkbox" id="publish" className="w-4 h-4" />
          <label htmlFor="publish" className="text-sm text-gray-700">
            Опубликовать сразу (иначе сохранится как черновик)
          </label>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {serverError}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? 'Создаём...' : 'Создать задачу'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
