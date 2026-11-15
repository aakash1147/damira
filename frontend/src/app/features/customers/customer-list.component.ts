import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerService } from './customer.service';
import { CustomerListItem } from './customer.model';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-customer-list',
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
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private http = inject(HttpClient);
  private router = inject(Router);
  Math = Math;

  customers = signal<CustomerListItem[]>([]);
  customerTypes = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  totalRecords = signal<number>(0);
  totalPages = signal<number>(1);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  searchQuery = '';
  typeFilter = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadCustomerTypes();
    this.loadCustomers();
  }

  loadCustomerTypes(): void {
    // In future this calls master data, fallback to standard list
    this.customerTypes.set([
      { id: 'wholesaler', name: 'Wholesaler' },
      { id: 'distributor', name: 'Distributor' },
      { id: 'corporate', name: 'Corporate' },
      { id: 'retailer', name: 'Retailer' },
      { id: 'individual', name: 'Individual' },
      { id: 'bulk_buyer', name: 'Bulk Buyer' },
    ]);
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    this.customerService
      .findAll({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchQuery,
        customerTypeId: this.typeFilter || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.customers.set(res.data);
          this.totalRecords.set(res.meta.total);
          this.totalPages.set(res.meta.totalPages);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadCustomers();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadCustomers();
  }

  editCustomer(id: string): void {
    // Navigate or open dialog
  }

  archiveCustomer(customer: CustomerListItem): void {
    if (confirm(`Are you sure you want to archive customer '${customer.fullName}'? Historical order and invoice records will be preserved.`)) {
      this.customerService.softDelete(customer.id).subscribe({
        next: () => this.loadCustomers(),
      });
    }
  }

  exportExcel(): void {
    this.customerService
      .exportExcel({
        search: this.searchQuery,
        customerTypeId: this.typeFilter || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DAMIRA_Customers_${Date.now()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  exportCsv(): void {
    this.customerService
      .exportCsv({
        search: this.searchQuery,
        customerTypeId: this.typeFilter || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DAMIRA_Customers_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }
}
