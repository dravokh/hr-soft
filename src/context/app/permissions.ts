import { Role } from '../../types';
import { ALL_PERMISSIONS } from '../../constants/permissions';

export const ensureAdminPermissions = (roles: Role[]): Role[] => {
  return roles.map((role) => {
    let permissions = role.permissions;

    if (role.id === 1) {
      permissions = ALL_PERMISSIONS.map((permission) => permission.id);
    }

    return {
      ...role,
      permissions: Array.from(new Set(permissions))
    };
  });
};
