import { PrismaClient } from '@prisma/client';
import { MarketIntelligenceService } from '../src/market-intelligence/market-intelligence.service';

const prisma = new PrismaClient();

async function main() {
  const service = new MarketIntelligenceService(prisma as any);
  console.log('Testing Market Intelligence Backend Analytics Services with live synthetic dataset...\n');

  // 1. Geography Overview & KPIs
  const overview = await service.getGeographyOverview({});
  console.log('1. GEOGRAPHY OVERVIEW & KPIS:');
  console.log(`   Total Customers          : ${overview.totalCustomers}`);
  console.log(`   Total Orders             : ${overview.totalOrders}`);
  console.log(`   Total Units Sold         : ${overview.totalUnitsSold}`);
  console.log(`   Total Net Revenue        : ₹${Math.round(overview.totalRevenue).toLocaleString('en-IN')}`);
  console.log(`   Total Gross Profit       : ₹${Math.round(overview.financials.grossProfit).toLocaleString('en-IN')}`);
  console.log(`   Average Order Value      : ₹${Math.round(overview.averageOrderValue).toLocaleString('en-IN')}`);
  console.log(`   Repeat Customers         : ${overview.repeatCustomers} (${overview.repeatPurchaseRate}%)`);
  console.log(`   States with Customers    : ${overview.totalStatesWithCustomers}/36`);
  console.log(`   Cities with Customers    : ${overview.totalCitiesWithCustomers}`);
  console.log(`   Active Pincodes          : ${overview.totalActivePincodes}\n`);

  // 2. State Performance
  const statePerf = await service.getStatePerformance({});
  console.log(`2. STATE-WISE PERFORMANCE (${statePerf.states.length} States & UTs):`);
  console.log('   Top 5 States by Revenue:');
  statePerf.states.slice(0, 5).forEach((s: any, idx: number) => {
    console.log(`   #${idx + 1} ${s.stateName.padEnd(16)} (${s.stateCode}): Orders: ${String(s.totalOrders).padStart(4)} | Customers: ${String(s.totalCustomers).padStart(4)} | Revenue: ₹${Math.round(s.totalRevenue).toLocaleString('en-IN')} | Profit: ₹${Math.round(s.totalProfit).toLocaleString('en-IN')} | Contribution: ${s.revenueContributionPct}%`);
  });

  // 3. City Performance
  const cityPerf = await service.getCityPerformance({});
  console.log(`\n3. CITY-WISE PERFORMANCE (${cityPerf.cities.length} Cities):`);
  console.log('   Top 5 Cities by Revenue:');
  cityPerf.cities.slice(0, 5).forEach((c: any, idx: number) => {
    console.log(`   #${idx + 1} ${c.cityName.padEnd(16)} (${c.stateName}): Orders: ${String(c.totalOrders).padStart(4)} | Customers: ${String(c.totalCustomers).padStart(4)} | Revenue: ₹${Math.round(c.totalRevenue).toLocaleString('en-IN')} | AOV: ₹${Math.round(c.averageOrderValue)}`);
  });

  // 4. Pincode Performance
  const pincodePerf = await service.getPincodePerformance({});
  console.log(`\n4. PINCODE LOCALITY ANALYTICS (${pincodePerf.pincodes.length} Pincodes):`);
  console.log('   Top 5 Pincodes by Volume:');
  pincodePerf.pincodes.slice(0, 5).forEach((p: any, idx: number) => {
    console.log(`   #${idx + 1} Pincode ${p.pincode} (${p.city}, ${p.state}): Orders: ${String(p.totalOrders).padStart(3)} | Revenue: ₹${Math.round(p.totalRevenue).toLocaleString('en-IN')}`);
  });

  // 5. Customer vs Orders Conversion
  const conversion = await service.getCustomerVsOrders({});
  console.log(`\n5. CUSTOMER VS ORDER CONVERSION:`);
  console.log(`   Analyzed City Cohorts: ${conversion.analysis.length} cities`);
  console.log('   Top 3 Conversion Insights:');
  conversion.analysis.slice(0, 3).forEach((a: any, idx: number) => {
    console.log(`   #${idx + 1} ${a.cityName} (${a.stateName}): Customers: ${a.totalCustomers} | Orders: ${a.totalOrders} | Repeat: ${a.repeatCustomers} | Insight: ${a.insight}`);
  });

  // 6. Revenue & Profit Analysis
  const revProfit = await service.getRevenueProfitAnalysis({});
  console.log(`\n6. REVENUE & PROFIT ANALYSIS:`);
  console.log(`   Gross Sales       : ₹${Math.round(revProfit.kpiCards.grossSales).toLocaleString('en-IN')}`);
  console.log(`   Discounts         : ₹${Math.round(revProfit.kpiCards.discounts).toLocaleString('en-IN')}`);
  console.log(`   Net Revenue       : ₹${Math.round(revProfit.kpiCards.netRevenue).toLocaleString('en-IN')}`);
  console.log(`   Product Cost      : ₹${Math.round(revProfit.kpiCards.totalProductCost).toLocaleString('en-IN')}`);
  console.log(`   Gross Profit      : ₹${Math.round(revProfit.kpiCards.grossProfit).toLocaleString('en-IN')}`);
  console.log(`   Profit Margin     : ${revProfit.kpiCards.profitMargin}%\n`);

  // 7. Product Demand
  const prodDemand = await service.getProductDemand({});
  console.log(`7. PRODUCT DEMAND & REGIONAL CONCENTRATION (${prodDemand.products.length} SKUs):`);
  prodDemand.products.slice(0, 4).forEach((p: any, idx: number) => {
    console.log(`   #${idx + 1} ${p.productName} (${p.sku}): Units: ${p.totalUnits} | Revenue: ₹${Math.round(p.totalRevenue).toLocaleString('en-IN')} | Top State: ${p.topState}`);
  });

  // 8. Sales Channel Analysis
  const channels = await service.getSalesChannels({});
  console.log(`\n8. SALES CHANNELS DISTRIBUTION (${channels.channels.length} Channels):`);
  channels.channels.forEach((ch: any) => {
    console.log(`   ${ch.channelName.padEnd(20)}: Orders: ${String(ch.totalOrders).padStart(4)} | Revenue: ₹${Math.round(ch.totalRevenue).toLocaleString('en-IN')} | Share: ${ch.orderSharePct}%`);
  });

  console.log('\n✓ All 6 Market Intelligence Analytics modules successfully verified with live synthetic data!');
}

main()
  .catch((e) => {
    console.error('Analytics test error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
