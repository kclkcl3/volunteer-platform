import axios from 'axios';

export type TaskStatus = 'draft' | 'published' | 'executor_selected' | 'in_progress' | 'on_review' | 'completed';
export type ResponseStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type Skill = { id: string; name: string };
export type Category = { id: string; name: string };
export type User = { id: string; firstName: string; lastName: string; email?: string; rating: string; completedTasksCount: number; role?: 'student' | 'admin' };
export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string;
  category: Category;
  skills: { skill: Skill }[];
  customer: User;
  executor?: User | null;
  responses?: { id: string; status: ResponseStatus; message: string; responder: User }[];
  review?: { rating: number; text?: string } | null;
  _count?: { comments: number; responses: number };
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => api.post('/auth/register', data),
};

export const tasksApi = {
  list: (params?: Record<string, unknown>) => api.get<{ items: Task[]; meta: { total: number; page: number; limit: number } }>('/tasks', { params }),
  my: (status?: TaskStatus) => api.get<Task[]>('/tasks/my', { params: { status } }),
  recommended: () => api.get<Task[]>('/tasks/recommended'),
  get: (id: string) => api.get<Task>(`/tasks/${id}`),
  create: (data: unknown) => api.post<Task>('/tasks', data),
  update: (id: string, data: unknown) => api.patch<Task>(`/tasks/${id}`, data),
  publish: (id: string) => api.post<Task>(`/tasks/${id}/publish`),
  selectExecutor: (id: string, responseId: string) => api.post<Task>(`/tasks/${id}/select-executor`, { responseId }),
  start: (id: string) => api.post<Task>(`/tasks/${id}/start`),
  sendToReview: (id: string) => api.post<Task>(`/tasks/${id}/send-to-review`),
  approve: (id: string) => api.post<Task>(`/tasks/${id}/approve`),
  requestRework: (id: string, reason?: string) => api.post<Task>(`/tasks/${id}/request-rework`, { reason }),
};

export const responsesApi = {
  create: (taskId: string, message: string) => api.post(`/tasks/${taskId}/responses`, { message }),
  my: () => api.get('/responses/my'),
  withdraw: (id: string) => api.delete(`/responses/${id}`),
};

export const commentsApi = {
  list: (taskId: string) => api.get(`/tasks/${taskId}/comments`),
  create: (taskId: string, data: { body: string; parentId?: string }) => api.post(`/tasks/${taskId}/comments`, data),
};

export const reviewsApi = {
  create: (taskId: string, data: { rating: number; text?: string }) => api.post(`/tasks/${taskId}/review`, data),
};

export const directoriesApi = {
  skills: () => api.get<Skill[]>('/skills'),
  createSkill: (name: string) => api.post<Skill>('/skills', { name }),
  categories: () => api.get<Category[]>('/categories'),
};

export const usersApi = {
  me: () => api.get<User>('/users/me'),
  top: () => api.get<User[]>('/users/top'),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
};
