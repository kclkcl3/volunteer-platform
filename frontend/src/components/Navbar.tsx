'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { GraduationCap, LogOut, User, Plus, List } from 'lucide-react';

export function Navbar() {
  const { student, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-blue-600 font-bold text-lg">
            <GraduationCap className="w-6 h-6" />
            UniHelp
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/tasks" className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1">
              <List className="w-4 h-4" /> Задачи
            </Link>

            {student ? (
              <>
                <Link
                  href="/tasks/new"
                  className="btn-primary flex items-center gap-1 text-sm py-1.5"
                >
                  <Plus className="w-4 h-4" /> Новая задача
                </Link>
                <Link href="/my-tasks" className="text-sm text-gray-600 hover:text-blue-600">
                  Мои задачи
                </Link>
                <Link href="/profile" className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                  <User className="w-4 h-4" />
                  {student.firstName}
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600">
                  Войти
                </Link>
                <Link href="/register" className="btn-primary text-sm py-1.5">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
