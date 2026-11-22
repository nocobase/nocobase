import { useCan } from '@nocobase/app-plugin-authorization/client';

export { useListData as useSettingsData } from '../../hooks/use-list-data.js';
export { usePageLeave as useSettingsLeave } from '../../hooks/use-page-leave.js';

/** Whether the viewer may perform `action` on a user, or on users in general. */
export function useUserPermission(action: string, id = '*'): boolean {
  return useCan({ resource: { type: 'user', id }, action }).can;
}
