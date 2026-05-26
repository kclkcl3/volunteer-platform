import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
	constructor(private readonly prisma: PrismaService) {}

	users() {
		return this.prisma.user.findMany({
			where: { deletedAt: null },
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				isBlocked: true,
				rating: true,
				completedTasksCount: true,
			},
			orderBy: { registrationDate: 'desc' },
		});
	}

	setBlocked(userId: string, isBlocked: boolean) {
		return this.prisma.user.update({
			where: { id: userId },
			data: { isBlocked },
		});
	}

	tasks() {
		return this.prisma.task.findMany({
			where: { deletedAt: null },
			include: {
				customer: true,
				executor: true,
				skills: { include: { skill: true } },
			},
			orderBy: { createdAt: 'desc' },
		});
	}

	forceStatus(
		taskId: string,
		status: TaskStatus,
		adminId: string,
		reason?: string,
	) {
		return this.prisma.task.update({
			where: { id: taskId },
			data: {
				status,
				statusHistory: {
					create: {
						toStatus: status,
						changedById: adminId,
						reason: reason ?? 'admin override',
					},
				},
			},
		});
	}
}
