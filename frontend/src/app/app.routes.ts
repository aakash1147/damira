import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component').then((m) => m.LoginComponent),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'crm/customers',
        canActivate: [permissionGuard],
        data: { module: 'CUSTOMERS', action: 'VIEW' },
        loadComponent: () =>
          import('./features/customers/customer-list.component').then(
            (m) => m.CustomerListComponent,
          ),
      },
      {
        path: 'crm/customers/new',
        canActivate: [permissionGuard],
        data: { module: 'CUSTOMERS', action: 'CREATE' },
        loadComponent: () =>
          import('./features/customers/customer-form.component').then(
            (m) => m.CustomerFormComponent,
          ),
      },
      {
        path: 'crm/customers/:id',
        canActivate: [permissionGuard],
        data: { module: 'CUSTOMERS', action: 'VIEW' },
        loadComponent: () =>
          import('./features/customers/customer-detail.component').then(
            (m) => m.CustomerDetailComponent,
          ),
      },
      {
        path: 'crm/import',
        canActivate: [permissionGuard],
        data: { module: 'CUSTOMERS', action: 'IMPORT' },
        loadComponent: () =>
          import('./features/customer-import/customer-import.component').then(
            (m) => m.CustomerImportComponent,
          ),
      },
      {
        path: 'company/employees',
        canActivate: [permissionGuard],
        data: { module: 'EMPLOYEES', action: 'VIEW' },
        loadComponent: () =>
          import('./features/employees/employee-list.component').then(
            (m) => m.EmployeeListComponent,
          ),
      },
      {
        path: 'company/employees/new',
        canActivate: [permissionGuard],
        data: { module: 'EMPLOYEES', action: 'CREATE' },
        loadComponent: () =>
          import('./features/employees/employee-form.component').then(
            (m) => m.EmployeeFormComponent,
          ),
      },
      {
        path: 'company/users',
        canActivate: [permissionGuard],
        data: { module: 'USERS', action: 'VIEW' },
        loadComponent: () =>
          import('./features/users/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'company/roles',
        canActivate: [permissionGuard],
        data: { module: 'ROLES', action: 'VIEW' },
        loadComponent: () =>
          import('./features/roles/role-list.component').then((m) => m.RoleListComponent),
      },
      {
        path: 'analytics/market-intelligence',
        canActivate: [permissionGuard],
        data: { module: 'ANALYTICS', action: 'VIEW_GEO' },
        loadComponent: () =>
          import(
            './features/market-intelligence/market-intelligence-dashboard.component'
          ).then((m) => m.MarketIntelligenceDashboardComponent),
      },
      {
        path: 'master-data/geo',
        canActivate: [permissionGuard],
        data: { module: 'MASTER_DATA', action: 'VIEW' },
        loadComponent: () =>
          import('./features/master-data/geo-master.component').then(
            (m) => m.GeoMasterComponent,
          ),
      },
      {
        path: 'master-data/org',
        canActivate: [permissionGuard],
        data: { module: 'MASTER_DATA', action: 'VIEW' },
        loadComponent: () =>
          import('./features/master-data/org-master.component').then(
            (m) => m.OrgMasterComponent,
          ),
      },
      {
        path: 'system/audit-logs',
        canActivate: [permissionGuard],
        data: { module: 'AUDIT_LOGS', action: 'VIEW' },
        loadComponent: () =>
          import('./features/audit-logs/audit-logs.component').then(
            (m) => m.AuditLogsComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
