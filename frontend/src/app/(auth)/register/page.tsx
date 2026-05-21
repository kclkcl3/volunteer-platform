'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState('');
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { firstName: '', lastName: '', email: '', password: '' } });
  async function onSubmit(values: FormValues) {
    setSubmitError('');
    try {
      const { data } = await authApi.register(values);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push('/dashboard');
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Registration failed'
          : 'Registration failed';
      setSubmitError(Array.isArray(message) ? message.join(', ') : message);
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Input placeholder="First name" {...form.register('firstName')} />
          {form.formState.errors.firstName && <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>}
          <Input placeholder="Last name" {...form.register('lastName')} />
          {form.formState.errors.lastName && <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>}
          <Input placeholder="Email" {...form.register('email')} />
          {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
          <Input placeholder="Password" type="password" {...form.register('password')} />
          {form.formState.errors.password && <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>}
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating account...' : 'Register'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
