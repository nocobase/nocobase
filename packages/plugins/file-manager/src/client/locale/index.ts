import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'file-manager';

export function useFmTranslation() {
  return useTranslation(NAMESPACE);
}
