import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'logger';

export function useLoggerTranslation() {
  return useTranslation(NAMESPACE);
}
