/**
 * Studio's own settings items (`STUDIO_SETTINGS_ACTIONS`): who manages the organization's API keys, who may make keys of
 * their own, the Git connections and the knowledge search, listed in the permission workspace under a Studio subsection
 * of administration. Titles are Studio's (`roles.items.*`, `roles.capabilities.*`).
 */
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';

import {
  STUDIO_NAMESPACE,
  STUDIO_SETTINGS_ACTIONS,
} from '../../shared/access.js';

export function registerStudioSettings(authz: AppAuthorization): void {
  authz.ui.sections.add({
    name: 'studio',
    title: { key: 'navigation.config', ns: STUDIO_NAMESPACE },
    parent: 'administration',
  });
  for (const [id, actions] of Object.entries(STUDIO_SETTINGS_ACTIONS)) {
    const local = id.slice(id.indexOf('.') + 1);
    authz.settings.add({
      id,
      title: { key: `roles.items.${local}`, ns: STUDIO_NAMESPACE },
      actions: actions.map((name: string) => ({
        name,
        title: {
          key: `roles.capabilities.${local}.${name}`,
          ns: STUDIO_NAMESPACE,
        },
      })),
    });
    authz.ui.place({ type: 'settings', id }, { section: 'studio' });
  }
}
