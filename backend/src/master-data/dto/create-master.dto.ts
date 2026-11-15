import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'IN' })
  @IsString()
  @IsNotEmpty()
  iso2: string;

  @ApiProperty({ example: 'IND' })
  @IsString()
  @IsNotEmpty()
  iso3: string;

  @ApiProperty({ example: '+91' })
  @IsString()
  @IsNotEmpty()
  phoneCode: string;
}

export class CreateStateDto {
  @ApiProperty({ description: 'Country UUID' })
  @IsString()
  @IsNotEmpty()
  countryId: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'MH' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: '27', description: 'Official Indian GST State Code' })
  @IsString()
  @IsOptional()
  gstCode?: string;
}

export class CreateCityDto {
  @ApiProperty({ description: 'State UUID' })
  @IsString()
  @IsNotEmpty()
  stateId: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateMasterItemDto {
  @ApiProperty({ example: 'Distributor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'DISTRIBUTOR' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'Regional distribution partners' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateActiveStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
