import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss',
})
export class AuditLogsComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/audit-logs`;

  logs = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  selectedLog = signal<any | null>(null);

  moduleFilter = '';
  actionFilter = '';

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (this.moduleFilter) params = params.set('module', this.moduleFilter);
    if (this.actionFilter) params = params.set('action', this.actionFilter);

    this.http.get<any>(this.API_URL, { params }).subscribe({
      next: (res) => {
        this.logs.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  formatJson(data: any): string {
    if (!data) return 'None';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
}
