'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { analyticsApi } from '@/lib/api';

export default function AdminPage() {
  const analytics = useQuery({ queryKey: ['admin-analytics'], queryFn: () => analyticsApi.dashboard() });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p>Average rating</p><strong>{analytics.data?.data.averageRatings?._avg?.rating ?? 0}</strong></Card>
        <Card><p>Reviews</p><strong>{analytics.data?.data.averageRatings?._count ?? 0}</strong></Card>
        <Card><p>Overdue tasks</p><strong>{analytics.data?.data.overdue?.length ?? 0}</strong></Card>
      </div>
    </div>
  );
}
