import { useService } from '@nocobase/app-client';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { MailClient } from './mail-client.js';

export const mailClientToken: ServiceToken<MailClient> =
  createServiceToken<MailClient>('@nocobase/app-plugin-mail/client');

export function useMailClient(): MailClient {
  return useService(mailClientToken);
}
