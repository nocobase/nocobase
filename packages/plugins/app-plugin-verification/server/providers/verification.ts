import {
  notificationServiceToken,
  type NotificationConfigInput,
} from '@nocobase/app-plugin-notification';
import {
  isE164,
  userPhoneDirectoryToken,
  type SmsMessage,
} from '@nocobase/app-plugin-notification-providers/sms';
import { cachingToken } from '@nocobase/app-server/caching';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import type { VerificationConfig } from '../config.js';
import { DefaultVerificationService } from '../services/verification.js';
import { verificationServiceToken } from '../tokens.js';

export class VerificationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-verification';

  public override register(): void {
    const { container, config } = this.app;
    const createService = () => {
      const counter = container
        .resolve(cachingToken)
        .getCounter({ namespace: 'verification-send' });
      const logger = container.resolve(loggingToken).getLogger('verification');
      return new DefaultVerificationService({
        database: container.resolve(databaseManagerToken),
        secrets: container.resolve(secretsServiceToken),
        config: config.get<VerificationConfig>('verification'),
        incrementSender: (key, ttl) => counter.increment(key, 1, ttl),
        audit: (event) => logger.info(event, 'Verification event.'),
        sms: {
          id: 'sms',
          normalizeTarget: (target) => (isE164(target) ? target : undefined),
          deliver: async ({ channel, target, template, code }) => {
            const channels =
              config.get<NotificationConfigInput>('notification')?.channels;
            const destination =
              channels && Object.hasOwn(channels, channel)
                ? channels[channel]
                : undefined;
            if (
              !destination ||
              ('type' in destination
                ? destination.type
                : destination.provider) !== 'sms' ||
              destination.enabled === false
            ) {
              return false;
            }
            const message: SmsMessage = {
              to: target,
              template,
              params: { code },
            };
            const [result] = await container
              .resolve(notificationServiceToken)
              .sendTransient({ channel, message });
            return result?.status === 'accepted';
          },
        },
      });
    };
    let service: DefaultVerificationService | undefined;
    const resolve = () => (service ??= createService());
    container.singleton(verificationServiceToken, resolve);
    container.singleton(userPhoneDirectoryToken, resolve);
  }
}
