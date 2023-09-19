import { i18n } from '@nocobase/client';
import { useTranslation as useT } from 'react-i18next';

export const NAMESPACE = 'mobile-client';

// i18n.addResources('zh-CN', NAMESPACE, zhCN);
// i18n.addResources('en-US', NAMESPACE, enUS);

export function lang(key: string) {
  return i18n.t(key, { ns: NAMESPACE });
}

export function generateNTemplate(key: string) {
  return `{{t('${key}', { ns: '${NAMESPACE}', nsMode: 'fallback' })}}`;
}

export function useTranslation() {
  return useT([NAMESPACE, 'client'], {
    nsMode: 'fallback',
  });
}
