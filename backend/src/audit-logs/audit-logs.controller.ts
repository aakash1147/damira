import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth('bearer-jwt')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermissions('AUDIT_LOGS:VIEW')
  @ApiOperation({ summary: 'Query immutable system audit log records' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'module', required: false, example: 'CUSTOMERS' })
  @ApiQuery({ name: 'action', required: false, example: 'UPDATE' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('module') module?: string,
    @Query('action') action?: string,
  ) {
    return this.auditLogsService.findAll(Number(page), Number(limit), module, action);
  }
}
