import {
  createKeyring,
  inspectSecret,
  isSecretsError,
  SecretsError,
  type DerivedSecret,
  type Keyring,
  type SecretsEnvelopeInfo,
  type SecretsSealOptions,
} from '@nocobase/secrets';

import type { SecretsConfig } from './config.js';

export {
  SecretsError,
  isSecretsError,
  type DerivedSecret,
  type SecretsEnvelopeInfo,
  type SecretsErrorCode,
  type SecretsSealOptions,
} from '@nocobase/secrets';

/** What `secrets status` and `secrets rotate` hand a store. */
export interface SecretsStoreContext {
  readonly secrets: SecretsService;
  /** How many rows to read and rewrite at a time. */
  readonly batchSize: number;
  /** `rotate --dry-run`: count what would change, write nothing. */
  readonly dryRun: boolean;
}

export interface SecretsStoreStatus {
  /** Sealed values the store holds. */
  readonly total: number;
  /** Count of sealed values by the key version that sealed them. */
  readonly byVersion: Readonly<Record<string, number>>;
  /** Values not sealed with the current key, including legacy ones a store still reads. */
  readonly needsReseal: number;
  /** Values in a format the store reads only for compatibility. */
  readonly legacy?: number;
}

export interface SecretsResealResult {
  /** Values rewritten under the current key (or that would be, under `dryRun`). */
  readonly resealed: number;
  /** Values that could not be opened, left as they were. */
  readonly failed: number;
}

/**
 * A place that keeps sealed values: one table, or a few columns of one. `reseal` rewrites every value not sealed with
 * the current key and must be safe to run again — after an interruption, or alongside a running application.
 */
export interface SecretsStore {
  readonly name: string;
  status(context: SecretsStoreContext): Promise<SecretsStoreStatus>;
  reseal(context: SecretsStoreContext): Promise<SecretsResealResult>;
}

export interface SecretsService {
  /** Whether keys are configured, so that `seal`, `open` and `keyring` work. */
  readonly ready: boolean;
  /** The version new values are sealed with; `undefined` when not ready. */
  readonly currentVersion: number | undefined;
  /** Encrypts `plaintext` for `purpose`. Throws `SECRETS_NOT_CONFIGURED` when not ready. */
  seal(plaintext: string, options: SecretsSealOptions): string;
  /** Decrypts what `seal` produced with the same purpose and `aad`. */
  open(sealed: string, options: SecretsSealOptions): string;
  /** The key version of a sealed value, without opening it. */
  inspect(sealed: string): SecretsEnvelopeInfo;
  /** Whether a sealed value was sealed with a key other than the current one. */
  needsReseal(sealed: string): boolean;
  /**
   * Every configured version's key derived for `purpose`, current first, for a library that encrypts on its own and
   * takes a rotation list, such as Better Auth's `secrets`.
   */
  keyring(purpose: string): DerivedSecret[];
  registerStore(store: SecretsStore): void;
  stores(): readonly SecretsStore[];
}

export const SECRETS_NOT_CONFIGURED_MESSAGE: string =
  'No secrets key is configured. Run pnpm nocobase config init, or set secrets.keys in the configuration file (SECRETS_KEYS in the environment) to a random key such as one from: openssl rand -hex 32.';

/**
 * The service over the configured keys. Without keys, or with keys that fail validation, it is not ready rather than
 * failing to construct: a command that never touches a secret still runs, and every use reports what to configure.
 */
export function createSecretsService(config: SecretsConfig): SecretsService {
  let keyring: Keyring | undefined;
  let unavailable: SecretsError | undefined;
  if (!config.keys || config.keys.length === 0) {
    unavailable = new SecretsError(
      'SECRETS_NOT_CONFIGURED',
      SECRETS_NOT_CONFIGURED_MESSAGE,
    );
  } else {
    try {
      keyring = createKeyring(config.keys);
    } catch (error) {
      if (!isSecretsError(error)) throw error;
      unavailable = error;
    }
  }
  const require = (): Keyring => {
    if (keyring) return keyring;
    throw unavailable!;
  };
  const stores = new Map<string, SecretsStore>();

  return {
    ready: keyring !== undefined,
    currentVersion: keyring?.currentVersion,
    seal: (plaintext, options) => require().seal(plaintext, options),
    open: (sealed, options) => require().open(sealed, options),
    inspect: (sealed) => inspectSecret(sealed),
    needsReseal: (sealed) =>
      inspectSecret(sealed).version !== require().currentVersion,
    keyring: (purpose) => require().derive(purpose),
    registerStore(store) {
      if (stores.has(store.name)) {
        throw new Error(
          `A secrets store named ${store.name} is already registered.`,
        );
      }
      stores.set(store.name, store);
    },
    stores: () => [...stores.values()],
  };
}
