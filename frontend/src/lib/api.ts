import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
};

// Students
export const studentsApi = {
  getMe: () => api.get('/students/me'),
  getById: (id: number) => api.get(`/students/${id}`),
  getTop: (limit = 10) => api.get(`/students/top?limit=${limit}`),
  addSkill: (skillId: number) => api.post(`/students/me/skills/${skillId}`),
  removeSkill: (skillId: number) => api.delete(`/students/me/skills/${skillId}`),
  getReviews: (id: number) => api.get(`/students/${id}/reviews`),
};

// Tasks
export const tasksApi = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getMy: () => api.get('/tasks/my'),
  getRecommended: () => api.get('/tasks/recommended'),
  getById: (id: number) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: number, data: any) => api.patch(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
  rejectWork: (id: number) => api.post(`/tasks/${id}/reject-work`),
  getCompletedByStudent: (studentId: number) => api.get(`/tasks/completed/student/${studentId}`),
  advanceStatus: (id: number) => api.post(`/tasks/${id}/advance-status`),
  selectExecutor: (taskId: number, executorId: number) =>
    api.post(`/tasks/${taskId}/select-executor/${executorId}`),
};

// Responses
export const responsesApi = {
  create: (taskId: number, data: any) => api.post(`/tasks/${taskId}/responses`, data),
  getByTask: (taskId: number) => api.get(`/tasks/${taskId}/responses`),
  delete: (id: number) => api.delete(`/responses/${id}`),
};

// Comments
export const commentsApi = {
  create: (taskId: number, data: any) => api.post(`/tasks/${taskId}/comments`, data),
  getByTask: (taskId: number) => api.get(`/tasks/${taskId}/comments`),
  delete: (id: number) => api.delete(`/comments/${id}`),
};

// Reviews
export const reviewsApi = {
  create: (taskId: number, data: any) => api.post(`/tasks/${taskId}/review`, data),
};

// Skills
export const skillsApi = {
  getAll: () => api.get('/skills'),
};

// Categories
export const categoriesApi = {
  getAll: () => api.get('/categories'),
};
