import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  module?: string;
  action?: string;
  anyPermissions?: { module: string; action: string }[];
  children?: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isSidebarCollapsed = signal<boolean>(false);
  currentUser = this.authService.currentUser;

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'D';
    if (user.fullName) {
      const parts = user.fullName.split(' ');
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  });

  primaryRole = computed(() => {
    const roles = this.authService.userRoles();
    return roles.length > 0 ? roles[0].replace('-', ' ') : 'Employee';
  });

  private rawNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
    },
    {
      label: 'Market Intelligence',
      icon: 'insights',
      children: [
        {
          label: 'Geographical Analytics',
          icon: 'public',
          route: '/analytics/market-intelligence',
          anyPermissions: [
            { module: 'ANALYTICS', action: 'VIEW_GEO' },
            { module: 'ANALYTICS', action: 'VIEW_CUSTOMERS' },
          ],
        },
      ],
    },
    {
      label: 'CRM',
      icon: 'contacts',
      children: [
        { label: 'Customers', icon: 'people_alt', route: '/crm/customers', module: 'CUSTOMERS', action: 'VIEW' },
        { label: 'Customer Import', icon: 'upload_file', route: '/crm/import', module: 'CUSTOMERS', action: 'IMPORT' },
      ],
    },
    {
      label: 'Company Management',
      icon: 'business',
      children: [
        { label: 'Employees', icon: 'badge', route: '/company/employees', module: 'EMPLOYEES', action: 'VIEW' },
        { label: 'User Accounts', icon: 'manage_accounts', route: '/company/users', module: 'USERS', action: 'VIEW' },
        { label: 'Roles & Permissions', icon: 'verified_user', route: '/company/roles', module: 'ROLES', action: 'VIEW' },
      ],
    },
    {
      label: 'Master Data',
      icon: 'hub',
      children: [
        { label: 'Geographic Master', icon: 'public', route: '/master-data/geo', module: 'MASTER_DATA', action: 'VIEW' },
        { label: 'Organization Master', icon: 'corporate_fare', route: '/master-data/org', module: 'MASTER_DATA', action: 'VIEW' },
      ],
    },
    {
      label: 'System & Security',
      icon: 'security',
      children: [
        { label: 'Audit Logs', icon: 'history', route: '/system/audit-logs', module: 'AUDIT_LOGS', action: 'VIEW' },
      ],
    },
  ];

  accessibleNavItems = computed(() => {
    const user = this.currentUser();
    if (!user) return [];

    return this.rawNavItems
      .map((item) => {
        if (item.children) {
          const filteredChildren = item.children.filter((child) => {
            if (child.anyPermissions?.length) {
              return child.anyPermissions.some((permission) =>
                this.authService.hasPermission(permission.module, permission.action),
              );
            }
            if (!child.module) return true;
            return this.authService.hasPermission(child.module, child.action || 'VIEW');
          });
          return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
        }
        if (item.module && !this.authService.hasPermission(item.module, item.action || 'VIEW')) {
          return null;
        }
        return item;
      })
      .filter((item): item is NavItem => item !== null);
  });

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}
