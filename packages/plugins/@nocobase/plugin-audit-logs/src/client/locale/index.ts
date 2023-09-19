import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'audit-logs';

export function lang(key: string) {
  return i18n.t(key, { ns: NAMESPACE });
}

export function useAuditLogsTranslation() {
  return useTranslation(NAMESPACE);
}
