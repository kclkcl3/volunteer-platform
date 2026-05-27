import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
	constructor(private readonly prisma: PrismaService) {}
	findAll() {
		return this.prisma.category.findMany();
	}
	create(dto: any) {
		return null;
	}
	update(id: string, dto: any) {
		return null;
	}
	remove(id: string) {
		return null;
	}
}
