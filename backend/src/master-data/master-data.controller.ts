import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MasterDataService } from './master-data.service';
import {
  CreateCountryDto,
  CreateStateDto,
  CreateCityDto,
  CreateMasterItemDto,
} from './dto/create-master.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Master Data Management')
@ApiBearerAuth('bearer-jwt')
@Controller('master-data')
export class MasterDataController {
  constructor(private masterDataService: MasterDataService) {}

  // 1. COUNTRIES
  @Get('countries')
  @RequirePermissions('MASTER_DATA:VIEW')
  @ApiOperation({ summary: 'Get list of configured countries' })
  async getCountries() {
    return this.masterDataService.getCountries();
  }

  @Post('countries')
  @RequirePermissions('MASTER_DATA:MANAGE')
  @ApiOperation({ summary: 'Add a new country' })
  async createCountry(@Body() dto: CreateCountryDto, @CurrentUser('id') userId: string) {
    return this.masterDataService.createCountry(dto, userId);
  }

  // 2. STATES
  @Get('states')
  @RequirePermissions('MASTER_DATA:VIEW')
  @ApiOperation({ summary: 'Get list of states/union territories (optionally filtered by country)' })
  async getStates(@Query('countryId') countryId?: string) {
    return this.masterDataService.getStates(countryId);
  }

  @Post('states')
  @RequirePermissions('MASTER_DATA:MANAGE')
  @ApiOperation({ summary: 'Add a new state with official GST State Code' })
  async createState(@Body() dto: CreateStateDto, @CurrentUser('id') userId: string) {
    return this.masterDataService.createState(dto, userId);
  }

  // 3. CITIES
  @Get('cities')
  @RequirePermissions('MASTER_DATA:VIEW')
  @ApiOperation({ summary: 'Get list of cities (optionally filtered by state)' })
  async getCities(@Query('stateId') stateId?: string) {
    return this.masterDataService.getCities(stateId);
  }

  @Post('cities')
  @RequirePermissions('MASTER_DATA:MANAGE')
  @ApiOperation({ summary: 'Add a new city under a state' })
  async createCity(@Body() dto: CreateCityDto, @CurrentUser('id') userId: string) {
    return this.masterDataService.createCity(dto, userId);
  }

  // 4. CUSTOMER TYPES
  @Get('customer-types')
  @RequirePermissions('MASTER_DATA:VIEW')
  @ApiOperation({ summary: 'Get customer classification types' })
  async getCustomerTypes() {
    return this.masterDataService.getCustomerTypes();
  }

  @Post('customer-types')
  @RequirePermissions('MASTER_DATA:MANAGE')
  @ApiOperation({ summary: 'Add an additional customer type' })
  async createCustomerType(@Body() dto: CreateMasterItemDto, @CurrentUser('id') userId: string) {
    return this.masterDataService.createCustomerType(dto, userId);
  }

  // 5. ADDRESS TYPES
  @Get('address-types')
  @RequirePermissions('MASTER_DATA:VIEW')
  @ApiOperation({ summary: 'Get customer address classification types' })
  async getAddressTypes() {
    return this.masterDataService.getAddressTypes();
  }

  @Post('address-types')
  @RequirePermissions('MASTER_DATA:MANAGE')
  @ApiOperation({ summary: 'Add a new address type' })
  async createAddressType(@Body() dto: CreateMasterItemDto, @CurrentUser('id') userId: string) {
    return this.masterDataService.createAddressType(dto, userId);
  }

  // 6. DEPARTMENTS
  @Get('departments')
  @RequirePermissions('MASTER_DATA:VIEW')
  @ApiOperation({ summary: 'Get organizational departments' })
  async getDepartments() {
    return this.masterDataService.getDepartments();
  }

  @Post('departments')
  @RequirePermissions('MASTER_DATA:MANAGE')
  @ApiOperation({ summary: 'Add a new company department' })
  async createDepartment(@Body() dto: CreateMasterItemDto, @CurrentUser('id') userId: string) {
    return this.masterDataService.createDepartment(dto, userId);
  }

  // 7. DESIGNATIONS
  @Get('designations')
  @RequirePermissions('MASTER_DATA:VIEW')
  @ApiOperation({ summary: 'Get employee designations' })
  async getDesignations() {
    return this.masterDataService.getDesignations();
  }

  @Post('designations')
  @RequirePermissions('MASTER_DATA:MANAGE')
  @ApiOperation({ summary: 'Add a new employee job designation' })
  async createDesignation(@Body() dto: CreateMasterItemDto, @CurrentUser('id') userId: string) {
    return this.masterDataService.createDesignation(dto, userId);
  }
}
