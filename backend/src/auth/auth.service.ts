import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
		private readonly config: ConfigService,
	) {}

	async register(dto: RegisterDto) {
		const exists = await this.prisma.user.findUnique({
			where: { email: dto.email.toLowerCase() },
		});
		if (exists) throw new ConflictException('Email already registered');
		const status = await this.prisma.studentStatus.findFirst({
			orderBy: { createdAt: 'asc' },
		});
		const user = await this.prisma.user.create({
			data: {
				firstName: dto.firstName,
				lastName: dto.lastName,
				middleName: dto.middleName,
				email: dto.email.toLowerCase(),
				passwordHash: await bcrypt.hash(dto.password, 12),
				studentStatusId: status?.id,
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
			},
		});
		return { user, ...(await this.signTokens(user.id, user.email, user.role)) };
	}

	async login(dto: LoginDto) {
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email.toLowerCase() },
		});
		if (!user || user.deletedAt || user.isBlocked)
			throw new UnauthorizedException('Invalid credentials');
		const valid = await bcrypt.compare(dto.password, user.passwordHash);
		if (!valid) throw new UnauthorizedException('Invalid credentials');
		const tokens = await this.signTokens(user.id, user.email, user.role);
		// Сохраняем refresh токен в базу
		await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: tokens.refreshToken },
		});
		return {
			user: {
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
			},
			...tokens,
		};
	}

	async refresh(refreshToken: string) {
		try {
			const payload = await this.jwt.verifyAsync<{
				sub: string;
				email: string;
				role: string;
			}>(refreshToken, {
				secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
			});
			// Проверяем, что токен совпадает с сохраненным в базе
			const user = await this.prisma.user.findUnique({
				where: { id: payload.sub },
			});
			if (!user || user.refreshToken !== refreshToken) {
				throw new UnauthorizedException('Invalid refresh token');
			}
			const tokens = await this.signTokens(
				payload.sub,
				payload.email,
				payload.role,
			);
			// Обновляем токен в базе
			await this.prisma.user.update({
				where: { id: payload.sub },
				data: { refreshToken: tokens.refreshToken },
			});
			return tokens;
		} catch {
			throw new UnauthorizedException('Invalid refresh token');
		}
	}

	async logout(userId: string) {
		// Удаляем refresh токен из базы, инвалидируя сессию
		await this.prisma.user.update({
			where: { id: userId },
			data: { refreshToken: null },
		});
		return { success: true };
	}

	private async signTokens(userId: string, email: string, role: string) {
		const payload = { sub: userId, email, role };
		const [accessToken, refreshToken] = await Promise.all([
			this.jwt.signAsync(payload, {
				secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
				expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
			}),
			this.jwt.signAsync(payload, {
				secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
				expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
			}),
		]);
		return { accessToken, refreshToken };
	}
}
