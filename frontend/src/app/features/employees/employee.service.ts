import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmployeeListItem, EmployeeDetails } from './employee.model';
import { PaginatedResponse } from '../../core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/employees`;

  findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
  }): Observable<PaginatedResponse<EmployeeListItem>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.departmentId) httpParams = httpParams.set('departmentId', params.departmentId);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<PaginatedResponse<EmployeeListItem>>(this.API_URL, { params: httpParams });
  }

  findById(id: string): Observable<EmployeeDetails> {
    return this.http.get<EmployeeDetails>(`${this.API_URL}/${id}`);
  }

  create(dto: any): Observable<{ employee: EmployeeDetails; accountCredentials: any }> {
    return this.http.post<{ employee: EmployeeDetails; accountCredentials: any }>(this.API_URL, dto);
  }

  update(id: string, dto: any): Observable<EmployeeDetails> {
    return this.http.put<EmployeeDetails>(`${this.API_URL}/${id}`, dto);
  }

  updateStatus(id: string, status: string): Observable<EmployeeDetails> {
    return this.http.patch<EmployeeDetails>(`${this.API_URL}/${id}/status`, { status });
  }

  softDelete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
