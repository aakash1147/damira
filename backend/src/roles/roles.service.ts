import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateRoleDto, UpdateRolePermissionsDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystemRole: r.isSystemRole,
      isActive: r.isActive,
      userCount: r._count.userRoles,
      permissionCount: r._count.rolePermissions,
      createdAt: r.createdAt,
    }));
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found.`);
    }

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }

  async create(dto: CreateRoleDto, userId?: string) {
    const existing = await this.prisma.role.findFirst({
      where: {
        OR: [{ slug: dto.slug.toLowerCase().trim() }, { name: dto.name.trim() }],
      },
    });

    if (existing) {
      throw new BadRequestException('A role with this name or slug already exists.');
    }

    const role = await this.prisma.$transaction(async (tx) => {
      const createdRole = await tx.role.create({
        data: {
          name: dto.name.trim(),
          slug: dto.slug.toLowerCase().trim(),
          description: dto.description || null,
          isSystemRole: false,
        },
      });

      if (dto.permissionIds && dto.permissionIds.length > 0) {
        // Resolve permission IDs if slugs were passed
        const permissions = await tx.permission.findMany({
          where: {
            OR: [{ id: { in: dto.permissionIds } }, { slug: { in: dto.permissionIds } }],
          },
        });

        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId: createdRole.id,
            permissionId: p.id,
          })),
        });
      }

      return createdRole;
    });

    await this.auditLogsService.log({
      userId,
      action: 'CREATE',
      module: 'ROLES',
      recordId: role.id,
      newValues: dto,
    });

    return this.findById(role.id);
  }

  async updatePermissions(roleId: string, dto: UpdateRolePermissionsDto, userId?: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found.`);
    }

    if (role.slug === 'super-admin') {
      throw new BadRequestException('Permissions of the Super Admin role cannot be modified.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      if (dto.permissionIds && dto.permissionIds.length > 0) {
        const permissions = await tx.permission.findMany({
          where: {
            OR: [{ id: { in: dto.permissionIds } }, { slug: { in: dto.permissionIds } }],
          },
        });

        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId,
            permissionId: p.id,
          })),
        });
      }
    });

    await this.auditLogsService.log({
      userId,
      action: 'UPDATE_PERMISSIONS',
      module: 'ROLES',
      recordId: roleId,
      newValues: dto.permissionIds,
    });

    return this.findById(roleId);
  }

  async getAllPermissions() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    // Group permissions by module
    const grouped: Record<string, any[]> = {};
    for (const p of permissions) {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push(p);
    }

    return grouped;
  }
}
