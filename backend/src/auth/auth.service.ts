import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditLogsService: AuditLogsService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const identifier = dto.username.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
        isDeleted: false,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            status: true,
            isDeleted: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.employee.isDeleted) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    // Check account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account is temporarily locked due to multiple failed login attempts. Please retry in ${waitMinutes} minutes.`,
      );
    }

    // Check active status
    if (user.status !== 'ACTIVE' || user.employee.status !== 'ACTIVE') {
      throw new UnauthorizedException('This account has been deactivated. Please contact your administrator.');
    }

    // Verify Password with Argon2
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const lockoutDate = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockoutUntil: lockoutDate,
        },
      });

      if (attempts >= 5) {
        throw new UnauthorizedException(
          'Account locked for 15 minutes due to 5 consecutive failed login attempts.',
        );
      }

      throw new UnauthorizedException('Invalid username or password.');
    }

    // Reset failed login attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || null,
      },
    });

    // Prepare Roles and Permissions
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const ur of user.userRoles) {
      if (ur.role.isActive) {
        roles.push(ur.role.slug);
        for (const rp of ur.role.rolePermissions) {
          permissionsSet.add(rp.permission.slug);
        }
      }
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      employeeId: user.employeeId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn', '900s'),
    });

    // Generate & Store Refresh Token
    const refreshToken = await this.generateAndStoreRefreshToken(user.id, ipAddress, userAgent);

    // Audit Log
    await this.auditLogsService.log({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      recordId: user.id,
      ipAddress,
      userAgent,
      newValues: { username: user.username, email: user.email },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        username: user.username,
        email: user.email,
        fullName: `${user.employee.firstName} ${user.employee.lastName}`,
        employeeCode: user.employee.employeeCode,
        department: user.employee.department?.name,
        designation: user.employee.designation?.title,
        roles,
        permissions: Array.from(permissionsSet),
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async refreshToken(rawRefreshToken: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    if (storedToken.user.status !== 'ACTIVE' || storedToken.user.isDeleted) {
      throw new UnauthorizedException('User account is deactivated.');
    }

    // Revoke old refresh token (Single-use rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Issue new Token Pair
    const payload = {
      sub: storedToken.user.id,
      username: storedToken.user.username,
      email: storedToken.user.email,
      employeeId: storedToken.user.employeeId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn', '900s'),
    });

    const newRefreshToken = await this.generateAndStoreRefreshToken(
      storedToken.user.id,
      ipAddress,
      userAgent,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, rawRefreshToken?: string, ipAddress?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId },
        data: { isRevoked: true },
      });
    }

    await this.auditLogsService.log({
      userId,
      action: 'LOGOUT',
      module: 'AUTH',
      recordId: userId,
      ipAddress,
    });

    return { message: 'Logged out successfully.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const newHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    // Revoke all existing refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    await this.auditLogsService.log({
      userId,
      action: 'CHANGE_PASSWORD',
      module: 'AUTH',
      recordId: userId,
      ipAddress,
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  private async generateAndStoreRefreshToken(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    // 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        deviceInfo: userAgent ? userAgent.slice(0, 250) : null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });

    return rawToken;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
