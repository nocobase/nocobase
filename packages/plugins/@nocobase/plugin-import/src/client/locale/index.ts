import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'import';

export function useImportTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}
