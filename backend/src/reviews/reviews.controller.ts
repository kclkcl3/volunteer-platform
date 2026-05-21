import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post('tasks/:taskId/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(taskId, user.id, dto);
  }

  @Get('users/:userId/reviews')
  byUser(@Param('userId') userId: string) {
    return this.reviews.byUser(userId);
  }
}
