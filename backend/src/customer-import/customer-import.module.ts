import { Module } from '@nestjs/common';
import { CustomerImportService } from './customer-import.service';
import { CustomerImportController } from './customer-import.controller';

@Module({
  controllers: [CustomerImportController],
  providers: [CustomerImportService],
  exports: [CustomerImportService],
})
export class CustomerImportModule {}
