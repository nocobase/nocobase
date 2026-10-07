/**
 * The recoverable copies of Hub keys (`hubApiKeys.encryptedSecret`), for `nocobase secrets status` and `secrets rotate`.
 * Each copy is bound to its key and owner (`apikey.referenceId`). Copies stored under `auth.secret` before the secrets
 * service (`v1.`) count as legacy and are resealed with it.
 */
import type {
  SecretsResealResult,
  SecretsStore,
  SecretsStoreContext,
  SecretsStoreStatus,
} from '@nocobase/app-server/secrets';
import type { DatabaseConnection } from '@nocobase/db';

import {
  decryptKey,
  HUB_KEY_SECRET_PURPOSE,
  isLegacyKeyCopy,
} from './key-secret.js';

interface KeyCopy {
  readonly id: string;
  readonly owner: string;
  readonly value: string;
}

export function createHubKeySecretsStore(
  connection: () => DatabaseConnection,
  legacySecret: () => string | undefined,
): SecretsStore {
  async function* batches(batchSize: number): AsyncGenerator<KeyCopy[]> {
    let last: string | undefined;
    for (;;) {
      let query = connection()
        .query.selectFrom('hubApiKeys')
        .select(['id', 'encryptedSecret'])
        .where('encryptedSecret', 'is not', null);
      if (last !== undefined) query = query.where('id', '>', last);
      const rows = await query
        .orderBy('id', 'asc')
        .limit(batchSize)
        .execute<{ id: string; encryptedSecret: string | null }>();
      if (rows.length === 0) return;
      const owners = new Map(
        (
          await connection()
            .query.selectFrom('apikey')
            .select(['id', 'referenceId'])
            .where(
              'id',
              'in',
              rows.map((row) => row.id),
            )
            .execute<{ id: string; referenceId: string }>()
        ).map((row) => [String(row.id), String(row.referenceId)]),
      );
      yield rows.flatMap((row) =>
        typeof row.encryptedSecret === 'string' && owners.has(String(row.id))
          ? [
              {
                id: String(row.id),
                owner: owners.get(String(row.id))!,
                value: row.encryptedSecret,
              },
            ]
          : [],
      );
      if (rows.length < batchSize) return;
      last = String(rows[rows.length - 1].id);
    }
  }

  const versionOf = (
    context: SecretsStoreContext,
    value: string,
  ): string | undefined => {
    if (isLegacyKeyCopy(value)) return 'legacy';
    try {
      return String(context.secrets.inspect(value).version);
    } catch {
      return undefined;
    }
  };

  return {
    name: '@nocobase/app-plugin-hub/api-keys',
    async status(context): Promise<SecretsStoreStatus> {
      const byVersion: Record<string, number> = {};
      let total = 0;
      let needsReseal = 0;
      let legacy = 0;
      for await (const copies of batches(context.batchSize)) {
        for (const copy of copies) {
          const version = versionOf(context, copy.value) ?? 'malformed';
          total += 1;
          byVersion[version] = (byVersion[version] ?? 0) + 1;
          if (version === 'legacy') legacy += 1;
          if (
            version === 'legacy' ||
            (version !== 'malformed' &&
              Number(version) !== context.secrets.currentVersion)
          )
            needsReseal += 1;
        }
      }
      return { total, byVersion, needsReseal, ...(legacy ? { legacy } : {}) };
    },
    async reseal(context): Promise<SecretsResealResult> {
      let resealed = 0;
      let failed = 0;
      for await (const copies of batches(context.batchSize)) {
        for (const copy of copies) {
          const version = versionOf(context, copy.value);
          if (
            version === undefined ||
            (version !== 'legacy' &&
              Number(version) === context.secrets.currentVersion)
          )
            continue;
          let plaintext: string;
          try {
            plaintext = decryptKey(copy.value, copy.id, copy.owner, {
              secrets: context.secrets,
              legacySecret: legacySecret(),
            });
          } catch {
            failed += 1;
            continue;
          }
          if (context.dryRun) {
            resealed += 1;
            continue;
          }
          const result = await connection()
            .query.updateTable('hubApiKeys')
            .set({
              encryptedSecret: context.secrets.seal(plaintext, {
                purpose: HUB_KEY_SECRET_PURPOSE,
                aad: [copy.id, copy.owner],
              }),
            })
            .where('id', '=', copy.id)
            .where('encryptedSecret', '=', copy.value)
            .execute();
          if ((result.updatedCount ?? 1) > 0) resealed += 1;
        }
      }
      return { resealed, failed };
    },
  };
}
