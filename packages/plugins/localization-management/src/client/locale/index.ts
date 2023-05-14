import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'localization-management';

// i18n.addResources('zh-CN', NAMESPACE, zhCN);

export function lang(key: string) {
  return i18n.t(key, { ns: NAMESPACE });
}

export function useLocalizationManagementTranslation() {
  return useTranslation(NAMESPACE);
}
