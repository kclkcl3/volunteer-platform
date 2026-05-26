import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsIn, Min, Max } from 'class-validator';

export class PaginationDto {
	@ApiPropertyOptional({ default: 1 })
	@IsInt()
	@Min(1)
	@Type(() => Number)
	page: number = 1;

	@ApiPropertyOptional({ default: 20, maximum: 100 })
	@IsInt()
	@Min(1)
	@Max(100)
	@Type(() => Number)
	limit: number = 20;

	@ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
	@IsIn(['asc', 'desc'])
	order: 'asc' | 'desc' = 'desc';
}

export const getPagination = (dto: PaginationDto) => {
	const page = Math.max(1, Number(dto.page) || 1);
	const limit = Math.min(100, Math.max(1, Number(dto.limit) || 10));
	return {
		skip: (page - 1) * limit,
		take: limit,
	};
};
