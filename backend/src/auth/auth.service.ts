import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
		private readonly users: UsersService,
	) {}

	private async getTokens(userId: string, email: string, role: string) {
		const [accessToken, refreshToken] = await Promise.all([
			this.jwt.signAsync(
				{ sub: userId, email, role },
				{ secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
			),
			this.jwt.signAsync(
				{ sub: userId, email, role },
				{ secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
			),
		]);

		return { accessToken, refreshToken };
	}

	async register(dto: RegisterDto) {
		const existingUser = await this.prisma.user.findUnique({
			where: { email: dto.email },
		});
		if (existingUser) {
			throw new ForbiddenException('User with this email already exists');
		}

		const passwordHash = await bcrypt.hash(dto.password, 10);
		const { password, ...rest } = dto;
		const user = await this.prisma.user.create({
			data: { ...rest, passwordHash },
		});

		const tokens = await this.getTokens(user.id, user.email, user.role);
		return tokens;
	}

	async login(dto: LoginDto) {
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		const passwordMatches = await bcrypt.compare(
			dto.password,
			user.passwordHash,
		);
		if (!passwordMatches) {
			throw new ForbiddenException('Invalid credentials');
		}

		const tokens = await this.getTokens(user.id, user.email, user.role);
		return tokens;
	}

	async logout(userId: string) {
		return true;
	}

	async refresh(userId: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			throw new ForbiddenException('Access denied');
		}
		const tokens = await this.getTokens(user.id, user.email, user.role);
		return tokens;
	}
}
