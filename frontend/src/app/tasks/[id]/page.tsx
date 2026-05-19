'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, responsesApi, commentsApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { clsx } from 'clsx';
import Link from 'next/link';
import {
  User, Calendar, Tag, ChevronRight, Star, Send, Trash2,
  CheckCircle, Edit3, ChevronDown, ChevronUp, MessageSquare,
  Paperclip, RotateCcw,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликована',
  executor_selected: 'Исполнитель выбран',
  in_progress: 'В работе',
  on_review: 'На проверке',
  completed: 'Выполнена',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-blue-100 text-blue-700',
  executor_selected: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  on_review: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
};

const STATUS_ORDER = ['draft', 'published', 'executor_selected', 'in_progress', 'on_review', 'completed'];

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}>
          <Star className={clsx('w-7 h-7 transition-colors',
            n <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
        </button>
      ))}
    </div>
  );
}

function CommentItem({ comment, currentStudentId, onDelete, taskId, onReplyAdded }: {
  comment: any; currentStudentId?: number;
  onDelete: (id: number) => void; taskId: number; onReplyAdded: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(true);

  const replyMutation = useMutation({
    mutationFn: () => commentsApi.create(taskId, { commentText: replyText, parentCommentId: comment.id }),
    onSuccess: () => { setReplyText(''); setShowReply(false); onReplyAdded(); },
  });

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
        {comment.author?.firstName?.[0]}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold">{comment.author?.firstName} {comment.author?.lastName}</span>
          <span className="text-xs text-gray-400">{format(new Date(comment.createdAt), 'd MMM, HH:mm', { locale: ru })}</span>
          <div className="ml-auto flex items-center gap-2">
            {currentStudentId && (
              <button onClick={() => setShowReply(!showReply)} className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Ответить
              </button>
            )}
            {currentStudentId === comment.authorStudentId && (
              <button onClick={() => onDelete(comment.id)} className="text-gray-300 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-700 text-sm">{comment.commentText}</p>

        {showReply && (
          <div className="flex gap-2 mt-2">
            <input value={replyText} onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) { e.preventDefault(); replyMutation.mutate(); } }}
              className="input flex-1 text-sm py-1.5" placeholder="Введите ответ..." autoFocus />
            <button onClick={() => replyMutation.mutate()} disabled={!replyText.trim() || replyMutation.isPending} className="btn-primary px-3 py-1.5 text-sm">
              <Send className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setShowReply(false)} className="btn-secondary px-3 py-1.5 text-sm">✕</button>
          </div>
        )}

        {comment.replies?.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setShowReplies(!showReplies)} className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 mb-2">
              {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {comment.replies.length} {comment.replies.length === 1 ? 'ответ' : 'ответа'}
            </button>
            {showReplies && (
              <div className="border-l-2 border-blue-100 pl-4 space-y-3">
                {comment.replies.map((reply: any) => (
                  <div key={reply.id} className="flex gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold shrink-0">
                      {reply.author?.firstName?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold">{reply.author?.firstName} {reply.author?.lastName}</span>
                        <span className="text-xs text-gray-400">{format(new Date(reply.createdAt), 'd MMM, HH:mm', { locale: ru })}</span>
                        {currentStudentId === reply.authorStudentId && (
                          <button onClick={() => onDelete(reply.id)} className="ml-auto text-gray-300 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm">{reply.commentText}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);
  const { student } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [responseComment, setResponseComment] = useState('');
  const [commentText, setCommentText] = useState('');
  const [workResult, setWorkResult] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getById(taskId).then((r) => r.data),
  });

  const { data: responses } = useQuery({
    queryKey: ['responses', taskId],
    queryFn: () => responsesApi.getByTask(taskId).then((r) => r.data),
    enabled: !!task && !!student && task.customerStudentId === student?.id,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.getByTask(taskId).then((r) => r.data),
    enabled: !!task,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['task', taskId] });
    qc.invalidateQueries({ queryKey: ['responses', taskId] });
    qc.invalidateQueries({ queryKey: ['comments', taskId] });
    qc.invalidateQueries({ queryKey: ['my-tasks'] });
  };

  const respondMutation = useMutation({
    mutationFn: () => responsesApi.create(taskId, { commentText: responseComment }),
    onSuccess: () => { setResponseComment(''); setError(''); invalidate(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Ошибка отклика'),
  });

  const commentMutation = useMutation({
    mutationFn: () => commentsApi.create(taskId, { commentText }),
    onSuccess: () => { setCommentText(''); invalidate(); },
  });

  // Исполнитель отправляет результат через комментарий
  const submitWorkMutation = useMutation({
    mutationFn: async () => {
      if (workResult.trim()) {
        await commentsApi.create(taskId, { commentText: `📎 Результат работы:\n${workResult}` });
      }
      return tasksApi.advanceStatus(taskId);
    },
    onSuccess: () => { setWorkResult(''); invalidate(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Ошибка'),
  });

  const advanceMutation = useMutation({
    mutationFn: () => tasksApi.advanceStatus(taskId),
    onSuccess: invalidate,
    onError: (e: any) => setError(e.response?.data?.message || 'Ошибка'),
  });

  const rejectWorkMutation = useMutation({
    mutationFn: async () => {
      if (rejectReason.trim()) {
        await commentsApi.create(taskId, { commentText: `❌ Работа отклонена. Причина:\n${rejectReason}` });
      }
      return tasksApi.rejectWork(taskId);
    },
    onSuccess: () => { setRejectReason(''); setShowRejectForm(false); invalidate(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Ошибка'),
  });

  const selectExecutorMutation = useMutation({
    mutationFn: (executorId: number) => tasksApi.selectExecutor(taskId, executorId),
    onSuccess: invalidate,
    onError: (e: any) => setError(e.response?.data?.message || 'Ошибка'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => reviewsApi.create(taskId, { rating: reviewRating, reviewText: reviewText || undefined }),
    onSuccess: () => { setShowReviewForm(false); setReviewText(''); setReviewRating(5); invalidate(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Ошибка отправки отзыва'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.delete(commentId),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(taskId),
    onSuccess: () => router.push('/my-tasks'),
    onError: (e: any) => setError(e.response?.data?.message || 'Ошибка удаления'),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="card animate-pulse h-64" />
        <div className="card animate-pulse h-32" />
      </div>
    );
  }

  if (!task) return <div className="text-center py-20 text-gray-400">Задача не найдена</div>;

  const isCustomer = student?.id === task.customerStudentId;
  const isExecutor = student?.id === task.executorStudentId;
  const statusName = task.taskStatus?.name;
  const currentIndex = STATUS_ORDER.indexOf(statusName);
  const canRespond = student && !isCustomer && !isExecutor && statusName === 'published';
  const canDelete = isCustomer && ['draft', 'published'].includes(statusName);
  const canEdit = isCustomer && statusName === 'draft';

  // Кнопки действий по статусам
  const showPublishBtn = isCustomer && statusName === 'draft';
  const showStartWorkBtn = isExecutor && statusName === 'executor_selected';
  const showSubmitWorkBtn = isExecutor && statusName === 'in_progress';
  const showApproveBtn = isCustomer && statusName === 'on_review';
  const showRejectBtn = isCustomer && statusName === 'on_review';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full', STATUS_COLORS[statusName])}>
                {STATUS_LABELS[statusName]}
              </span>
              {task.category && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Tag className="w-3 h-3" /> {task.category.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <Link href={`/tasks/${taskId}/edit`} className="text-gray-400 hover:text-blue-500" title="Редактировать">
                <Edit3 className="w-5 h-5" />
              </Link>
            )}
            {canDelete && (
              <button onClick={() => { if (confirm('Удалить задачу?')) deleteMutation.mutate(); }}
                className="text-gray-400 hover:text-red-500" title="Удалить">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-gray-600 whitespace-pre-line mb-4 leading-relaxed">{task.description}</p>

        {task.taskSkills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {task.taskSkills.map((ts: any) => (
              <span key={ts.skill.id} className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full font-medium">
                {ts.skill.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-t pt-4">
          <Link href={`/students/${task.customerStudentId}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <User className="w-4 h-4" /> {task.customer?.lastName} {task.customer?.firstName}
          </Link>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Дедлайн: {format(new Date(task.deadline), 'd MMMM yyyy', { locale: ru })}
          </span>
          {task.executor && (
            <Link href={`/students/${task.executorStudentId}`} className="flex items-center gap-1.5 text-green-600 hover:text-green-700 transition-colors">
              <CheckCircle className="w-4 h-4" />
              Исполнитель: {task.executor.lastName} {task.executor.firstName}
            </Link>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* Progress */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Прогресс задачи</h2>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={clsx('text-xs px-2.5 py-1 rounded-full font-medium',
                i < currentIndex ? 'bg-green-100 text-green-700' :
                i === currentIndex ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400')}>
                {STATUS_LABELS[s]}
              </div>
              {i < STATUS_ORDER.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {showPublishBtn && (
            <button onClick={() => advanceMutation.mutate()} disabled={advanceMutation.isPending} className="btn-primary text-sm">
              {advanceMutation.isPending ? 'Публикуем...' : '→ Опубликовать задачу'}
            </button>
          )}
          {showStartWorkBtn && (
            <button onClick={() => advanceMutation.mutate()} disabled={advanceMutation.isPending} className="btn-primary text-sm">
              {advanceMutation.isPending ? '...' : '→ Начать работу'}
            </button>
          )}
          {showApproveBtn && (
            <button onClick={() => advanceMutation.mutate()} disabled={advanceMutation.isPending} className="btn-primary text-sm bg-green-600 hover:bg-green-700">
              {advanceMutation.isPending ? '...' : '✓ Принять работу'}
            </button>
          )}
          {showRejectBtn && !showRejectForm && (
            <button onClick={() => setShowRejectForm(true)} className="btn-danger text-sm flex items-center gap-1">
              <RotateCcw className="w-4 h-4" /> Отправить на доработку
            </button>
          )}
        </div>

        {/* Reject form */}
        {showRejectForm && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
            <p className="text-sm font-medium text-red-700">Укажите причину отклонения:</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              rows={2} className="input resize-none text-sm" placeholder="Что нужно исправить или доработать..." />
            <div className="flex gap-2">
              <button onClick={() => rejectWorkMutation.mutate()} disabled={rejectWorkMutation.isPending} className="btn-danger text-sm">
                {rejectWorkMutation.isPending ? 'Отправляем...' : 'Отправить на доработку'}
              </button>
              <button onClick={() => setShowRejectForm(false)} className="btn-secondary text-sm">Отмена</button>
            </div>
          </div>
        )}

        {statusName === 'published' && isCustomer && responses !== undefined && responses.length > 0 && (
          <p className="text-xs text-blue-500 mt-3">Есть отклики — выберите исполнителя из списка ниже</p>
        )}
        {statusName === 'published' && isCustomer && responses !== undefined && responses.length === 0 && (
          <p className="text-xs text-gray-400 mt-3">Ожидайте откликов — затем выберите исполнителя</p>
        )}
      </div>

      {/* Submit work (executor) */}
      {showSubmitWorkBtn && (
        <div className="card border-2 border-blue-200 bg-blue-50">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-blue-500" /> Отправить работу на проверку
          </h2>
          <textarea value={workResult} onChange={(e) => setWorkResult(e.target.value)}
            rows={3} className="input resize-none mb-3"
            placeholder="Опишите результат: ссылки, пояснения, что было сделано..." />
          <button onClick={() => submitWorkMutation.mutate()} disabled={submitWorkMutation.isPending} className="btn-primary">
            {submitWorkMutation.isPending ? 'Отправляем...' : '→ Отправить на проверку'}
          </button>
        </div>
      )}

      {/* Respond */}
      {canRespond && (
        <div className="card">
          <h2 className="font-semibold mb-3">Откликнуться на задачу</h2>
          <textarea value={responseComment} onChange={(e) => setResponseComment(e.target.value)}
            rows={3} className="input resize-none mb-3"
            placeholder="Расскажите, почему хотите помочь и какой у вас опыт..." />
          <button onClick={() => respondMutation.mutate()}
            disabled={!responseComment.trim() || respondMutation.isPending} className="btn-primary">
            {respondMutation.isPending ? 'Отправляем...' : 'Откликнуться'}
          </button>
        </div>
      )}

      {/* Responses */}
      {isCustomer && responses !== undefined && (
        <div className="card">
          <h2 className="font-semibold mb-4">Отклики {responses.length > 0 && `(${responses.length})`}</h2>
          {responses.length === 0 ? (
            <p className="text-gray-400 text-sm">Откликов пока нет</p>
          ) : (
            <div className="space-y-4">
              {responses.map((r: any) => (
                <div key={r.id} className={clsx('border rounded-xl p-4',
                  r.responseStatus?.name === 'accepted' ? 'border-green-200 bg-green-50' :
                  r.responseStatus?.name === 'rejected' ? 'border-gray-100 opacity-60' : 'border-gray-100')}>
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <Link href={`/students/${r.responder.id}`} className="flex items-center gap-3 hover:opacity-80">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold shrink-0">
                        {r.responder.firstName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{r.responder.lastName} {r.responder.firstName}</p>
                        <p className="text-xs text-gray-400">
                          {r.responseStatus?.name === 'pending' ? 'Ожидает ответа' :
                           r.responseStatus?.name === 'accepted' ? '✓ Выбран исполнителем' : '✗ Отклонён'}
                        </p>
                      </div>
                    </Link>
                    {statusName === 'published' && r.responseStatus?.name === 'pending' && (
                      <button onClick={() => { if (confirm(`Выбрать ${r.responder.firstName} ${r.responder.lastName}?`)) selectExecutorMutation.mutate(r.responder.id); }}
                        disabled={selectExecutorMutation.isPending} className="btn-primary text-sm py-1.5 shrink-0">
                        Выбрать
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{r.commentText}</p>
                  {r.responder.studentSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.responder.studentSkills.map((ss: any) => (
                        <span key={ss.skill.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ss.skill.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review form */}
      {isCustomer && statusName === 'completed' && !task.review && (
        <div className="card border-2 border-yellow-200 bg-yellow-50">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> Оцените исполнителя
          </h2>
          {showReviewForm ? (
            <div className="space-y-3">
              <div>
                <label className="label">Оценка</label>
                <StarRating value={reviewRating} onChange={setReviewRating} />
              </div>
              <div>
                <label className="label">Комментарий <span className="text-gray-400 font-normal">(необязательно)</span></label>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                  rows={2} className="input resize-none" placeholder="Расскажите о работе исполнителя..." />
              </div>
              <div className="flex gap-2">
                <button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending} className="btn-primary">
                  {reviewMutation.isPending ? 'Отправляем...' : 'Отправить отзыв'}
                </button>
                <button onClick={() => setShowReviewForm(false)} className="btn-secondary">Отмена</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowReviewForm(true)} className="btn-primary flex items-center gap-2">
              <Star className="w-4 h-4" /> Оставить отзыв
            </button>
          )}
        </div>
      )}

      {/* Review display */}
      {task.review && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Отзыв заказчика
          </h2>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={clsx('w-5 h-5', n <= task.review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} />
            ))}
            <span className="text-sm font-semibold ml-1 text-gray-700">{task.review.rating} из 5</span>
          </div>
          {task.review.reviewText && <p className="text-gray-600 text-sm">{task.review.reviewText}</p>}
        </div>
      )}

      {/* Comments */}
      <div className="card">
        <h2 className="font-semibold mb-4">Комментарии {comments?.length ? `(${comments.length})` : ''}</h2>
        <div className="space-y-5 mb-5">
          {comments?.length === 0 && <p className="text-gray-400 text-sm">Комментариев пока нет</p>}
          {comments?.map((c: any) => (
            <CommentItem key={c.id} comment={c} currentStudentId={student?.id}
              onDelete={(id) => deleteCommentMutation.mutate(id)} taskId={taskId} onReplyAdded={invalidate} />
          ))}
        </div>
        {student ? (
          <div className="flex gap-2 pt-4 border-t">
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) { e.preventDefault(); commentMutation.mutate(); } }}
              className="input flex-1" placeholder="Написать комментарий... (Enter для отправки)" />
            <button onClick={() => commentMutation.mutate()} disabled={!commentText.trim() || commentMutation.isPending} className="btn-primary px-3">
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 pt-4 border-t">
            <Link href="/login" className="text-blue-600 hover:underline">Войдите</Link>, чтобы оставить комментарий
          </p>
        )}
      </div>
    </div>
  );
}
