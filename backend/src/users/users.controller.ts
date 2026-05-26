import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
	CurrentUser,
	AuthUser,
} from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
	constructor(private readonly users: UsersService) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	me(@CurrentUser() user: AuthUser) {
		return this.users.me(user.id);
	}

	@Patch('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
		return this.users.updateMe(user.id, dto);
	}

	@Post('me/skills/:skillId')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	addSkill(@CurrentUser() user: AuthUser, @Param('skillId') skillId: string) {
		return this.users.addSkill(user.id, skillId);
	}

	@Delete('me/skills/:skillId')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	removeSkill(
		@CurrentUser() user: AuthUser,
		@Param('skillId') skillId: string,
	) {
		return this.users.removeSkill(user.id, skillId);
	}

	@Get('top')
	top(@Query('limit') limit?: string) {
		return this.users.top(limit ? Number(limit) : 10);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.users.findOne(id);
	}

	@Get(':id/stats')
	getProfileStats(@Param('id') id: string) {
		return this.users.getProfileStats(id);
	}
}
