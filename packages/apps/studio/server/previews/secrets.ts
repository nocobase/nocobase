/**
 * The key upload tickets are signed with (`../builds`). Repositories' preview variables used to be sealed here too;
 * they were removed (`202610170010_studio_drop_repo_preview_variables`): a preview takes its environment's values and
 * its own, like every other App.
 */
import { randomBytes } from 'node:crypto';

import type { SecretsService } from '@nocobase/app-server/secrets';

export const BUILD_UPLOAD_TICKET_PURPOSE = 'studio/builds/upload-tickets';

/**
 * The key upload tickets are signed with: derived from the secrets keys when there are any, `auth.secret` otherwise,
 * and failing both a key of this process, so tickets end with it rather than being signed with a known value.
 */
export function uploadTicketKey(
  secrets: Pick<SecretsService, 'ready' | 'keyring'> | undefined,
  authSecret: string | undefined,
): string {
  if (secrets?.ready)
    return secrets.keyring(BUILD_UPLOAD_TICKET_PURPOSE)[0].value;
  return authSecret ?? randomBytes(32).toString('base64url');
}
