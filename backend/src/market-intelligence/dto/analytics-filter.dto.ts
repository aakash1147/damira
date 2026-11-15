import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsFilterDto {
  @ApiPropertyOptional({ description: 'Filter orders starting from date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter orders ending at date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by Country UUID' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Filter by State UUID' })
  @IsOptional()
  @IsString()
  stateId?: string;

  @ApiPropertyOptional({ description: 'Filter by City UUID' })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ description: 'Filter by 6-digit PIN / Postal Code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Filter by Customer Type UUID' })
  @IsOptional()
  @IsString()
  customerTypeId?: string;

  @ApiPropertyOptional({ description: 'Filter by Product UUID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by Sales Channel Code (e.g. WEBSITE, AMAZON, etc.)' })
  @IsOptional()
  @IsString()
  channelCode?: string;

  @ApiPropertyOptional({ description: 'Filter by Order Status' })
  @IsOptional()
  @IsString()
  orderStatus?: string;

  @ApiPropertyOptional({ description: 'Search keyword for text filtering' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size limit' })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort column name' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order: asc or desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
