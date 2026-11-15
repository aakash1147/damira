import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRolePermissionsDto } from './dto/create-role.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Roles & Permissions')
@ApiBearerAuth('bearer-jwt')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermissions('ROLES:VIEW')
  @ApiOperation({ summary: 'Get all roles with user count and permission summary' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @RequirePermissions('ROLES:VIEW')
  @ApiOperation({ summary: 'Get all available system permissions grouped by module' })
  async getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Get(':id')
  @RequirePermissions('ROLES:VIEW')
  @ApiOperation({ summary: 'Get role details including full permission list' })
  async findById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequirePermissions('ROLES:MANAGE')
  @ApiOperation({ summary: 'Create a new custom role' })
  async create(@Body() dto: CreateRoleDto, @CurrentUser('id') userId: string) {
    return this.rolesService.create(dto, userId);
  }

  @Put(':id/permissions')
  @RequirePermissions('ROLES:MANAGE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update permissions mapped to a role' })
  async updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.updatePermissions(id, dto, userId);
  }
}
