import { mailConfig } from '@nocobase/app-plugin-mail/server';
import { defineMailConfig } from '@nocobase/app-server/mailer';

export default defineMailConfig({
  defaults: mailConfig,
  env: mailConfig.rules?.env,
});
