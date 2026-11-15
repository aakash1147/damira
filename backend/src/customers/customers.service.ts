import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../database/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  QueryCustomerDto,
  CreateCustomerAddressDto,
} from './dto/create-customer.dto';
import { createPaginatedResponse } from '../common/pagination/pagination.dto';
import { CustomerStatus } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateCustomerDto, userId?: string) {
    // 1. Generate or validate customer code
    let code = dto.customerCode?.trim().toUpperCase();
    if (!code) {
      const count = await this.prisma.customer.count();
      code = `DAMIRA-CUST-${(count + 1001).toString()}`;
    }

    const existingCode = await this.prisma.customer.findUnique({
      where: { customerCode: code },
    });
    if (existingCode) {
      throw new ConflictException(`Customer code '${code}' is already registered.`);
    }

    // 2. Validate customer type exists
    const customerType = await this.prisma.customerType.findUnique({
      where: { id: dto.customerTypeId },
    });
    if (!customerType) {
      throw new BadRequestException('Selected customer type is invalid.');
    }

    // 3. Atomic transaction to create customer and initial address
    const customer = await this.prisma.$transaction(async (tx) => {
      const cust = await tx.customer.create({
        data: {
          customerCode: code,
          customerTypeId: dto.customerTypeId,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          companyName: dto.companyName ? dto.companyName.trim() : null,
          email: dto.email ? dto.email.trim().toLowerCase() : null,
          mobile: dto.mobile.trim(),
          altMobile: dto.altMobile ? dto.altMobile.trim() : null,
          gstin: dto.gstin ? dto.gstin.trim().toUpperCase() : null,
          pan: dto.pan ? dto.pan.trim().toUpperCase() : null,
          dob: dto.dob ? new Date(dto.dob) : null,
          gender: dto.gender || null,
          source: dto.source || null,
          status: dto.status || CustomerStatus.ACTIVE,
          notes: dto.notes || null,
          createdById: userId || null,
          updatedById: userId || null,
        },
      });

      if (dto.initialAddress) {
        await tx.customerAddress.create({
          data: {
            customerId: cust.id,
            addressTypeId: dto.initialAddress.addressTypeId,
            addressLabel: dto.initialAddress.addressLabel.trim(),
            contactPersonName: dto.initialAddress.contactPersonName || `${cust.firstName} ${cust.lastName}`,
            contactMobile: dto.initialAddress.contactMobile || cust.mobile,
            addressLine1: dto.initialAddress.addressLine1.trim(),
            addressLine2: dto.initialAddress.addressLine2 ? dto.initialAddress.addressLine2.trim() : null,
            landmark: dto.initialAddress.landmark ? dto.initialAddress.landmark.trim() : null,
            countryId: dto.initialAddress.countryId,
            stateId: dto.initialAddress.stateId,
            cityId: dto.initialAddress.cityId,
            district: dto.initialAddress.district || null,
            postalCode: dto.initialAddress.postalCode.trim(),
            isDefaultBilling: dto.initialAddress.isDefaultBilling !== undefined ? dto.initialAddress.isDefaultBilling : true,
            isDefaultShipping: dto.initialAddress.isDefaultShipping !== undefined ? dto.initialAddress.isDefaultShipping : true,
          },
        });
      }

      return cust;
    });

    await this.auditLogsService.log({
      userId,
      action: 'CREATE',
      module: 'CUSTOMERS',
      recordId: customer.id,
      newValues: dto,
    });

    return this.findById(customer.id);
  }

  async findAll(query: Partial<QueryCustomerDto>) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { search, customerTypeId, status, stateId, cityId, fromDate, toDate, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (customerTypeId) where.customerTypeId = customerTypeId;
    if (status) where.status = status;

    if (stateId || cityId) {
      where.addresses = {
        some: {
          isDeleted: false,
          ...(stateId ? { stateId } : {}),
          ...(cityId ? { cityId } : {}),
        },
      };
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { customerCode: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { companyName: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
        { gstin: { contains: search } },
        { pan: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sortBy && ['customerCode', 'firstName', 'lastName', 'createdAt', 'status'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customerType: { select: { id: true, name: true, code: true } },
          addresses: {
            where: { isDeleted: false },
            include: {
              state: { select: { name: true, code: true } },
              city: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const formatted = customers.map((c) => {
      // Find default or first primary address for table display
      const defaultAddr = c.addresses.find((a) => a.isDefaultBilling) || c.addresses[0];
      return {
        id: c.id,
        customerCode: c.customerCode,
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: `${c.firstName} ${c.lastName}`,
        companyName: c.companyName,
        customerType: c.customerType.name,
        customerTypeCode: c.customerType.code,
        email: c.email,
        mobile: c.mobile,
        gstin: c.gstin,
        pan: c.pan,
        status: c.status,
        city: defaultAddr?.city?.name || '-',
        state: defaultAddr?.state?.name || '-',
        totalAddresses: c.addresses.length,
        createdAt: c.createdAt,
      };
    });

    return createPaginatedResponse(formatted, total, page, limit);
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        customerType: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        addresses: {
          where: { isDeleted: false },
          orderBy: [
            { isDefaultBilling: 'desc' },
            { isDefaultShipping: 'desc' },
            { createdAt: 'desc' },
          ],
          include: {
            addressType: true,
            country: { select: { id: true, name: true, iso2: true } },
            state: { select: { id: true, name: true, code: true, gstCode: true } },
            city: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!customer || customer.isDeleted) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, userId?: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.isDeleted) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        customerTypeId: dto.customerTypeId || undefined,
        firstName: dto.firstName !== undefined ? dto.firstName.trim() : undefined,
        lastName: dto.lastName !== undefined ? dto.lastName.trim() : undefined,
        companyName: dto.companyName !== undefined ? dto.companyName?.trim() : undefined,
        email: dto.email !== undefined ? dto.email?.trim().toLowerCase() : undefined,
        mobile: dto.mobile !== undefined ? dto.mobile.trim() : undefined,
        altMobile: dto.altMobile !== undefined ? dto.altMobile?.trim() : undefined,
        gstin: dto.gstin !== undefined ? dto.gstin?.trim().toUpperCase() : undefined,
        pan: dto.pan !== undefined ? dto.pan?.trim().toUpperCase() : undefined,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        gender: dto.gender !== undefined ? dto.gender : undefined,
        source: dto.source !== undefined ? dto.source : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        updatedById: userId || null,
      },
    });

    await this.auditLogsService.log({
      userId,
      action: 'UPDATE',
      module: 'CUSTOMERS',
      recordId: id,
      oldValues: customer,
      newValues: dto,
    });

    return this.findById(id);
  }

  async softDelete(id: string, userId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });
    if (!customer || customer.isDeleted) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: {
          isDeleted: true,
          status: CustomerStatus.ARCHIVED,
          updatedById: userId || null,
        },
      });

      // Soft delete addresses as well
      await tx.customerAddress.updateMany({
        where: { customerId: id },
        data: { isDeleted: true },
      });
    });

    await this.auditLogsService.log({
      userId,
      action: 'DELETE',
      module: 'CUSTOMERS',
      recordId: id,
    });

    return { message: `Customer '${customer.customerCode}' archived successfully.` };
  }

  // -----------------------------------------------------------
  // MULTIPLE CUSTOMER ADDRESS MANAGEMENT
  // -----------------------------------------------------------

  async addAddress(customerId: string, dto: CreateCustomerAddressDto, userId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId, isDeleted: false },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    const address = await this.prisma.$transaction(async (tx) => {
      // Unset previous defaults if new address is default
      if (dto.isDefaultBilling) {
        await tx.customerAddress.updateMany({
          where: { customerId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }
      if (dto.isDefaultShipping) {
        await tx.customerAddress.updateMany({
          where: { customerId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }

      return tx.customerAddress.create({
        data: {
          customerId,
          addressTypeId: dto.addressTypeId,
          addressLabel: dto.addressLabel.trim(),
          contactPersonName: dto.contactPersonName || `${customer.firstName} ${customer.lastName}`,
          contactMobile: dto.contactMobile || customer.mobile,
          addressLine1: dto.addressLine1.trim(),
          addressLine2: dto.addressLine2 ? dto.addressLine2.trim() : null,
          landmark: dto.landmark ? dto.landmark.trim() : null,
          countryId: dto.countryId,
          stateId: dto.stateId,
          cityId: dto.cityId,
          district: dto.district || null,
          postalCode: dto.postalCode.trim(),
          isDefaultBilling: !!dto.isDefaultBilling,
          isDefaultShipping: !!dto.isDefaultShipping,
        },
        include: {
          addressType: true,
          country: true,
          state: true,
          city: true,
        },
      });
    });

    await this.auditLogsService.log({
      userId,
      action: 'ADD_ADDRESS',
      module: 'CUSTOMERS',
      recordId: customerId,
      newValues: { addressId: address.id, label: address.addressLabel },
    });

    return address;
  }

  async updateAddress(
    customerId: string,
    addressId: string,
    dto: Partial<CreateCustomerAddressDto>,
    userId?: string,
  ) {
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId, isDeleted: false },
    });
    if (!address) {
      throw new NotFoundException(`Address not found.`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefaultBilling) {
        await tx.customerAddress.updateMany({
          where: { customerId, id: { not: addressId }, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }
      if (dto.isDefaultShipping) {
        await tx.customerAddress.updateMany({
          where: { customerId, id: { not: addressId }, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }

      return tx.customerAddress.update({
        where: { id: addressId },
        data: {
          addressTypeId: dto.addressTypeId || undefined,
          addressLabel: dto.addressLabel !== undefined ? dto.addressLabel.trim() : undefined,
          contactPersonName: dto.contactPersonName !== undefined ? dto.contactPersonName : undefined,
          contactMobile: dto.contactMobile !== undefined ? dto.contactMobile : undefined,
          addressLine1: dto.addressLine1 !== undefined ? dto.addressLine1.trim() : undefined,
          addressLine2: dto.addressLine2 !== undefined ? dto.addressLine2 : undefined,
          landmark: dto.landmark !== undefined ? dto.landmark : undefined,
          countryId: dto.countryId || undefined,
          stateId: dto.stateId || undefined,
          cityId: dto.cityId || undefined,
          district: dto.district !== undefined ? dto.district : undefined,
          postalCode: dto.postalCode !== undefined ? dto.postalCode.trim() : undefined,
          isDefaultBilling: dto.isDefaultBilling !== undefined ? dto.isDefaultBilling : undefined,
          isDefaultShipping: dto.isDefaultShipping !== undefined ? dto.isDefaultShipping : undefined,
        },
        include: {
          addressType: true,
          country: true,
          state: true,
          city: true,
        },
      });
    });

    await this.auditLogsService.log({
      userId,
      action: 'UPDATE_ADDRESS',
      module: 'CUSTOMERS',
      recordId: customerId,
      oldValues: address,
      newValues: dto,
    });

    return updated;
  }

  async setDefaultBilling(customerId: string, addressId: string, userId?: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: { customerId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
      await tx.customerAddress.update({
        where: { id: addressId },
        data: { isDefaultBilling: true },
      });
    });

    await this.auditLogsService.log({
      userId,
      action: 'SET_DEFAULT_BILLING',
      module: 'CUSTOMERS',
      recordId: customerId,
      newValues: { defaultBillingAddressId: addressId },
    });

    return { message: 'Default billing address updated.' };
  }

  async setDefaultShipping(customerId: string, addressId: string, userId?: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: { customerId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
      await tx.customerAddress.update({
        where: { id: addressId },
        data: { isDefaultShipping: true },
      });
    });

    await this.auditLogsService.log({
      userId,
      action: 'SET_DEFAULT_SHIPPING',
      module: 'CUSTOMERS',
      recordId: customerId,
      newValues: { defaultShippingAddressId: addressId },
    });

    return { message: 'Default shipping address updated.' };
  }

  async deleteAddress(customerId: string, addressId: string, userId?: string) {
    await this.prisma.customerAddress.update({
      where: { id: addressId },
      data: { isDeleted: true },
    });

    await this.auditLogsService.log({
      userId,
      action: 'DELETE_ADDRESS',
      module: 'CUSTOMERS',
      recordId: customerId,
      newValues: { deletedAddressId: addressId },
    });

    return { message: 'Address removed successfully.' };
  }

  // -----------------------------------------------------------
  // EXPORT TO EXCEL & CSV
  // -----------------------------------------------------------

  async exportToExcel(query: QueryCustomerDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DAMIRA by Gupta';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('DAMIRA Customers', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Customer Code', key: 'code', width: 20 },
      { header: 'First Name', key: 'firstName', width: 16 },
      { header: 'Last Name', key: 'lastName', width: 16 },
      { header: 'Company Name', key: 'company', width: 30 },
      { header: 'Customer Type', key: 'type', width: 18 },
      { header: 'Email Address', key: 'email', width: 28 },
      { header: 'Mobile Number', key: 'mobile', width: 18 },
      { header: 'GSTIN', key: 'gstin', width: 20 },
      { header: 'PAN', key: 'pan', width: 15 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'State', key: 'state', width: 20 },
      { header: 'PIN Code', key: 'pincode', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Created Date', key: 'createdAt', width: 16 },
    ];

    // Style Header Row: Royal Purple
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5B21B6' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Fetch all customers matching query
    const res = await this.findAll({ ...query, page: 1, limit: 10000 });

    for (const c of res.data) {
      sheet.addRow({
        code: c.customerCode,
        firstName: c.firstName,
        lastName: c.lastName,
        company: c.companyName || '-',
        type: c.customerType,
        email: c.email || '-',
        mobile: c.mobile,
        gstin: c.gstin || '-',
        pan: c.pan || '-',
        city: c.city,
        state: c.state,
        pincode: '-',
        status: c.status,
        createdAt: new Date(c.createdAt).toLocaleDateString(),
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async exportToCsv(query: QueryCustomerDto): Promise<string> {
    const res = await this.findAll({ ...query, page: 1, limit: 10000 });
    const headers = [
      'Customer Code',
      'First Name',
      'Last Name',
      'Company Name',
      'Customer Type',
      'Email',
      'Mobile',
      'GSTIN',
      'PAN',
      'City',
      'State',
      'Status',
      'Created Date',
    ];

    const rows = res.data.map((c) =>
      [
        `"${c.customerCode}"`,
        `"${c.firstName}"`,
        `"${c.lastName}"`,
        `"${c.companyName || ''}"`,
        `"${c.customerType}"`,
        `"${c.email || ''}"`,
        `"${c.mobile}"`,
        `"${c.gstin || ''}"`,
        `"${c.pan || ''}"`,
        `"${c.city}"`,
        `"${c.state}"`,
        `"${c.status}"`,
        `"${new Date(c.createdAt).toISOString()}"`,
      ].join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
