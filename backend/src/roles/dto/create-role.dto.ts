import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Sales Lead', description: 'Human readable role name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'sales-lead', description: 'Unique role slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Lead role for regional sales teams' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'Array of permission IDs or slugs' })
  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [String], description: 'List of permission IDs to assign to this role' })
  @IsArray()
  permissionIds: string[];
}
