import { useCan } from '../use-can.js';

/** Reads a settings list or record, refreshing it when its data changes. */
export { useListData as useSettingsData } from '#hooks/use-list-data';

export function useUserPermission(action: string, id = '*'): boolean {
  return useCan({ resource: { type: 'user', id }, action }).can;
}
export function useRolePermission(action: string): boolean {
  return useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action,
  }).can;
}

/** Asks before leaving a form with unsaved changes. */
export { usePageLeave as useSettingsLeave } from './use-page-leave.js';
