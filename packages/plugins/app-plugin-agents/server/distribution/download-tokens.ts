/**
 * Download tokens: what a signed-in person hands to the install script (`HEADERS.downloadToken`) so that a machine
 * where nobody is signed in yet can download the application's CLI (`agents.cli`, such as `acme`), for instance a coding
 * agent following the prompt an application's home page copies. A token reaches the CLI's manifest, its current version for one platform and that tarball, for
 * `DOWNLOAD_TOKEN_TTL_MS` and at most `DOWNLOAD_TOKEN_MAX_DOWNLOADS` downloads; the platform of its first request binds
 * it. It grants nothing a signed-in person could not download anyway, and registers no runner. Like the other
 * credentials only its hash is stored (`agDownloadTokens`); only this file reads or writes them.
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import type { DatabaseConnection, Repository } from '@nocobase/db';

import type { DownloadToken } from '../../shared/runners.js';
import { later, type Clock } from '../kernel/clock.js';
import {
  CREDENTIAL_PREFIX,
  createCredential,
  hashCredential,
} from '../kernel/crypto.js';
import type { IdSource } from '../kernel/ids.js';
import type { TxRunner } from '../kernel/tx.js';

/** How long a download token stays usable. */
export const DOWNLOAD_TOKEN_TTL_MS: number = 30 * 60_000;

/** How many tarball downloads one token allows, so a failed download can be retried. */
export const DOWNLOAD_TOKEN_MAX_DOWNLOADS = 3;

interface DownloadTokenRecord {
  readonly id: string;
  readonly tokenHash: string;
  readonly createdById: string | null;
  readonly target: string | null;
  readonly downloads: number;
  readonly expiresAt: string;
  readonly createdAt: string;
}

function downloadTokensRepo(
  conn: DatabaseConnection,
): Repository<DownloadTokenRecord> {
  return conn.repository<DownloadTokenRecord>('agDownloadTokens');
}

/** What a request with a download token asks for. */
export interface DownloadRequest {
  readonly product?: string;
  /** The platform it resolves or downloads for; absent for the manifest. */
  readonly target?: string;
  /** A tarball download, which counts against the token. */
  readonly download?: boolean;
}

export interface DownloadTokenService {
  create(createdById: string | null): Promise<DownloadToken>;
  /** Lets `request` through with `token`, binding its platform and counting a download; `DOWNLOAD_TOKEN_INVALID` otherwise. */
  admit(token: string, request: DownloadRequest): Promise<void>;
}

export interface DownloadTokenServiceDeps {
  /** The one product a download token downloads: the application's CLI (`agents.cli.name`). */
  readonly product: string;
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
}

export function createDownloadTokenService(
  deps: DownloadTokenServiceDeps,
): DownloadTokenService {
  const { tx, ids, clock, product } = deps;
  const invalid = (message: string): ProtocolError =>
    new ProtocolError('DOWNLOAD_TOKEN_INVALID', message);
  const spent = (): ProtocolError =>
    invalid(
      'The download token is unknown, expired or used up. Get a new one where you copied it.',
    );

  return {
    create: (createdById) =>
      tx.run(async ({ conn }) => {
        const now = clock.now();
        const token = createCredential(CREDENTIAL_PREFIX.download);
        const expiresAt = later(now, DOWNLOAD_TOKEN_TTL_MS);
        await downloadTokensRepo(conn).createOne({
          values: {
            id: ids.next(),
            tokenHash: hashCredential(token),
            createdById,
            target: null,
            downloads: 0,
            expiresAt,
            createdAt: now.toISOString(),
          },
        });
        return {
          token,
          expiresAt,
          maxDownloads: DOWNLOAD_TOKEN_MAX_DOWNLOADS,
        };
      }),

    admit: (token, request) =>
      tx.run(async ({ conn }) => {
        if (request.product !== undefined && request.product !== product)
          throw invalid(`A download token downloads only ${product}.`);
        const tokens = downloadTokensRepo(conn);
        const record = token
          ? await tokens.findOne({
              filter: { tokenHash: hashCredential(token) },
            })
          : undefined;
        const downloads = Number(record?.downloads ?? 0);
        if (
          !record ||
          Date.parse(record.expiresAt) <= clock.now().getTime() ||
          downloads >= DOWNLOAD_TOKEN_MAX_DOWNLOADS
        )
          throw spent();
        const { target } = request;
        if (target === undefined) return;
        if (record.target !== null && record.target !== target)
          throw invalid(
            `This download token is for ${record.target}, not ${target}.`,
          );
        if (record.target === target && !request.download) return;
        // Binds the platform and counts the download; a concurrent request that changed the row first wins.
        const updated = await tokens.updateMany({
          filter: (f) =>
            f.and([
              f.string('id').eq(record.id),
              f.number('downloads').eq(downloads),
            ]),
          values: {
            target,
            downloads: request.download ? downloads + 1 : downloads,
          },
        });
        if (updated.updatedCount !== 1) throw spent();
      }),
  };
}
