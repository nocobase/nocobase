import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'auth';

export function useAuthTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}
