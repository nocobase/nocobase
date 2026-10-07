import { useCan } from '@nocobase/app-plugin-authorization/client';

import {
  aiSettingsCheck,
  type AISettingsKey,
} from '../shared/authorization.js';

/**
 * Whether the signed-in user may change what an AI settings page configures: `manage` on its item. A page opens with
 * `read`, so without `manage` it shows the same settings with its controls turned off. Until the answer arrives the
 * controls stay off.
 */
export function useCanManageAISettings(key: AISettingsKey): boolean {
  return useCan(aiSettingsCheck(key, 'manage')).can;
}
