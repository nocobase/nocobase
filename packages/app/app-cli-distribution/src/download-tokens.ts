import { ProtocolError } from '@nocobase/agent-protocol';
import { createHash, randomBytes } from 'node:crypto';
import { CREDENTIAL_PREFIXES } from '@nocobase/agent-protocol';

export interface DownloadToken {
  readonly token: string;
  readonly expiresAt: string;
  readonly maxDownloads: number;
}
export interface Clock {
  now(): Date;
}
/** How long a download token stays usable. */
export const DOWNLOAD_TOKEN_TTL_MS: number = 30 * 60_000;

/** How many tarball downloads one token allows, so a failed download can be retried. */
export const DOWNLOAD_TOKEN_MAX_DOWNLOADS = 3;

export interface DownloadTokenRecord {
  readonly id: string;
  readonly tokenHash: string;
  readonly createdById: string | null;
  readonly target: string | null;
  readonly downloads: number;
  readonly expiresAt: string;
  readonly createdAt: string;
}

/** Storage operations within the host's transaction. Updates must compare the stored download count atomically. */
export interface DownloadTokenTransaction {
  insert(record: DownloadTokenRecord): Promise<void>;
  findByHash(hash: string): Promise<DownloadTokenRecord | null | undefined>;
  updateIfDownloads(
    id: string,
    expected: number,
    values: { target: string | null; downloads: number },
  ): Promise<boolean>;
}
export interface DownloadTokenStore {
  transaction<T>(
    fn: (store: DownloadTokenTransaction) => Promise<T>,
  ): Promise<T>;
}

/** What a request with a download token asks for. */
export interface DownloadRequest {
  readonly product?: string;
  /** The platform it resolves or downloads for; absent for the manifest, and for the universal tarball. */
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
  readonly store: DownloadTokenStore;
  readonly ids: { next(): string };
  readonly clock: Clock;
}

export function createDownloadTokenService(
  deps: DownloadTokenServiceDeps,
): DownloadTokenService {
  const { store, ids, clock, product } = deps;
  const invalid = (message: string): ProtocolError =>
    new ProtocolError('DOWNLOAD_TOKEN_INVALID', message);
  const spent = (): ProtocolError =>
    invalid(
      'The download token is unknown, expired or used up. Get a new one where you copied it.',
    );

  return {
    create: (createdById) =>
      store.transaction(async (tokens) => {
        const now = clock.now();
        const token = `${CREDENTIAL_PREFIXES.download}${randomBytes(32).toString('base64url')}`;
        const expiresAt = new Date(
          now.getTime() + DOWNLOAD_TOKEN_TTL_MS,
        ).toISOString();
        await tokens.insert({
          id: ids.next(),
          tokenHash: hashCredential(token),
          createdById,
          target: null,
          downloads: 0,
          expiresAt,
          createdAt: now.toISOString(),
        });
        return {
          token,
          expiresAt,
          maxDownloads: DOWNLOAD_TOKEN_MAX_DOWNLOADS,
        };
      }),

    admit: (token, request) =>
      store.transaction(async (tokens) => {
        if (request.product !== undefined && request.product !== product)
          throw invalid(`A download token downloads only ${product}.`);
        const record = token
          ? await tokens.findByHash(hashCredential(token))
          : undefined;
        const downloads = Number(record?.downloads ?? 0);
        if (
          !record ||
          Date.parse(record.expiresAt) <= clock.now().getTime() ||
          downloads >= DOWNLOAD_TOKEN_MAX_DOWNLOADS
        )
          throw spent();
        const { target } = request;
        if (target === undefined && !request.download) return;
        if (
          target !== undefined &&
          record.target !== null &&
          record.target !== target
        )
          throw invalid(
            `This download token is for ${record.target}, not ${target}.`,
          );
        if (
          (target === undefined || record.target === target) &&
          !request.download
        )
          return;
        // Binds the platform and counts the download; a concurrent request that changed the row first wins.
        const updated = await tokens.updateIfDownloads(record.id, downloads, {
          target: target ?? record.target,
          downloads: request.download ? downloads + 1 : downloads,
        });
        if (!updated) throw spent();
      }),
  };
}

function hashCredential(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
