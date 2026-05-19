import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all skills' })
  findAll() {
    return this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
  }
}
