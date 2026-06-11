/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT,
  FLOW_SETTINGS_PREFERENCE_STORAGE_KEY,
  readFlowSettingsPreference,
  writeFlowSettingsPreference,
} from '../flowSettingsPreference';

describe('flowSettingsPreference', () => {
  beforeEach(() => {
    window.localStorage.removeItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY);
  });

  afterEach(() => {
    window.localStorage.removeItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it('should read disabled preference by default', () => {
    expect(readFlowSettingsPreference()).toBe(false);
  });

  it('should write enabled preference and dispatch change event', () => {
    const listener = vi.fn();
    window.addEventListener(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, listener);

    writeFlowSettingsPreference(true);

    expect(window.localStorage.getItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY)).toBe('1');
    expect(readFlowSettingsPreference()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, listener);
  });
});
