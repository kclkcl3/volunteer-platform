import { Controller, Post, Get, Param, ParseIntPipe, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Отличная работа, всё сделал вовремя!' })
  @IsOptional()
  @IsString()
  reviewText?: string;
}

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post('tasks/:taskId/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a review for the executor (customer only, completed tasks)' })
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Request() req,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(taskId, req.user.id, dto.rating, dto.reviewText);
  }

  @Get('students/:studentId/reviews')
  @ApiOperation({ summary: 'Get reviews received by a student' })
  getByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.reviewsService.getByStudent(studentId);
  }
}
