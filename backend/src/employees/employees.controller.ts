import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  QueryEmployeeDto,
} from './dto/create-employee.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EmployeeStatus } from '@prisma/client';

@ApiTags('Employees')
@ApiBearerAuth('bearer-jwt')
@Controller('employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions('EMPLOYEES:VIEW')
  @ApiOperation({ summary: 'List employees with pagination, search, and department filters' })
  async findAll(@Query() query: QueryEmployeeDto) {
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('EMPLOYEES:VIEW')
  @ApiOperation({ summary: 'Get complete employee details with linked user account and reporting hierarchy' })
  async findById(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Post()
  @RequirePermissions('EMPLOYEES:CREATE')
  @ApiOperation({ summary: 'Onboard a new employee and optionally provision linked login credentials' })
  async create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.employeesService.create(dto, adminId);
  }

  @Put(':id')
  @RequirePermissions('EMPLOYEES:EDIT')
  @ApiOperation({ summary: 'Update an existing employee record' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.employeesService.update(id, dto, adminId);
  }

  @Patch(':id/status')
  @RequirePermissions('EMPLOYEES:EDIT')
  @ApiOperation({ summary: 'Activate or change employee status (Active, Probation, Terminated, Resigned)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: EmployeeStatus,
    @CurrentUser('id') adminId: string,
  ) {
    return this.employeesService.updateStatus(id, status, adminId);
  }

  @Delete(':id')
  @RequirePermissions('EMPLOYEES:DELETE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete / archive employee and revoke account access' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.employeesService.softDelete(id, adminId);
  }
}
