import { useTranslation } from 'react-i18next';

export function useACLTranslation() {
  return useTranslation(['acl', 'client'], { nsMode: 'fallback' });
}
