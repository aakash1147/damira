import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { CustomerStatus, Gender } from '@prisma/client';
import { PaginationDto } from '../../common/pagination/pagination.dto';

export class CreateCustomerAddressDto {
  @ApiProperty({ description: 'Address Type UUID (e.g. Home, Office, Billing, Delivery, Warehouse)' })
  @IsString()
  @IsNotEmpty()
  addressTypeId: string;

  @ApiProperty({ example: 'Head Office Gurgaon', description: 'User-friendly address label' })
  @IsString()
  @IsNotEmpty()
  addressLabel: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsString()
  @IsOptional()
  contactPersonName?: string;

  @ApiPropertyOptional({ example: '+919812345678' })
  @IsString()
  @IsOptional()
  contactMobile?: string;

  @ApiProperty({ example: 'Plot No. 42, Sector 18' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Cyber City Phase 2' })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Near DLF Cyber Hub' })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiProperty({ description: 'Country UUID (Default: India)' })
  @IsString()
  @IsNotEmpty()
  countryId: string;

  @ApiProperty({ description: 'State UUID' })
  @IsString()
  @IsNotEmpty()
  stateId: string;

  @ApiProperty({ description: 'City UUID' })
  @IsString()
  @IsNotEmpty()
  cityId: string;

  @ApiPropertyOptional({ example: 'Gurugram' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ example: '122002', description: 'Indian 6-digit PIN code or Postal Code' })
  @IsString()
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Postal code must be a valid 6-digit Indian PIN code' })
  postalCode: string;

  @ApiPropertyOptional({ default: false, description: 'Set as default billing address' })
  @IsBoolean()
  @IsOptional()
  isDefaultBilling?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Set as default shipping address' })
  @IsBoolean()
  @IsOptional()
  isDefaultShipping?: boolean;
}

export class CreateCustomerDto {
  @ApiPropertyOptional({ example: 'DAMIRA-CUST-1001', description: 'Unique customer code (auto-generated if omitted)' })
  @IsString()
  @IsOptional()
  customerCode?: string;

  @ApiProperty({ description: 'Customer Type UUID (e.g. Individual, Retailer, Distributor, Wholesaler, Corporate, Bulk Buyer)' })
  @IsString()
  @IsNotEmpty()
  customerTypeId: string;

  @ApiProperty({ example: 'Amit' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Gupta' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'Gupta Retail Enterprises Pvt Ltd' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: 'amit.gupta@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+919876543210', description: 'Primary 10-digit mobile number' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Mobile number must be valid' })
  mobile: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsString()
  @IsOptional()
  altMobile?: string;

  @ApiPropertyOptional({
    example: '07AAAAA0000A1Z5',
    description: 'Indian 15-digit GST Identification Number',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid Indian GSTIN format (e.g. 07AAAAA0000A1Z5)',
  })
  gstin?: string;

  @ApiPropertyOptional({
    example: 'ABCDE1234F',
    description: 'Indian 10-character Permanent Account Number (PAN)',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Invalid Indian PAN format (e.g. ABCDE1234F)',
  })
  pan?: string;

  @ApiPropertyOptional({ example: '1988-11-20' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Referral', description: 'Lead source (Direct, Website, Referral, Trade Fair)' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({ description: 'Internal CRM notes regarding customer preferences or credit terms' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: CreateCustomerAddressDto, description: 'Optional initial address' })
  @IsOptional()
  initialAddress?: CreateCustomerAddressDto;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerTypeId?: string;

  @ApiPropertyOptional({ example: 'Amit' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Gupta' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Gupta Retail Enterprises Pvt Ltd' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: 'amit.gupta@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsString()
  @IsOptional()
  altMobile?: string;

  @ApiPropertyOptional({ example: '07AAAAA0000A1Z5' })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsString()
  @IsOptional()
  pan?: string;

  @ApiPropertyOptional({ example: '1988-11-20' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryCustomerDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by Customer Type UUID' })
  @IsString()
  @IsOptional()
  customerTypeId?: string;

  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({ description: 'Filter by State UUID' })
  @IsString()
  @IsOptional()
  stateId?: string;

  @ApiPropertyOptional({ description: 'Filter by City UUID' })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiPropertyOptional({ description: 'Filter created after date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter created before date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}
