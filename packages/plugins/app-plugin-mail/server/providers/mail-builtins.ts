import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';

import { gmailMailProviderDefinition } from '../adapters/gmail/definition.js';
import { microsoftMailProviderDefinition } from '../adapters/microsoft/definition.js';
import { createImapSmtpMailProviderDefinition } from '../adapters/imap-smtp/definition.js';
import { createImapLocationPersistence } from '../store/sync.js';
import { mailProviderRegistryToken } from '../tokens.js';

export class MailBuiltinsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-mail/builtins';

  public override boot(): Promise<void> {
    this.app.container
      .resolve(mailProviderRegistryToken)
      .register(gmailMailProviderDefinition)
      .register(microsoftMailProviderDefinition)
      .register(
        // Each IMAP adapter gets location reads and commits bound to its own account.
        createImapSmtpMailProviderDefinition((accountId) =>
          createImapLocationPersistence(
            this.app.container.resolve(databaseManagerToken),
            accountId,
          ),
        ),
      );
    return Promise.resolve();
  }
}
