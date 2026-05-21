'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { directoriesApi, tasksApi } from '@/lib/api';

const schema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  categoryId: z.string().min(1),
  skillIds: z.array(z.string()).default([]),
  deadline: z.string().min(1),
  publishImmediately: z.boolean().default(false),
});
type FormValues = z.infer<typeof schema>;

export default function NewTaskPage() {
  const router = useRouter();
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => directoriesApi.categories() });
  const skills = useQuery({ queryKey: ['skills'], queryFn: () => directoriesApi.skills() });
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { title: '', description: '', categoryId: '', skillIds: [], deadline: '', publishImmediately: false } });
  const mutation = useMutation({ mutationFn: (values: FormValues) => tasksApi.create(values), onSuccess: ({ data }) => router.push(`/tasks/${data.id}`) });
  const selectedSkills = form.watch('skillIds');
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">New task</h1>
      <Card>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <Input placeholder="Title" {...form.register('title')} />
          <textarea className="min-h-36 w-full rounded-md border bg-background p-3 text-sm" placeholder="Description" {...form.register('description')} />
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...form.register('categoryId')}>
            <option value="">Category</option>
            {categories.data?.data.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <div className="grid gap-2 md:grid-cols-3">
            {skills.data?.data.map((skill) => (
              <label key={skill.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill.id)}
                  onChange={(event) => {
                    const next = event.target.checked ? [...selectedSkills, skill.id] : selectedSkills.filter((id) => id !== skill.id);
                    form.setValue('skillIds', next);
                  }}
                />
                {skill.name}
              </label>
            ))}
          </div>
          <Input type="datetime-local" {...form.register('deadline')} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('publishImmediately')} /> Publish immediately</label>
          <Button type="submit">Save task</Button>
        </form>
      </Card>
    </div>
  );
}
