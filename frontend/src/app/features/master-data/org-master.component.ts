import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-org-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    HasPermissionDirective,
  ],
  templateUrl: './org-master.component.html',
  styleUrl: './org-master.component.scss',
})
export class OrgMasterComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private readonly API_URL = `${environment.apiUrl}/master-data`;

  activeTab = signal<'departments' | 'designations' | 'customer-types' | 'address-types'>('departments');
  showAddModal = signal<boolean>(false);

  departments = signal<any[]>([]);
  designations = signal<any[]>([]);
  customerTypes = signal<any[]>([]);
  addressTypes = signal<any[]>([]);

  orgForm = this.fb.group({
    name: ['', [Validators.required]],
    code: ['', [Validators.required]],
    description: [''],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.http.get<any>(`${this.API_URL}/departments`).subscribe({
      next: (res) => this.departments.set(res.data || res || []),
    });
    this.http.get<any>(`${this.API_URL}/designations`).subscribe({
      next: (res) => this.designations.set(res.data || res || []),
    });
    this.http.get<any>(`${this.API_URL}/customer-types`).subscribe({
      next: (res) => this.customerTypes.set(res.data || res || []),
    });
    this.http.get<any>(`${this.API_URL}/address-types`).subscribe({
      next: (res) => this.addressTypes.set(res.data || res || []),
    });
  }

  currentList() {
    switch (this.activeTab()) {
      case 'departments':
        return this.departments();
      case 'designations':
        return this.designations();
      case 'customer-types':
        return this.customerTypes();
      case 'address-types':
        return this.addressTypes();
    }
  }

  getActiveTabTitle(): string {
    switch (this.activeTab()) {
      case 'departments': return 'Department';
      case 'designations': return 'Designation';
      case 'customer-types': return 'Customer Type';
      case 'address-types': return 'Address Type';
    }
  }

  openAddModal(): void {
    this.orgForm.reset();
    this.showAddModal.set(true);
  }

  submitItem(): void {
    if (this.orgForm.invalid) return;
    const tab = this.activeTab();
    this.http.post(`${this.API_URL}/${tab}`, this.orgForm.value).subscribe({
      next: () => {
        this.showAddModal.set(false);
        this.loadAll();
      },
    });
  }
}
