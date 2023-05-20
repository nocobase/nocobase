import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'localization-management';

export function localManageLang(key: string) {
  return i18n.t(key, { ns: NAMESPACE });
}
