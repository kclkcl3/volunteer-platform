import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsDateString,
	IsEnum,
	IsIn,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';
import { PaginationDto } from '../../common/pagination/pagination.dto';

export class TaskQueryDto extends PaginationDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	categoryId?: string;

	@ApiPropertyOptional({ type: [String] })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	skillIds?: string[];

	@ApiPropertyOptional({ enum: TaskStatus })
	@IsOptional()
	@IsEnum(TaskStatus)
	status?: TaskStatus;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	deadlineSoon?: boolean;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	activeOnly?: boolean;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	myTasks?: boolean;

	@ApiPropertyOptional({ enum: ['createdAt', 'deadline', 'status'] })
	@IsIn(['createdAt', 'deadline', 'status'])
	sortBy: 'createdAt' | 'deadline' | 'status' = 'createdAt';
}

export class CreateTaskDto {
	@IsString()
	@MinLength(5)
	@MaxLength(160)
	title: string;

	@IsString()
	categoryId: string;

	@IsString()
	@MinLength(20)
	description: string;

	@IsArray()
	@ArrayMaxSize(12)
	@IsString({ each: true })
	skillIds: string[] = [];

	@IsDateString()
	deadline: string;

	@IsOptional()
	@IsBoolean()
	publishImmediately?: boolean;
}

export class UpdateTaskDto {
	@IsOptional()
	@IsString()
	@MinLength(5)
	@MaxLength(160)
	title?: string;

	@IsOptional()
	@IsString()
	@MinLength(20)
	description?: string;

	@IsOptional()
	@IsString()
	categoryId?: string;

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(12)
	@IsString({ each: true })
	skillIds?: string[];

	@IsOptional()
	@IsDateString()
	deadline?: string;
}

export class SelectExecutorDto {
	@IsString()
	responseId: string;
}

export class WorkflowReasonDto {
	@IsOptional()
	@IsString()
	reason?: string;
}
