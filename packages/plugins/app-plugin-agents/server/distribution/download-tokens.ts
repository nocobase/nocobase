/** Preserve the existing table, transaction boundary and conditional update for pre-upgrade tokens. */
import {
  createDownloadTokenService as createService,
  type DownloadTokenStore,
  type DownloadTokenRecord,
  type DownloadTokenService,
} from '@nocobase/app-cli-distribution';
import type { Clock } from '../kernel/clock.js';
import type { IdSource } from '../kernel/ids.js';
import type { TxRunner } from '../kernel/tx.js';
export {
  DOWNLOAD_TOKEN_MAX_DOWNLOADS,
  DOWNLOAD_TOKEN_TTL_MS,
  type DownloadRequest,
  type DownloadTokenService,
} from '@nocobase/app-cli-distribution';
export interface DownloadTokenServiceDeps {
  readonly product: string;
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
}
export function createDownloadTokenService(
  deps: DownloadTokenServiceDeps,
): DownloadTokenService {
  const store: DownloadTokenStore = {
    transaction: (fn) =>
      deps.tx.run(async ({ conn }) => {
        const tokens = conn.repository<DownloadTokenRecord>('agDownloadTokens');
        return fn({
          insert: async (record) => {
            await tokens.createOne({ values: record });
          },
          findByHash: (hash) => tokens.findOne({ filter: { tokenHash: hash } }),
          updateIfDownloads: async (id, expected, values) => {
            const updated = await tokens.updateMany({
              filter: (f) =>
                f.and([
                  f.string('id').eq(id),
                  f.number('downloads').eq(expected),
                ]),
              values,
            });
            return updated.updatedCount === 1;
          },
        });
      }),
  };
  return createService({
    product: deps.product,
    clock: deps.clock,
    ids: deps.ids,
    store,
  });
}
