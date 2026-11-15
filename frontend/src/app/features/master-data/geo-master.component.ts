import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-geo-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './geo-master.component.html',
  styleUrl: './geo-master.component.scss',
})
export class GeoMasterComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private readonly API_URL = `${environment.apiUrl}/master-data`;

  activeTab = signal<'states' | 'cities' | 'countries'>('states');
  states = signal<any[]>([]);
  cities = signal<any[]>([]);
  countries = signal<any[]>([]);
  showAddModal = signal<boolean>(false);

  geoForm = this.fb.group({
    name: ['', [Validators.required]],
    code: [''],
    gstCode: [''],
    countryId: [''],
    stateId: [''],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.http.get<any>(`${this.API_URL}/states`).subscribe({
      next: (res) => this.states.set(res.data || res || []),
    });
    this.http.get<any>(`${this.API_URL}/cities`).subscribe({
      next: (res) => this.cities.set(res.data || res || []),
    });
    this.http.get<any>(`${this.API_URL}/countries`).subscribe({
      next: (res) => this.countries.set(res.data || res || []),
    });
  }

  openAddModal(): void {
    this.geoForm.reset();
    const india = this.countries().find((c) => c.iso2 === 'IN');
    if (india) this.geoForm.patchValue({ countryId: india.id });
    this.showAddModal.set(true);
  }

  submitNewRecord(): void {
    if (this.geoForm.invalid) return;

    const val = this.geoForm.value;
    const tab = this.activeTab();

    if (tab === 'states') {
      this.http.post(`${this.API_URL}/states`, val).subscribe({
        next: () => {
          this.showAddModal.set(false);
          this.loadData();
        },
      });
    } else if (tab === 'cities') {
      this.http.post(`${this.API_URL}/cities`, val).subscribe({
        next: () => {
          this.showAddModal.set(false);
          this.loadData();
        },
      });
    }
  }
}
