import {
  userAdministrationServiceToken,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import type { NotificationContent } from '@nocobase/app-plugin-notification';
import type { ServiceContainer } from '@nocobase/service-provider';

import type { EmailMessage, EmailRecipient } from './types.js';

/** The user lookup stays below the administration list's page limit. */
const USER_BATCH_SIZE = 100;

/**
 * Each enabled person's account address. Service accounts and disabled users have none; without the authentication
 * plugin nobody has one.
 */
export async function resolveAccountAddresses(
  container: ServiceContainer,
  userIds: readonly string[],
): Promise<ReadonlyMap<string, readonly EmailRecipient[]>> {
  const found = new Map<string, readonly EmailRecipient[]>();
  if (!container.has(userAdministrationServiceToken)) return found;
  const users: UserAdministrationService = container.resolve(
    userAdministrationServiceToken,
  );
  for (let index = 0; index < userIds.length; index += USER_BATCH_SIZE) {
    const batch = userIds.slice(index, index + USER_BATCH_SIZE);
    const page = await users.list({
      userIds: batch,
      status: 'enabled',
      kind: 'person',
      pageSize: batch.length,
    });
    for (const user of page.items)
      if (user.email) found.set(user.id, [{ address: user.email }]);
  }
  return found;
}

/** One email to every recipient's address, with the plain text and the HTML a kind rendered. */
export function composeEmail(
  content: NotificationContent,
  recipients: readonly EmailRecipient[],
): EmailMessage {
  const [first, ...rest] = recipients.map(({ address }) => address);
  return {
    subject: content.title,
    to: [first, ...rest],
    text: content.body,
    ...(content.html ? { html: content.html } : {}),
  };
}
