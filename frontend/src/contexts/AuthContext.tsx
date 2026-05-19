'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { studentsApi } from '@/lib/api';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  rating?: number;
  reviewsCount?: number;
  studentSkills?: any[];
}

interface AuthContextType {
  student: Student | null;
  token: string | null;
  login: (token: string, student: Student) => void;
  logout: () => void;
  refreshMe: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      setToken(savedToken);
      studentsApi
        .getMe()
        .then((res) => setStudent(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newStudent: Student) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    setStudent(newStudent);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setStudent(null);
  };

  const refreshMe = () => {
    studentsApi.getMe().then((res) => setStudent(res.data));
  };

  return (
    <AuthContext.Provider value={{ student, token, login, logout, refreshMe, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
