import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { MailersConfig } from '@nocobase/app-server/mailers/config';
import {
  describeInvitationEmailChannel,
  type UsersConfig,
} from '@nocobase/app-plugin-users/server/config';

/** Only a derived boolean reaches the existing SPA bootstrap; all transport configuration stays private. */
export default class NotificationManagementProvider extends ServiceProvider<AppPluginApplication> {
  readonly name = 'app.notification-management';
  override boot(): Promise<void> {
    const channel = describeInvitationEmailChannel({
      invitations: this.app.config.get<UsersConfig>('users')?.invitations,
      mailers: this.app.config.get<MailersConfig>('mailers'),
      channels: this.app.config.get<{
        channels?: Readonly<Record<string, { enabled?: boolean }>>;
      }>('notification')?.channels,
    });
    this.app.config.mergeDefaults({
      client: {
        notificationTemplates: { invitationConfigured: channel.configured },
      },
    });
    return Promise.resolve();
  }
}
