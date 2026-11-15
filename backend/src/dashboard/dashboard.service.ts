import { Injectable } from '@nestjs/common';
import { EmployeeStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const activeCustomerWhere = { isDeleted: false };

    const [totalCustomers, activeCustomers, newCustomersMonth, types, customersByType, recentRegistrations] =
      await Promise.all([
        this.prisma.customer.count({ where: activeCustomerWhere }),
        this.prisma.customer.count({
          where: { ...activeCustomerWhere, status: 'ACTIVE' },
        }),
        this.prisma.customer.count({
          where: {
            ...activeCustomerWhere,
            createdAt: { gte: monthStart, lt: nextMonthStart },
          },
        }),
        this.prisma.customerType.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        this.prisma.customer.groupBy({
          by: ['customerTypeId'],
          where: activeCustomerWhere,
          _count: { _all: true },
        }),
        this.prisma.customer.findMany({
          where: activeCustomerWhere,
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            customerType: { select: { name: true } },
          },
        }),
      ]);

    const countsByType = new Map(
      customersByType.map((entry) => [entry.customerTypeId, entry._count._all]),
    );

    return {
      totalCustomers,
      activeCustomers,
      newCustomersMonth,
      customerTypeDistribution: types.map((type) => {
        const count = countsByType.get(type.id) || 0;
        return {
          customerTypeId: type.id,
          name: type.name,
          count,
          percentage: totalCustomers > 0 ? Math.round((count / totalCustomers) * 1000) / 10 : 0,
        };
      }),
      recentRegistrations: recentRegistrations.map((customer) => ({
        id: customer.id,
        fullName: `${customer.firstName} ${customer.lastName}`,
        customerType: customer.customerType.name,
        createdAt: customer.createdAt,
      })),
    };
  }

  async getEmployeeSummary() {
    const where = { isDeleted: false };
    const [totalEmployees, activeEmployees] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.count({
        where: { ...where, status: EmployeeStatus.ACTIVE },
      }),
    ]);

    return { totalEmployees, activeEmployees };
  }

  async getRecentEmployeeActivities() {
    const activities = await this.prisma.auditLog.findMany({
      where: { module: 'EMPLOYEES' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        action: true,
        createdAt: true,
        user: {
          select: {
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      actorName: activity.user?.employee
        ? `${activity.user.employee.firstName} ${activity.user.employee.lastName}`
        : 'System',
      createdAt: activity.createdAt,
    }));
  }
}
