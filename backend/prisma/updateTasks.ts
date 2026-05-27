import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('Updating tasks with default category...');

	const defaultCategory = await prisma.category.findFirst({
		where: { name: 'Обучение' },
	});

	if (!defaultCategory) {
		throw new Error(
			'Default category "Обучение" not found. Please run seed first.',
		);
	}

	const result = await prisma.task.updateMany({
		where: { categoryId: null },
		data: { categoryId: defaultCategory.id },
	});

	console.log(`Updated ${result.count} tasks.`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
