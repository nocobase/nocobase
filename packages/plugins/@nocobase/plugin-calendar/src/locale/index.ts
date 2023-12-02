import { i18n } from '@nocobase/client';
import { useTranslation as useT } from 'react-i18next';

export const NAMESPACE = 'calendar';

export function i18nt(key: string, options: any = {}) {
  return i18n.t(key, { ns: NAMESPACE, ...options });
}

export function generateNTemplate(key: string) {
  return `{{t('${key}', { ns: '${NAMESPACE}' })}}`;
}

export function useTranslation() {
  return useT(NAMESPACE);
}
