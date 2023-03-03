import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'comments';

export function lang(key: string) {
  return i18n.t(key, { ns: NAMESPACE });
}

export function useCommentTranslation() {
  return useTranslation(NAMESPACE);
}
