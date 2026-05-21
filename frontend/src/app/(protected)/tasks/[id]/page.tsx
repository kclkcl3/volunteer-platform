'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Send, Star } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { commentsApi, responsesApi, reviewsApi, tasksApi } from '@/lib/api';

export default function TaskDetailsPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [response, setResponse] = useState('');
  const [comment, setComment] = useState('');
  const task = useQuery({ queryKey: ['task', params.id], queryFn: () => tasksApi.get(params.id) });
  const comments = useQuery({ queryKey: ['comments', params.id], queryFn: () => commentsApi.list(params.id) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['task', params.id] });
  const respond = useMutation({ mutationFn: () => responsesApi.create(params.id, response), onSuccess: () => { setResponse(''); void invalidate(); } });
  const addComment = useMutation({ mutationFn: () => commentsApi.create(params.id, { body: comment }), onSuccess: () => { setComment(''); void queryClient.invalidateQueries({ queryKey: ['comments', params.id] }); } });
  const createReview = useMutation({ mutationFn: () => reviewsApi.create(params.id, { rating: 5, text: 'Great work' }), onSuccess: invalidate });
  const current = task.data?.data;
  return (
    <div className="space-y-6">
      {current && (
        <>
          <Card>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold">{current.title}</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{current.description}</p>
              </div>
              <Badge>{current.status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{current.category.name}</Badge>
              {current.skills.map(({ skill }) => <Badge key={skill.id}>{skill.name}</Badge>)}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {current.status === 'draft' && <Button onClick={() => tasksApi.publish(current.id).then(invalidate)}>Publish</Button>}
              {current.status === 'executor_selected' && <Button onClick={() => tasksApi.start(current.id).then(invalidate)}>Start</Button>}
              {current.status === 'in_progress' && <Button onClick={() => tasksApi.sendToReview(current.id).then(invalidate)}>Send to review</Button>}
              {current.status === 'on_review' && <Button onClick={() => tasksApi.approve(current.id).then(invalidate)}>Approve work</Button>}
              {current.status === 'on_review' && <Button className="border bg-background text-foreground" onClick={() => tasksApi.requestRework(current.id, 'Needs fixes').then(invalidate)}>Request rework</Button>}
              {current.status === 'completed' && !current.review && <Button onClick={() => createReview.mutate()}><Star className="h-4 w-4" /> Review</Button>}
            </div>
          </Card>
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Responses</h2>
            <div className="space-y-3">
              {current.responses?.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{item.responder.firstName} {item.responder.lastName} · {item.responder.rating}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
                  </div>
                  {current.status === 'published' && <Button onClick={() => tasksApi.selectExecutor(current.id, item.id).then(invalidate)}>Select</Button>}
                </div>
              ))}
            </div>
            {current.status === 'published' && (
              <div className="mt-4 flex gap-2">
                <Input value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Response message" />
                <Button onClick={() => respond.mutate()}><Send className="h-4 w-4" /></Button>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Comments</h2>
            <div className="space-y-2">
              {comments.data?.data.map((item: { id: string; body: string; author: { firstName: string; lastName: string }; replies: { id: string; body: string }[] }) => (
                <div key={item.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{item.author.firstName} {item.author.lastName}</p>
                  <p>{item.body}</p>
                  {item.replies.map((reply) => <p key={reply.id} className="ml-4 mt-2 border-l pl-3 text-sm">{reply.body}</p>)}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write comment" />
              <Button onClick={() => addComment.mutate()}>Send</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
