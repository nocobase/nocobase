import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'cas';

export function useAuthTranslation() {
  return useTranslation(NAMESPACE);
}

export function generateNTemplate(key: string) {
  return `{{t('${key}', { ns: '${NAMESPACE}', nsMode: 'fallback' })}}`;
}
