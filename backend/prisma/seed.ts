import { PrismaClient, Gender, EmployeeStatus, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DAMIRA DATABASE SEEDING STARTED ---');

  // 1. SEED PERMISSIONS
  console.log('Seeding Permissions...');
  const permissionsData = [
    // Customers
    { module: 'CUSTOMERS', action: 'VIEW', slug: 'CUSTOMERS:VIEW', description: 'View customer records and profile details' },
    { module: 'CUSTOMERS', action: 'CREATE', slug: 'CUSTOMERS:CREATE', description: 'Create new customer profiles and addresses' },
    { module: 'CUSTOMERS', action: 'EDIT', slug: 'CUSTOMERS:EDIT', description: 'Edit existing customer profiles and addresses' },
    { module: 'CUSTOMERS', action: 'DELETE', slug: 'CUSTOMERS:DELETE', description: 'Soft delete or archive customers' },
    { module: 'CUSTOMERS', action: 'IMPORT', slug: 'CUSTOMERS:IMPORT', description: 'Bulk import customers via CSV/Excel' },
    { module: 'CUSTOMERS', action: 'EXPORT', slug: 'CUSTOMERS:EXPORT', description: 'Export customer data to CSV/Excel' },

    // Employees
    { module: 'EMPLOYEES', action: 'VIEW', slug: 'EMPLOYEES:VIEW', description: 'View employee directory and details' },
    { module: 'EMPLOYEES', action: 'CREATE', slug: 'EMPLOYEES:CREATE', description: 'Onboard new company employees' },
    { module: 'EMPLOYEES', action: 'EDIT', slug: 'EMPLOYEES:EDIT', description: 'Update employee records' },
    { module: 'EMPLOYEES', action: 'DELETE', slug: 'EMPLOYEES:DELETE', description: 'Deactivate or remove employees' },

    // Users
    { module: 'USERS', action: 'VIEW', slug: 'USERS:VIEW', description: 'View user accounts and login histories' },
    { module: 'USERS', action: 'MANAGE', slug: 'USERS:MANAGE', description: 'Activate, lock or reset user accounts' },

    // Roles & Permissions
    { module: 'ROLES', action: 'VIEW', slug: 'ROLES:VIEW', description: 'View roles and their assigned permissions' },
    { module: 'ROLES', action: 'MANAGE', slug: 'ROLES:MANAGE', description: 'Create and update custom roles and permission mappings' },

    // Master Data
    { module: 'MASTER_DATA', action: 'VIEW', slug: 'MASTER_DATA:VIEW', description: 'View geographical and classification master data' },
    { module: 'MASTER_DATA', action: 'MANAGE', slug: 'MASTER_DATA:MANAGE', description: 'Add, edit, or deactivate master data items' },

    // Audit Logs
    { module: 'AUDIT_LOGS', action: 'VIEW', slug: 'AUDIT_LOGS:VIEW', description: 'Inspect system-wide change and audit history' },

    // Analytics & Market Intelligence
    { module: 'ANALYTICS', action: 'VIEW_GEO', slug: 'ANALYTICS:VIEW_GEO', description: 'View geographical sales and location analytics' },
    { module: 'ANALYTICS', action: 'VIEW_FINANCIAL', slug: 'ANALYTICS:VIEW_FINANCIAL', description: 'View financial analytics, margins, and profit breakdowns' },
    { module: 'ANALYTICS', action: 'VIEW_CUSTOMERS', slug: 'ANALYTICS:VIEW_CUSTOMERS', description: 'View customer distribution and conversion analytics' },
    { module: 'ANALYTICS', action: 'VIEW_PRODUCTS', slug: 'ANALYTICS:VIEW_PRODUCTS', description: 'View product demand and variant performance by geography' },
    { module: 'ANALYTICS', action: 'EXPORT', slug: 'ANALYTICS:EXPORT', description: 'Export geographic and financial analytics reports' },

    // Reports & Dashboard
    { module: 'REPORTS', action: 'VIEW', slug: 'REPORTS:VIEW', description: 'View business analytics and dashboard summaries' },
    { module: 'SETTINGS', action: 'MANAGE', slug: 'SETTINGS:MANAGE', description: 'Configure global system settings' },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: { description: perm.description },
      create: perm,
    });
  }

  // 2. SEED ROLES
  console.log('Seeding Roles...');
  const rolesData = [
    { name: 'Super Admin', slug: 'super-admin', description: 'Complete system authority with all permissions', isSystemRole: true },
    { name: 'Admin', slug: 'admin', description: 'Administrator with full management capabilities', isSystemRole: true },
    { name: 'Manager', slug: 'manager', description: 'Team and department manager with operational access', isSystemRole: false },
    { name: 'Employee', slug: 'employee', description: 'Standard internal employee with operational CRM access', isSystemRole: false },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesData) {
    const roleRecord = await prisma.role.upsert({
      where: { slug: r.slug },
      update: { description: r.description },
      create: r,
    });
    roleMap[r.slug] = roleRecord.id;
  }

  // 3. MAP ROLE PERMISSIONS
  console.log('Mapping Role Permissions...');
  const allPermissions = await prisma.permission.findMany();

  // Super Admin gets all permissions
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['super-admin'], permissionId: p.id } },
      update: {},
      create: { roleId: roleMap['super-admin'], permissionId: p.id },
    });
  }

  // Admin gets all except SETTINGS:MANAGE
  for (const p of allPermissions) {
    if (p.slug !== 'SETTINGS:MANAGE') {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleMap['admin'], permissionId: p.id } },
        update: {},
        create: { roleId: roleMap['admin'], permissionId: p.id },
      });
    }
  }

  // Manager permissions
  const managerSlugs = [
    'CUSTOMERS:VIEW', 'CUSTOMERS:CREATE', 'CUSTOMERS:EDIT', 'CUSTOMERS:IMPORT', 'CUSTOMERS:EXPORT',
    'EMPLOYEES:VIEW', 'REPORTS:VIEW', 'MASTER_DATA:VIEW',
    'ANALYTICS:VIEW_GEO', 'ANALYTICS:VIEW_FINANCIAL', 'ANALYTICS:VIEW_CUSTOMERS', 'ANALYTICS:VIEW_PRODUCTS', 'ANALYTICS:EXPORT'
  ];
  for (const p of allPermissions.filter(perm => managerSlugs.includes(perm.slug))) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['manager'], permissionId: p.id } },
      update: {},
      create: { roleId: roleMap['manager'], permissionId: p.id },
    });
  }

  // Employee permissions
  const employeeSlugs = ['CUSTOMERS:VIEW', 'CUSTOMERS:CREATE', 'CUSTOMERS:EDIT', 'REPORTS:VIEW'];
  for (const p of allPermissions.filter(perm => employeeSlugs.includes(perm.slug))) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['employee'], permissionId: p.id } },
      update: {},
      create: { roleId: roleMap['employee'], permissionId: p.id },
    });
  }

  // 4. SEED DEPARTMENTS & DESIGNATIONS
  console.log('Seeding Departments & Designations...');
  const departmentsData = [
    { name: 'Executive Management', code: 'EXEC', description: 'Company Executive Leadership' },
    { name: 'Sales & CRM', code: 'SALES', description: 'Sales and Customer Relationship Management' },
    { name: 'Operations & Logistics', code: 'OPS', description: 'Supply Chain, Fulfillment, and Logistics' },
    { name: 'Finance & Accounts', code: 'FIN', description: 'Financial Accounting and Invoicing' },
    { name: 'Human Resources', code: 'HR', description: 'Personnel and Talent Management' },
    { name: 'Information Technology', code: 'IT', description: 'Technical Infrastructure and Systems' },
  ];

  const deptMap: Record<string, string> = {};
  for (const dept of departmentsData) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description },
      create: dept,
    });
    deptMap[dept.code] = d.id;
  }

  const designationsData = [
    { title: 'Managing Director', code: 'MD', description: 'Executive Leadership' },
    { title: 'Operations Director', code: 'OPS_DIR', description: 'Director of Operations' },
    { title: 'Sales Manager', code: 'SALES_MGR', description: 'Head of Sales & CRM' },
    { title: 'Sales Executive', code: 'SALES_EXEC', description: 'Customer Accounts & Sales' },
    { title: 'Operations Lead', code: 'OPS_LEAD', description: 'Logistics Supervisor' },
    { title: 'Senior Accountant', code: 'SR_ACC', description: 'Accounts and GST Compliance' },
  ];

  const desigMap: Record<string, string> = {};
  for (const desig of designationsData) {
    const d = await prisma.designation.upsert({
      where: { code: desig.code },
      update: { title: desig.title, description: desig.description },
      create: desig,
    });
    desigMap[desig.code] = d.id;
  }

  // 5. SEED CUSTOMER TYPES & ADDRESS TYPES
  console.log('Seeding Customer & Address Types...');
  const customerTypesData = [
    { name: 'Individual', code: 'INDIVIDUAL', description: 'Direct Retail / End Consumer' },
    { name: 'Retailer', code: 'RETAILER', description: 'Retail Store Merchant' },
    { name: 'Distributor', code: 'DISTRIBUTOR', description: 'Regional Distribution Partner' },
    { name: 'Wholesaler', code: 'WHOLESALER', description: 'Wholesale Buyer' },
    { name: 'Corporate', code: 'CORPORATE', description: 'Corporate Client / Enterprise' },
    { name: 'Bulk Buyer', code: 'BULK_BUYER', description: 'Large Volume Seasonal Purchaser' },
  ];

  for (const ct of customerTypesData) {
    await prisma.customerType.upsert({
      where: { code: ct.code },
      update: { name: ct.name, description: ct.description },
      create: ct,
    });
  }

  const addressTypesData = [
    { name: 'Home', code: 'HOME', description: 'Residential Address' },
    { name: 'Office', code: 'OFFICE', description: 'Corporate Office / Headquarters' },
    { name: 'Delivery', code: 'DELIVERY', description: 'Shipping & Delivery Location' },
    { name: 'Billing', code: 'BILLING', description: 'Registered Invoicing & GST Address' },
    { name: 'Warehouse', code: 'WAREHOUSE', description: 'Fulfillment & Storage Depot' },
  ];

  for (const at of addressTypesData) {
    await prisma.addressType.upsert({
      where: { code: at.code },
      update: { name: at.name, description: at.description },
      create: at,
    });
  }

  // 6. SEED COUNTRIES & INDIAN STATES (WITH GST CODES)
  console.log('Seeding Country, Indian States & GST Codes...');
  const india = await prisma.country.upsert({
    where: { iso2: 'IN' },
    update: { name: 'India', iso3: 'IND', phoneCode: '+91' },
    create: {
      name: 'India',
      iso2: 'IN',
      iso3: 'IND',
      phoneCode: '+91',
    },
  });

  const indianStates = [
    { name: 'Jammu and Kashmir', code: 'JK', gstCode: '01' },
    { name: 'Himachal Pradesh', code: 'HP', gstCode: '02' },
    { name: 'Punjab', code: 'PB', gstCode: '03' },
    { name: 'Chandigarh', code: 'CH', gstCode: '04' },
    { name: 'Uttarakhand', code: 'UK', gstCode: '05' },
    { name: 'Haryana', code: 'HR', gstCode: '06' },
    { name: 'Delhi', code: 'DL', gstCode: '07' },
    { name: 'Rajasthan', code: 'RJ', gstCode: '08' },
    { name: 'Uttar Pradesh', code: 'UP', gstCode: '09' },
    { name: 'Bihar', code: 'BR', gstCode: '10' },
    { name: 'Sikkim', code: 'SK', gstCode: '11' },
    { name: 'Arunachal Pradesh', code: 'AR', gstCode: '12' },
    { name: 'Nagaland', code: 'NL', gstCode: '13' },
    { name: 'Manipur', code: 'MN', gstCode: '14' },
    { name: 'Mizoram', code: 'MZ', gstCode: '15' },
    { name: 'Tripura', code: 'TR', gstCode: '16' },
    { name: 'Meghalaya', code: 'ML', gstCode: '17' },
    { name: 'Assam', code: 'AS', gstCode: '18' },
    { name: 'West Bengal', code: 'WB', gstCode: '19' },
    { name: 'Jharkhand', code: 'JH', gstCode: '20' },
    { name: 'Odisha', code: 'OR', gstCode: '21' },
    { name: 'Chhattisgarh', code: 'CG', gstCode: '22' },
    { name: 'Madhya Pradesh', code: 'MP', gstCode: '23' },
    { name: 'Gujarat', code: 'GJ', gstCode: '24' },
    { name: 'Daman and Diu and Dadra and Nagar Haveli', code: 'DN', gstCode: '26' },
    { name: 'Maharashtra', code: 'MH', gstCode: '27' },
    { name: 'Andhra Pradesh', code: 'AP', gstCode: '37' },
    { name: 'Karnataka', code: 'KA', gstCode: '29' },
    { name: 'Goa', code: 'GA', gstCode: '30' },
    { name: 'Lakshadweep', code: 'LD', gstCode: '31' },
    { name: 'Kerala', code: 'KL', gstCode: '32' },
    { name: 'Tamil Nadu', code: 'TN', gstCode: '33' },
    { name: 'Puducherry', code: 'PY', gstCode: '34' },
    { name: 'Andaman and Nicobar Islands', code: 'AN', gstCode: '35' },
    { name: 'Telangana', code: 'TS', gstCode: '36' },
    { name: 'Ladakh', code: 'LA', gstCode: '38' },
  ];

  const stateMap: Record<string, string> = {};
  for (const state of indianStates) {
    const s = await prisma.state.upsert({
      where: { countryId_code: { countryId: india.id, code: state.code } },
      update: { name: state.name, gstCode: state.gstCode },
      create: {
        countryId: india.id,
        name: state.name,
        code: state.code,
        gstCode: state.gstCode,
      },
    });
    stateMap[state.code] = s.id;
  }

  // Key Metro Cities
  const keyCities = [
    { stateCode: 'DL', name: 'New Delhi' },
    { stateCode: 'HR', name: 'Gurugram' },
    { stateCode: 'UP', name: 'Noida' },
    { stateCode: 'UP', name: 'Lucknow' },
    { stateCode: 'UP', name: 'Kanpur' },
    { stateCode: 'UP', name: 'Varanasi' },
    { stateCode: 'MH', name: 'Mumbai' },
    { stateCode: 'MH', name: 'Pune' },
    { stateCode: 'MH', name: 'Nagpur' },
    { stateCode: 'MH', name: 'Nashik' },
    { stateCode: 'KA', name: 'Bengaluru' },
    { stateCode: 'KA', name: 'Mysuru' },
    { stateCode: 'TN', name: 'Chennai' },
    { stateCode: 'TN', name: 'Coimbatore' },
    { stateCode: 'TS', name: 'Hyderabad' },
    { stateCode: 'WB', name: 'Kolkata' },
    { stateCode: 'GJ', name: 'Ahmedabad' },
    { stateCode: 'GJ', name: 'Surat' },
    { stateCode: 'GJ', name: 'Vadodara' },
    { stateCode: 'RJ', name: 'Jaipur' },
    { stateCode: 'RJ', name: 'Jodhpur' },
    { stateCode: 'PB', name: 'Ludhiana' },
    { stateCode: 'PB', name: 'Amritsar' },
    { stateCode: 'CH', name: 'Chandigarh' },
    { stateCode: 'MP', name: 'Indore' },
    { stateCode: 'MP', name: 'Bhopal' },
    { stateCode: 'KL', name: 'Kochi' },
  ];

  const cityMap: Record<string, string> = {};
  for (const c of keyCities) {
    const sId = stateMap[c.stateCode];
    if (sId) {
      const city = await prisma.city.upsert({
        where: { stateId_name: { stateId: sId, name: c.name } },
        update: {},
        create: { stateId: sId, name: c.name },
      });
      cityMap[`${c.stateCode}_${c.name}`] = city.id;
    }
  }

  // 7. SEED SUPER ADMIN EMPLOYEE & USER
  console.log('Seeding Super Admin...');
  const adminEmail = 'admin@damira.com';
  const adminMobile = '+919876543210';
  const adminEmpCode = 'DAMIRA-EMP-001';

  let employee = await prisma.employee.findUnique({
    where: { employeeCode: adminEmpCode },
  });

  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        employeeCode: adminEmpCode,
        firstName: 'Gupta',
        lastName: 'Admin',
        email: adminEmail,
        mobile: adminMobile,
        gender: Gender.MALE,
        dateOfJoining: new Date('2024-01-01'),
        departmentId: deptMap['EXEC'],
        designationId: desigMap['MD'],
        status: EmployeeStatus.ACTIVE,
        notes: 'Founder & Super Administrator of DAMIRA by Gupta',
      },
    });
  }

  const hashedPassword = await argon2.hash('DamiraAdmin2026!');

  let user = await prisma.user.findUnique({
    where: { username: 'superadmin' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        employeeId: employee.id,
        username: 'superadmin',
        email: adminEmail,
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
      },
    });

    // Assign Super Admin role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: roleMap['super-admin'],
        assignedBy: 'SYSTEM_SEED',
      },
    });

    console.log('Super Admin user created successfully (username: superadmin / password: DamiraAdmin2026!)');
  }

  // 8. SEED SALES CHANNELS
  console.log('Seeding Sales Channels...');
  const salesChannelsData = [
    { name: 'Own Website', code: 'WEBSITE', description: 'DAMIRA Official Direct-to-Consumer Portal' },
    { name: 'Amazon India', code: 'AMAZON', description: 'Amazon Prime Marketplace Storefront' },
    { name: 'Flipkart', code: 'FLIPKART', description: 'Flipkart Brand Store' },
    { name: 'Instagram Direct', code: 'INSTAGRAM', description: 'Social Commerce & Direct Messaging' },
    { name: 'WhatsApp Commerce', code: 'WHATSAPP', description: 'WhatsApp Business Catalog & Conversational Sales' },
    { name: 'Offline / Retail', code: 'OFFLINE', description: 'Physical Boutique & Retail Outlets' },
    { name: 'Bulk / Corporate', code: 'BULK', description: 'B2B Gifting & Wholesale Consignments' },
  ];

  const channelMap: Record<string, string> = {};
  for (const sc of salesChannelsData) {
    const ch = await prisma.salesChannel.upsert({
      where: { code: sc.code },
      update: { name: sc.name, description: sc.description },
      create: sc,
    });
    channelMap[sc.code] = ch.id;
  }

  // 9. SEED PRODUCT CATEGORIES, PRODUCTS & VARIANTS
  console.log('Seeding Products & Variants...');
  const catSpices = await prisma.productCategory.upsert({
    where: { code: 'SPICES' },
    update: {},
    create: { name: 'Royal Spices & Saffron', code: 'SPICES', description: 'Pure Grade-A Kashmiri Spices & Saffron' },
  });

  const catDryFruits = await prisma.productCategory.upsert({
    where: { code: 'DRY_FRUITS' },
    update: {},
    create: { name: 'Dry Fruits & Gourmet Nuts', code: 'DRY_FRUITS', description: 'High-altitude Kashmiri Mamra Almonds & Walnuts' },
  });

  const catHoney = await prisma.productCategory.upsert({
    where: { code: 'HONEY_WELLNESS' },
    update: {},
    create: { name: 'Organic Honey & Wellness', code: 'HONEY_WELLNESS', description: 'Raw unprocessed forest honey & natural teas' },
  });

  // Product 1: Saffron
  const prodSaffron = await prisma.product.upsert({
    where: { sku: 'DAM-SAF-001' },
    update: {},
    create: {
      categoryId: catSpices.id,
      name: 'DAMIRA Royal Kashmiri Mongra Saffron',
      sku: 'DAM-SAF-001',
      hsnCode: '091020',
      description: 'GI Tagged 100% Pure Kashmiri Mongra Grade-A+ Saffron filaments',
      basePrice: 450,
      costPrice: 220,
    },
  });

  const varSaffron1g = await prisma.productVariant.upsert({
    where: { sku: 'DAM-SAF-1G' },
    update: {},
    create: {
      productId: prodSaffron.id,
      name: '1 Gram Glass Vial with Velvet Box',
      sku: 'DAM-SAF-1G',
      weightGrams: 1,
      mrp: 550,
      sellingPrice: 475,
      costPrice: 230,
      packagingCost: 45,
    },
  });

  const varSaffron5g = await prisma.productVariant.upsert({
    where: { sku: 'DAM-SAF-5G' },
    update: {},
    create: {
      productId: prodSaffron.id,
      name: '5 Gram Luxury Gift Chest',
      sku: 'DAM-SAF-5G',
      weightGrams: 5,
      mrp: 2600,
      sellingPrice: 2250,
      costPrice: 1100,
      packagingCost: 120,
    },
  });

  // Product 2: Mamra Almonds
  const prodAlmonds = await prisma.product.upsert({
    where: { sku: 'DAM-ALM-001' },
    update: {},
    create: {
      categoryId: catDryFruits.id,
      name: 'DAMIRA Kashmiri Mamra Giri Almonds',
      sku: 'DAM-ALM-001',
      hsnCode: '080212',
      description: 'Zero cholesterol high-oil organically cultivated Kashmiri Mamra almonds',
      basePrice: 1100,
      costPrice: 650,
    },
  });

  const varAlmonds500g = await prisma.productVariant.upsert({
    where: { sku: 'DAM-ALM-500G' },
    update: {},
    create: {
      productId: prodAlmonds.id,
      name: '500g Vacuum Foil Pouch',
      sku: 'DAM-ALM-500G',
      weightGrams: 500,
      mrp: 1800,
      sellingPrice: 1550,
      costPrice: 900,
      packagingCost: 55,
    },
  });

  const varAlmonds1kg = await prisma.productVariant.upsert({
    where: { sku: 'DAM-ALM-1KG' },
    update: {},
    create: {
      productId: prodAlmonds.id,
      name: '1kg Royal Tin Cannister',
      sku: 'DAM-ALM-1KG',
      weightGrams: 1000,
      mrp: 3500,
      sellingPrice: 2950,
      costPrice: 1750,
      packagingCost: 90,
    },
  });

  // Product 3: Walnuts
  const prodWalnut = await prisma.product.upsert({
    where: { sku: 'DAM-WAL-001' },
    update: {},
    create: {
      categoryId: catDryFruits.id,
      name: 'DAMIRA Extra-Light Snow Walnut Kernels',
      sku: 'DAM-WAL-001',
      hsnCode: '080232',
      description: 'Crisp, sweet, half-piece walnut kernels naturally harvested in Kashmir',
      basePrice: 750,
      costPrice: 420,
    },
  });

  const varWalnut500g = await prisma.productVariant.upsert({
    where: { sku: 'DAM-WAL-500G' },
    update: {},
    create: {
      productId: prodWalnut.id,
      name: '500g Fresh Pack',
      sku: 'DAM-WAL-500G',
      weightGrams: 500,
      mrp: 950,
      sellingPrice: 820,
      costPrice: 460,
      packagingCost: 40,
    },
  });

  // Product 4: Forest Honey
  const prodHoney = await prisma.product.upsert({
    where: { sku: 'DAM-HNY-001' },
    update: {},
    create: {
      categoryId: catHoney.id,
      name: 'DAMIRA Raw Acacia Forest Honey',
      sku: 'DAM-HNY-001',
      hsnCode: '040900',
      description: 'Unheated, unfiltered wild blossom acacia nectar honey',
      basePrice: 550,
      costPrice: 280,
    },
  });

  const varHoney500g = await prisma.productVariant.upsert({
    where: { sku: 'DAM-HNY-500G' },
    update: {},
    create: {
      productId: prodHoney.id,
      name: '500g Hexagonal Glass Jar',
      sku: 'DAM-HNY-500G',
      weightGrams: 500,
      mrp: 750,
      sellingPrice: 650,
      costPrice: 320,
      packagingCost: 50,
    },
  });

  const allVariants = [varSaffron1g, varSaffron5g, varAlmonds500g, varAlmonds1kg, varWalnut500g, varHoney500g];

  // 10. SEED SAMPLE CUSTOMERS & ADDRESSES ACROSS INDIA
  console.log('Seeding Customers and Addresses across India...');
  const customerTypes = await prisma.customerType.findMany();
  const indType = customerTypes.find((t) => t.code === 'INDIVIDUAL') || customerTypes[0];
  const retType = customerTypes.find((t) => t.code === 'RETAILER') || customerTypes[0];
  const corpType = customerTypes.find((t) => t.code === 'CORPORATE') || customerTypes[0];
  const bulkType = customerTypes.find((t) => t.code === 'BULK_BUYER') || customerTypes[0];

  const addressTypes = await prisma.addressType.findMany();
  const deliveryAddrType = addressTypes.find((a) => a.code === 'DELIVERY') || addressTypes[0];
  const homeAddrType = addressTypes.find((a) => a.code === 'HOME') || addressTypes[0];

  interface CustomerSeedDef {
    code: string;
    first: string;
    last: string;
    company?: string;
    email: string;
    mobile: string;
    typeId: string;
    stateCode: string;
    cityName: string;
    postalCode: string;
    locality: string;
  }

  const customersList: CustomerSeedDef[] = [
    // Maharashtra - Mumbai
    { code: 'DAM-CUST-101', first: 'Rajesh', last: 'Mehta', company: 'Mehta Organics', email: 'rajesh.m@gmail.com', mobile: '+919820011111', typeId: indType.id, stateCode: 'MH', cityName: 'Mumbai', postalCode: '400050', locality: 'Bandra West' },
    { code: 'DAM-CUST-102', first: 'Ananya', last: 'Deshmukh', email: 'ananya.d@gmail.com', mobile: '+919820022222', typeId: indType.id, stateCode: 'MH', cityName: 'Mumbai', postalCode: '400001', locality: 'Fort' },
    { code: 'DAM-CUST-103', first: 'Kunal', last: 'Shah', company: 'Shah Gourmet', email: 'kunal@shahgourmet.in', mobile: '+919820033333', typeId: retType.id, stateCode: 'MH', cityName: 'Mumbai', postalCode: '400053', locality: 'Andheri West' },
    { code: 'DAM-CUST-104', first: 'Pooja', last: 'Kulkarni', email: 'pooja.k@gmail.com', mobile: '+919820044444', typeId: indType.id, stateCode: 'MH', cityName: 'Pune', postalCode: '411004', locality: 'Deccan Gymkhana' },
    { code: 'DAM-CUST-105', first: 'Sameer', last: 'Joshi', company: 'Joshi Trading Co', email: 'sameer.j@gmail.com', mobile: '+919820055555', typeId: corpType.id, stateCode: 'MH', cityName: 'Pune', postalCode: '411038', locality: 'Kothrud' },
    { code: 'DAM-CUST-106', first: 'Nikhil', last: 'Patil', email: 'nikhil.p@gmail.com', mobile: '+919820066666', typeId: indType.id, stateCode: 'MH', cityName: 'Nagpur', postalCode: '440010', locality: 'Dharampeth' },

    // Delhi NCR
    { code: 'DAM-CUST-107', first: 'Vikram', last: 'Malhotra', company: 'Malhotra Luxe Gifts', email: 'vikram.m@gmail.com', mobile: '+919810011111', typeId: corpType.id, stateCode: 'DL', cityName: 'New Delhi', postalCode: '110001', locality: 'Connaught Place' },
    { code: 'DAM-CUST-108', first: 'Rhea', last: 'Kapoor', email: 'rhea.k@gmail.com', mobile: '+919810022222', typeId: indType.id, stateCode: 'DL', cityName: 'New Delhi', postalCode: '110017', locality: 'Malviya Nagar' },
    { code: 'DAM-CUST-109', first: 'Aditya', last: 'Bhasin', email: 'aditya.b@gmail.com', mobile: '+919810033333', typeId: indType.id, stateCode: 'DL', cityName: 'New Delhi', postalCode: '110024', locality: 'Lajpat Nagar' },
    { code: 'DAM-CUST-110', first: 'Shweta', last: 'Gupta', company: 'DLF Gifting', email: 'shweta.g@gmail.com', mobile: '+919810044444', typeId: bulkType.id, stateCode: 'HR', cityName: 'Gurugram', postalCode: '122002', locality: 'Golf Course Road' },
    { code: 'DAM-CUST-111', first: 'Rohan', last: 'Sharma', email: 'rohan.s@gmail.com', mobile: '+919810055555', typeId: indType.id, stateCode: 'UP', cityName: 'Noida', postalCode: '201301', locality: 'Sector 18' },

    // Karnataka - Bengaluru
    { code: 'DAM-CUST-112', first: 'Arjun', last: 'Rao', company: 'Indiranagar Club', email: 'arjun.r@gmail.com', mobile: '+919845011111', typeId: indType.id, stateCode: 'KA', cityName: 'Bengaluru', postalCode: '560038', locality: 'Indiranagar' },
    { code: 'DAM-CUST-113', first: 'Deepa', last: 'Nair', email: 'deepa.n@gmail.com', mobile: '+919845022222', typeId: indType.id, stateCode: 'KA', cityName: 'Bengaluru', postalCode: '560034', locality: 'Koramangala' },
    { code: 'DAM-CUST-114', first: 'Siddharth', last: 'Menon', company: 'TechPark Pantry', email: 'siddharth.m@gmail.com', mobile: '+919845033333', typeId: retType.id, stateCode: 'KA', cityName: 'Bengaluru', postalCode: '560102', locality: 'HSR Layout' },
    { code: 'DAM-CUST-115', first: 'Lakshmi', last: 'Prasad', email: 'lakshmi.p@gmail.com', mobile: '+919845044444', typeId: indType.id, stateCode: 'KA', cityName: 'Mysuru', postalCode: '570001', locality: 'Devaraja Market' },

    // Uttar Pradesh - Lucknow, Kanpur
    { code: 'DAM-CUST-116', first: 'Amitabh', last: 'Srivastava', company: 'Awadh Sweets & Spices', email: 'amitabh.s@gmail.com', mobile: '+919415011111', typeId: retType.id, stateCode: 'UP', cityName: 'Lucknow', postalCode: '226001', locality: 'Hazratganj' },
    { code: 'DAM-CUST-117', first: 'Rashmi', last: 'Verma', email: 'rashmi.v@gmail.com', mobile: '+919415022222', typeId: indType.id, stateCode: 'UP', cityName: 'Lucknow', postalCode: '226010', locality: 'Gomti Nagar' },
    { code: 'DAM-CUST-118', first: 'Mohit', last: 'Agarwal', email: 'mohit.a@gmail.com', mobile: '+919415033333', typeId: indType.id, stateCode: 'UP', cityName: 'Kanpur', postalCode: '208001', locality: 'Civil Lines' },
    { code: 'DAM-CUST-119', first: 'Sanjay', last: 'Pandey', email: 'sanjay.p@gmail.com', mobile: '+919415044444', typeId: indType.id, stateCode: 'UP', cityName: 'Varanasi', postalCode: '221002', locality: 'Cantonment' },

    // Gujarat - Ahmedabad, Surat
    { code: 'DAM-CUST-120', first: 'Chirag', last: 'Patel', company: 'Patel Brothers Trade', email: 'chirag.p@gmail.com', mobile: '+919898011111', typeId: bulkType.id, stateCode: 'GJ', cityName: 'Ahmedabad', postalCode: '380015', locality: 'Bodakdev' },
    { code: 'DAM-CUST-121', first: 'Bhavna', last: 'Shah', email: 'bhavna.s@gmail.com', mobile: '+919898022222', typeId: indType.id, stateCode: 'GJ', cityName: 'Ahmedabad', postalCode: '380009', locality: 'Navrangpura' },
    { code: 'DAM-CUST-122', first: 'Hardik', last: 'Gajjar', company: 'Diamond City Provisions', email: 'hardik.g@gmail.com', mobile: '+919898033333', typeId: retType.id, stateCode: 'GJ', cityName: 'Surat', postalCode: '395007', locality: 'Vesu' },

    // Telangana & Tamil Nadu
    { code: 'DAM-CUST-123', first: 'Kavita', last: 'Reddy', email: 'kavita.r@gmail.com', mobile: '+919848011111', typeId: indType.id, stateCode: 'TS', cityName: 'Hyderabad', postalCode: '500034', locality: 'Banjara Hills' },
    { code: 'DAM-CUST-124', first: 'Prashanth', last: 'Kumar', company: 'Cyber Towers Mart', email: 'prashanth.k@gmail.com', mobile: '+919848022222', typeId: retType.id, stateCode: 'TS', cityName: 'Hyderabad', postalCode: '500081', locality: 'Madhapur' },
    { code: 'DAM-CUST-125', first: 'Suresh', last: 'Subramanian', email: 'suresh.s@gmail.com', mobile: '+919840011111', typeId: indType.id, stateCode: 'TN', cityName: 'Chennai', postalCode: '600028', locality: 'R.A. Puram' },
    { code: 'DAM-CUST-126', first: 'Meenakshi', last: 'Sundaram', email: 'meenakshi.s@gmail.com', mobile: '+919840022222', typeId: indType.id, stateCode: 'TN', cityName: 'Coimbatore', postalCode: '641002', locality: 'RS Puram' },

    // Rajasthan & West Bengal
    { code: 'DAM-CUST-127', first: 'Yuvraj', last: 'Singh', email: 'yuvraj.s@gmail.com', mobile: '+919829011111', typeId: indType.id, stateCode: 'RJ', cityName: 'Jaipur', postalCode: '302001', locality: 'C-Scheme' },
    { code: 'DAM-CUST-128', first: 'Debashis', last: 'Mukherjee', email: 'debashis.m@gmail.com', mobile: '+919830011111', typeId: indType.id, stateCode: 'WB', cityName: 'Kolkata', postalCode: '700016', locality: 'Park Street' },
    { code: 'DAM-CUST-129', first: 'Harpreet', last: 'Kaur', email: 'harpreet.k@gmail.com', mobile: '+919872011111', typeId: indType.id, stateCode: 'PB', cityName: 'Ludhiana', postalCode: '141001', locality: 'Model Town' },
  ];

  const seededCustomerAddresses: { customerId: string; addressId: string; cityId: string; stateId: string; postalCode: string }[] = [];

  for (const c of customersList) {
    const sId = stateMap[c.stateCode];
    const cId = cityMap[`${c.stateCode}_${c.cityName}`];
    if (!sId || !cId) continue;

    const existingCust = await prisma.customer.findUnique({ where: { customerCode: c.code } });
    let custId = existingCust?.id;

    if (!existingCust) {
      const cust = await prisma.customer.create({
        data: {
          customerCode: c.code,
          customerTypeId: c.typeId,
          firstName: c.first,
          lastName: c.last,
          companyName: c.company,
          email: c.email,
          mobile: c.mobile,
          source: 'ORGANIC_INBOUND',
          status: 'ACTIVE',
        },
      });
      custId = cust.id;
    }

    if (custId) {
      let addr = await prisma.customerAddress.findFirst({
        where: { customerId: custId, isDefaultShipping: true },
      });

      if (!addr) {
        addr = await prisma.customerAddress.create({
          data: {
            customerId: custId,
            addressTypeId: deliveryAddrType.id,
            addressLabel: 'Primary Delivery Location',
            contactPersonName: `${c.first} ${c.last}`,
            contactMobile: c.mobile,
            addressLine1: `${c.locality}, Main Road`,
            countryId: india.id,
            stateId: sId,
            cityId: cId,
            district: c.cityName,
            postalCode: c.postalCode,
            isDefaultBilling: true,
            isDefaultShipping: true,
          },
        });
      }

      seededCustomerAddresses.push({
        customerId: custId,
        addressId: addr.id,
        cityId: cId,
        stateId: sId,
        postalCode: c.postalCode,
      });
    }
  }

  // 11. SEED REALISTIC ORDERS WITH ITEMS ACROSS TIME & GEOGRAPHY
  console.log('Seeding Orders & Geographic Sales Items...');
  const orderCount = await prisma.order.count();
  if (orderCount === 0) {
    const channelKeys = ['WEBSITE', 'AMAZON', 'FLIPKART', 'INSTAGRAM', 'WHATSAPP', 'OFFLINE', 'BULK'];
    let orderIndex = 1;

    // Generate ~65 orders spread across the seeded customers over past 8 months
    // Creating realistic patterns:
    // Mumbai, Delhi, Bengaluru have many repeat orders (high demand & high loyalty)
    // Lucknow, Jaipur have customers but fewer orders (high potential / untransacted)
    // Ahmedabad / Surat have surging recent orders
    const now = new Date();

    for (let i = 0; i < seededCustomerAddresses.length; i++) {
      const custAddr = seededCustomerAddresses[i];
      // Determine how many orders this customer makes:
      // Index 0-5 (Mumbai, Pune) -> 3-4 orders
      // Index 6-9 (Delhi NCR) -> 2-3 orders
      // Index 11-13 (Bengaluru) -> 4 orders (high repeat)
      // Index 15-18 (UP: Lucknow, Kanpur) -> 0 to 1 order (high customer, low order)
      // Index 19-21 (Gujarat) -> 2-3 orders
      // Others -> 1 order
      let numOrders = 1;
      if (i <= 5) numOrders = (i % 2 === 0) ? 3 : 2;
      else if (i >= 6 && i <= 9) numOrders = 3;
      else if (i >= 11 && i <= 13) numOrders = 4;
      else if (i >= 15 && i <= 18) numOrders = (i === 15) ? 1 : 0; // high customer low order
      else if (i >= 19 && i <= 21) numOrders = 3;

      for (let o = 0; o < numOrders; o++) {
        const orderNum = `DAM-2024-${String(orderIndex++).padStart(4, '0')}`;
        const chCode = channelKeys[(i + o) % channelKeys.length];
        const channelId = channelMap[chCode] || channelMap['WEBSITE'];

        // Stagger dates: from 200 days ago to 2 days ago
        const daysAgo = Math.floor(Math.random() * 210) + 2;
        const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        // Pick 1 to 3 items
        const v1 = allVariants[(i + o) % allVariants.length];
        const v2 = allVariants[(i + o + 2) % allVariants.length];
        const q1 = (chCode === 'BULK') ? 8 : (o === 0 ? 1 : 2);
        const q2 = (chCode === 'BULK') ? 5 : 1;

        const item1Gross = v1.sellingPrice * q1;
        const item1Cost = v1.costPrice * q1;
        const item2Gross = v2.sellingPrice * q2;
        const item2Cost = v2.costPrice * q2;

        const grossAmount = item1Gross + item2Gross;
        const productCost = item1Cost + item2Cost;
        const discountAmount = Math.round(grossAmount * 0.05); // 5% standard discount
        const shippingCost = (grossAmount > 3000) ? 0 : 120;
        const packagingCost = (v1.packagingCost * q1) + (v2.packagingCost * q2);
        const allocatedCost = Math.round(grossAmount * 0.03); // 3% payment gateway / channel fee
        
        // 90% DELIVERED, 5% SHIPPED, 3% RETURNED, 2% CANCELLED
        let status: any = 'DELIVERED';
        let refundAmount = 0;
        if (orderIndex % 25 === 0) {
          status = 'CANCELLED';
        } else if (orderIndex % 18 === 0) {
          status = 'RETURNED';
          refundAmount = grossAmount - discountAmount;
        } else if (daysAgo < 5) {
          status = 'SHIPPED';
        }

        const netAmount = (status === 'CANCELLED') ? 0 : (grossAmount - discountAmount - refundAmount);
        const grossProfit = (status === 'CANCELLED' || status === 'RETURNED')
          ? 0
          : Math.max(0, netAmount - productCost - packagingCost - shippingCost - allocatedCost);
        const profitMarginPct = (netAmount > 0) ? Math.round((grossProfit / netAmount) * 1000) / 10 : 0;

        const order = await prisma.order.create({
          data: {
            orderNumber: orderNum,
            customerId: custAddr.customerId,
            deliveryAddressId: custAddr.addressId,
            billingAddressId: custAddr.addressId,
            channelId: channelId,
            status: status,
            orderDate: orderDate,
            grossAmount: grossAmount,
            discountAmount: discountAmount,
            refundAmount: refundAmount,
            netAmount: netAmount,
            shippingCost: shippingCost,
            packagingCost: packagingCost,
            allocatedCost: allocatedCost,
            productCost: productCost,
            grossProfit: grossProfit,
            profitMarginPct: profitMarginPct,
            totalUnits: q1 + q2,
            notes: `Seeded order through ${chCode}`,
          },
        });

        // Create order items
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            variantId: v1.id,
            quantity: q1,
            unitPrice: v1.sellingPrice,
            unitCost: v1.costPrice,
            totalPrice: item1Gross,
            totalCost: item1Cost,
            discount: Math.round(item1Gross * 0.05),
            netPrice: item1Gross - Math.round(item1Gross * 0.05),
          },
        });

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            variantId: v2.id,
            quantity: q2,
            unitPrice: v2.sellingPrice,
            unitCost: v2.costPrice,
            totalPrice: item2Gross,
            totalCost: item2Cost,
            discount: Math.round(item2Gross * 0.05),
            netPrice: item2Gross - Math.round(item2Gross * 0.05),
          },
        });
      }
    }
    console.log(`Seeded ${orderIndex - 1} orders across Indian states and cities.`);
  }

  console.log('--- DAMIRA DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
