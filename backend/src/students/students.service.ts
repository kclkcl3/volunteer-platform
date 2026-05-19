import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  private sanitize(student: any) {
    const { passwordHash, ...rest } = student;
    return rest;
  }

  private async getRating(studentId: number) {
    const result = await this.prisma.review.aggregate({
      where: { reviewedStudentId: studentId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      rating: result._avg.rating ? Number(result._avg.rating.toFixed(2)) : null,
      reviewsCount: result._count.rating,
    };
  }

  private async getCompletedCounts(studentId: number) {
    const completedStatus = await this.prisma.taskStatus.findUnique({ where: { name: 'completed' } });
    if (!completedStatus) return { completedAsCustomer: 0, completedAsExecutor: 0 };

    const [completedAsCustomer, completedAsExecutor] = await Promise.all([
      this.prisma.task.count({
        where: { customerStudentId: studentId, taskStatusId: completedStatus.id, deleted: false },
      }),
      this.prisma.task.count({
        where: { executorStudentId: studentId, taskStatusId: completedStatus.id, deleted: false },
      }),
    ]);

    return { completedAsCustomer, completedAsExecutor };
  }

  async getMe(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        studentStatus: true,
        studentSkills: { include: { skill: true } },
      },
    });
    if (!student) throw new NotFoundException('Студент не найден');

    const [ratingData, counts] = await Promise.all([
      this.getRating(studentId),
      this.getCompletedCounts(studentId),
    ]);

    return { ...this.sanitize(student), ...ratingData, ...counts };
  }

  async getStudentById(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        studentStatus: true,
        studentSkills: { include: { skill: true } },
      },
    });
    if (!student) throw new NotFoundException('Студент не найден');

    const [ratingData, counts] = await Promise.all([
      this.getRating(id),
      this.getCompletedCounts(id),
    ]);

    return { ...this.sanitize(student), ...ratingData, ...counts };
  }

  async addSkill(studentId: number, skillId: number) {
    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) throw new NotFoundException('Навык не найден');

    return this.prisma.studentSkill.upsert({
      where: { studentId_skillId: { studentId, skillId } },
      update: {},
      create: { studentId, skillId },
      include: { skill: true },
    });
  }

  async removeSkill(studentId: number, skillId: number) {
    const existing = await this.prisma.studentSkill.findUnique({
      where: { studentId_skillId: { studentId, skillId } },
    });
    if (!existing) throw new NotFoundException('Навык не найден в профиле');

    return this.prisma.studentSkill.delete({
      where: { studentId_skillId: { studentId, skillId } },
    });
  }

  async getTopStudents(limit = 10) {
    const reviews = await this.prisma.review.groupBy({
      by: ['reviewedStudentId'],
      _avg: { rating: true },
      _count: { rating: true },
      orderBy: { _avg: { rating: 'desc' } },
      take: limit,
    });

    if (reviews.length === 0) return [];

    const studentIds = reviews.map((r) => r.reviewedStudentId);
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { studentSkills: { include: { skill: true } } },
    });

    return reviews.map((r) => {
      const s = students.find((s) => s.id === r.reviewedStudentId)!;
      const { passwordHash, ...rest } = s;
      return {
        ...rest,
        rating: Number(r._avg.rating!.toFixed(2)),
        reviewsCount: r._count.rating,
      };
    });
  }
}
