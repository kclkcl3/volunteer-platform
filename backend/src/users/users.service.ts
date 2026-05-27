import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	async me(id: string) {
		const result = await this.prisma.$queryRaw<any[]>`
			SELECT
				u.id,
				u."firstName",
				u."lastName",
				u.email,
				u.role,
				u.rating,
				u."completedTasksCount",
				COALESCE(s.skills, '[]'::json) as skills,
				COALESCE(ct.tasks, '[]'::json) as "createdTasks",
				COALESCE(et.tasks, '[]'::json) as "completedTasks",
				COALESCE(r.reviews, '[]'::json) as reviews
			FROM users u
			LEFT JOIN (
				SELECT
					ss."userId",
					json_agg(json_build_object('id', s.id, 'name', s.name)) as skills
				FROM student_skills ss
				JOIN skills s ON ss."skillId" = s.id
				GROUP BY ss."userId"
			) s ON u.id = s."userId"
			LEFT JOIN (
				SELECT
					t."customerId",
					json_agg(json_build_object('id', t.id, 'title', t.title)) as tasks
				FROM tasks t
				GROUP BY t."customerId"
			) ct ON u.id = ct."customerId"
			LEFT JOIN (
				SELECT
					t."executorId",
					json_agg(json_build_object('id', t.id, 'title', t.title)) as tasks
				FROM tasks t
				WHERE t.status = 'completed'
				GROUP BY t."executorId"
			) et ON u.id = et."executorId"
			LEFT JOIN (
				SELECT
					r."reviewedId",
					json_agg(
						json_build_object(
							'id', r.id,
							'rating', r.rating,
							'text', r.text,
							'author', json_build_object(
								'id', a.id,
								'firstName', a."firstName",
								'lastName', a."lastName"
							)
						)
					) as reviews
				FROM reviews r
				JOIN users a ON r."reviewerId" = a.id
				GROUP BY r."reviewedId"
			) r ON u.id = r."reviewedId"
			WHERE u.id = ${id} AND u."deletedAt" IS NULL
		`;

		if (!result.length || !result[0]) {
			throw new NotFoundException('User not found');
		}

		return result[0];
	}

	updateMe(id: string, dto: UpdateProfileDto) {
		return this.prisma.user.update({
			where: { id },
			data: dto,
		});
	}

	async findOne(id: string) {
		const result = await this.prisma.$queryRaw<any[]>`
			SELECT
				u.id,
				u."firstName",
				u."lastName",
				u.email,
				u.role,
				u.rating,
				u."completedTasksCount",
				COALESCE(s.skills, '[]'::json) as skills,
				COALESCE(ct.tasks, '[]'::json) as "createdTasks",
				COALESCE(et.tasks, '[]'::json) as "completedTasks",
				COALESCE(r.reviews, '[]'::json) as reviews
			FROM users u
			LEFT JOIN (
				SELECT
					ss."userId",
					json_agg(json_build_object('id', s.id, 'name', s.name)) as skills
				FROM student_skills ss
				JOIN skills s ON ss."skillId" = s.id
				GROUP BY ss."userId"
			) s ON u.id = s."userId"
			LEFT JOIN (
				SELECT
					t."customerId",
					json_agg(json_build_object('id', t.id, 'title', t.title)) as tasks
				FROM tasks t
				GROUP BY t."customerId"
			) ct ON u.id = ct."customerId"
			LEFT JOIN (
				SELECT
					t."executorId",
					json_agg(json_build_object('id', t.id, 'title', t.title)) as tasks
				FROM tasks t
				WHERE t.status = 'completed'
				GROUP BY t."executorId"
			) et ON u.id = et."executorId"
			LEFT JOIN (
				SELECT
					r."reviewedId",
					json_agg(
						json_build_object(
							'id', r.id,
							'rating', r.rating,
							'text', r.text,
							'author', json_build_object(
								'id', a.id,
								'firstName', a."firstName",
								'lastName', a."lastName"
							)
						)
					) as reviews
				FROM reviews r
				JOIN users a ON r."reviewerId" = a.id
				GROUP BY r."reviewedId"
			) r ON u.id = r."reviewedId"
			WHERE u.id = ${id} AND u."deletedAt" IS NULL
		`;

		if (!result.length || !result[0]) {
			throw new NotFoundException('User not found');
		}

		return result[0];
	}

	top(limit = 10) {
		return this.prisma.user.findMany({
			where: { deletedAt: null, isBlocked: false },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				rating: true,
				completedTasksCount: true,
			},
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
		return this.prisma.studentSkill.delete({
			where: { userId_skillId: { userId, skillId } },
		});
	}

	async updateRatingAfterReview(userId: string) {
		const reviews = await this.prisma.review.findMany({
			where: { reviewedId: userId },
			select: { rating: true },
		});

		const avgRating = reviews.length
			? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
			: 0;

		return this.prisma.user.update({
			where: { id: userId },
			data: { rating: Number(avgRating.toFixed(2)) },
			select: { id: true },
		});
	}
}
