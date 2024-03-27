import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = '@nocobase/plugin-bulk-edit';

export function lang(key: string) {
  return i18n.t(key, { ns: NAMESPACE });
}

export function generateNTemplate(key: string) {
  return `{{t('${key}', { ns: '${NAMESPACE}', nsMode: 'fallback' })}}`;
}

export function useBulkEditTranslation() {
  return useTranslation(NAMESPACE, {
    nsMode: 'fallback',
  });
}
