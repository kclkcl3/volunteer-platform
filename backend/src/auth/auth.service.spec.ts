import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    studentStatus: {
      findFirst: jest.fn(),
    },
  };
  const jwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const config = {
    getOrThrow: jest.fn((key: string) => key),
    get: jest.fn(() => undefined),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as never,
    );
    jwt.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
  });

  it('registers a student with hashed password and tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.studentStatus.findFirst.mockResolvedValue({ id: 'status-1' });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'student@university.ru',
      firstName: 'Ann',
      lastName: 'Lee',
      role: UserRole.student,
    });

    const result = await service.register({
      firstName: 'Ann',
      lastName: 'Lee',
      email: 'Student@University.ru',
      password: 'password123',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'student@university.ru',
          passwordHash: 'hashed',
          studentStatusId: 'status-1',
        }),
      }),
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('rejects duplicate registration email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.register({
        firstName: 'Ann',
        lastName: 'Lee',
        email: 'student@university.ru',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects blocked user login', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'student@university.ru',
      passwordHash: 'hash',
      isBlocked: true,
      deletedAt: null,
    });

    await expect(service.login({ email: 'student@university.ru', password: 'password123' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
