import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { QueryUserDto, UpdateUserStatusDto, AssignRolesDto } from './dto/query-user.dto';
import { createPaginatedResponse } from '../common/pagination/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async findAll(query: QueryUserDto) {
    const { page, limit, search, status, role, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (status) {
      where.status = status;
    }

    if (role) {
      where.userRoles = {
        some: {
          role: { slug: role },
        },
      };
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        {
          employee: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { employeeCode: { contains: search } },
            ],
          },
        },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'username' || sortBy === 'email' || sortBy === 'status' || sortBy === 'createdAt' || sortBy === 'lastLoginAt') {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
              designation: { select: { title: true } },
            },
          },
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const formatted = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      status: u.status,
      employeeId: u.employeeId,
      employeeCode: u.employee.employeeCode,
      fullName: `${u.employee.firstName} ${u.employee.lastName}`,
      department: u.employee.department?.name,
      designation: u.employee.designation?.title,
      roles: u.userRoles.map((ur) => ur.role),
      lastLoginAt: u.lastLoginAt,
      failedLoginAttempts: u.failedLoginAttempts,
      createdAt: u.createdAt,
    }));

    return createPaginatedResponse(formatted, total, page, limit);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            reportingManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
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

    if (!user || user.isDeleted) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    return user;
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, adminId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });

    // If deactivated or locked, revoke all refresh tokens immediately
    if (dto.status !== 'ACTIVE') {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });
    }

    await this.auditLogsService.log({
      userId: adminId,
      action: 'UPDATE_STATUS',
      module: 'USERS',
      recordId: id,
      oldValues: { status: user.status },
      newValues: { status: dto.status },
    });

    return updated;
  }

  async resetPassword(id: string, adminId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    // Generate secure 12-char temporary password: e.g. "Dmr@9b2Kx7Lp"
    const tempPassword = `Dmr@${crypto.randomBytes(4).toString('hex')}!`;
    const passwordHash = await argon2.hash(tempPassword);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    // Revoke active sessions
    await this.prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { isRevoked: true },
    });

    await this.auditLogsService.log({
      userId: adminId,
      action: 'RESET_PASSWORD',
      module: 'USERS',
      recordId: id,
    });

    return {
      message: 'Temporary password generated successfully.',
      temporaryPassword: tempPassword,
      username: user.username,
      email: user.email,
    };
  }

  async assignRoles(id: string, dto: AssignRolesDto, adminId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });

      if (dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: id,
            roleId,
            assignedBy: adminId || null,
          })),
        });
      }
    });

    await this.auditLogsService.log({
      userId: adminId,
      action: 'ASSIGN_ROLES',
      module: 'USERS',
      recordId: id,
      newValues: dto.roleIds,
    });

    return this.findById(id);
  }
}
