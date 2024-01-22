import { i18n } from '@nocobase/client';

export const NAMESPACE = 'database-connections';

export function lang(key: string, options = {}) {
  return i18n.t(key, { ...options, ns: NAMESPACE });
}
