/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient, i18n } from '@nocobase/client';
import _ from 'lodash';

const sentMissingKeys = new Set<string>();
const pendingMissingKeys = new Map<string, string>();
const DEBOUNCE_DELAY = 2000;

const shouldSaveKey = (key: string): boolean => {
  if (key.startsWith('t{{') || key.startsWith('{{t(')) {
    return false;
  }
  return true;
};

const submitPendingKeys = async (apiClient: APIClient) => {
  if (pendingMissingKeys.size === 0) {
    return;
  }

  try {
    const keysToSubmit = Array.from(pendingMissingKeys.entries()).map(([key, ns]) => ({
      text: key,
      ns,
    }));

    await apiClient.request({
      method: 'POST',
      url: '/localizationTexts:missing',
      data: {
        keys: keysToSubmit,
      },
    });

    pendingMissingKeys.clear();
  } catch (error) {
    console.error('[i18n] Failed to submit missing keys:', error);
  }
};

const submitPendingKeysDebounced = _.debounce((apiClient: APIClient) => {
  submitPendingKeys(apiClient);
}, DEBOUNCE_DELAY);

/**
 * 配置 i18n 实例的 saveMissing 和 missingKeyHandler
 */
const configureMissingKeyHandling = ({ apiClient }: { apiClient: APIClient }) => {
  i18n.options.saveMissing = true;
  // 只关心当前语言
  i18n.options.saveMissingTo = 'current';
  // 不放大复数
  i18n.options.saveMissingPlurals = false;
  // 只有真正缺失才触发
  i18n.options.updateMissing = false;

  i18n.options.missingKeyHandler = async (
    lngs: readonly string[],
    ns: string,
    key: string,
    fallbackValue: string,
    updateMissing: boolean,
    options: any,
  ) => {
    try {
      if (!shouldSaveKey(key)) {
        return fallbackValue || key;
      }

      const uniqueKey = `${ns}:${key}`;
      if (sentMissingKeys.has(uniqueKey)) {
        return fallbackValue || key;
      }

      sentMissingKeys.add(uniqueKey);

      pendingMissingKeys.set(key, ns);

      // 防抖提交
      submitPendingKeysDebounced(apiClient);
    } catch (error) {
      console.error('[i18n] Error in missingKeyHandler:', error);
    }

    return fallbackValue || key;
  };
};

export const registerMissingKeyHandler = ({ apiClient }: { apiClient: APIClient }) => {
  const prevOptions = {
    saveMissing: i18n.options.saveMissing,
    saveMissingTo: i18n.options.saveMissingTo,
    saveMissingPlurals: i18n.options.saveMissingPlurals,
    updateMissing: i18n.options.updateMissing,
    missingKeyHandler: i18n.options.missingKeyHandler,
  };

  configureMissingKeyHandling({ apiClient });

  return () => {
    i18n.options.saveMissing = prevOptions.saveMissing;
    i18n.options.saveMissingTo = prevOptions.saveMissingTo;
    i18n.options.saveMissingPlurals = prevOptions.saveMissingPlurals;
    i18n.options.updateMissing = prevOptions.updateMissing;
    i18n.options.missingKeyHandler = prevOptions.missingKeyHandler;
    submitPendingKeysDebounced.cancel();
  };
};
