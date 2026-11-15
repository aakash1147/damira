import { PrismaClient } from '@prisma/client';
import { SyntheticGeneratorService } from '../src/database/seed/synthetic-generator.service';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  const seedArg = args.find((a) => a.startsWith('--seed='));
  const seed = seedArg ? parseInt(seedArg.split('=')[1], 10) : 42091;

  const custArg = args.find((a) => a.startsWith('--customers='));
  const customerTarget = custArg ? parseInt(custArg.split('=')[1], 10) : 1700;

  const ordArg = args.find((a) => a.startsWith('--orders='));
  const orderTarget = ordArg ? parseInt(ordArg.split('=')[1], 10) : 3200;

  console.log(`Starting DAMIRA Synthetic Data Generator...`);
  console.log(`Arguments: isDryRun=${isDryRun}, seed=${seed}, customers=${customerTarget}, orders=${orderTarget}`);

  const generator = new SyntheticGeneratorService(prisma, {
    seed,
    customerTarget,
    orderTarget,
  });

  const stats = await generator.run(isDryRun);

  console.log('\n======================================================');
  console.log('       DAMIRA TEST DATASET SUMMARY REPORT             ');
  console.log('======================================================');
  console.log(`Total Synthetic Customers Generated : ${stats.customersCreated.toLocaleString('en-IN')}`);
  console.log(`Total Customer Addresses Generated   : ${stats.addressesCreated.toLocaleString('en-IN')}`);
  console.log(`Total Orders Generated               : ${stats.ordersCreated.toLocaleString('en-IN')}`);
  console.log(`Total Order Items Generated          : ${stats.orderItemsCreated.toLocaleString('en-IN')}`);
  console.log(`Total Gross Revenue Generated        : ₹${stats.totalGrossRevenue.toLocaleString('en-IN')}`);
  console.log(`Total Net Revenue Generated          : ₹${stats.totalNetRevenue.toLocaleString('en-IN')}`);
  console.log(`Total Gross Profit Generated         : ₹${stats.totalProfit.toLocaleString('en-IN')}`);
  console.log(`Geographic Coverage                  : ${stats.statesCovered}/36 States & UTs | ${stats.citiesCovered} Cities`);
  console.log('------------------------------------------------------');
  console.log('STATE-WISE GEOGRAPHICAL DISTRIBUTION (TOP 15):');
  console.log('State Code | Customers | Orders | Net Revenue (₹)');
  console.log('-----------+-----------+--------+------------------');

  const sortedStates = Object.entries(stats.stateDistribution).sort((a, b) => b[1].revenue - a[1].revenue);

  for (const [st, val] of sortedStates.slice(0, 15)) {
    const codeStr = st.padEnd(10);
    const custStr = String(val.customers).padStart(9);
    const ordStr = String(val.orders).padStart(6);
    const revStr = ('₹' + val.revenue.toLocaleString('en-IN')).padStart(16);
    console.log(`${codeStr} | ${custStr} | ${ordStr} | ${revStr}`);
  }

  console.log('------------------------------------------------------');
  console.log(`All ${stats.statesCovered} Indian States & Union Territories are represented!`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Data generation error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
