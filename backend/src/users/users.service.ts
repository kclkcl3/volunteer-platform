import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  middleName: true,
  email: true,
  avatar: true,
  bio: true,
  role: true,
  rating: true,
  completedTasksCount: true,
  registrationDate: true,
  lastSeenAt: true,
  skills: { include: { skill: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  me(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select: userSelect });
  }

  updateMe(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id }, data: dto, select: userSelect });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSelect });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  top(limit = 10) {
    return this.prisma.user.findMany({
      where: { deletedAt: null, isBlocked: false },
      select: userSelect,
      orderBy: [{ rating: 'desc' }, { completedTasksCount: 'desc' }],
      take: limit,
    });
  }

  addSkill(userId: string, skillId: string) {
    return this.prisma.studentSkill.upsert({
      where: { userId_skillId: { userId, skillId } },
      update: {},
      create: { userId, skillId },
      include: { skill: true },
    });
  }

  removeSkill(userId: string, skillId: string) {
    return this.prisma.studentSkill.delete({ where: { userId_skillId: { userId, skillId } } });
  }
}
