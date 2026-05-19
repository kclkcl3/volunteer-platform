import { Controller, Get, Post, Delete, Param, ParseIntPipe, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current student profile' })
  getMe(@Request() req) {
    return this.studentsService.getMe(req.user.id);
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top rated students' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTop(@Query('limit') limit?: number) {
    return this.studentsService.getTopStudents(limit ? +limit : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student profile by ID' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.getStudentById(id);
  }

  @Post('me/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add skill to my profile' })
  addSkill(@Request() req, @Param('skillId', ParseIntPipe) skillId: number) {
    return this.studentsService.addSkill(req.user.id, skillId);
  }

  @Delete('me/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove skill from my profile' })
  removeSkill(@Request() req, @Param('skillId', ParseIntPipe) skillId: number) {
    return this.studentsService.removeSkill(req.user.id, skillId);
  }
}
