import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import { gmailMailProviderDefinition } from '../adapters/gmail/definition.js';
import { microsoftMailProviderDefinition } from '../adapters/microsoft/definition.js';
import { imapSmtpMailProviderDefinition } from '../adapters/imap-smtp/definition.js';
import { mailProviderRegistryToken } from '../tokens.js';

export class MailBuiltinsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-mail/builtins';

  public override boot(): Promise<void> {
    this.app.container
      .resolve(mailProviderRegistryToken)
      .register(gmailMailProviderDefinition)
      .register(microsoftMailProviderDefinition)
      .register(imapSmtpMailProviderDefinition);
    return Promise.resolve();
  }
}
