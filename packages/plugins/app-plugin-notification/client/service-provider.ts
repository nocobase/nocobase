import { apiClientToken, ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  createNotificationChannelTypeRegistry,
  createNotificationPreferenceSectionRegistry,
  notificationChannelTypesToken,
  notificationPreferenceSectionsToken,
} from './extensions.js';
import { configureNotificationClient } from './runtime.js';

export class NotificationServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-notification/client';

  public override register(): void {
    // Channel plugins register their type display and personal sections into these in their own `boot()`.
    this.app.container.singleton(notificationChannelTypesToken, () =>
      createNotificationChannelTypeRegistry(),
    );
    this.app.container.singleton(notificationPreferenceSectionsToken, () =>
      createNotificationPreferenceSectionRegistry(),
    );
  }

  public override boot(): Promise<void> {
    configureNotificationClient(this.app.container.resolve(apiClientToken));
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  NotificationServiceProvider,
];

export default serviceProviders;
