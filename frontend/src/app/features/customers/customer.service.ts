import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomerListItem, CustomerProfile, CustomerAddress } from './customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/customers`;

  findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    customerTypeId?: string;
    status?: string;
    stateId?: string;
    cityId?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<{ data: CustomerListItem[]; meta: any }> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const val = (params as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val.toString());
      }
    });

    return this.http.get<{ data: CustomerListItem[]; meta: any }>(this.API_URL, {
      params: httpParams,
    });
  }

  findById(id: string): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${this.API_URL}/${id}`);
  }

  create(dto: any): Observable<CustomerProfile> {
    return this.http.post<CustomerProfile>(this.API_URL, dto);
  }

  update(id: string, dto: any): Observable<CustomerProfile> {
    return this.http.put<CustomerProfile>(`${this.API_URL}/${id}`, dto);
  }

  softDelete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  // Address Sub-Resource
  addAddress(customerId: string, dto: any): Observable<CustomerAddress> {
    return this.http.post<CustomerAddress>(`${this.API_URL}/${customerId}/addresses`, dto);
  }

  updateAddress(customerId: string, addressId: string, dto: any): Observable<CustomerAddress> {
    return this.http.put<CustomerAddress>(
      `${this.API_URL}/${customerId}/addresses/${addressId}`,
      dto,
    );
  }

  setDefaultBilling(customerId: string, addressId: string): Observable<any> {
    return this.http.patch(
      `${this.API_URL}/${customerId}/addresses/${addressId}/default-billing`,
      {},
    );
  }

  setDefaultShipping(customerId: string, addressId: string): Observable<any> {
    return this.http.patch(
      `${this.API_URL}/${customerId}/addresses/${addressId}/default-shipping`,
      {},
    );
  }

  deleteAddress(customerId: string, addressId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${customerId}/addresses/${addressId}`);
  }

  // Export
  exportExcel(params: any): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get(`${this.API_URL}/export/excel`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  exportCsv(params: any): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get(`${this.API_URL}/export/csv`, {
      params: httpParams,
      responseType: 'blob',
    });
  }
}
