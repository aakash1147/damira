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
import { Gender, EmployeeStatus } from '@prisma/client';
import { PaginationDto } from '../../common/pagination/pagination.dto';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'DAMIRA-EMP-002', description: 'Unique company employee code' })
  @IsString()
  @IsNotEmpty()
  employeeCode: string;

  @ApiProperty({ example: 'Rahul' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'rahul.sharma@damira.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919812345678' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Mobile number must be in E.164 or valid format' })
  mobile: string;

  @ApiPropertyOptional({ example: '+919812345679' })
  @IsString()
  @IsOptional()
  altMobile?: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '1992-05-15' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ example: '2024-03-01' })
  @IsDateString()
  dateOfJoining: string;

  @ApiPropertyOptional({ description: 'Department UUID' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Designation UUID' })
  @IsString()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional({ description: 'Reporting Manager Employee UUID' })
  @IsString()
  @IsOptional()
  reportingManagerId?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;

  @ApiPropertyOptional({ description: 'Profile avatar image URL' })
  @IsString()
  @IsOptional()
  profileImageUrl?: string;

  @ApiPropertyOptional({ description: 'Internal remarks or HR notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  // Linked User Account Creation Details
  @ApiPropertyOptional({ description: 'Whether to create a linked login account immediately' })
  @IsBoolean()
  @IsOptional()
  createLoginAccount?: boolean;

  @ApiPropertyOptional({ description: 'Desired username for login (defaults to email or employee code)' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'Primary Role UUID to assign' })
  @IsString()
  @IsOptional()
  roleId?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Rahul' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'rahul.sharma@damira.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+919812345678' })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({ example: '+919812345679' })
  @IsString()
  @IsOptional()
  altMobile?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: '1992-05-15' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsDateString()
  @IsOptional()
  dateOfJoining?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reportingManagerId?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profileImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryEmployeeDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by Department UUID' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;
}
