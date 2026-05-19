import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Student statuses
  const statuses = ['active', 'blocked'];
  for (const name of statuses) {
    await prisma.studentStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Task statuses (ordered for workflow)
  const taskStatuses = [
    'draft',
    'published',
    'executor_selected',
    'in_progress',
    'on_review',
    'completed',
  ];
  for (const name of taskStatuses) {
    await prisma.taskStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Response statuses
  const responseStatuses = ['pending', 'accepted', 'rejected'];
  for (const name of responseStatuses) {
    await prisma.responseStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Categories
  const categories = [
    { name: 'Программирование', description: 'Помощь с кодом, отладка, разработка' },
    { name: 'Дизайн', description: 'Графический дизайн, UI/UX, иллюстрации' },
    { name: 'Математика', description: 'Помощь с задачами, формулами, доказательствами' },
    { name: 'Иностранные языки', description: 'Перевод, репетиторство, проверка текстов' },
    { name: 'Видео и медиа', description: 'Монтаж, обработка фото, съёмка' },
    { name: 'Написание текстов', description: 'Эссе, рефераты, рецензии' },
    { name: 'Другое', description: 'Прочие задачи взаимопомощи' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Skills
  const skills = [
    { name: 'Git', description: 'Система контроля версий' },
    { name: 'SQL', description: 'Язык запросов к базам данных' },
    { name: 'Python', description: 'Язык программирования Python' },
    { name: 'JavaScript', description: 'Язык программирования JavaScript' },
    { name: 'TypeScript', description: 'Типизированный JavaScript' },
    { name: 'React', description: 'Библиотека для построения UI' },
    { name: 'Canva', description: 'Графический редактор Canva' },
    { name: 'Photoshop', description: 'Adobe Photoshop' },
    { name: 'Видеомонтаж', description: 'Редактирование и монтаж видео' },
    { name: 'Английский язык', description: 'Английский язык (уровень B2+)' },
    { name: 'LaTeX', description: 'Верстка научных документов' },
    { name: 'Excel', description: 'Microsoft Excel / Google Sheets' },
  ];
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  // Demo admin student
  const activeStatus = await prisma.studentStatus.findUnique({ where: { name: 'active' } });
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.student.upsert({
    where: { email: 'admin@university.ru' },
    update: {},
    create: {
      firstName: 'Администратор',
      lastName: 'Системы',
      email: 'admin@university.ru',
      passwordHash,
      studentStatusId: activeStatus!.id,
    },
  });

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
