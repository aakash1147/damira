import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  module: string;
  action: string;
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: (string | RequiredPermission)[]) =>
  SetMetadata(
    PERMISSIONS_KEY,
    permissions.map((p) => {
      if (typeof p === 'string') {
        const [module, action] = p.split(':');
        return { module, action };
      }
      return p;
    }),
  );
