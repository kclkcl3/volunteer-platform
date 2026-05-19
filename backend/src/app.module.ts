import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { TasksModule } from './tasks/tasks.module';
import { ResponsesModule } from './responses/responses.module';
import { CommentsModule } from './comments/comments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SkillsModule } from './skills/skills.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StudentsModule,
    TasksModule,
    ResponsesModule,
    CommentsModule,
    ReviewsModule,
    SkillsModule,
    CategoriesModule,
  ],
})
export class AppModule {}
