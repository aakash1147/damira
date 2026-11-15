export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  postalCode?: string;
  customerTypeId?: string;
  productId?: string;
  channelCode?: string;
  orderStatus?: string;
}

export interface FinancialBreakdown {
  grossSales: number;
  discounts: number;
  refunds: number;
  netRevenue: number;
  productCost: number;
  packagingCost: number;
  shippingCost: number;
  allocatedCost: number;
  grossProfit: number;
  profitMarginPct: number;
}

export interface KpiSummary {
  totalStatesWithCustomers: number;
  totalCitiesWithCustomers: number;
  totalActivePincodes: number;
  totalCustomers: number;
  customersWithOrders: number;
  customersWithoutOrders: number;
  distinctOrderingCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  totalGrossRevenue: number;
  totalDiscount: number;
  totalRefunds: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  repeatCustomers: number;
  repeatPurchaseRate: number;
  averageOrdersPerCustomer: number;
  financials: FinancialBreakdown;
}

export interface StatePerformance {
  stateId: string;
  stateName: string;
  stateCode: string;
  gstCode?: string | null;
  totalCustomers: number;
  newCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  unitsSold: number;
  averageOrderValue: number;
  repeatCustomers: number;
  repeatPurchaseRate: number;
  revenueContributionPct: number;
  monthlyRevenue?: { period: string; revenue: number }[];
}

export interface StatePerformanceResponse {
  kpiCards?: {
    totalStatesWithCustomers: number;
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    totalProfit: number;
    averageOrderValue: number;
  };
  states: StatePerformance[];
  totalStates: number;
  rankings: {
    topByCustomers: StatePerformance[];
    topByOrders: StatePerformance[];
    topByRevenue: StatePerformance[];
    topByProfit: StatePerformance[];
  };
  charts?: {
    top10ByRevenue: StatePerformance[];
    top10ByOrders: StatePerformance[];
    top10ByCustomers: StatePerformance[];
    top10ByProfit: StatePerformance[];
    monthlyTrendsByState: { stateId: string; stateName: string; trends: { period: string; revenue: number }[] }[];
  };
}

export interface StateDetailResponse {
  state: {
    id: string;
    name: string;
    code: string;
    gstCode?: string | null;
    countryName: string;
  };
  kpis: KpiSummary;
  topCities: CityPerformance[];
  topPincodes: PincodePerformance[];
  bestSellingProducts: ProductDemandItem[];
  channelBreakdown: SalesChannelItem[];
  orderTrends: GrowthTrendItem[];
}

export interface CityPerformance {
  cityId: string;
  cityName: string;
  stateId: string;
  stateName: string;
  stateCode: string;
  totalCustomers: number;
  newCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  unitsSold: number;
  averageOrderValue: number;
  repeatCustomers: number;
  repeatPurchaseRate: number;
  revenueContributionPct: number;
  monthlyRevenue?: { period: string; revenue: number }[];
}

export interface CityPerformanceResponse {
  kpiCards?: {
    totalCitiesWithCustomers: number;
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
    averageOrderValue: number;
  };
  cities: CityPerformance[];
  totalCities: number;
  rankings: {
    topByCustomers: CityPerformance[];
    topByOrders: CityPerformance[];
    topByRevenue: CityPerformance[];
    topByProfit: CityPerformance[];
    topByRepeat: CityPerformance[];
  };
  charts?: {
    top20ByRevenue: CityPerformance[];
    top20ByOrders: CityPerformance[];
    top20ByCustomers: CityPerformance[];
    top20ByProfit: CityPerformance[];
    monthlyTrendsByCity: { cityId: string; cityName: string; stateName: string; trends: { period: string; revenue: number }[] }[];
  };
}

export interface CityDetailResponse {
  city: {
    id: string;
    name: string;
    stateName: string;
    stateCode: string;
    countryName: string;
  };
  kpis: KpiSummary;
  pincodeDistribution: PincodePerformance[];
  customerDistribution: { type: string; count: number }[];
  bestSellingProducts: ProductDemandItem[];
  channelBreakdown: SalesChannelItem[];
  orderTrends: GrowthTrendItem[];
  repeatPurchaseStats: {
    totalCustomers: number;
    customersWithOrders: number;
    repeatCustomers: number;
    repeatPurchaseRate: number;
  };
}

export interface PincodePerformance {
  postalCode: string;
  cityName: string;
  stateName: string;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  unitsSold?: number;
  averageOrderValue: number;
  repeatCustomers: number;
  lat?: number | null;
  lng?: number | null;
}

export interface PincodePerformanceResponse {
  kpiCards?: {
    totalActivePincodes: number;
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
  };
  pincodes: PincodePerformance[];
  top20Pincodes: PincodePerformance[];
  totalPincodes: number;
}

export interface CustomerVsOrdersItem {
  cityId: string;
  cityName: string;
  stateName: string;
  totalCustomers: number;
  customersWithOrders: number;
  customersWithoutOrders: number;
  totalOrders: number;
  repeatCustomers: number;
  ordersPerCustomer: number;
  totalRevenue: number;
  repeatPurchaseRate: number;
  quadrant:
    | 'HIGH_CUSTOMERS_LOW_ORDERS'
    | 'LOW_CUSTOMERS_HIGH_ORDERS'
    | 'HIGH_CUSTOMERS_HIGH_ORDERS'
    | 'LOW_CUSTOMERS_LOW_ORDERS';
  insight: string;
}

export interface CustomerVsOrdersResponse {
  kpiCards?: {
    totalRegisteredCustomers: number;
    customersWithAtLeastOneOrder: number;
    customersWithoutOrders: number;
    repeatCustomers: number;
    repeatPurchaseRate: number;
    averageOrdersPerCustomer: number;
  };
  cityComparisonTable: CustomerVsOrdersItem[];
  charts: {
    customersVsOrdersByState: { stateName: string; stateCode: string; customers: number; orders: number; revenue: number }[];
    customersVsOrdersByCity: { cityName: string; stateName: string; customers: number; orders: number; revenue: number }[];
    customerLoyaltyDistribution: { firstTimeCustomers: number; repeatCustomers: number; customersWithoutOrders: number };
    customersWithoutOrdersByCity: { cityName: string; stateName: string; customersWithoutOrders: number; totalCustomers: number }[];
    repeatPurchaseTrends: { period: string; totalOrders: number; estimatedRepeatOrders: number; revenue: number }[];
  };
  analysis?: CustomerVsOrdersItem[];
}

export interface FinancialLedgerRow {
  stateName: string;
  cityName: string;
  orders: number;
  grossSales: number;
  discounts: number;
  refunds: number;
  netRevenue: number;
  productCost: number;
  shippingCost: number;
  otherAllocatedCosts: number;
  profit: number;
  profitMargin: number;
}

export interface RevenueProfitResponse {
  kpiCards: {
    grossSales: number;
    discounts: number;
    refunds: number;
    netRevenue: number;
    totalProductCost: number;
    shippingCost: number;
    grossProfit: number;
    profitMargin: number;
  };
  charts: {
    revenueByState: { stateName: string; stateCode: string; revenue: number; sharePct: number }[];
    revenueByCity: { cityName: string; stateName: string; revenue: number; sharePct: number }[];
    profitByState: { stateName: string; stateCode: string; profit: number; marginPct: number }[];
    profitByCity: { cityName: string; stateName: string; profit: number; marginPct: number }[];
    monthlyRevenueTrends: { period: string; revenue: number; orders: number }[];
    monthlyProfitTrends: { period: string; profit: number; marginPct: number }[];
    revenueContributionByLocation: { name: string; revenue: number; sharePct: number }[];
  };
  financialLedger: FinancialLedgerRow[];
}

export interface ProductDemandItem {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  unitsSold: number;
  grossRevenue: number;
  netRevenue: number;
  grossProfit: number;
  profitMarginPct: number;
  topStates: { state: string; unitsSold: number }[];
}

export interface ProductDemandResponse {
  products: ProductDemandItem[];
  totalVariants: number;
}

export interface SalesChannelItem {
  channelId: string;
  channelName: string;
  channelCode: string;
  totalOrders: number;
  netRevenue: number;
  unitsSold: number;
  grossProfit: number;
  averageOrderValue: number;
  topStates: { state: string; orders: number }[];
}

export interface GrowthTrendItem {
  period: string;
  revenue: number;
  orders: number;
  units: number;
  profit: number;
  aov: number;
}

export interface MarketOpportunityItem {
  category:
    | 'HIGH_DEMAND'
    | 'HIGH_POTENTIAL'
    | 'HIGH_REPEAT'
    | 'EMERGING'
    | 'LOW_PERFORMING';
  badgeColor: string;
  locationType: 'STATE';
  locationName: string;
  metrics: {
    customers: number;
    orders: number;
    revenue: number;
    repeatRate: number;
  };
  actionTitle: string;
  rationale: string;
}

export interface MarketOpportunitiesResponse {
  opportunities: MarketOpportunityItem[];
  totalOpportunities: number;
}

export interface FilterMetadata {
  countries: { id: string; name: string; iso2: string }[];
  states: { id: string; name: string; code: string; countryId: string }[];
  cities: { id: string; name: string; stateId: string }[];
  customerTypes: { id: string; name: string; code: string }[];
  products: { id: string; name: string; sku: string }[];
  salesChannels: { id: string; name: string; code: string }[];
  orderStatuses: string[];
}
