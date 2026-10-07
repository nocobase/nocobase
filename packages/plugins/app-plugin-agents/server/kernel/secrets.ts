/**
 * Values the server must read back to deliver them — variables, model service keys — sealed with the application's
 * secrets service (`secrets.keys`), each bound to the record it belongs to. Without keys, storing or reading one fails
 * with `SECRETS_KEY_MISSING` (503), which says what to configure.
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import type { SecretsService } from '@nocobase/app-server/secrets';

export const VARIABLES_SECRET_PURPOSE = '@nocobase/app-plugin-agents/variables';
export const MODEL_SERVICE_KEY_SECRET_PURPOSE =
  '@nocobase/app-plugin-agents/model-service-keys';

/** What the plugin needs of the secrets service. */
export type AgentsSecrets = Pick<SecretsService, 'ready' | 'seal' | 'open'>;

/** Seals and opens values of one purpose, each bound to its record by `aad`. */
export interface Sealer {
  seal(plaintext: string, aad: readonly string[]): string;
  open(sealed: string, aad: readonly string[]): string;
}

export function createSealer(
  secrets: AgentsSecrets | undefined,
  purpose: string,
): Sealer {
  const ready = (): AgentsSecrets => {
    if (!secrets?.ready)
      throw new ProtocolError(
        'SECRETS_KEY_MISSING',
        'Secrets need a key: set secrets.keys in the application configuration, or SECRETS_KEYS in the environment.',
      );
    return secrets;
  };
  return {
    seal: (plaintext, aad) => ready().seal(plaintext, { purpose, aad }),
    open: (sealed, aad) => ready().open(sealed, { purpose, aad }),
  };
}
