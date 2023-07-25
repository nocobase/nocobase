import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'sms-auth';

export function useAuthTranslation() {
  return useTranslation(NAMESPACE);
}
