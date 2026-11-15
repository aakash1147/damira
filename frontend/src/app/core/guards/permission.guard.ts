import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredModule = route.data['module'] as string;
  const requiredAction = (route.data['action'] as string) || 'VIEW';

  if (!requiredModule) {
    return true;
  }

  if (authService.hasPermission(requiredModule, requiredAction)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
