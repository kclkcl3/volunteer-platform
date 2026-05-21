import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSkillDto } from './dto/skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.skill.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  create(dto: UpsertSkillDto) {
    return this.prisma.skill.create({ data: dto });
  }

  update(id: string, dto: UpsertSkillDto) {
    return this.prisma.skill.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.skill.delete({ where: { id } });
  }
}
