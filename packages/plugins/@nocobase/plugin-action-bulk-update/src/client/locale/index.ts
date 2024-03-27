import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'bulk-update';

export function lang(key: string) {
  return i18n.t(key, { ns: NAMESPACE });
}

export function generateNTemplate(key: string) {
  return `{{t('${key}', { ns: '${NAMESPACE}', nsMode: 'fallback' })}}`;
}

export function useBulkUpdateTranslation() {
  return useTranslation(NAMESPACE, {
    nsMode: 'fallback',
  });
}
