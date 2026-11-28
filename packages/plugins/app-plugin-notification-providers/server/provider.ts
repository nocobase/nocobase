import { notificationExtensionRegistryToken } from '@nocobase/app-plugin-notification';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { registerBuiltInNotificationProviders } from './bootstrap.js';
import { createSmsProviderRegistry } from './sms/config.js';
import { smsProviderRegistryToken } from './sms/provider.js';

export type NotificationProvidersApplication = AppPluginApplication;

export default class NotificationProvidersProvider<
  TApplication extends NotificationProvidersApplication =
    NotificationProvidersApplication,
> extends ServiceProvider<TApplication> {
  public readonly name: string = '@nocobase/app-plugin-notification-providers';

  public override register(): void {
    this.app.container.instance(
      smsProviderRegistryToken,
      createSmsProviderRegistry(),
    );
  }

  public override async boot(): Promise<void> {
    if (!this.app.container.has(notificationExtensionRegistryToken)) {
      throw new Error(
        'Built-in notification Providers require the notification extension registry.',
      );
    }
    registerBuiltInNotificationProviders(
      this.app.container.resolve(notificationExtensionRegistryToken),
    );
  }
}
