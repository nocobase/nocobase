import type { ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { mailExtensionsToken } from '@nocobase/app-plugin-mail/client';
import { ServiceProvider } from '@nocobase/service-provider';

import { DemoSetupAction } from './components/demo-setup-action.js';
import { DEMO_MAILBOX_PROFILES } from './hooks/demo-mailboxes.js';

/**
 * Extends Mail's own pages instead of shipping pages of its own: titles for the three mock Provider types in the
 * connect dialog and the Providers table, and a workspace action that prepares the demo mailboxes.
 */
export class MailExampleClientServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-mail-example/client';

  public override async boot(): Promise<void> {
    const mail = this.app.container.resolve(mailExtensionsToken);
    for (const profile of DEMO_MAILBOX_PROFILES) {
      mail.providerTypes.add({
        type: profile.providerType,
        title: profile.providerLabel,
      });
    }
    mail.slots.workspaceActions.add({
      name: 'mail-example-demo-setup',
      component: DemoSetupAction,
    });
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  MailExampleClientServiceProvider,
];

export default serviceProviders;
