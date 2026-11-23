import type { ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  createInboxExtensionList,
  inboxRenderersToken,
  inboxSourcesToken,
} from './inbox-page/extensions.js';

/**
 * Binds the inbox's two extension lists, empty: an application or plugin adds an entry renderer with
 * `app.container.resolve(inboxRenderersToken).register(renderer)` and a pending source with
 * `resolve(inboxSourcesToken).register(source)`, typically from its own client service provider's `boot()`.
 */
export class InAppNotificationClientServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-notification-in-app/client';

  public override register(): void {
    this.app.container.singleton(inboxRenderersToken, () =>
      createInboxExtensionList(),
    );
    this.app.container.singleton(inboxSourcesToken, () =>
      createInboxExtensionList(),
    );
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  InAppNotificationClientServiceProvider,
];

export default serviceProviders;
