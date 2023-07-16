import { useTranslation as useT } from 'react-i18next';

export const NAMESPACE = 'theme-editor';

export function useTranslation() {
  return useT([NAMESPACE, 'client'], {
    nsMode: 'fallback',
  });
}
