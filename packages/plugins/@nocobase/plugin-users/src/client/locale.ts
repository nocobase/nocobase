import { useTranslation } from 'react-i18next';

export function useUsersTranslation() {
  return useTranslation(['users', 'client'], { nsMode: 'fallback' });
}
