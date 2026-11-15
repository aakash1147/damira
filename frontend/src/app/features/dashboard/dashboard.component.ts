import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import {
  DashboardCustomerSummary,
  DashboardEmployeeActivity,
  DashboardEmployeeSummary,
  DashboardService,
} from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    HasPermissionDirective,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  currentUser = this.authService.currentUser;

  customerSummary = signal<DashboardCustomerSummary | null>(null);
  employeeSummary = signal<DashboardEmployeeSummary | null>(null);
  employeeActivities = signal<DashboardEmployeeActivity[]>([]);

  customersLoading = signal(true);
  employeesLoading = signal(true);
  activitiesLoading = signal(true);

  customersError = signal<string | null>(null);
  employeesError = signal<string | null>(null);
  activitiesError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.customerSummary.set(null);
    this.employeeSummary.set(null);
    this.employeeActivities.set([]);

    this.customersLoading.set(true);
    this.employeesLoading.set(true);
    this.activitiesLoading.set(true);
    this.customersError.set(null);
    this.employeesError.set(null);
    this.activitiesError.set(null);

    this.dashboardService.getCustomerSummary().subscribe({
      next: (summary) => {
        this.customerSummary.set(summary);
        this.customersLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.customersError.set(this.getErrorMessage(error, 'customer statistics'));
        this.customersLoading.set(false);
      },
    });

    this.dashboardService.getEmployeeSummary().subscribe({
      next: (summary) => {
        this.employeeSummary.set(summary);
        this.employeesLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.employeesError.set(this.getErrorMessage(error, 'employee statistics'));
        this.employeesLoading.set(false);
      },
    });

    this.dashboardService.getRecentEmployeeActivities().subscribe({
      next: (activities) => {
        this.employeeActivities.set(activities);
        this.activitiesLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.activitiesError.set(this.getErrorMessage(error, 'employee activity'));
        this.activitiesLoading.set(false);
      },
    });
  }

  private getErrorMessage(error: HttpErrorResponse, section: string): string {
    if (error.status === 403) {
      return `Access denied: you do not have permission to view ${section}.`;
    }
    if (error.status === 401) {
      return 'Your session has expired. Sign in again to load this data.';
    }

    const message = error.error?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    return `Could not load ${section}. Please try again.`;
  }
}
