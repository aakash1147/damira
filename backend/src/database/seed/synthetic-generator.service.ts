import { PrismaClient, CustomerStatus, OrderStatus, Gender } from '@prisma/client';
import { SyntheticConfig, DEFAULT_SYNTHETIC_CONFIG } from './synthetic-config';
import { INDIA_GEOGRAPHIC_CATALOG, StateCatalogItem, CityCatalogItem } from './geographic-catalog';
import { SYNTHETIC_PRODUCT_CATALOG } from './product-catalog';

export class PRNG {
  private s: number;
  constructor(seed: number) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  weightedPick<T>(items: { item: T; weight: number }[]): T {
    const total = items.reduce((sum, i) => sum + i.weight, 0);
    let r = this.next() * total;
    for (const i of items) {
      if (r < i.weight) return i.item;
      r -= i.weight;
    }
    return items[items.length - 1].item;
  }
}

const FIRST_NAMES_MALE = [
  'Aarav', 'Aditya', 'Amit', 'Anand', 'Arjun', 'Ashok', 'Bharat', 'Chetan', 'Deepak',
  'Dev', 'Dinesh', 'Ganesh', 'Gaurav', 'Harish', 'Hemant', 'Karan', 'Karthik', 'Kunal',
  'Manish', 'Mayank', 'Mukesh', 'Naveen', 'Nikhil', 'Nitin', 'Pankaj', 'Pradeep', 'Prakash',
  'Prashant', 'Rahul', 'Rajesh', 'Rakesh', 'Ramesh', 'Ravi', 'Rohan', 'Rohit', 'Sachin',
  'Sameer', 'Sanjay', 'Saurabh', 'Siddharth', 'Suresh', 'Tarun', 'Varun', 'Vikas', 'Vikram',
  'Vinay', 'Vishal', 'Vivek', 'Yash', 'Zeeshan'
];

const FIRST_NAMES_FEMALE = [
  'Aadhya', 'Ananya', 'Anjali', 'Ankita', 'Aparna', 'Bhavna', 'Deepa', 'Deepika', 'Divya',
  'Gayatri', 'Geeta', 'Isha', 'Jyoti', 'Kavita', 'Kiran', 'Komal', 'Lakshmi', 'Madhu',
  'Meera', 'Monika', 'Neha', 'Nidhi', 'Nisha', 'Pallavi', 'Pooja', 'Prachi', 'Prerna',
  'Priya', 'Priyanka', 'Radha', 'Rani', 'Rashi', 'Reema', 'Ritu', 'Ruchika', 'Sakshi',
  'Sandhya', 'Sarita', 'Shalini', 'Shreya', 'Sneha', 'Suman', 'Sunita', 'Swati', 'Tanvi',
  'Uma', 'Vaishali', 'Vandana', 'Varsha', 'Vidya'
];

const LAST_NAMES = [
  'Agarwal', 'Banerjee', 'Bansal', 'Bhat', 'Bhattacharya', 'Chakraborty', 'Chatterjee', 'Chauhan',
  'Choudhury', 'Das', 'Dave', 'Deshmukh', 'Dey', 'Dubey', 'Dutta', 'Ghosh', 'Gupta', 'Iyer',
  'Jain', 'Jha', 'Joshi', 'Kapoor', 'Kaul', 'Khan', 'Khatri', 'Kulkarni', 'Kumar', 'Mahajan',
  'Malhotra', 'Mehta', 'Menon', 'Mishra', 'Mukherjee', 'Nair', 'Nambiar', 'Pandey', 'Patel',
  'Patil', 'Pillai', 'Prasad', 'Rao', 'Reddy', 'Roy', 'Saxena', 'Sen', 'Shah', 'Sharma',
  'Shukla', 'Singh', 'Sinha', 'Srivastava', 'Tiwari', 'Tripathi', 'Varma', 'Verma', 'Yadav'
];

const COMPANY_PREFIXES = [
  'Apex', 'Heritage', 'Organic Roots', 'Vedic', 'Royal', 'Zenith', 'Prithvi', 'Green Leaf',
  'Nirvana', 'Prakriti', 'Sunrise', 'Golden Harvest', 'BioPure', 'Shree Ganesh', 'Satva'
];
const COMPANY_SUFFIXES = [
  'Organics Pvt Ltd', 'Enterprises', 'Foods & Spices', 'Wellness Store', 'Agro Products',
  'Trading Corporation', 'Superfoods LLP', 'Gourmet Retailers', 'Wholesale Distributors'
];

const STREET_PREFIXES = [
  'Flat 204, Shanti Heights', 'Flat 402, Royal Palms', 'House No. 14B, Green Park',
  'Plot 28, Sector 15', 'Shop 7, City Centre Mall', 'B-12, Ground Floor, Defence Colony',
  'Office 501, Technopark', 'Plot 88, MIDC Industrial Area', 'Villa 9, Palm Meadows',
  'House No. 102, Civil Lines', 'Flat 11A, Silver Crest', 'Shop 18, Commercial Complex'
];

const STREET_LANDMARKS = [
  'Near Metro Station', 'Opposite City Hospital', 'Behind Grand Mall', 'Near SBI Bank',
  'Beside Post Office', 'Near Clock Tower', 'Behind Reliance Fresh', 'Near Apollo Pharmacy',
  'Opposite Public Garden', 'Near Hanuman Temple'
];

export interface GenerationStats {
  customersCreated: number;
  addressesCreated: number;
  ordersCreated: number;
  orderItemsCreated: number;
  totalGrossRevenue: number;
  totalNetRevenue: number;
  totalProfit: number;
  statesCovered: number;
  citiesCovered: number;
  stateDistribution: Record<string, { customers: number; orders: number; revenue: number }>;
}

export class SyntheticGeneratorService {
  private prng: PRNG;
  private config: SyntheticConfig;

  constructor(
    private prisma: PrismaClient,
    config: Partial<SyntheticConfig> = {}
  ) {
    this.config = { ...DEFAULT_SYNTHETIC_CONFIG, ...config };
    this.prng = new PRNG(this.config.seed);
  }

  /**
   * Main entry point for generation.
   * Supports dry-run without writing to DB.
   */
  async run(dryRun = false): Promise<GenerationStats> {
    console.log(`\n======================================================`);
    console.log(`  DAMIRA SYNTHETIC DATA GENERATOR`);
    console.log(`  Mode: ${dryRun ? 'DRY RUN (No database writes)' : 'LIVE EXECUTION'}`);
    console.log(`  Target: ${this.config.customerTarget} Customers, ${this.config.orderTarget} Orders`);
    console.log(`  Seed: ${this.config.seed}`);
    console.log(`======================================================\n`);

    // 1. Ensure master data & products exist
    console.log('[1/6] Verifying and enriching Master Data & Product Catalog...');
    const masterData = await this.ensureMasterDataAndProducts(dryRun);

    // 2. Build city & state weighted pools
    console.log('[2/6] Building geographic distribution pools for 36 States & UTs...');
    const geoPool = this.buildGeographicPools(masterData.statesByCode, masterData.citiesByStateAndName);

    // 3. Generate Customers
    console.log(`[3/6] Generating ${this.config.customerTarget} realistic Indian synthetic customers...`);
    const customersData = this.generateCustomersData(masterData.customerTypes);

    // 4. Generate Addresses
    console.log(`[4/6] Generating ${this.config.addressTarget}+ customer addresses with genuine pincodes...`);
    const addressesData = this.generateAddressesData(customersData, geoPool, masterData.addressTypes, masterData.countryId);

    // 5. Generate Orders & Order Items
    console.log(`[5/6] Generating ${this.config.orderTarget}+ orders & 5,000+ items across past 12 months...`);
    const { ordersData, orderItemsData, stats } = this.generateOrdersAndItems(
      customersData,
      addressesData,
      masterData.variants,
      masterData.channels
    );

    // 6. Database Commit (if not dry run)
    if (!dryRun) {
      console.log('[6/6] Writing synthetic dataset to database in atomic batches...');
      await this.persistToDatabase(customersData, addressesData, ordersData, orderItemsData);
      console.log('✓ All records successfully committed to database!\n');
    } else {
      console.log('[6/6] Dry run complete. Database was not modified.\n');
    }

    return stats;
  }

  /**
   * Ensure categories, products, variants, and cities exist in the database.
   */
  private async ensureMasterDataAndProducts(dryRun: boolean) {
    const country = await this.prisma.country.findFirst({ where: { iso2: 'IN' } });
    if (!country) throw new Error('Country India (IN) not found in database.');

    const states = await this.prisma.state.findMany({ where: { countryId: country.id } });
    const statesByCode = new Map<string, any>();
    states.forEach((s) => statesByCode.set(s.code.toUpperCase(), s));

    // Ensure all cities in our geographic catalog exist in DB
    const cities = await this.prisma.city.findMany({ include: { state: true } });
    const citiesByStateAndName = new Map<string, any>();
    cities.forEach((c) => {
      citiesByStateAndName.set(`${c.state.code.toUpperCase()}:${c.name.toLowerCase()}`, c);
    });

    if (!dryRun) {
      for (const stCat of INDIA_GEOGRAPHIC_CATALOG) {
        let stateRecord = statesByCode.get(stCat.code);
        if (!stateRecord) {
          // If code differs e.g. DN vs DNHDD or OR vs OD
          if (stCat.code === 'DN') stateRecord = statesByCode.get('DNHDD');
          if (stCat.code === 'OR') stateRecord = statesByCode.get('OD');
        }

        if (stateRecord) {
          for (const cityItem of stCat.cities) {
            const key = `${stateRecord.code.toUpperCase()}:${cityItem.name.toLowerCase()}`;
            if (!citiesByStateAndName.has(key)) {
              const newCity = await this.prisma.city.create({
                data: {
                  stateId: stateRecord.id,
                  name: cityItem.name,
                  isActive: true,
                },
                include: { state: true },
              });
              citiesByStateAndName.set(key, newCity);
            }
          }
        }
      }

      // Ensure synthetic product catalog exists
      for (const prodDef of SYNTHETIC_PRODUCT_CATALOG) {
        let category = await this.prisma.productCategory.findUnique({ where: { code: prodDef.categoryCode } });
        if (!category) {
          category = await this.prisma.productCategory.create({
            data: {
              name: prodDef.categoryName,
              code: prodDef.categoryCode,
              description: `Natural ${prodDef.categoryName}`,
              isActive: true,
            },
          });
        }

        let product = await this.prisma.product.findUnique({ where: { sku: prodDef.sku } });
        if (!product) {
          product = await this.prisma.product.create({
            data: {
              categoryId: category.id,
              name: prodDef.name,
              sku: prodDef.sku,
              description: prodDef.description,
              basePrice: prodDef.variants[0]?.sellingPrice || 199,
              costPrice: prodDef.variants[0]?.costPrice || 90,
              isActive: true,
            },
          });
        }

        for (const vDef of prodDef.variants) {
          const variant = await this.prisma.productVariant.findUnique({ where: { sku: vDef.sku } });
          if (!variant) {
            await this.prisma.productVariant.create({
              data: {
                productId: product.id,
                name: vDef.name,
                sku: vDef.sku,
                weightGrams: vDef.weightGrams,
                mrp: vDef.mrp,
                sellingPrice: vDef.sellingPrice,
                costPrice: vDef.costPrice,
                packagingCost: vDef.packagingCost,
                isActive: true,
              },
            });
          }
        }
      }
    }

    const [customerTypes, addressTypes, channels, variants] = await Promise.all([
      this.prisma.customerType.findMany({ where: { isActive: true } }),
      this.prisma.addressType.findMany({ where: { isActive: true } }),
      this.prisma.salesChannel.findMany({ where: { isActive: true } }),
      this.prisma.productVariant.findMany({ where: { isActive: true }, include: { product: true } }),
    ]);

    return {
      countryId: country.id,
      statesByCode,
      citiesByStateAndName,
      customerTypes,
      addressTypes,
      channels,
      variants,
    };
  }

  /**
   * Build weighted geographic sampling pool.
   */
  private buildGeographicPools(statesByCode: Map<string, any>, citiesByStateAndName: Map<string, any>) {
    const statePool: { item: StateCatalogItem; weight: number }[] = [];

    for (const s of INDIA_GEOGRAPHIC_CATALOG) {
      statePool.push({ item: s, weight: s.weight });
    }

    return {
      pickState: () => this.prng.weightedPick(statePool),
      pickCityForState: (stateItem: StateCatalogItem) => {
        const cityPool = stateItem.cities.map((c) => ({ item: c, weight: c.weight }));
        return this.prng.weightedPick(cityPool);
      },
      getStateRecord: (code: string) => {
        let st = statesByCode.get(code);
        if (!st && code === 'DN') st = statesByCode.get('DNHDD');
        if (!st && code === 'OR') st = statesByCode.get('OD');
        return st;
      },
      getCityRecord: (stateCode: string, cityName: string) => {
        const key = `${stateCode.toUpperCase()}:${cityName.toLowerCase()}`;
        return citiesByStateAndName.get(key);
      },
    };
  }

  /**
   * Generate Customer records.
   */
  private generateCustomersData(customerTypes: any[]) {
    const customers: any[] = [];
    const sources = ['WEBSITE', 'INSTAGRAM', 'WHATSAPP', 'AMAZON', 'FLIPKART', 'OFFLINE', 'REFERRAL'];

    // Map weights to types
    const typePool = customerTypes.map((t) => ({
      item: t,
      weight: this.config.customerTypeWeights[t.code] || 10,
    }));

    for (let i = 1; i <= this.config.customerTarget; i++) {
      const isMale = this.prng.next() > 0.48;
      const firstName = isMale ? this.prng.pick(FIRST_NAMES_MALE) : this.prng.pick(FIRST_NAMES_FEMALE);
      const lastName = this.prng.pick(LAST_NAMES);
      const customerType = this.prng.weightedPick(typePool);

      const isCorporate = ['CORPORATE', 'WHOLESALER', 'BULK_BUYER', 'DISTRIBUTOR'].includes(customerType.code);
      const companyName = isCorporate ? `${this.prng.pick(COMPANY_PREFIXES)} ${this.prng.pick(COMPANY_SUFFIXES)}` : null;

      // Deterministic synthetic mobile & email
      const mobileSuffix = String(this.prng.range(10000000, 99999999));
      const mobile = `98${mobileSuffix.slice(0, 8)}`;
      const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`;
      const email = `${emailName}@synthetic.damira.test`;

      // Created date in past 12 months
      const createdDaysAgo = this.prng.range(1, 365);
      const createdAt = new Date(this.config.endDate.getTime() - createdDaysAgo * 86400000);

      const customerCode = `${this.config.customerPrefix}${String(i).padStart(5, '0')}`;

      customers.push({
        id: `syn-cust-${i}`,
        customerCode,
        customerTypeId: customerType.id,
        firstName,
        lastName,
        companyName,
        email,
        mobile,
        gender: isMale ? Gender.MALE : Gender.FEMALE,
        source: this.prng.pick(sources),
        status: CustomerStatus.ACTIVE,
        notes: `${this.config.tagMarker} Synthetic customer record ${customerCode}`,
        createdAt,
        updatedAt: createdAt,
        // Helper metadata for address & order generation
        _index: i,
        _isCorporate: isCorporate,
      });
    }

    return customers;
  }

  /**
   * Generate CustomerAddress records.
   */
  private generateAddressesData(customers: any[], geoPool: any, addressTypes: any[], countryId: string) {
    const addresses: any[] = [];
    const addrTypeMap = new Map<string, any>();
    addressTypes.forEach((t) => addrTypeMap.set(t.code, t));

    const homeType = addrTypeMap.get('HOME') || addressTypes[0];
    const officeType = addrTypeMap.get('OFFICE') || addressTypes[0];
    const deliveryType = addrTypeMap.get('DELIVERY') || addressTypes[0];

    const addrCountPool = this.config.addressCountDistribution.map((d) => ({
      item: d.count,
      weight: d.weight,
    }));

    let addrSeq = 1;

    for (const cust of customers) {
      const addressCount = this.prng.weightedPick(addrCountPool);
      const custAddresses: any[] = [];

      // Primary State & City for this customer
      const primaryStateCat = geoPool.pickState();
      const primaryCityCat = geoPool.pickCityForState(primaryStateCat);
      const stateRecord = geoPool.getStateRecord(primaryStateCat.code);
      const cityRecord = geoPool.getCityRecord(stateRecord ? stateRecord.code : primaryStateCat.code, primaryCityCat.name);

      const stateId = stateRecord ? stateRecord.id : 'state-fallback';
      const cityId = cityRecord ? cityRecord.id : 'city-fallback';

      for (let a = 1; a <= addressCount; a++) {
        const isDefault = a === 1;
        const pincode = this.prng.pick(primaryCityCat.pincodes);
        const street = `${this.prng.pick(STREET_PREFIXES)}, ${this.prng.pick(STREET_LANDMARKS)}`;
        const addrType = cust._isCorporate ? officeType : a === 1 ? homeType : a === 2 ? officeType : deliveryType;

        const addrId = `syn-addr-${addrSeq++}`;

        const addrObj = {
          id: addrId,
          customerId: cust.id,
          addressTypeId: addrType.id,
          addressLabel: a === 1 ? 'Primary Location' : a === 2 ? 'Secondary Office' : `Branch / Site ${a}`,
          contactPersonName: `${cust.firstName} ${cust.lastName}`,
          contactMobile: cust.mobile,
          addressLine1: street,
          addressLine2: `${primaryCityCat.district} Area`,
          landmark: this.prng.pick(STREET_LANDMARKS),
          countryId,
          stateId,
          cityId,
          district: primaryCityCat.district,
          postalCode: pincode,
          isDefaultBilling: isDefault,
          isDefaultShipping: isDefault,
          isActive: true,
          isDeleted: false,
          createdAt: cust.createdAt,
          updatedAt: cust.createdAt,
          // Helper metadata
          _stateCode: primaryStateCat.code,
          _cityName: primaryCityCat.name,
        };

        addresses.push(addrObj);
        custAddresses.push(addrObj);
      }

      cust._addresses = custAddresses;
    }

    return addresses;
  }

  /**
   * Generate Orders and Order Items.
   */
  private generateOrdersAndItems(customers: any[], addresses: any[], variants: any[], channels: any[]) {
    const orders: any[] = [];
    const orderItems: any[] = [];

    const channelPool = channels.map((c) => ({
      item: c,
      weight: this.config.salesChannelWeights[c.code] || 10,
    }));

    const statusPool = Object.keys(this.config.orderStatusWeights).map((code) => ({
      item: code as OrderStatus,
      weight: this.config.orderStatusWeights[code] || 10,
    }));

    const freqPool = this.config.orderFrequencyDistribution.map((d) => ({
      item: d.orderRange,
      weight: d.weight,
    }));

    let orderSeq = 1;
    let itemSeq = 1;

    let totalGross = 0;
    let totalNet = 0;
    let totalProfit = 0;

    const stateStats: Record<string, { customers: Set<string>; orders: number; revenue: number }> = {};

    for (const cust of customers) {
      const [minOrders, maxOrders] = this.prng.weightedPick(freqPool);
      const ordersToCreate = this.prng.range(minOrders, maxOrders);

      if (ordersToCreate === 0) continue;

      const custAddrs = cust._addresses || [];
      const primaryAddr = custAddrs[0] || addresses[0];

      let lastOrderDate = new Date(cust.createdAt.getTime() + this.prng.range(1, 10) * 86400000);

      for (let o = 1; o <= ordersToCreate; o++) {
        const orderNumber = `${this.config.orderPrefix}${String(orderSeq).padStart(6, '0')}`;
        const channel = this.prng.weightedPick(channelPool);
        const status = this.prng.weightedPick(statusPool);

        // Advance date realistically for repeat buyers (20 to 75 days apart)
        if (o > 1) {
          const daysGap = this.prng.range(20, 75);
          lastOrderDate = new Date(lastOrderDate.getTime() + daysGap * 86400000);
        }

        // Clamp to end date
        if (lastOrderDate > this.config.endDate) {
          lastOrderDate = new Date(this.config.endDate.getTime() - this.prng.range(1, 15) * 86400000);
        }

        // Pick 1 to 4 distinct variants
        const itemCount = this.prng.range(this.config.minItemsPerOrder, this.config.maxItemsPerOrder);
        const chosenVariants: any[] = [];
        for (let i = 0; i < itemCount; i++) {
          const v = this.prng.pick(variants);
          if (!chosenVariants.some((cv) => cv.id === v.id)) {
            chosenVariants.push(v);
          }
        }

        const orderId = `syn-ord-${orderSeq++}`;

        let orderGross = 0;
        let orderDiscount = 0;
        let orderCost = 0;
        let orderPackaging = 0;
        let totalUnits = 0;

        for (const variant of chosenVariants) {
          const qty = cust._isCorporate ? this.prng.range(5, 25) : this.prng.range(1, 3);
          const unitPrice = variant.sellingPrice;
          const unitCost = variant.costPrice;
          const totalPrice = unitPrice * qty;
          const totalCost = unitCost * qty;
          const discount = this.prng.next() < 0.25 ? Math.round(totalPrice * 0.1) : 0; // 10% discount sometimes
          const netPrice = totalPrice - discount;

          orderGross += totalPrice;
          orderDiscount += discount;
          orderCost += totalCost;
          orderPackaging += (variant.packagingCost || 15) * qty;
          totalUnits += qty;

          orderItems.push({
            id: `syn-item-${itemSeq++}`,
            orderId,
            variantId: variant.id,
            quantity: qty,
            unitPrice,
            unitCost,
            totalPrice,
            totalCost,
            discount,
            netPrice,
            createdAt: lastOrderDate,
          });
        }

        // Shipping & Cost allocation
        const shippingCost = orderGross >= 999 ? 0 : 80;
        const allocatedCost = Math.round(orderGross * 0.035); // 3.5% payment & operational gateway overhead

        let netAmount = orderGross - orderDiscount + shippingCost;
        let refundAmount = 0;
        let grossProfit = 0;
        let profitMarginPct = 0;

        if (status === 'CANCELLED') {
          netAmount = 0;
          grossProfit = 0;
          profitMarginPct = 0;
        } else if (status === 'REFUNDED' || status === 'RETURNED') {
          refundAmount = netAmount;
          netAmount = 0;
          grossProfit = -(shippingCost + orderPackaging); // Losses on dispatch & return
          profitMarginPct = 0;
        } else {
          grossProfit = netAmount - (orderCost + orderPackaging + shippingCost + allocatedCost);
          profitMarginPct = netAmount > 0 ? Number(((grossProfit / netAmount) * 100).toFixed(2)) : 0;

          totalGross += orderGross;
          totalNet += netAmount;
          totalProfit += grossProfit;
        }

        orders.push({
          id: orderId,
          orderNumber,
          customerId: cust.id,
          deliveryAddressId: primaryAddr.id,
          billingAddressId: primaryAddr.id,
          channelId: channel.id,
          status,
          orderDate: lastOrderDate,
          grossAmount: orderGross,
          discountAmount: orderDiscount,
          refundAmount,
          netAmount,
          shippingCost,
          packagingCost: orderPackaging,
          allocatedCost,
          productCost: orderCost,
          grossProfit,
          profitMarginPct,
          totalUnits,
          notes: `${this.config.tagMarker} Order #${orderNumber} via ${channel.name}`,
          createdAt: lastOrderDate,
          updatedAt: lastOrderDate,
        });

        // Record state distribution metrics
        const stCode = primaryAddr._stateCode;
        if (!stateStats[stCode]) {
          stateStats[stCode] = { customers: new Set(), orders: 0, revenue: 0 };
        }
        stateStats[stCode].customers.add(cust.id);
        stateStats[stCode].orders++;
        if (status !== 'CANCELLED') {
          stateStats[stCode].revenue += netAmount;
        }
      }
    }

    // Build serializable state distribution report
    const stateSummary: Record<string, { customers: number; orders: number; revenue: number }> = {};
    for (const [st, val] of Object.entries(stateStats)) {
      stateSummary[st] = {
        customers: val.customers.size,
        orders: val.orders,
        revenue: Math.round(val.revenue),
      };
    }

    const uniqueCities = new Set(addresses.map((a: any) => `${a._stateCode}:${a._cityName}`));

    const stats: GenerationStats = {
      customersCreated: customers.length,
      addressesCreated: addresses.length,
      ordersCreated: orders.length,
      orderItemsCreated: orderItems.length,
      totalGrossRevenue: Math.round(totalGross),
      totalNetRevenue: Math.round(totalNet),
      totalProfit: Math.round(totalProfit),
      statesCovered: Object.keys(stateStats).length,
      citiesCovered: uniqueCities.size,
      stateDistribution: stateSummary,
    };

    return { ordersData: orders, orderItemsData: orderItems, stats };
  }

  /**
   * Persist synthetic dataset into the database in optimized transactional chunks.
   */
  private async persistToDatabase(customers: any[], addresses: any[], orders: any[], orderItems: any[]) {
    // Clean helper properties before Prisma insertion
    const cleanCustomers = customers.map((c) => {
      const { _index, _isCorporate, _addresses, ...rest } = c;
      return rest;
    });

    const cleanAddresses = addresses.map((a) => {
      const { _stateCode, _cityName, ...rest } = a;
      return rest;
    });

    // 1. Batch Insert Customers (in chunks of 150)
    console.log(`  -> Inserting ${cleanCustomers.length} customers...`);
    const chunkSize = 150;
    for (let i = 0; i < cleanCustomers.length; i += chunkSize) {
      const chunk = cleanCustomers.slice(i, i + chunkSize);
      await this.prisma.$transaction(chunk.map((c) => this.prisma.customer.create({ data: c })));
    }

    // 2. Batch Insert Addresses
    console.log(`  -> Inserting ${cleanAddresses.length} customer addresses...`);
    for (let i = 0; i < cleanAddresses.length; i += chunkSize) {
      const chunk = cleanAddresses.slice(i, i + chunkSize);
      await this.prisma.$transaction(chunk.map((a) => this.prisma.customerAddress.create({ data: a })));
    }

    // 3. Batch Insert Orders
    console.log(`  -> Inserting ${orders.length} orders...`);
    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize);
      await this.prisma.$transaction(chunk.map((o) => this.prisma.order.create({ data: o })));
    }

    // 4. Batch Insert Order Items
    console.log(`  -> Inserting ${orderItems.length} order items...`);
    for (let i = 0; i < orderItems.length; i += chunkSize) {
      const chunk = orderItems.slice(i, i + chunkSize);
      await this.prisma.$transaction(chunk.map((it) => this.prisma.orderItem.create({ data: it })));
    }
  }

  /**
   * Safe cleanup of ONLY synthetic records matching the batch marker.
   */
  async cleanup(): Promise<{ deletedOrders: number; deletedCustomers: number }> {
    console.log(`\n======================================================`);
    console.log(`  DAMIRA SYNTHETIC DATA CLEANUP`);
    console.log(`  Targeting Tag: ${this.config.tagMarker}`);
    console.log(`======================================================\n`);

    // Delete in relational order: orderItems -> orders -> addresses -> customers
    const synOrders = await this.prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { startsWith: this.config.orderPrefix } },
          { notes: { contains: this.config.tagMarker } },
        ],
      },
      select: { id: true },
    });

    const orderIds = synOrders.map((o) => o.id);
    console.log(`Found ${orderIds.length} synthetic orders to delete.`);

    if (orderIds.length > 0) {
      await this.prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await this.prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    const synCustomers = await this.prisma.customer.findMany({
      where: {
        OR: [
          { customerCode: { startsWith: this.config.customerPrefix } },
          { notes: { contains: this.config.tagMarker } },
        ],
      },
      select: { id: true },
    });

    const custIds = synCustomers.map((c) => c.id);
    console.log(`Found ${custIds.length} synthetic customers to delete.`);

    if (custIds.length > 0) {
      await this.prisma.customerAddress.deleteMany({ where: { customerId: { in: custIds } } });
      await this.prisma.customer.deleteMany({ where: { id: { in: custIds } } });
    }

    console.log(`✓ Cleanup complete! Real business records remain completely untouched.\n`);
    return { deletedOrders: orderIds.length, deletedCustomers: custIds.length };
  }
}
