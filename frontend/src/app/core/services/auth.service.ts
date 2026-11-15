import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginDto, UserProfile } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/auth`;

  // Reactive State via Signals
  readonly currentUser = signal<UserProfile | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRoles = computed(() => this.currentUser()?.roles || []);
  readonly userPermissions = computed(() => this.currentUser()?.permissions || []);

  login(dto: LoginDto): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, dto).pipe(
      tap((res) => {
        const payload: AuthResponse = res.data || res;
        this.setSession(payload);
      }),
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.API_URL}/logout`, { refreshToken }).subscribe({
        error: () => {},
      });
    }
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<any>(`${this.API_URL}/refresh-token`, { refreshToken }).pipe(
      tap((res) => {
        const payload: AuthResponse = res.data || res;
        this.setTokens(payload.accessToken, payload.refreshToken);
      }),
      catchError((err) => {
        this.clearSession();
        this.router.navigate(['/auth/login']);
        return throwError(() => err);
      }),
    );
  }

  hasPermission(module: string, action: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.roles.includes('super-admin')) return true;
    const requiredSlug = `${module}:${action}`;
    return user.permissions.includes(requiredSlug);
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.roles.includes('super-admin')) return true;
    return roles.some((r) => user.roles.includes(r));
  }

  getAccessToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  private setSession(auth: AuthResponse): void {
    this.setTokens(auth.accessToken, auth.refreshToken);
    localStorage.setItem(environment.userKey, JSON.stringify(auth.user));
    this.currentUser.set(auth.user);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(environment.tokenKey, accessToken);
    localStorage.setItem(environment.refreshTokenKey, refreshToken);
  }

  private clearSession(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem(environment.userKey);
    this.currentUser.set(null);
  }

  private getStoredUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(environment.userKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
