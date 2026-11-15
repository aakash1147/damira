import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  QueryCustomerDto,
  CreateCustomerAddressDto,
} from './dto/create-customer.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Customers & Addresses')
@ApiBearerAuth('bearer-jwt')
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @RequirePermissions('CUSTOMERS:VIEW')
  @ApiOperation({ summary: 'List customers with multi-filter search and server-side pagination' })
  async findAll(@Query() query: QueryCustomerDto) {
    return this.customersService.findAll(query);
  }

  @Get('export/excel')
  @RequirePermissions('CUSTOMERS:EXPORT')
  @ApiOperation({ summary: 'Export filtered customer records to formatted Excel (.xlsx)' })
  async exportExcel(@Query() query: QueryCustomerDto, @Res() res: Response) {
    const buffer = await this.customersService.exportToExcel(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=DAMIRA_Customers_${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Get('export/csv')
  @RequirePermissions('CUSTOMERS:EXPORT')
  @ApiOperation({ summary: 'Export filtered customer records to standard CSV' })
  async exportCsv(@Query() query: QueryCustomerDto, @Res() res: Response) {
    const csv = await this.customersService.exportToCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=DAMIRA_Customers_${Date.now()}.csv`,
    );
    res.send(csv);
  }

  @Get(':id')
  @RequirePermissions('CUSTOMERS:VIEW')
  @ApiOperation({ summary: 'Get full customer profile including all addresses and change audit metadata' })
  async findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  @RequirePermissions('CUSTOMERS:CREATE')
  @ApiOperation({ summary: 'Create a new customer with optional initial address' })
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.create(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('CUSTOMERS:EDIT')
  @ApiOperation({ summary: 'Update customer personal or commercial details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('CUSTOMERS:DELETE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete / archive customer record preserving order & audit history' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.softDelete(id, userId);
  }

  // -------------------------------------------------------------
  // MULTIPLE ADDRESS MANAGEMENT ENDPOINTS
  // -------------------------------------------------------------

  @Post(':id/addresses')
  @RequirePermissions('CUSTOMERS:CREATE')
  @ApiOperation({ summary: 'Add a new location address to customer (Office, Home, Delivery, Warehouse)' })
  async addAddress(
    @Param('id') customerId: string,
    @Body() dto: CreateCustomerAddressDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.addAddress(customerId, dto, userId);
  }

  @Put(':id/addresses/:addressId')
  @RequirePermissions('CUSTOMERS:EDIT')
  @ApiOperation({ summary: 'Update an existing customer address' })
  async updateAddress(
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @Body() dto: Partial<CreateCustomerAddressDto>,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.updateAddress(customerId, addressId, dto, userId);
  }

  @Patch(':id/addresses/:addressId/default-billing')
  @RequirePermissions('CUSTOMERS:EDIT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set this address as the single default billing address for the customer' })
  async setDefaultBilling(
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.setDefaultBilling(customerId, addressId, userId);
  }

  @Patch(':id/addresses/:addressId/default-shipping')
  @RequirePermissions('CUSTOMERS:EDIT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set this address as the single default shipping address for the customer' })
  async setDefaultShipping(
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.setDefaultShipping(customerId, addressId, userId);
  }

  @Delete(':id/addresses/:addressId')
  @RequirePermissions('CUSTOMERS:DELETE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete customer address' })
  async deleteAddress(
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.deleteAddress(customerId, addressId, userId);
  }
}
