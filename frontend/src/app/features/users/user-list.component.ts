import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/users`;

  users = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  resetResult = signal<any | null>(null);

  searchQuery = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (this.searchQuery) params = params.set('search', this.searchQuery);
    if (this.statusFilter) params = params.set('status', this.statusFilter);

    this.http.get<any>(this.API_URL, { params }).subscribe({
      next: (res) => {
        this.users.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  resetPassword(user: any): void {
    if (confirm(`Generate new temporary credentials for '${user.username}'?`)) {
      this.http.post<any>(`${this.API_URL}/${user.id}/reset-password`, {}).subscribe({
        next: (res) => {
          this.resetResult.set(res.data || res);
        },
      });
    }
  }

  toggleUserStatus(user: any): void {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.http.patch(`${this.API_URL}/${user.id}/status`, { status: newStatus }).subscribe({
      next: () => this.loadUsers(),
    });
  }
}
