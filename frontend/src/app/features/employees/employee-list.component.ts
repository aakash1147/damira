import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmployeeService } from './employee.service';
import { EmployeeListItem } from './employee.model';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  Math = Math;

  employees = signal<EmployeeListItem[]>([]);
  isLoading = signal<boolean>(false);
  totalRecords = signal<number>(0);
  totalPages = signal<number>(1);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  searchQuery = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.employeeService
      .findAll({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchQuery,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.employees.set(res.data);
          this.totalRecords.set(res.meta.total);
          this.totalPages.set(res.meta.totalPages);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadEmployees();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadEmployees();
  }

  viewDetails(id: string): void {
    // Navigate to employee view
  }

  editEmployee(id: string): void {
    // Navigate to employee edit
  }

  toggleStatus(emp: EmployeeListItem): void {
    const newStatus = emp.status === 'ACTIVE' ? 'TERMINATED' : 'ACTIVE';
    this.employeeService.updateStatus(emp.id, newStatus).subscribe({
      next: () => this.loadEmployees(),
    });
  }

  deleteEmployee(emp: EmployeeListItem): void {
    if (confirm(`Are you sure you want to deactivate and archive ${emp.fullName}?`)) {
      this.employeeService.softDelete(emp.id).subscribe({
        next: () => this.loadEmployees(),
      });
    }
  }
}
