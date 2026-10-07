import { useCan } from '@nocobase/app-plugin-authorization/client';

import type { SettingsAction, SettingsItem } from '../../shared/access.js';

/**
 * Whether the signed-in user holds `action` on one of this plugin's settings items. False while checking.
 */
export function useSetting(
  item: SettingsItem,
  action: SettingsAction,
): boolean {
  return useCan({ resource: { type: 'settings', id: item }, action }).can;
}
