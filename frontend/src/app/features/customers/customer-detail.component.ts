import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerService } from './customer.service';
import { CustomerProfile, CustomerAddress } from './customer.model';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss',
})
export class CustomerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  customer = signal<CustomerProfile | null>(null);
  activeTab = signal<string>('overview');
  showAddAddressModal = signal<boolean>(false);

  states = signal<any[]>([]);
  cities = signal<any[]>([]);
  addressTypes = signal<any[]>([]);

  addressForm = this.fb.group({
    addressLabel: ['', [Validators.required]],
    addressTypeId: ['', [Validators.required]],
    contactPersonName: [''],
    contactMobile: [''],
    addressLine1: ['', [Validators.required]],
    addressLine2: [''],
    countryId: [''],
    stateId: ['', [Validators.required]],
    cityId: ['', [Validators.required]],
    landmark: [''],
    postalCode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
    isDefaultBilling: [false],
    isDefaultShipping: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(id);
      this.loadMasterData();
    }
  }

  loadCustomer(id: string): void {
    this.customerService.findById(id).subscribe({
      next: (res) => {
        res.fullName = `${res.firstName} ${res.lastName}`;
        this.customer.set(res);
      },
    });
  }

  loadMasterData(): void {
    // Address types
    this.addressTypes.set([
      { id: 'office', name: 'Office' },
      { id: 'billing', name: 'Billing' },
      { id: 'delivery', name: 'Delivery' },
      { id: 'warehouse', name: 'Warehouse' },
      { id: 'home', name: 'Home' },
    ]);

    // States
    this.http.get<any>(`${environment.apiUrl}/master-data/states`).subscribe({
      next: (res) => this.states.set(res || []),
    });
  }

  onStateChanged(): void {
    const stateId = this.addressForm.get('stateId')?.value;
    if (stateId) {
      this.http.get<any>(`${environment.apiUrl}/master-data/cities?stateId=${stateId}`).subscribe({
        next: (res) => this.cities.set(res || []),
      });
    }
  }

  openAddAddressModal(): void {
    this.addressForm.reset({
      isDefaultBilling: false,
      isDefaultShipping: false,
    });
    this.showAddAddressModal.set(true);
  }

  submitNewAddress(): void {
    if (this.addressForm.invalid) return;
    const custId = this.customer()?.id;
    if (!custId) return;

    this.customerService.addAddress(custId, this.addressForm.value).subscribe({
      next: () => {
        this.showAddAddressModal.set(false);
        this.loadCustomer(custId);
      },
    });
  }

  setDefaultBilling(addressId: string): void {
    const custId = this.customer()?.id;
    if (!custId) return;
    this.customerService.setDefaultBilling(custId, addressId).subscribe({
      next: () => this.loadCustomer(custId),
    });
  }

  setDefaultShipping(addressId: string): void {
    const custId = this.customer()?.id;
    if (!custId) return;
    this.customerService.setDefaultShipping(custId, addressId).subscribe({
      next: () => this.loadCustomer(custId),
    });
  }

  deleteAddress(addressId: string): void {
    const custId = this.customer()?.id;
    if (!custId) return;
    if (confirm('Delete this address?')) {
      this.customerService.deleteAddress(custId, addressId).subscribe({
        next: () => this.loadCustomer(custId),
      });
    }
  }
}
