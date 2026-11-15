import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerService } from './customer.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private http = inject(HttpClient);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  customerTypes = signal<any[]>([]);

  customerForm = this.fb.group({
    customerTypeId: ['', [Validators.required]],
    customerCode: [''],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    companyName: [''],
    mobile: ['', [Validators.required]],
    altMobile: [''],
    email: ['', [Validators.email]],
    gender: [''],
    gstin: [''],
    pan: [''],
    source: ['Direct'],
    status: ['ACTIVE'],
    notes: [''],
  });

  ngOnInit(): void {
    // Load customer types
    this.http.get<any>(`${environment.apiUrl}/master-data/customer-types`).subscribe({
      next: (res) => this.customerTypes.set(res.data || []),
      error: () => {
        // Fallback options
        this.customerTypes.set([
          { id: 'wholesaler', name: 'Wholesaler' },
          { id: 'distributor', name: 'Distributor' },
          { id: 'corporate', name: 'Corporate' },
          { id: 'retailer', name: 'Retailer' },
          { id: 'individual', name: 'Individual' },
          { id: 'bulk_buyer', name: 'Bulk Buyer' },
        ]);
      },
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const val = this.customerForm.value;

    this.customerService.create(val).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.router.navigate(['/crm/customers', res.id]);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Failed to save customer.';
        this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }
}
