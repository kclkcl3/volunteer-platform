import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TaskStatus, UserRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';

class BlockUserDto {
  @IsBoolean()
  isBlocked: boolean;
}

class ForceTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  users() {
    return this.admin.users();
  }

  @Patch('users/:id/block')
  setBlocked(@Param('id') id: string, @Body() dto: BlockUserDto) {
    return this.admin.setBlocked(id, dto.isBlocked);
  }

  @Get('tasks')
  tasks() {
    return this.admin.tasks();
  }

  @Patch('tasks/:id/status')
  forceStatus(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: ForceTaskStatusDto) {
    return this.admin.forceStatus(id, dto.status, user.id, dto.reason);
  }
}
