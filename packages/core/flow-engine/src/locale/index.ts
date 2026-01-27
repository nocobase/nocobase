/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import enUS from './en-US.json';
import zhCN from './zh-CN.json';
import { FLOW_ENGINE_NAMESPACE } from '../utils';

export const locales = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

/**
 * Get translation for a key with fallback
 */
export function getFlowEngineTranslation(key: string, locale = 'en-US'): string {
  const translations = locales[locale] || locales['en-US'];
  return translations[key] || key;
}

/**
 * Initialize flow-engine locale resources
 * This should be called when the flow-engine is initialized
 */
export function initFlowEngineLocale(i18nInstance?: any) {
  if (i18nInstance && typeof i18nInstance.addResourceBundle === 'function') {
    // Register flow-engine translations to the flow-engine namespace
    Object.entries(locales).forEach(([locale, resources]) => {
      i18nInstance.addResourceBundle(locale, FLOW_ENGINE_NAMESPACE, resources, true, false);
    });
  }
}
