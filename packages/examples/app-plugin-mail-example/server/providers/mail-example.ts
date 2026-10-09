import {
  mailProviderRegistryToken,
  type MailProviderRegistry,
} from '@nocobase/app-plugin-mail/server';
import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';

import { createDemoMailProviderDefinition } from './demo-mail-provider.js';
import { DemoMailboxes } from './demo-mailboxes.js';

export interface MailExampleProviderApplication {
  readonly container: ServiceContainer;
}

export class MailExampleProvider extends ServiceProvider<MailExampleProviderApplication> {
  public readonly name: string = '@nocobase/app-plugin-mail-example';
  private readonly mailboxes: DemoMailboxes = new DemoMailboxes();

  public override boot(): Promise<void> {
    const registry: MailProviderRegistry = this.app.container.resolve(
      mailProviderRegistryToken,
    );
    registry.register(createDemoMailProviderDefinition(this.mailboxes));
    registry.register(
      createDemoMailProviderDefinition(
        this.mailboxes,
        'mail-example-microsoft',
        'Microsoft 365 Demo Mail',
      ),
    );
    registry.register(
      createDemoMailProviderDefinition(
        this.mailboxes,
        'mail-example-imap-smtp',
        'IMAP/SMTP Demo Mail',
      ),
    );
    return Promise.resolve();
  }
}
