/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const FLOW_SETTINGS_PREFERENCE_STORAGE_KEY = 'NOCOBASE_V1_FLOW_SETTINGS_ENABLED';
export const FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT = 'nocobase:v1:flow-settings-preference-change';

export function readFlowSettingsPreference() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY) === '1';
  } catch (error) {
    console.error('[NocoBase] Failed to read flow settings preference.', error);
    return false;
  }
}

export function writeFlowSettingsPreference(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, enabled ? '1' : '0');
    window.dispatchEvent(
      new CustomEvent(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, {
        detail: {
          enabled,
        },
      }),
    );
  } catch (error) {
    console.error('[NocoBase] Failed to write flow settings preference.', error);
  }
}
