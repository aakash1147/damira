import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  employeeId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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

    if (!user || user.isDeleted || user.status !== 'ACTIVE' || user.employee.isDeleted) {
      throw new UnauthorizedException('User account is inactive, locked, or deleted.');
    }

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

    return {
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
      mustChangePassword: user.mustChangePassword,
    };
  }
}
