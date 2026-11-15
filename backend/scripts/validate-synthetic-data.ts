import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('======================================================');
  console.log('  DAMIRA DATABASE SYNTHETIC DATA VALIDATION SUITE     ');
  console.log('======================================================\n');

  // 1. Entity Totals
  const [
    totalCustomers,
    totalAddresses,
    totalOrders,
    totalOrderItems,
    syntheticCustomers,
    syntheticOrders,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customerAddress.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.customer.count({ where: { customerCode: { startsWith: 'CUST-SYN-' } } }),
    prisma.order.count({ where: { orderNumber: { startsWith: 'ORD-SYN-' } } }),
  ]);

  console.log('1. TOTAL ENTITY COUNTS:');
  console.log(`   Total Customers in DB         : ${totalCustomers.toLocaleString('en-IN')} (Synthetic: ${syntheticCustomers.toLocaleString('en-IN')})`);
  console.log(`   Total Customer Addresses in DB: ${totalAddresses.toLocaleString('en-IN')}`);
  console.log(`   Total Orders in DB            : ${totalOrders.toLocaleString('en-IN')} (Synthetic: ${syntheticOrders.toLocaleString('en-IN')})`);
  console.log(`   Total Order Items in DB       : ${totalOrderItems.toLocaleString('en-IN')}\n`);

  // 2. Customer Order Repeat Behavior
  const customerOrderCounts = await prisma.order.groupBy({
    by: ['customerId'],
    _count: { id: true },
  });

  const orderingCustomerIds = new Set(customerOrderCounts.map((c) => c.customerId));
  const customersWithoutOrders = totalCustomers - orderingCustomerIds.size;
  let customersWithSingleOrder = 0;
  let customersWith2To3Orders = 0;
  let customersWith4PlusOrders = 0;

  for (const row of customerOrderCounts) {
    const cnt = row._count.id;
    if (cnt === 1) customersWithSingleOrder++;
    else if (cnt >= 2 && cnt <= 3) customersWith2To3Orders++;
    else if (cnt >= 4) customersWith4PlusOrders++;
  }

  const repeatCustomersCount = customersWith2To3Orders + customersWith4PlusOrders;
  const repeatRate = orderingCustomerIds.size > 0 ? ((repeatCustomersCount / orderingCustomerIds.size) * 100).toFixed(1) : '0';

  console.log('2. CUSTOMER ORDER CONVERSION & REPEAT RATE:');
  console.log(`   Customers with 0 Orders (Leads/Prospects) : ${customersWithoutOrders} (${((customersWithoutOrders / totalCustomers) * 100).toFixed(1)}%)`);
  console.log(`   Customers with Exactly 1 Order            : ${customersWithSingleOrder} (${((customersWithSingleOrder / totalCustomers) * 100).toFixed(1)}%)`);
  console.log(`   Repeat Customers (2 to 3 Orders)          : ${customersWith2To3Orders} (${((customersWith2To3Orders / totalCustomers) * 100).toFixed(1)}%)`);
  console.log(`   High-Frequency Buyers (4+ Orders)         : ${customersWith4PlusOrders} (${((customersWith4PlusOrders / totalCustomers) * 100).toFixed(1)}%)`);
  console.log(`   Active Ordering Customers                 : ${orderingCustomerIds.size}`);
  console.log(`   Overall Customer Repeat Purchase Rate     : ${repeatRate}%\n`);

  // 3. Customer Address Multiplicity
  const custAddressCounts = await prisma.customerAddress.groupBy({
    by: ['customerId'],
    _count: { id: true },
  });

  let singleAddr = 0, twoAddr = 0, threePlusAddr = 0;
  for (const c of custAddressCounts) {
    if (c._count.id === 1) singleAddr++;
    else if (c._count.id === 2) twoAddr++;
    else if (c._count.id >= 3) threePlusAddr++;
  }

  console.log('3. ADDRESS DISTRIBUTION PER CUSTOMER:');
  console.log(`   Customers with 1 Address       : ${singleAddr} (${((singleAddr / totalCustomers) * 100).toFixed(1)}%)`);
  console.log(`   Customers with 2 Addresses     : ${twoAddr} (${((twoAddr / totalCustomers) * 100).toFixed(1)}%)`);
  console.log(`   Customers with 3+ Addresses    : ${threePlusAddr} (${((threePlusAddr / totalCustomers) * 100).toFixed(1)}%)\n`);

  // 4. Financial & Margin Totals
  const orderSums = await prisma.order.aggregate({
    _sum: {
      grossAmount: true,
      discountAmount: true,
      netAmount: true,
      productCost: true,
      shippingCost: true,
      packagingCost: true,
      allocatedCost: true,
      grossProfit: true,
      totalUnits: true,
    },
    _avg: {
      netAmount: true,
      profitMarginPct: true,
    },
  });

  console.log('4. FINANCIAL & MARGIN TOTALS:');
  console.log(`   Gross Merchandise Value (GMV) : ₹${(orderSums._sum.grossAmount || 0).toLocaleString('en-IN')}`);
  console.log(`   Discounts Absorbed            : ₹${(orderSums._sum.discountAmount || 0).toLocaleString('en-IN')}`);
  console.log(`   Net Revenue Collected         : ₹${(orderSums._sum.netAmount || 0).toLocaleString('en-IN')}`);
  console.log(`   Cost of Goods Sold (COGS)     : ₹${(orderSums._sum.productCost || 0).toLocaleString('en-IN')}`);
  console.log(`   Shipping & Packaging Costs    : ₹${((orderSums._sum.shippingCost || 0) + (orderSums._sum.packagingCost || 0)).toLocaleString('en-IN')}`);
  console.log(`   Gross Profit Realized         : ₹${(orderSums._sum.grossProfit || 0).toLocaleString('en-IN')}`);
  console.log(`   Total Units Sold              : ${(orderSums._sum.totalUnits || 0).toLocaleString('en-IN')}`);
  console.log(`   Average Order Value (AOV)     : ₹${Math.round(orderSums._avg.netAmount || 0).toLocaleString('en-IN')}\n`);

  // 5. Geographic Breadth
  const uniqueStates = await prisma.customerAddress.groupBy({
    by: ['stateId'],
  });
  const uniqueCities = await prisma.customerAddress.groupBy({
    by: ['cityId'],
  });
  const uniquePincodes = await prisma.customerAddress.groupBy({
    by: ['postalCode'],
  });

  console.log('5. GEOGRAPHICAL REACH:');
  console.log(`   States & UTs with Customer Presence : ${uniqueStates.length}/36`);
  console.log(`   Cities Represented                  : ${uniqueCities.length}`);
  console.log(`   Unique Postal Codes (Pincodes)      : ${uniquePincodes.length}\n`);

  // 6. Channel Distribution
  const channelBreakdown = await prisma.order.groupBy({
    by: ['channelId'],
    _count: { id: true },
    _sum: { netAmount: true },
  });

  const channels = await prisma.salesChannel.findMany();
  const channelMap = new Map(channels.map((c) => [c.id, c.name]));

  console.log('6. SALES CHANNEL DISTRIBUTION:');
  for (const ch of channelBreakdown) {
    const name = channelMap.get(ch.channelId) || ch.channelId;
    const count = ch._count.id;
    const rev = ch._sum.netAmount || 0;
    const share = ((count / totalOrders) * 100).toFixed(1);
    console.log(`   ${name.padEnd(20)} : ${String(count).padStart(5)} orders (${share.padStart(4)}%) | ₹${Math.round(rev).toLocaleString('en-IN')}`);
  }

  // 7. Relational Integrity Checks
  const allOrders = await prisma.order.findMany({ select: { customerId: true, deliveryAddressId: true } });
  const allCustomerIds = new Set((await prisma.customer.findMany({ select: { id: true } })).map((c) => c.id));
  const allAddressIds = new Set((await prisma.customerAddress.findMany({ select: { id: true } })).map((a) => a.id));

  let missingCustomerCount = 0;
  let missingAddressCount = 0;

  for (const o of allOrders) {
    if (!allCustomerIds.has(o.customerId)) missingCustomerCount++;
    if (o.deliveryAddressId && !allAddressIds.has(o.deliveryAddressId)) missingAddressCount++;
  }

  console.log('\n7. RELATIONAL INTEGRITY VERIFICATION:');
  console.log(`   Orders with valid customer   : ${allOrders.length - missingCustomerCount}/${allOrders.length}`);
  console.log(`   Orders with valid address    : ${allOrders.length - missingAddressCount}/${allOrders.length}`);

  if (missingCustomerCount === 0 && missingAddressCount === 0) {
    console.log('   ✓ Relational Integrity 100% Verified!\n');
  } else {
    console.warn(`   ⚠ Detected ${missingCustomerCount} missing customers, ${missingAddressCount} missing addresses!`);
  }

  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Validation error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
