import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmployeeService } from './employee.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  credentialsGenerated = signal<any | null>(null);
  createdEmployeeName = signal<string>('');

  employeeForm = this.fb.group({
    employeeCode: [`DAMIRA-EMP-${Math.floor(100 + Math.random() * 900)}`, [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required]],
    altMobile: [''],
    gender: ['MALE', [Validators.required]],
    dob: [''],
    dateOfJoining: [new Date().toISOString().substring(0, 10), [Validators.required]],
    status: ['ACTIVE', [Validators.required]],
    notes: [''],
    createLoginAccount: [true],
    username: [''],
    roleSlug: ['employee'],
  });

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const val = this.employeeForm.value;

    this.employeeService.create(val).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.accountCredentials) {
          this.createdEmployeeName.set(`${val.firstName} ${val.lastName}`);
          this.credentialsGenerated.set(res.accountCredentials);
        } else {
          this.router.navigate(['/company/employees']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Failed to onboard employee. Please try again.';
        this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  dismissCredentialsAndRedirect(): void {
    this.credentialsGenerated.set(null);
    this.router.navigate(['/company/employees']);
  }
}
