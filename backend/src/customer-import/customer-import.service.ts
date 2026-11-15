import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { PrismaService } from '../database/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DuplicateStrategy, ImportStatus, CustomerStatus } from '@prisma/client';

export interface ParsedCustomerRow {
  rowNumber: number;
  customerCode?: string;
  customerType: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email?: string;
  mobile: string;
  altMobile?: string;
  gstin?: string;
  pan?: string;
  gender?: string;
  source?: string;
  notes?: string;
  // Address Fields
  addressLabel?: string;
  addressType?: string;
  addressLine1?: string;
  addressLine2?: string;
  stateCodeOrName?: string;
  cityName?: string;
  postalCode?: string;
  // Validation Results
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class CustomerImportService {
  private readonly logger = new Logger(CustomerImportService.name);

  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  // 1. GENERATE SAMPLE IMPORT TEMPLATE (EXCEL)
  async generateSampleTemplate(format: 'xlsx' | 'csv'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DAMIRA by Gupta';
    const sheet = workbook.addWorksheet('Customer Import Template', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Customer Code (Optional)', key: 'customerCode', width: 22 },
      { header: 'Customer Type *', key: 'customerType', width: 20 },
      { header: 'First Name *', key: 'firstName', width: 18 },
      { header: 'Last Name *', key: 'lastName', width: 18 },
      { header: 'Company Name', key: 'companyName', width: 28 },
      { header: 'Email Address', key: 'email', width: 26 },
      { header: 'Mobile Number *', key: 'mobile', width: 18 },
      { header: 'Alternate Mobile', key: 'altMobile', width: 18 },
      { header: 'GSTIN', key: 'gstin', width: 20 },
      { header: 'PAN', key: 'pan', width: 16 },
      { header: 'Gender (MALE/FEMALE/OTHER)', key: 'gender', width: 18 },
      { header: 'Source', key: 'source', width: 16 },
      { header: 'Notes', key: 'notes', width: 25 },
      { header: 'Address Label (e.g. Office)', key: 'addressLabel', width: 22 },
      { header: 'Address Type (e.g. Billing)', key: 'addressType', width: 22 },
      { header: 'Address Line 1 *', key: 'addressLine1', width: 30 },
      { header: 'Address Line 2', key: 'addressLine2', width: 24 },
      { header: 'State Code or Name *', key: 'state', width: 22 },
      { header: 'City Name *', key: 'city', width: 20 },
      { header: 'PIN Code *', key: 'postalCode', width: 14 },
    ];

    // Style Header
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5B21B6' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Sample Row
    sheet.addRow({
      customerCode: 'DAMIRA-CUST-9001',
      customerType: 'Wholesaler',
      firstName: 'Vikram',
      lastName: 'Malhotra',
      companyName: 'Malhotra Spices & Commodities',
      email: 'vikram@malhotraspices.com',
      mobile: '+919876543210',
      altMobile: '+919876543219',
      gstin: '07AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      gender: 'MALE',
      source: 'Trade Fair',
      notes: 'Key bulk wholesaler for Northern region',
      addressLabel: 'Central Wholesale Depot',
      addressType: 'Warehouse',
      addressLine1: 'Khari Baoli, Chandni Chowk',
      addressLine2: 'Shop 104, Second Floor',
      state: 'Delhi',
      city: 'New Delhi',
      postalCode: '110006',
    });

    if (format === 'csv') {
      return Buffer.from(await workbook.csv.writeBuffer());
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // 2. PARSE AND VALIDATE UPLOADED FILE
  async parseAndValidate(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<{ rows: ParsedCustomerRow[]; totalRows: number; validCount: number; errorCount: number }> {
    let rawRows: any[] = [];
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as any);
      const sheet = workbook.worksheets[0];

      if (!sheet) {
        throw new BadRequestException('Uploaded spreadsheet contains no worksheets.');
      }

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        const values = row.values as any[];
        rawRows.push({
          rowNumber,
          customerCode: values[1]?.toString()?.trim(),
          customerType: values[2]?.toString()?.trim(),
          firstName: values[3]?.toString()?.trim(),
          lastName: values[4]?.toString()?.trim(),
          companyName: values[5]?.toString()?.trim(),
          email: values[6]?.toString()?.trim(),
          mobile: values[7]?.toString()?.trim(),
          altMobile: values[8]?.toString()?.trim(),
          gstin: values[9]?.toString()?.trim(),
          pan: values[10]?.toString()?.trim(),
          gender: values[11]?.toString()?.trim(),
          source: values[12]?.toString()?.trim(),
          notes: values[13]?.toString()?.trim(),
          addressLabel: values[14]?.toString()?.trim(),
          addressType: values[15]?.toString()?.trim(),
          addressLine1: values[16]?.toString()?.trim(),
          addressLine2: values[17]?.toString()?.trim(),
          stateCodeOrName: values[18]?.toString()?.trim(),
          cityName: values[19]?.toString()?.trim(),
          postalCode: values[20]?.toString()?.trim(),
        });
      });
    } else if (ext === 'csv') {
      rawRows = await new Promise((resolve, reject) => {
        const results: any[] = [];
        let rowNum = 2; // header is row 1
        const stream = Readable.from(fileBuffer);
        stream
          .pipe(csvParser())
          .on('data', (data) => {
            results.push({
              rowNumber: rowNum++,
              customerCode: data['Customer Code (Optional)'] || data['customerCode'],
              customerType: data['Customer Type *'] || data['customerType'],
              firstName: data['First Name *'] || data['firstName'],
              lastName: data['Last Name *'] || data['lastName'],
              companyName: data['Company Name'] || data['companyName'],
              email: data['Email Address'] || data['email'],
              mobile: data['Mobile Number *'] || data['mobile'],
              altMobile: data['Alternate Mobile'] || data['altMobile'],
              gstin: data['GSTIN'] || data['gstin'],
              pan: data['PAN'] || data['pan'],
              gender: data['Gender (MALE/FEMALE/OTHER)'] || data['gender'],
              source: data['Source'] || data['source'],
              notes: data['Notes'] || data['notes'],
              addressLabel: data['Address Label (e.g. Office)'] || data['addressLabel'],
              addressType: data['Address Type (e.g. Billing)'] || data['addressType'],
              addressLine1: data['Address Line 1 *'] || data['addressLine1'],
              addressLine2: data['Address Line 2'] || data['addressLine2'],
              stateCodeOrName: data['State Code or Name *'] || data['state'],
              cityName: data['City Name *'] || data['city'],
              postalCode: data['PIN Code *'] || data['postalCode'],
            });
          })
          .on('end', () => resolve(results))
          .on('error', (err) => reject(err));
      });
    } else {
      throw new BadRequestException('Unsupported file format. Please upload .xlsx or .csv.');
    }

    // Load master data for validation lookup
    const [customerTypes, states, existingMobiles] = await Promise.all([
      this.prisma.customerType.findMany({ select: { id: true, name: true, code: true } }),
      this.prisma.state.findMany({ select: { id: true, name: true, code: true } }),
      this.prisma.customer.findMany({
        where: { isDeleted: false },
        select: { mobile: true, customerCode: true },
      }),
    ]);

    const existingMobileSet = new Set(existingMobiles.map((c) => c.mobile.replace(/\s+/g, '')));
    const batchMobileSet = new Set<string>();

    const parsedRows: ParsedCustomerRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    for (const r of rawRows) {
      const errors: string[] = [];

      // Required fields
      if (!r.firstName) errors.push('First name is required.');
      if (!r.lastName) errors.push('Last name is required.');
      if (!r.mobile) errors.push('Mobile number is required.');
      if (!r.customerType) errors.push('Customer type is required.');

      // Mobile format validation (Indian 10-digit or E.164)
      if (r.mobile) {
        const cleanMobile = r.mobile.replace(/[\s\-]/g, '');
        if (!/^\+?[1-9]\d{9,14}$/.test(cleanMobile)) {
          errors.push('Mobile number format is invalid.');
        } else {
          // Check duplicates within batch
          if (batchMobileSet.has(cleanMobile)) {
            errors.push('Duplicate mobile number within uploaded file.');
          } else {
            batchMobileSet.add(cleanMobile);
          }

          // Check duplicate against existing database records
          if (existingMobileSet.has(cleanMobile)) {
            errors.push('Mobile number is already registered in DAMIRA database.');
          }
        }
      }

      // Email format validation
      if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim())) {
        errors.push('Email format is invalid.');
      }

      // Customer type match
      if (r.customerType) {
        const matchedType = customerTypes.find(
          (t) =>
            t.name.toLowerCase() === r.customerType.toLowerCase() ||
            t.code.toLowerCase() === r.customerType.toLowerCase(),
        );
        if (!matchedType) {
          errors.push(`Customer type '${r.customerType}' does not exist in master data.`);
        }
      }

      // GSTIN validation
      if (r.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(r.gstin.trim().toUpperCase())) {
        errors.push('Invalid GSTIN format (must be 15 alphanumeric characters).');
      }

      // PAN validation
      if (r.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(r.pan.trim().toUpperCase())) {
        errors.push('Invalid PAN format (must be 10 characters, e.g. ABCDE1234F).');
      }

      // PIN code validation
      if (r.postalCode && !/^[1-9][0-9]{5}$/.test(r.postalCode.trim())) {
        errors.push('Postal PIN code must be a valid 6-digit Indian PIN code.');
      }

      const isValid = errors.length === 0;
      if (isValid) validCount++;
      else errorCount++;

      parsedRows.push({
        ...r,
        isValid,
        errors,
      });
    }

    return {
      rows: parsedRows,
      totalRows: parsedRows.length,
      validCount,
      errorCount,
    };
  }

  // 3. EXECUTE BATCH IMPORT (IN CHUNKS OF 500)
  async executeImport(
    parsedRows: ParsedCustomerRow[],
    duplicateStrategy: DuplicateStrategy,
    fileName: string,
    fileSize: number,
    userId: string,
  ) {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'xlsx';

    // 1. Create Import History Record
    const importRecord = await this.prisma.customerImport.create({
      data: {
        fileName,
        fileSize,
        fileFormat: ext,
        duplicateStrategy,
        uploadedById: userId,
        status: ImportStatus.PROCESSING,
        totalRecords: parsedRows.length,
      },
    });

    const [customerTypes, states, defaultCountry, defaultAddressType] = await Promise.all([
      this.prisma.customerType.findMany(),
      this.prisma.state.findMany(),
      this.prisma.country.findFirst({ where: { iso2: 'IN' } }),
      this.prisma.addressType.findFirst({ where: { code: 'OFFICE' } }),
    ]);

    let successCount = 0;
    let failedCount = 0;
    const errorsToInsert: any[] = [];

    // Filter rows to process based on strategy
    const rowsToProcess = parsedRows.filter((r) => {
      if (r.isValid) return true;
      // If error is duplicate and strategy allows UPDATE, keep it
      if (
        duplicateStrategy === DuplicateStrategy.UPDATE &&
        r.errors.length === 1 &&
        r.errors[0].includes('already registered')
      ) {
        return true;
      }
      return false;
    });

    const invalidRows = parsedRows.filter((r) => !rowsToProcess.includes(r));
    for (const inv of invalidRows) {
      failedCount++;
      errorsToInsert.push({
        importId: importRecord.id,
        rowNumber: inv.rowNumber,
        rawRowData: inv as any,
        errorCode: 'VALIDATION_FAILED',
        errorReason: inv.errors.join('; '),
      });
    }

    // Process in batches of 500 records per transaction
    const BATCH_SIZE = 500;
    for (let i = 0; i < rowsToProcess.length; i += BATCH_SIZE) {
      const batch = rowsToProcess.slice(i, i + BATCH_SIZE);

      await this.prisma.$transaction(
        async (tx) => {
          for (const row of batch) {
            try {
              const matchedType = customerTypes.find(
                (t) =>
                  t.name.toLowerCase() === row.customerType?.toLowerCase() ||
                  t.code.toLowerCase() === row.customerType?.toLowerCase(),
              );

              if (!matchedType) {
                throw new Error(`Customer type not found: ${row.customerType}`);
              }

              // Check existing by mobile
              const cleanMobile = row.mobile.replace(/[\s\-]/g, '');
              const existing = await tx.customer.findFirst({
                where: { mobile: cleanMobile, isDeleted: false },
              });

              let customerId: string;

              if (existing) {
                if (duplicateStrategy === DuplicateStrategy.SKIP) {
                  continue;
                } else if (duplicateStrategy === DuplicateStrategy.UPDATE) {
                  const updated = await tx.customer.update({
                    where: { id: existing.id },
                    data: {
                      firstName: row.firstName,
                      lastName: row.lastName,
                      companyName: row.companyName || existing.companyName,
                      email: row.email || existing.email,
                      gstin: row.gstin || existing.gstin,
                      pan: row.pan || existing.pan,
                      updatedById: userId,
                    },
                  });
                  customerId = updated.id;
                } else {
                  // IMPORT_NEW with modified code
                  const newCust = await tx.customer.create({
                    data: {
                      customerCode: row.customerCode || `DAMIRA-CUST-${Date.now().toString().slice(-6)}`,
                      customerTypeId: matchedType.id,
                      firstName: row.firstName,
                      lastName: row.lastName,
                      companyName: row.companyName || null,
                      email: row.email || null,
                      mobile: cleanMobile,
                      gstin: row.gstin || null,
                      pan: row.pan || null,
                      createdById: userId,
                      updatedById: userId,
                    },
                  });
                  customerId = newCust.id;
                }
              } else {
                // New customer
                const newCust = await tx.customer.create({
                  data: {
                    customerCode: row.customerCode || `DAMIRA-CUST-${Date.now().toString().slice(-6)}`,
                    customerTypeId: matchedType.id,
                    firstName: row.firstName,
                    lastName: row.lastName,
                    companyName: row.companyName || null,
                    email: row.email || null,
                    mobile: cleanMobile,
                    gstin: row.gstin || null,
                    pan: row.pan || null,
                    createdById: userId,
                    updatedById: userId,
                  },
                });
                customerId = newCust.id;
              }

              // Address creation if provided
              if (row.addressLine1 && row.postalCode) {
                const matchedState = states.find(
                  (s) =>
                    s.name.toLowerCase() === row.stateCodeOrName?.toLowerCase() ||
                    s.code.toLowerCase() === row.stateCodeOrName?.toLowerCase(),
                );

                const stateId = matchedState?.id || states[0]?.id;
                // Lookup or create city in this state
                let cityId: string;
                if (row.cityName) {
                  const existingCity = await tx.city.findFirst({
                    where: { stateId, name: row.cityName },
                  });
                  if (existingCity) {
                    cityId = existingCity.id;
                  } else {
                    const newCity = await tx.city.create({
                      data: { stateId, name: row.cityName },
                    });
                    cityId = newCity.id;
                  }
                } else {
                  const defaultCity = await tx.city.findFirst({ where: { stateId } });
                  cityId = defaultCity ? defaultCity.id : '';
                }

                if (cityId) {
                  await tx.customerAddress.create({
                    data: {
                      customerId,
                      addressTypeId: defaultAddressType?.id || '',
                      addressLabel: row.addressLabel || 'Primary Location',
                      contactPersonName: `${row.firstName} ${row.lastName}`,
                      contactMobile: cleanMobile,
                      addressLine1: row.addressLine1,
                      addressLine2: row.addressLine2 || null,
                      countryId: defaultCountry?.id || '',
                      stateId,
                      cityId,
                      postalCode: row.postalCode,
                      isDefaultBilling: true,
                      isDefaultShipping: true,
                    },
                  });
                }
              }

              successCount++;
            } catch (err: any) {
              failedCount++;
              errorsToInsert.push({
                importId: importRecord.id,
                rowNumber: row.rowNumber,
                rawRowData: row as any,
                errorCode: 'INSERT_ERROR',
                errorReason: err.message || 'Database insert failed',
              });
            }
          }
        },
        { timeout: 30000 },
      );
    }

    // Insert batch errors
    if (errorsToInsert.length > 0) {
      await this.prisma.customerImportError.createMany({
        data: errorsToInsert,
      });
    }

    // Update Import status
    const finalStatus =
      failedCount === 0
        ? ImportStatus.COMPLETED
        : successCount > 0
          ? ImportStatus.PARTIALLY_FAILED
          : ImportStatus.FAILED;

    const completed = await this.prisma.customerImport.update({
      where: { id: importRecord.id },
      data: {
        status: finalStatus,
        successRecords: successCount,
        failedRecords: failedCount,
        completedAt: new Date(),
      },
    });

    await this.auditLogsService.log({
      userId,
      action: 'BULK_IMPORT',
      module: 'CUSTOMERS',
      recordId: importRecord.id,
      newValues: { total: parsedRows.length, success: successCount, failed: failedCount },
    });

    return completed;
  }

  // 4. GENERATE DOWNLOADABLE ERROR REPORT EXCEL
  async generateErrorReport(importId: string): Promise<Buffer> {
    const importRecord = await this.prisma.customerImport.findUnique({
      where: { id: importId },
      include: {
        errors: {
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!importRecord) {
      throw new BadRequestException('Import record not found.');
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Import Errors', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'File Row #', key: 'rowNumber', width: 14 },
      { header: 'Customer Details', key: 'customer', width: 35 },
      { header: 'Mobile Number', key: 'mobile', width: 18 },
      { header: 'Error Code', key: 'code', width: 22 },
      { header: 'Exact Error Reason', key: 'reason', width: 50 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDC2626' }, // Danger Red Header
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    for (const err of importRecord.errors) {
      const raw = err.rawRowData as any;
      sheet.addRow({
        rowNumber: err.rowNumber,
        customer: `${raw?.firstName || ''} ${raw?.lastName || ''} (${raw?.companyName || 'Individual'})`,
        mobile: raw?.mobile || '-',
        code: err.errorCode,
        reason: err.errorReason,
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // 5. IMPORT HISTORY
  async getHistory(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.customerImport.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: {
              username: true,
              employee: { select: { firstName: true, lastName: true } },
            },
          },
          _count: { select: { errors: true } },
        },
      }),
      this.prisma.customerImport.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
