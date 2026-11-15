import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomerImportService, ParsedCustomerRow } from './customer-import.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DuplicateStrategy } from '@prisma/client';

@ApiTags('Customer Import')
@ApiBearerAuth('bearer-jwt')
@Controller('customer-import')
export class CustomerImportController {
  constructor(private importService: CustomerImportService) {}

  @Get('template')
  @RequirePermissions('CUSTOMERS:IMPORT')
  @ApiOperation({ summary: 'Download documented sample customer import template (.xlsx or .csv)' })
  async downloadTemplate(
    @Query('format') format: 'xlsx' | 'csv' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.importService.generateSampleTemplate(format);
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=DAMIRA_Customer_Import_Template.csv');
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=DAMIRA_Customer_Import_Template.xlsx',
      );
    }
    res.send(buffer);
  }

  @Post('preview')
  @RequirePermissions('CUSTOMERS:IMPORT')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file, preview rows, and show row-level validation errors before confirming' })
  async uploadAndPreview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please select an Excel (.xlsx) or CSV (.csv) file to upload.');
    }
    return this.importService.parseAndValidate(file.buffer, file.originalname);
  }

  @Post('confirm')
  @RequirePermissions('CUSTOMERS:IMPORT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm import with selected duplicate handling strategy (SKIP, UPDATE, IMPORT_NEW)' })
  async confirmImport(
    @Body()
    body: {
      rows: ParsedCustomerRow[];
      duplicateStrategy: DuplicateStrategy;
      fileName: string;
      fileSize: number;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.importService.executeImport(
      body.rows,
      body.duplicateStrategy || DuplicateStrategy.SKIP,
      body.fileName || 'bulk_import.xlsx',
      body.fileSize || 0,
      userId,
    );
  }

  @Get('history')
  @RequirePermissions('CUSTOMERS:IMPORT')
  @ApiOperation({ summary: 'Get history of past bulk customer uploads with success and error counters' })
  async getHistory(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.importService.getHistory(Number(page), Number(limit));
  }

  @Get(':id/error-report')
  @RequirePermissions('CUSTOMERS:IMPORT')
  @ApiOperation({ summary: 'Download Excel error report containing exact row numbers and error descriptions' })
  async downloadErrorReport(@Param('id') importId: string, @Res() res: Response) {
    const buffer = await this.importService.generateErrorReport(importId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=DAMIRA_Import_Errors_${importId}.xlsx`,
    );
    res.send(buffer);
  }
}
