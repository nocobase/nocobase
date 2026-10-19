import {
  defineAppConfig,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import { vapidKeys } from './keys.js';

export interface PushConfig {
  privateKey?: string;
  contact: string;
  channel?: string;
}
export function definePushConfig(
  defaults: Partial<PushConfig> = {},
): AppConfigFactory<PushConfig> {
  return defineAppConfig<PushConfig>({
    env: {
      WEB_PUSH_PRIVATE_KEY: envString('privateKey', {
        description:
          'The persistent VAPID P-256 private key (32-byte hex or base64url). Changing it requires devices to subscribe again.',
        secret: true,
        generate: 'secret',
        required: false,
      }),
      WEB_PUSH_CONTACT: envString('contact', {
        description: 'An HTTPS or mailto contact for the Web Push service.',
        required: false,
      }),
    },
    defaults: { contact: 'mailto:admin@example.com', ...defaults },
    validate(value, context) {
      if (value.privateKey) {
        try {
          vapidKeys(value.privateKey);
        } catch {
          context.error(
            'privateKey',
            'Must be a valid 32-byte P-256 private key.',
          );
        }
      }
      if (!/^(mailto:|https:\/\/)/u.test(value.contact))
        context.error('contact', 'Must be an HTTPS or mailto contact.');
    },
  });
}
const push: AppConfigFactory<PushConfig> = definePushConfig();
export default push;
