import { apiClientToken, ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { MailExtensions, mailExtensionsToken } from './extensions.js';
import { mailClientToken } from './runtime.js';
import { MailClient } from './mail-client.js';

export class MailClientServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-mail/client';

  public override register(): void {
    this.app.container.singleton(
      mailClientToken,
      () => new MailClient(this.app.container.resolve(apiClientToken)),
    );
    // Registered here so every other provider's `boot()` can add to it before the first page renders.
    this.app.container.singleton(
      mailExtensionsToken,
      () => new MailExtensions(),
    );
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  MailClientServiceProvider,
];

export default serviceProviders;
