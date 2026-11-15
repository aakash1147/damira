import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    customer: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    customerType: { findMany: jest.fn() },
    employee: { count: jest.fn() },
    auditLog: { findMany: jest.fn() },
  };
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(prisma as never);
  });

  it('returns live customer counts, type aggregation, and recent registrations', async () => {
    const createdAt = new Date('2026-11-10T00:00:00.000Z');
    prisma.customer.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    prisma.customerType.findMany.mockResolvedValue([
      { id: 'type-a', name: 'Retailer' },
      { id: 'type-b', name: 'Wholesale' },
    ]);
    prisma.customer.groupBy.mockResolvedValue([
      { customerTypeId: 'type-a', _count: { _all: 3 } },
      { customerTypeId: 'type-b', _count: { _all: 1 } },
    ]);
    prisma.customer.findMany.mockResolvedValue([
      {
        id: 'customer-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        createdAt,
        customerType: { name: 'Retailer' },
      },
    ]);

    const result = await service.getCustomerSummary();

    expect(result).toEqual({
      totalCustomers: 4,
      activeCustomers: 3,
      newCustomersMonth: 2,
      customerTypeDistribution: [
        { customerTypeId: 'type-a', name: 'Retailer', count: 3, percentage: 75 },
        { customerTypeId: 'type-b', name: 'Wholesale', count: 1, percentage: 25 },
      ],
      recentRegistrations: [
        {
          id: 'customer-1',
          fullName: 'Ada Lovelace',
          customerType: 'Retailer',
          createdAt,
        },
      ],
    });
    expect(prisma.customer.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ['customerTypeId'], where: { isDeleted: false } }),
    );
    expect(prisma.customer.count).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          createdAt: expect.objectContaining({ gte: expect.any(Date), lt: expect.any(Date) }),
        }),
      }),
    );
  });

  it('counts non-deleted employees and active employees separately', async () => {
    prisma.employee.count.mockResolvedValueOnce(5).mockResolvedValueOnce(4);

    await expect(service.getEmployeeSummary()).resolves.toEqual({
      totalEmployees: 5,
      activeEmployees: 4,
    });
    expect(prisma.employee.count).toHaveBeenNthCalledWith(1, { where: { isDeleted: false } });
    expect(prisma.employee.count).toHaveBeenNthCalledWith(2, {
      where: { isDeleted: false, status: 'ACTIVE' },
    });
  });

  it('returns recent employee audit events without audit payloads or customer data', async () => {
    const createdAt = new Date('2026-11-10T00:00:00.000Z');
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'event-1',
        action: 'UPDATE',
        createdAt,
        user: { employee: { firstName: 'Ada', lastName: 'Lovelace' } },
      },
      { id: 'event-2', action: 'CREATE', createdAt, user: null },
    ]);

    await expect(service.getRecentEmployeeActivities()).resolves.toEqual([
      { id: 'event-1', action: 'UPDATE', actorName: 'Ada Lovelace', createdAt },
      { id: 'event-2', action: 'CREATE', actorName: 'System', createdAt },
    ]);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { module: 'EMPLOYEES' },
        take: 10,
        select: expect.not.objectContaining({ oldValues: true, newValues: true }),
      }),
    );
  });
});
