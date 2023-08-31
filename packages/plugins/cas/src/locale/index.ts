import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import zhCN from './zh-CN';

export const NAMESPACE = 'cas';

i18n.addResources('zh-CN', NAMESPACE, zhCN);

export function useAuthTranslation() {
  return useTranslation(NAMESPACE);
}
