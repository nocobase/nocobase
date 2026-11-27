import type { ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import {
  notificationChannelTypesToken,
  notificationPreferenceSectionsToken,
} from '@nocobase/app-plugin-notification/client';
import { ServiceProvider } from '@nocobase/service-provider';
import { MonitorSmartphoneIcon } from 'lucide-react';

import { PushPreferences } from './components/preferences.js';

const NAMESPACE = '@nocobase/app-plugin-notification-web-push';

/**
 * Adds the "Browser push devices" section to Personal settings › Messages › Notifications, and how the settings page
 * names the `web-push` channel type. Both registries belong to the notification plugin; without it there is nothing
 * to add to.
 */
export class WebPushClientServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-notification-web-push/client';

  public override boot(): Promise<void> {
    const { container } = this.app;
    if (container.has(notificationPreferenceSectionsToken))
      container.resolve(notificationPreferenceSectionsToken).register({
        key: 'web-push.devices',
        order: 100,
        component: PushPreferences,
      });
    if (container.has(notificationChannelTypesToken))
      container.resolve(notificationChannelTypesToken).register({
        type: 'web-push',
        title: {
          ns: NAMESPACE,
          key: 'channelType.title',
          defaultValue: 'Browser push',
        },
        icon: MonitorSmartphoneIcon,
        testHint: {
          ns: NAMESPACE,
          key: 'channelType.testHint',
          defaultValue:
            'Sends a test notification to the browsers you turned push on for. Turn it on under Personal settings › Notifications first.',
        },
      });
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  WebPushClientServiceProvider,
];

export default serviceProviders;
