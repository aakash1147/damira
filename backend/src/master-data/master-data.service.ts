import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  CreateCountryDto,
  CreateStateDto,
  CreateCityDto,
  CreateMasterItemDto,
  UpdateActiveStatusDto,
} from './dto/create-master.dto';

@Injectable()
export class MasterDataService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  // 1. COUNTRIES
  async getCountries() {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { states: true, addresses: true } } },
    });
  }

  async createCountry(dto: CreateCountryDto, userId?: string) {
    const existing = await this.prisma.country.findFirst({
      where: { OR: [{ iso2: dto.iso2.toUpperCase() }, { name: dto.name }] },
    });
    if (existing) throw new ConflictException('Country already exists.');

    const country = await this.prisma.country.create({
      data: {
        name: dto.name.trim(),
        iso2: dto.iso2.trim().toUpperCase(),
        iso3: dto.iso3.trim().toUpperCase(),
        phoneCode: dto.phoneCode.trim(),
      },
    });

    await this.auditLogsService.log({
      userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordId: country.id,
      newValues: dto,
    });

    return country;
  }

  // 2. STATES
  async getStates(countryId?: string) {
    const where: any = {};
    if (countryId) where.countryId = countryId;

    return this.prisma.state.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        country: { select: { name: true, iso2: true } },
        _count: { select: { cities: true, addresses: true } },
      },
    });
  }

  async createState(dto: CreateStateDto, userId?: string) {
    const existing = await this.prisma.state.findFirst({
      where: { countryId: dto.countryId, code: dto.code.trim().toUpperCase() },
    });
    if (existing) throw new ConflictException('State with this code already exists for country.');

    const state = await this.prisma.state.create({
      data: {
        countryId: dto.countryId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        gstCode: dto.gstCode ? dto.gstCode.trim() : null,
      },
    });

    await this.auditLogsService.log({
      userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordId: state.id,
      newValues: dto,
    });

    return state;
  }

  // 3. CITIES
  async getCities(stateId?: string) {
    const where: any = {};
    if (stateId) where.stateId = stateId;

    return this.prisma.city.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        state: { select: { name: true, code: true } },
        _count: { select: { addresses: true } },
      },
    });
  }

  async createCity(dto: CreateCityDto, userId?: string) {
    const existing = await this.prisma.city.findFirst({
      where: { stateId: dto.stateId, name: dto.name.trim() },
    });
    if (existing) throw new ConflictException('City already exists in this state.');

    const city = await this.prisma.city.create({
      data: {
        stateId: dto.stateId,
        name: dto.name.trim(),
      },
    });

    await this.auditLogsService.log({
      userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordId: city.id,
      newValues: dto,
    });

    return city;
  }

  // 4. CUSTOMER TYPES
  async getCustomerTypes() {
    return this.prisma.customerType.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { customers: true } } },
    });
  }

  async createCustomerType(dto: CreateMasterItemDto, userId?: string) {
    const existing = await this.prisma.customerType.findFirst({
      where: { OR: [{ code: dto.code.toUpperCase() }, { name: dto.name }] },
    });
    if (existing) throw new ConflictException('Customer type already exists.');

    const ct = await this.prisma.customerType.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description || null,
      },
    });

    await this.auditLogsService.log({
      userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordId: ct.id,
      newValues: dto,
    });

    return ct;
  }

  // 5. ADDRESS TYPES
  async getAddressTypes() {
    return this.prisma.addressType.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { addresses: true } } },
    });
  }

  async createAddressType(dto: CreateMasterItemDto, userId?: string) {
    const existing = await this.prisma.addressType.findFirst({
      where: { OR: [{ code: dto.code.toUpperCase() }, { name: dto.name }] },
    });
    if (existing) throw new ConflictException('Address type already exists.');

    const at = await this.prisma.addressType.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description || null,
      },
    });

    await this.auditLogsService.log({
      userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordId: at.id,
      newValues: dto,
    });

    return at;
  }

  // 6. DEPARTMENTS
  async getDepartments() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true } } },
    });
  }

  async createDepartment(dto: CreateMasterItemDto, userId?: string) {
    const existing = await this.prisma.department.findFirst({
      where: { OR: [{ code: dto.code.toUpperCase() }, { name: dto.name }] },
    });
    if (existing) throw new ConflictException('Department already exists.');

    const dept = await this.prisma.department.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description || null,
      },
    });

    await this.auditLogsService.log({
      userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordId: dept.id,
      newValues: dto,
    });

    return dept;
  }

  // 7. DESIGNATIONS
  async getDesignations() {
    return this.prisma.designation.findMany({
      orderBy: { title: 'asc' },
      include: { _count: { select: { employees: true } } },
    });
  }

  async createDesignation(dto: CreateMasterItemDto, userId?: string) {
    const existing = await this.prisma.designation.findFirst({
      where: { OR: [{ code: dto.code.toUpperCase() }, { title: dto.name }] },
    });
    if (existing) throw new ConflictException('Designation already exists.');

    const desig = await this.prisma.designation.create({
      data: {
        title: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description || null,
      },
    });

    await this.auditLogsService.log({
      userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordId: desig.id,
      newValues: dto,
    });

    return desig;
  }
}
