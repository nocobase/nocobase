/**
 * What this plugin offers to be granted: one settings item, `foundation.plugins`, whose `read` action opens the
 * plugins page and its API. The server registers it with the authorization plugin; the client route checks the same
 * grant, so a role either sees the page and its data or neither.
 */

/** The plugin's package name, which is also the namespace of its translations. */
export const FOUNDATION_PACKAGE = '@nocobase/app-plugin-foundation';

/** The first path segment of every route this plugin serves under `/api`, and the `domain` of its errors. */
export const FOUNDATION_NAMESPACE = 'foundation';

/** A title as the authorization plugin stores it: an i18n key in this plugin's namespace. */
export function accessText(key: string): {
  readonly key: string;
  readonly ns: string;
} {
  return { key: `access.${key}`, ns: FOUNDATION_PACKAGE };
}

export const PLUGINS_SETTINGS_ID = 'foundation.plugins';

/** «Plugins · View»: opens the plugins page and reads `GET /api/foundation/plugins`. */
export const PLUGINS_ACCESS: {
  readonly resource: {
    readonly type: 'settings';
    readonly id: 'foundation.plugins';
  };
  readonly action: 'read';
} = {
  resource: { type: 'settings', id: PLUGINS_SETTINGS_ID },
  action: 'read',
};

/** The permission workspace subsection (under administration) the settings item is listed in. */
export const SYSTEM_SECTION = 'system';
