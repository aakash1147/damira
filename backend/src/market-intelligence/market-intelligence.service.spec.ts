import { MarketIntelligenceService } from './market-intelligence.service';

describe('MarketIntelligenceService KPI aggregation', () => {
  const prisma = {
    order: { findMany: jest.fn() },
    customer: { findMany: jest.fn() },
  };
  let service: MarketIntelligenceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MarketIntelligenceService(prisma as never);
  });

  it('counts orders and customers uniquely and uses post-refund net revenue', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        customerId: 'customer-1',
        status: 'DELIVERED',
        grossAmount: 100,
        discountAmount: 10,
        refundAmount: 0,
        netAmount: 90,
        shippingCost: 5,
        packagingCost: 2,
        allocatedCost: 1,
        productCost: 40,
        grossProfit: 42,
        totalUnits: 2,
        deliveryAddress: { stateId: 'state-1', cityId: 'city-1', postalCode: '100001' },
      },
      {
        id: 'order-2',
        customerId: 'customer-1',
        status: 'RETURNED',
        grossAmount: 50,
        discountAmount: 0,
        refundAmount: 0,
        netAmount: 50,
        shippingCost: 5,
        packagingCost: 2,
        allocatedCost: 1,
        productCost: 20,
        grossProfit: -8,
        totalUnits: 1,
        deliveryAddress: null,
      },
      {
        id: 'order-3',
        customerId: 'customer-2',
        status: 'REFUNDED',
        grossAmount: 25,
        discountAmount: 0,
        refundAmount: 25,
        netAmount: 0,
        shippingCost: 4,
        packagingCost: 1,
        allocatedCost: 1,
        productCost: 10,
        grossProfit: -5,
        totalUnits: 1,
        deliveryAddress: null,
      },
      {
        id: 'order-4',
        customerId: 'customer-1',
        status: 'DELIVERED',
        grossAmount: 100,
        discountAmount: 10,
        refundAmount: 0,
        netAmount: 90,
        shippingCost: 5,
        packagingCost: 2,
        allocatedCost: 1,
        productCost: 40,
        grossProfit: 42,
        totalUnits: 2,
        deliveryAddress: { stateId: 'state-1', cityId: 'city-1', postalCode: '100001' },
      },
    ]);
    prisma.customer.findMany.mockResolvedValue([
      {
        id: 'customer-1',
        addresses: [{ stateId: 'state-1', cityId: 'city-1', postalCode: '100001', isDefaultShipping: true }],
      },
      {
        id: 'customer-2',
        addresses: [{ stateId: 'state-2', cityId: 'city-2', postalCode: '200002', isDefaultShipping: true }],
      },
    ]);

    const result = await service.getGeographyOverview({});

    expect(result).toMatchObject({
      totalCustomers: 2,
      customersWithOrders: 1,
      customersWithoutOrders: 1,
      distinctOrderingCustomers: 1,
      totalOrders: 4,
      totalRevenue: 180,
      totalGrossRevenue: 275,
      totalRefunds: 75,
      totalUnitsSold: 4,
      averageOrderValue: 45,
      repeatCustomers: 1,
      repeatPurchaseRate: 100,
      averageOrdersPerCustomer: 2,
      financials: expect.objectContaining({ grossProfit: 72, profitMarginPct: 40 }),
    });
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [{ status: { not: 'CANCELLED' } }],
        }),
      }),
    );
  });

  it('does not let a CANCELLED status filter override the sales exclusion', async () => {
    prisma.order.findMany.mockResolvedValue([]);
    prisma.customer.findMany.mockResolvedValue([]);

    await service.getGeographyOverview({ orderStatus: 'CANCELLED' });

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ status: { not: 'CANCELLED' } }, { status: 'CANCELLED' }],
        },
      }),
    );
  });

  it('builds the financial ledger from persisted order amounts, not derived estimates', async () => {
    jest.spyOn(service, 'getGeographyOverview').mockResolvedValue({
      totalRevenue: 0,
      financials: {
        grossSales: 100,
        discounts: 10,
        refunds: 90,
        netRevenue: 0,
        productCost: 40,
        packagingCost: 2,
        shippingCost: 5,
        allocatedCost: 1,
        grossProfit: -8,
        profitMarginPct: 0,
      },
    } as never);
    jest.spyOn(service, 'getStatePerformance').mockResolvedValue({ states: [] } as never);
    jest.spyOn(service, 'getCityPerformance').mockResolvedValue({ cities: [] } as never);
    jest.spyOn(service, 'getGrowthTrends').mockResolvedValue({ trends: [] } as never);
    prisma.order.findMany.mockResolvedValue([
      {
        status: 'REFUNDED',
        grossAmount: 100,
        discountAmount: 10,
        refundAmount: 90,
        netAmount: 0,
        productCost: 40,
        packagingCost: 2,
        shippingCost: 5,
        allocatedCost: 1,
        grossProfit: -8,
        deliveryAddress: {
          city: { name: 'Pune', state: { name: 'Maharashtra' } },
        },
      },
    ]);

    const result = await service.getRevenueProfitAnalysis({});

    expect(result.financialLedger).toEqual([
      {
        stateName: 'Maharashtra',
        cityName: 'Pune',
        orders: 1,
        grossSales: 100,
        discounts: 10,
        refunds: 90,
        netRevenue: 0,
        productCost: 40,
        shippingCost: 5,
        otherAllocatedCosts: 3,
        profit: -8,
        profitMargin: 0,
      },
    ]);
  });

  it('uses observed customer counts and repeat orders in customer-order analysis', async () => {
    jest.spyOn(service, 'getCityPerformance').mockResolvedValue({
      cities: [
        {
          cityId: 'city-1',
          cityName: 'Pune',
          stateName: 'Maharashtra',
          stateCode: 'MH',
          totalCustomers: 4,
          customersWithOrders: 2,
          customersWithoutOrders: 2,
          totalOrders: 3,
          repeatCustomers: 1,
          totalRevenue: 200,
          repeatPurchaseRate: 50,
        },
      ],
    } as never);
    jest.spyOn(service, 'getStatePerformance').mockResolvedValue({ states: [] } as never);
    jest.spyOn(service, 'getGeographyOverview').mockResolvedValue({
      totalCustomers: 4,
      customersWithOrders: 2,
      customersWithoutOrders: 2,
      repeatCustomers: 1,
      repeatPurchaseRate: 50,
      averageOrdersPerCustomer: 1.5,
    } as never);
    jest.spyOn(service, 'getGrowthTrends').mockResolvedValue({
      trends: [{ period: '2025-01', orders: 5, repeatOrders: 2, revenue: 200 }],
    } as never);

    const result = await service.getCustomerOrderAnalysis({});

    expect(result.cityComparisonTable[0]).toMatchObject({
      customersWithOrders: 2,
      customersWithoutOrders: 2,
    });
    expect(result.charts.repeatPurchaseTrends).toEqual([
      { period: '2025-01', totalOrders: 5, repeatOrders: 2, revenue: 200 },
    ]);
  });
});
