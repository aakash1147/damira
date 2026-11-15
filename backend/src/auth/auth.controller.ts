import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto, ChangePasswordDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal employee login (No public registration allowed)' })
  @ApiResponse({ status: 200, description: 'Authentication successful with tokens and user profile' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account locked/deactivated' })
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and obtain new access token' })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Token invalid or expired' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.refreshToken(dto.refreshToken, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-jwt')
  @ApiOperation({ summary: 'Logout and revoke active refresh token' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() body: { refreshToken?: string },
    @Ip() ipAddress: string,
  ) {
    return this.authService.logout(userId, body.refreshToken, ipAddress);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-jwt')
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.changePassword(userId, dto, ipAddress);
  }

  @Get('me')
  @ApiBearerAuth('bearer-jwt')
  @ApiOperation({ summary: 'Get current authenticated user profile, roles, and permissions' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
