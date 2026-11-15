import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User session not found.');
    }

    // Super Admin has unrestricted access across all modules
    if (user.roles && user.roles.includes('super-admin')) {
      return true;
    }

    const userPermissions: string[] = user.permissions || [];

    const hasAllRequired = requiredPermissions.every((req) => {
      const slug = `${req.module}:${req.action}`;
      return userPermissions.includes(slug);
    });

    if (!hasAllRequired) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions
          .map((p) => `${p.module}:${p.action}`)
          .join(', ')}`,
      );
    }

    return true;
  }
}
