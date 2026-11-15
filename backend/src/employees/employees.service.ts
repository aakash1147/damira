import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  QueryEmployeeDto,
} from './dto/create-employee.dto';
import { createPaginatedResponse } from '../common/pagination/pagination.dto';
import { EmployeeStatus } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateEmployeeDto, adminId?: string) {
    // Check uniqueness
    const existing = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { employeeCode: dto.employeeCode.trim() },
          { email: dto.email.trim().toLowerCase() },
          { mobile: dto.mobile.trim() },
        ],
        isDeleted: false,
      },
    });

    if (existing) {
      if (existing.employeeCode === dto.employeeCode.trim()) {
        throw new ConflictException(`Employee code '${dto.employeeCode}' is already registered.`);
      }
      if (existing.email.toLowerCase() === dto.email.trim().toLowerCase()) {
        throw new ConflictException(`Email address '${dto.email}' is already in use.`);
      }
      if (existing.mobile === dto.mobile.trim()) {
        throw new ConflictException(`Mobile number '${dto.mobile}' is already registered.`);
      }
    }

    let generatedTemporaryPassword: string | null = null;
    let createdUsername: string | null = null;

    const employee = await this.prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          employeeCode: dto.employeeCode.trim(),
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.trim().toLowerCase(),
          mobile: dto.mobile.trim(),
          altMobile: dto.altMobile ? dto.altMobile.trim() : null,
          gender: dto.gender,
          dob: dto.dob ? new Date(dto.dob) : null,
          dateOfJoining: new Date(dto.dateOfJoining),
          departmentId: dto.departmentId || null,
          designationId: dto.designationId || null,
          reportingManagerId: dto.reportingManagerId || null,
          status: dto.status || EmployeeStatus.ACTIVE,
          profileImageUrl: dto.profileImageUrl || null,
          notes: dto.notes || null,
        },
      });

      // Provision linked user account if requested
      if (dto.createLoginAccount) {
        const username = (dto.username || dto.employeeCode).trim().toLowerCase();
        createdUsername = username;

        // Check if username taken
        const existingUser = await tx.user.findFirst({
          where: { username, isDeleted: false },
        });

        if (existingUser) {
          throw new ConflictException(`Username '${username}' is already taken.`);
        }

        generatedTemporaryPassword = `Dmr@${crypto.randomBytes(4).toString('hex')}!`;
        const passwordHash = await argon2.hash(generatedTemporaryPassword);

        const newUser = await tx.user.create({
          data: {
            employeeId: emp.id,
            username,
            email: emp.email,
            passwordHash,
            status: 'ACTIVE',
            mustChangePassword: true,
          },
        });

        // Assign role if specified
        if (dto.roleId) {
          await tx.userRole.create({
            data: {
              userId: newUser.id,
              roleId: dto.roleId,
              assignedBy: adminId || null,
            },
          });
        }
      }

      return emp;
    });

    await this.auditLogsService.log({
      userId: adminId,
      action: 'CREATE',
      module: 'EMPLOYEES',
      recordId: employee.id,
      newValues: { ...dto, generatedTemporaryPassword: undefined },
    });

    const detailed = await this.findById(employee.id);

    return {
      employee: detailed,
      accountCredentials: generatedTemporaryPassword
        ? {
            username: createdUsername,
            temporaryPassword: generatedTemporaryPassword,
            note: 'Deliver these credentials securely to the employee. They will be prompted to change password on first login.',
          }
        : null,
    };
  }

  async findAll(query: QueryEmployeeDto) {
    const { page, limit, search, departmentId, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeCode: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sortBy && ['firstName', 'lastName', 'employeeCode', 'dateOfJoining', 'createdAt', 'status'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          department: { select: { id: true, name: true, code: true } },
          designation: { select: { id: true, title: true, code: true } },
          reportingManager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          userAccount: {
            select: {
              id: true,
              username: true,
              status: true,
              lastLoginAt: true,
              userRoles: {
                select: {
                  role: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    const formatted = employees.map((emp) => ({
      id: emp.id,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      fullName: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      mobile: emp.mobile,
      gender: emp.gender,
      dateOfJoining: emp.dateOfJoining,
      department: emp.department?.name,
      designation: emp.designation?.title,
      status: emp.status,
      hasLoginAccount: !!emp.userAccount,
      username: emp.userAccount?.username,
      roles: emp.userAccount?.userRoles.map((ur) => ur.role.name) || [],
      createdAt: emp.createdAt,
    }));

    return createPaginatedResponse(formatted, total, page, limit);
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        reportingManager: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        subordinates: {
          where: { isDeleted: false },
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        userAccount: {
          select: {
            id: true,
            username: true,
            email: true,
            status: true,
            lastLoginAt: true,
            failedLoginAttempts: true,
            createdAt: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!employee || employee.isDeleted) {
      throw new NotFoundException(`Employee with ID ${id} not found.`);
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, adminId?: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee || employee.isDeleted) {
      throw new NotFoundException(`Employee with ID ${id} not found.`);
    }

    // Check unique email/mobile conflict
    if (dto.email && dto.email.toLowerCase() !== employee.email.toLowerCase()) {
      const exists = await this.prisma.employee.findFirst({
        where: { email: dto.email.toLowerCase(), id: { not: id }, isDeleted: false },
      });
      if (exists) throw new ConflictException(`Email '${dto.email}' is already used by another employee.`);
    }

    if (dto.mobile && dto.mobile !== employee.mobile) {
      const exists = await this.prisma.employee.findFirst({
        where: { mobile: dto.mobile, id: { not: id }, isDeleted: false },
      });
      if (exists) throw new ConflictException(`Mobile '${dto.mobile}' is already used by another employee.`);
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        firstName: dto.firstName !== undefined ? dto.firstName.trim() : undefined,
        lastName: dto.lastName !== undefined ? dto.lastName.trim() : undefined,
        email: dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined,
        mobile: dto.mobile !== undefined ? dto.mobile.trim() : undefined,
        altMobile: dto.altMobile !== undefined ? dto.altMobile?.trim() : undefined,
        gender: dto.gender !== undefined ? dto.gender : undefined,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
        departmentId: dto.departmentId !== undefined ? dto.departmentId : undefined,
        designationId: dto.designationId !== undefined ? dto.designationId : undefined,
        reportingManagerId: dto.reportingManagerId !== undefined ? dto.reportingManagerId : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        profileImageUrl: dto.profileImageUrl !== undefined ? dto.profileImageUrl : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
    });

    await this.auditLogsService.log({
      userId: adminId,
      action: 'UPDATE',
      module: 'EMPLOYEES',
      recordId: id,
      oldValues: employee,
      newValues: dto,
    });

    return this.findById(id);
  }

  async updateStatus(id: string, status: EmployeeStatus, adminId?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { userAccount: true },
    });

    if (!employee || employee.isDeleted) {
      throw new NotFoundException(`Employee with ID ${id} not found.`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { status },
      });

      // Synchronize linked user account
      if (employee.userAccount) {
        const userStatus = status === EmployeeStatus.ACTIVE ? 'ACTIVE' : 'INACTIVE';
        await tx.user.update({
          where: { id: employee.userAccount.id },
          data: { status: userStatus },
        });

        if (userStatus === 'INACTIVE') {
          await tx.refreshToken.updateMany({
            where: { userId: employee.userAccount.id },
            data: { isRevoked: true },
          });
        }
      }
    });

    await this.auditLogsService.log({
      userId: adminId,
      action: 'UPDATE_STATUS',
      module: 'EMPLOYEES',
      recordId: id,
      oldValues: { status: employee.status },
      newValues: { status },
    });

    return this.findById(id);
  }

  async softDelete(id: string, adminId?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { userAccount: true },
    });

    if (!employee || employee.isDeleted) {
      throw new NotFoundException(`Employee with ID ${id} not found.`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { isDeleted: true, status: EmployeeStatus.TERMINATED },
      });

      if (employee.userAccount) {
        await tx.user.update({
          where: { id: employee.userAccount.id },
          data: { isDeleted: true, status: 'INACTIVE' },
        });

        await tx.refreshToken.updateMany({
          where: { userId: employee.userAccount.id },
          data: { isRevoked: true },
        });
      }
    });

    await this.auditLogsService.log({
      userId: adminId,
      action: 'DELETE',
      module: 'EMPLOYEES',
      recordId: id,
    });

    return { message: `Employee '${employee.employeeCode}' deactivated and archived.` };
  }
}
