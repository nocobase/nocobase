import { useTranslation } from 'react-i18next';
import { i18n } from '@nocobase/client';

import zhCN from './zh-CN';

export const NAMESPACE = 'sequence_field';

i18n.addResources('zh-CN', NAMESPACE, zhCN);

export function lang(key: string, options = {}) {
  return i18n.t(key, { ...options, ns: NAMESPACE });
}

export function usePluginTranslation() {
  return useTranslation(NAMESPACE);
}
