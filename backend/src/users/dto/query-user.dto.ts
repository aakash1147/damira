import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { UserStatus } from '@prisma/client';

export class QueryUserDto extends PaginationDto {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filter by role slug' })
  @IsString()
  @IsOptional()
  role?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class AssignRolesDto {
  @ApiProperty({ type: [String], description: 'Array of role IDs to assign' })
  @IsArray()
  roleIds: string[];
}
