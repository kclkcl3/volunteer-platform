import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_jwt_key',
    });
  }

  async validate(payload: JwtPayload) {
    const student = await this.prisma.student.findUnique({
      where: { id: payload.sub },
      include: { studentStatus: true },
    });

    if (!student) throw new UnauthorizedException();
    if (student.studentStatus.name === 'blocked') {
      throw new UnauthorizedException('Account is blocked');
    }

    return student;
  }
}
