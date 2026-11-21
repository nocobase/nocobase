import { SYSTEM_SETTINGS_ROUTE_PATH } from '@nocobase/app-client/plugins';
import { useTranslation } from '@nocobase/i18n/client';

import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import type { LocalizedText } from '../authorization-client.js';
import type { AuthorizationPageTab } from './extensions.js';

/** Translates a title that names its own namespace, or this plugin's when it names none. */
export function useLocalizedText(): (value: LocalizedText) => string {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  return (value) =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
}

/** Where a page tab lives: tabs are pages of the System settings, so a link, Back and a reload keep the tab. */
export function pageTabHref(tab: Pick<AuthorizationPageTab, 'path'>): string {
  return `${SYSTEM_SETTINGS_ROUTE_PATH}${tab.path}`;
}
