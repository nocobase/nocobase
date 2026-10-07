import type { Application } from '@nocobase/app-server';
import {
  secretsServiceToken,
  type SecretsService,
  type SecretsStoreStatus,
} from '@nocobase/app-server/secrets';

import { CommandError } from '../command/errors.ts';

/** How many rows a store reads and rewrites at a time unless `--batch-size` says otherwise. */
export const DEFAULT_SECRETS_BATCH_SIZE = 200;

export interface SecretsStoreReport extends SecretsStoreStatus {
  readonly name: string;
}

export interface SecretsStatusResult {
  readonly currentVersion: number;
  readonly stores: readonly SecretsStoreReport[];
  /** Values across every store not sealed with the current key. */
  readonly needsReseal: number;
}

export interface SecretsRotateStoreReport {
  readonly name: string;
  readonly resealed: number;
  readonly failed: number;
  /** What still needs resealing after this run; equal to before under `--dry-run`. */
  readonly needsReseal: number;
}

export interface SecretsRotateResult {
  readonly dryRun: boolean;
  readonly currentVersion: number;
  readonly stores: readonly SecretsRotateStoreReport[];
  readonly resealed: number;
  readonly failed: number;
}

/** The ready secrets service of an application whose providers are registered, or the error that says what to set. */
export function requireSecretsService(app: Application): SecretsService {
  if (!app.container.has(secretsServiceToken)) {
    throw new CommandError(
      'This application registers no secrets service: add SecretsProvider from @nocobase/app-server/secrets to server/app.ts.',
      { code: 'SECRETS_UNAVAILABLE' },
    );
  }
  const secrets = app.container.resolve(secretsServiceToken);
  if (!secrets.ready) {
    // The service's own message names the setting and how to generate a key, never a key.
    let message = 'No secrets key is configured.';
    try {
      secrets.keyring('check');
    } catch (error) {
      if (error instanceof Error) message = error.message;
    }
    throw new CommandError(message, {
      code: 'SECRETS_NOT_CONFIGURED',
      suggestions: [
        'Set secrets.keys in the configuration file, or SECRETS_KEYS=1:<key> in the environment, with a key from: openssl rand -hex 32.',
      ],
    });
  }
  return secrets;
}

export async function collectSecretsStatus(
  secrets: SecretsService,
  batchSize: number,
): Promise<SecretsStatusResult> {
  const stores: SecretsStoreReport[] = [];
  for (const store of secrets.stores()) {
    stores.push({
      name: store.name,
      ...(await store.status({ secrets, batchSize, dryRun: true })),
    });
  }
  return {
    currentVersion: secrets.currentVersion!,
    stores,
    needsReseal: stores.reduce((sum, store) => sum + store.needsReseal, 0),
  };
}

/**
 * Reseals every store under the current key. Each store skips what is already current, so a run that stops part-way
 * is finished by running it again.
 */
export async function rotateSecrets(
  secrets: SecretsService,
  options: { readonly batchSize: number; readonly dryRun: boolean },
  onStore?: (report: SecretsRotateStoreReport) => void,
): Promise<SecretsRotateResult> {
  const stores: SecretsRotateStoreReport[] = [];
  for (const store of secrets.stores()) {
    const context = { secrets, ...options };
    const { resealed, failed } = await store.reseal(context);
    const { needsReseal } = await store.status(context);
    const report = { name: store.name, resealed, failed, needsReseal };
    onStore?.(report);
    stores.push(report);
  }
  return {
    dryRun: options.dryRun,
    currentVersion: secrets.currentVersion!,
    stores,
    resealed: stores.reduce((sum, store) => sum + store.resealed, 0),
    failed: stores.reduce((sum, store) => sum + store.failed, 0),
  };
}

export function formatVersions(
  byVersion: Readonly<Record<string, number>>,
): string {
  const entries = Object.entries(byVersion);
  return entries.length === 0
    ? 'none'
    : entries
        .map(([version, count]) =>
          /^\d+$/u.test(version)
            ? `v${version}: ${count}`
            : `${version}: ${count}`,
        )
        .join(', ');
}
