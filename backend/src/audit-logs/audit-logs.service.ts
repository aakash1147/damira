import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  module: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          module: params.module,
          recordId: params.recordId ? String(params.recordId) : null,
          oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : null,
          newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log for action: ${params.action}`, error);
    }
  }

  async findAll(page = 1, limit = 20, module?: string, action?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (module) where.module = module;
    if (action) where.action = action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              employee: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
