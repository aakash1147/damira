import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.count();
  const customers = await prisma.customer.count();
  const addrs = await prisma.customerAddress.count();
  const orderItems = await prisma.orderItem.count();

  console.log('=== DB COUNTS ===');
  console.log('Orders:', orders);
  console.log('Customers:', customers);
  console.log('Addresses:', addrs);
  console.log('Order Items:', orderItems);

  // Check a sample order and its delivery address
  const sampleOrder = await prisma.order.findFirst({
    include: {
      deliveryAddress: {
        include: { state: true, city: true },
      },
      items: {
        include: { variant: { include: { product: true } } },
        take: 1,
      },
    },
  });

  console.log('\n=== SAMPLE ORDER ===');
  console.log('Order ID:', sampleOrder?.id);
  console.log('Order status:', sampleOrder?.status);
  console.log('Net amount:', sampleOrder?.netAmount);
  console.log('Gross profit:', sampleOrder?.grossProfit);
  console.log('Delivery address state:', sampleOrder?.deliveryAddress?.state?.name);
  console.log('Delivery address city:', sampleOrder?.deliveryAddress?.city?.name);
  console.log('Items count:', sampleOrder?.items?.length);

  // Check orders with no delivery address
  const ordersWithNoAddress = await prisma.order.count({
    where: { deliveryAddressId: null },
  });
  console.log('\nOrders with NO delivery address:', ordersWithNoAddress);

  // Check orders with delivery address that has state
  const ordersWithAddress = await prisma.order.count({
    where: { deliveryAddress: { isNot: null } },
  });
  console.log('Orders WITH delivery address:', ordersWithAddress);

  // State distribution
  const stateGroups = await prisma.customerAddress.groupBy({
    by: ['stateId'],
    _count: { stateId: true },
    orderBy: { _count: { stateId: 'desc' } },
    take: 5,
  });
  console.log('\n=== TOP 5 STATES BY ADDRESS COUNT ===');
  for (const sg of stateGroups) {
    const state = sg.stateId ? await prisma.state.findUnique({ where: { id: sg.stateId } }) : null;
    console.log(`${state?.name ?? 'NULL'} (${sg.stateId}): ${sg._count.stateId}`);
  }

  // Check if orders have correct status
  const orderStatuses = await prisma.order.groupBy({
    by: ['status'],
    _count: { status: true },
  });
  console.log('\n=== ORDER STATUS BREAKDOWN ===');
  for (const s of orderStatuses) {
    console.log(`${s.status}: ${s._count.status}`);
  }

  // Check if order has deliveryAddressId at all
  const firstFew = await prisma.order.findMany({ take: 3, select: { id: true, deliveryAddressId: true, status: true, netAmount: true } });
  console.log('\n=== FIRST 3 ORDERS ===');
  console.log(JSON.stringify(firstFew, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
