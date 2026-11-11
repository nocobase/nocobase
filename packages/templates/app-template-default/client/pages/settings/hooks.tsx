import { useCan } from '@nocobase/app-plugin-authorization/client';

/** Compatibility entry for prepared settings pages and application-owned consumers. */
export { useListData as useSettingsData } from '#hooks/use-list-data';

export function useUserPermission(action: string, id = '*') {
  return useCan({ resource: { type: 'user', id }, action }).can;
}
export function useRolePermission(action: string) {
  return useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action,
  }).can;
}

/** Leave protection is owned by the shell while page Effects are suspended. */
export { usePageLeave as useSettingsLeave } from '../../routing/route-leave-boundary.js';
