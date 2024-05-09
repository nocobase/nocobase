import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'ldap';

export function lang(key: string) {
  return i18n.t(key, { n: NAMESPACE });
}

export function useLdapTranslation() {
  return useTranslation(NAMESPACE);
}
