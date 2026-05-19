import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.student.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const activeStatus = await this.prisma.studentStatus.findUnique({ where: { name: 'active' } });
    if (!activeStatus) throw new Error('Student statuses not seeded');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const student = await this.prisma.student.create({
      data: {
        lastName: dto.lastName,
        firstName: dto.firstName,
        middleName: dto.middleName,
        email: dto.email,
        passwordHash,
        studentStatusId: activeStatus.id,
      },
      include: { studentStatus: true },
    });

    const token = this.jwtService.sign({ sub: student.id, email: student.email });
    return { access_token: token, student: this.sanitize(student) };
  }

  async login(dto: LoginDto) {
    const student = await this.prisma.student.findUnique({
      where: { email: dto.email },
      include: { studentStatus: true },
    });
    if (!student) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, student.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (student.studentStatus.name === 'blocked') {
      throw new UnauthorizedException('Account is blocked');
    }

    const token = this.jwtService.sign({ sub: student.id, email: student.email });
    return { access_token: token, student: this.sanitize(student) };
  }

  private sanitize(student: any) {
    const { passwordHash, ...rest } = student;
    return rest;
  }
}
