import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'action-export';

export function useExportTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}
