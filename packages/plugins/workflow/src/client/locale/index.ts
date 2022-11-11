import { useTranslation } from 'react-i18next';
import { i18n } from '@nocobase/client';

import zhCN from './zh-CN';
import enUS from './en-US';
import jaJP from './ja-JP';
import ruRU from './ru-RU';
import trTR from './tr-TR';

export const NAMESPACE = 'workflow';

i18n.addResources('zh-CN', NAMESPACE, zhCN);
i18n.addResources('en-US', NAMESPACE, enUS);
i18n.addResources('ja-JP', NAMESPACE, jaJP);
i18n.addResources('ru-RU', NAMESPACE, ruRU);
i18n.addResources('tr-TR', NAMESPACE, trTR);

export function lang(key: string) {
  return i18n.t(key, { ns: NAMESPACE });
}

export function useWorkflowTranslation() {
  return useTranslation(NAMESPACE);
}
