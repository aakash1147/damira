import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CustomerTypeDistribution {
  customerTypeId: string;
  name: string;
  count: number;
  percentage: number;
}

export interface RecentCustomerRegistration {
  id: string;
  fullName: string;
  customerType: string;
  createdAt: string;
}

export interface DashboardCustomerSummary {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersMonth: number;
  customerTypeDistribution: CustomerTypeDistribution[];
  recentRegistrations: RecentCustomerRegistration[];
}

export interface DashboardEmployeeSummary {
  totalEmployees: number;
  activeEmployees: number;
}

export interface DashboardEmployeeActivity {
  id: string;
  action: string;
  actorName: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getCustomerSummary(): Observable<DashboardCustomerSummary> {
    return this.http.get<DashboardCustomerSummary>(`${this.apiUrl}/customers`);
  }

  getEmployeeSummary(): Observable<DashboardEmployeeSummary> {
    return this.http.get<DashboardEmployeeSummary>(`${this.apiUrl}/employees`);
  }

  getRecentEmployeeActivities(): Observable<DashboardEmployeeActivity[]> {
    return this.http.get<DashboardEmployeeActivity[]>(`${this.apiUrl}/employee-activities`);
  }
}
