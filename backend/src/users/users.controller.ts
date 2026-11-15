import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { QueryUserDto, UpdateUserStatusDto, AssignRolesDto } from './dto/query-user.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('bearer-jwt')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('USERS:VIEW')
  @ApiOperation({ summary: 'List user accounts with server-side pagination and filters' })
  async findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('USERS:VIEW')
  @ApiOperation({ summary: 'Get user account details, roles, and linked employee info' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/status')
  @RequirePermissions('USERS:MANAGE')
  @ApiOperation({ summary: 'Activate, deactivate or lock a user account' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.updateStatus(id, dto, adminId);
  }

  @Post(':id/reset-password')
  @RequirePermissions('USERS:MANAGE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset employee password and generate temporary login credentials' })
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.resetPassword(id, adminId);
  }

  @Post(':id/roles')
  @RequirePermissions('USERS:MANAGE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign roles to a user account' })
  async assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.assignRoles(id, dto, adminId);
  }
}
