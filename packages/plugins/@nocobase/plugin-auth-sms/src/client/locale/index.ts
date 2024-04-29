import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'auth-sms';

export function useAuthTranslation() {
  return useTranslation(NAMESPACE);
}
