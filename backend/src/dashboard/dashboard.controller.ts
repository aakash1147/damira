import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer-jwt')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('customers')
  @RequirePermissions('CUSTOMERS:VIEW')
  @ApiOperation({ summary: 'Customer counts, type distribution, and recent registrations' })
  getCustomerSummary() {
    return this.dashboardService.getCustomerSummary();
  }

  @Get('employees')
  @RequirePermissions('EMPLOYEES:VIEW')
  @ApiOperation({ summary: 'Employee counts' })
  getEmployeeSummary() {
    return this.dashboardService.getEmployeeSummary();
  }

  @Get('employee-activities')
  @RequirePermissions('EMPLOYEES:VIEW', 'AUDIT_LOGS:VIEW')
  @ApiOperation({ summary: 'Recent employee audit activity' })
  getRecentEmployeeActivities() {
    return this.dashboardService.getRecentEmployeeActivities();
  }
}
