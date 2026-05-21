'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { notificationsApi } from '@/lib/api';

export default function NotificationsPage() {
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list() });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Notifications</h1>
      <div className="grid gap-3">
        {notifications.data?.data.map((item: { id: string; title: string; body: string; createdAt: string }) => <Card key={item.id}><strong>{item.title}</strong><p className="text-sm">{item.body}</p></Card>)}
      </div>
    </div>
  );
}
