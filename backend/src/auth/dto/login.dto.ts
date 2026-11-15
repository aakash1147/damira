import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'superadmin', description: 'Username or official email address' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'DamiraAdmin2026!', description: 'Account password' })
  @IsString()
  @MinLength(6)
  password: string;
}
