'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { responsesApi } from '@/lib/api';

export default function MyResponsesPage() {
  const responses = useQuery({ queryKey: ['my-responses'], queryFn: () => responsesApi.my() });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">My Responses</h1>
      <div className="grid gap-4">
        {responses.data?.data.map((item: { id: string; status: string; message: string; task: { title: string } }) => (
          <Card key={item.id}><div className="flex justify-between"><strong>{item.task.title}</strong><Badge>{item.status}</Badge></div><p className="mt-2 text-sm">{item.message}</p></Card>
        ))}
      </div>
    </div>
  );
}
