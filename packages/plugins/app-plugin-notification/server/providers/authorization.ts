import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  NOTIFICATION_ACCESS_NAMESPACE,
  NOTIFICATION_SETTINGS_ACTIONS,
  NOTIFICATION_SETTINGS_ID,
} from '../../shared/access.js';

/** The permission workspace subsection (under administration) that lists the messaging settings items. */
export const MESSAGES_SETTINGS_SECTION = 'messages';

const text = (key: string) => ({
  key: `authorization.${key}`,
  ns: NOTIFICATION_ACCESS_NAMESPACE,
});

/** Registers the `notification` settings item with its `read` and `manage` actions. */
export class NotificationAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${NOTIFICATION_ACCESS_NAMESPACE}/authorization`;

  public override boot(): Promise<void> {
    // An application may be assembled without authorization, as a mail-only host is: there is no catalog to list in.
    if (!this.app.container.has(authorizationToken)) return Promise.resolve();
    const authz = this.app.container.resolve(authorizationToken);
    // Another messaging plugin, such as the mail center, may own the same subsection.
    authz.ui.sections.add({
      name: MESSAGES_SETTINGS_SECTION,
      title: text('section'),
      parent: 'administration',
      extend: true,
    });
    authz.settings.add({
      id: NOTIFICATION_SETTINGS_ID,
      title: text('title'),
      actions: NOTIFICATION_SETTINGS_ACTIONS.map((name) => ({
        name,
        title: text(name),
      })),
    });
    authz.ui.place(
      { type: 'settings', id: NOTIFICATION_SETTINGS_ID },
      { section: MESSAGES_SETTINGS_SECTION },
    );
    return Promise.resolve();
  }
}
