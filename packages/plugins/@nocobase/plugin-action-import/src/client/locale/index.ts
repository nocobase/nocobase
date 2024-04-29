import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'action-import';

export function useImportTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}
