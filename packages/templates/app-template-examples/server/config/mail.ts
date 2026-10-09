import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import { mailConfig, type MailConfig } from '@nocobase/app-plugin-mail/server';

// These providers are offline fixtures owned by Mail Example; no external credentials are needed.
const mail: AppConfigFactory<MailConfig> = defineAppConfig((runtime) => ({
  ...mailConfig(runtime),
  providers: {
    demo: { type: 'mail-example' },
    'demo-microsoft': { type: 'mail-example-microsoft' },
    'demo-imap-smtp': { type: 'mail-example-imap-smtp' },
  },
}));

export default mail;
