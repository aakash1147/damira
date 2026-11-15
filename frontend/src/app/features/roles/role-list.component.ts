import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/roles`;

  roles = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  inspectRole = signal<any | null>(null);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading.set(true);
    this.http.get<any>(this.API_URL).subscribe({
      next: (res) => {
        this.roles.set(res || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  viewRolePermissions(roleId: string): void {
    this.http.get<any>(`${this.API_URL}/${roleId}`).subscribe({
      next: (res) => {
        this.inspectRole.set(res.data || res);
      },
    });
  }
}
