import Link from 'next/link';
import { GraduationCap, Users, CheckCircle, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <GraduationCap className="w-16 h-16 opacity-90" />
          </div>
          <h1 className="text-4xl font-bold mb-4">UniHelp — Помогаем друг другу</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Бесплатная платформа взаимопомощи внутри университета. Публикуй задачи, откликайся на задачи других и развивай свои навыки.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/tasks" className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition">
              Смотреть задачи
            </Link>
            <Link href="/register" className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-10">Как это работает</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Публикуй задачи</h3>
            <p className="text-gray-500 text-sm">Опиши задачу, выбери категорию и нужные навыки. Другие студенты сами тебя найдут.</p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Помогай другим</h3>
            <p className="text-gray-500 text-sm">Откликайся на задачи по своим навыкам. Помощь — взаимная и бесплатная.</p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="font-semibold mb-2">Зарабатывай репутацию</h3>
            <p className="text-gray-500 text-sm">Получай оценки за выполненные задачи. Высокий рейтинг откроет больше возможностей.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-100 py-12 text-center">
        <h2 className="text-xl font-bold mb-3">Готов начать?</h2>
        <p className="text-gray-500 mb-6">Присоединяйся к сообществу студентов, которые помогают друг другу.</p>
        <Link href="/register" className="btn-primary px-8 py-3">
          Создать аккаунт
        </Link>
      </section>
    </div>
  );
}
