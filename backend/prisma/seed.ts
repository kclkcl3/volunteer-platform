import { PrismaClient, TaskStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const statuses = ['Bachelor', 'Master', 'Postgraduate'];
  for (const name of statuses) await prisma.studentStatus.upsert({ where: { name }, update: {}, create: { name } });

  const categories = ['Programming', 'Design', 'Research', 'Languages', 'Math', 'Events'];
  for (const name of categories) await prisma.category.upsert({ where: { name }, update: {}, create: { name } });

  const skills = ['TypeScript', 'React', 'NestJS', 'PostgreSQL', 'Figma', 'Academic writing', 'English', 'Calculus'];
  for (const name of skills) await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });

  const bachelor = await prisma.studentStatus.findUniqueOrThrow({ where: { name: 'Bachelor' } });
  const admin = await prisma.user.upsert({
    where: { email: 'admin@university.ru' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@university.ru',
      role: UserRole.admin,
      studentStatusId: bachelor.id,
      passwordHash: await bcrypt.hash('admin12345', 12),
    },
  });
  const anna = await prisma.user.upsert({
    where: { email: 'anna@university.ru' },
    update: {},
    create: {
      firstName: 'Anna',
      lastName: 'Ivanova',
      email: 'anna@university.ru',
      studentStatusId: bachelor.id,
      passwordHash: await bcrypt.hash('student12345', 12),
    },
  });
  const pavel = await prisma.user.upsert({
    where: { email: 'pavel@university.ru' },
    update: {},
    create: {
      firstName: 'Pavel',
      lastName: 'Smirnov',
      email: 'pavel@university.ru',
      studentStatusId: bachelor.id,
      passwordHash: await bcrypt.hash('student12345', 12),
    },
  });

  const ts = await prisma.skill.findUniqueOrThrow({ where: { name: 'TypeScript' } });
  const react = await prisma.skill.findUniqueOrThrow({ where: { name: 'React' } });
  await prisma.studentSkill.upsert({ where: { userId_skillId: { userId: pavel.id, skillId: ts.id } }, update: {}, create: { userId: pavel.id, skillId: ts.id } });
  await prisma.studentSkill.upsert({ where: { userId_skillId: { userId: pavel.id, skillId: react.id } }, update: {}, create: { userId: pavel.id, skillId: react.id } });

  const programming = await prisma.category.findUniqueOrThrow({ where: { name: 'Programming' } });
  let task = await prisma.task.findFirst({
    where: { title: 'Help build a React dashboard', customerId: anna.id },
  });
  if (!task) {
    task = await prisma.task.create({
      data: {
        title: 'Help build a React dashboard',
        description: 'Need a student helper to structure components and connect a small dashboard to REST API.',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: TaskStatus.published,
        publishedAt: new Date(),
        categoryId: programming.id,
        customerId: anna.id,
        skills: { create: [{ skillId: ts.id }, { skillId: react.id }] },
        statusHistory: { create: { toStatus: TaskStatus.published, changedById: anna.id, reason: 'seed' } },
      },
    });
  }
  const existingNotification = await prisma.notification.findFirst({
    where: { userId: admin.id, taskId: task.id, title: 'Seed task published' },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'task_published_matching_skills',
        taskId: task.id,
        title: 'Seed task published',
        body: 'Initial data is ready',
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
