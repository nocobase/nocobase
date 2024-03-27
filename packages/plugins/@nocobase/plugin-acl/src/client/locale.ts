import { useTranslation } from 'react-i18next';

export function useACLTranslation() {
  return useTranslation(['@nocobase/plugin-acl', 'client'], { nsMode: 'fallback' });
}
