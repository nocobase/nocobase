import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import { HubError } from './hub.js';

/** The largest archive a resumable upload accepts, in bytes: 2 GiB. */
export const MAX_RESUMABLE_ARTIFACT_SIZE: number = 2 * 1024 * 1024 * 1024;

/** The largest chunk one `PUT` of a resumable upload may carry, in bytes: 8 MiB. */
export const RELEASE_UPLOAD_CHUNK_SIZE: number = 8 * 1024 * 1024;

/** How long an upload session lives after its last activity, in milliseconds: 24 hours. */
export const RELEASE_UPLOAD_TTL_MS: number = 24 * 60 * 60 * 1000;

/** How often the expired sessions of every App are swept, in milliseconds: once an hour. */
export const RELEASE_UPLOAD_SWEEP_INTERVAL_MS: number = 60 * 60 * 1000;

const UPLOAD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const APP_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const META_FILE = 'meta.json';
const DATA_FILE = 'data';

/** What `meta.json` records for one upload session. */
export interface ReleaseUploadSession {
  readonly uploadId: string;
  readonly appId: string;
  readonly size: number;
  readonly sha256: string;
  /** Bytes durably written to `data`; anything past it in the file is discarded by the next append. */
  readonly offset: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Set once the upload became a Release; the session is then a tombstone and holds no data. */
  readonly releaseId?: string;
  /** Whether completing the upload matched a Release that already existed. */
  readonly reused?: boolean;
}

/** Whether a string is shaped like an upload ID, checked before it is ever joined into a path. */
export function isReleaseUploadId(value: string): boolean {
  return UPLOAD_ID_PATTERN.test(value);
}

/** Validates the declared size and digest of a new upload. */
export function validateReleaseUploadInput(input: unknown): {
  readonly size: number;
  readonly sha256: string;
} {
  const record =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const { size, sha256 } = record;
  if (
    typeof size !== 'number' ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > MAX_RESUMABLE_ARTIFACT_SIZE
  )
    throw new HubError(
      `Upload size must be an integer from 1 to ${MAX_RESUMABLE_ARTIFACT_SIZE} bytes.`,
      'INVALID_UPLOAD',
      'INVALID_ARGUMENT',
    );
  if (typeof sha256 !== 'string' || !SHA256_PATTERN.test(sha256))
    throw new HubError(
      'Upload sha256 must be a lowercase SHA-256 hex digest.',
      'INVALID_UPLOAD',
      'INVALID_ARGUMENT',
    );
  return { size, sha256 };
}

/** When a session expires: its last activity plus the session lifetime. */
export function releaseUploadExpiresAt(session: ReleaseUploadSession): Date {
  return new Date(Date.parse(session.updatedAt) + RELEASE_UPLOAD_TTL_MS);
}

export function isReleaseUploadExpired(
  session: ReleaseUploadSession,
  now: number = Date.now(),
): boolean {
  return releaseUploadExpiresAt(session).getTime() <= now;
}

/**
 * Upload sessions on local disk: one directory per App, holding one directory per session with `meta.json` and the
 * staged bytes in `data`. Grouping by App keeps finding an App's sessions to reading that App's directory.
 *
 * The store only reads and writes files. Callers serialize the operations of one session, and `meta.json` is replaced
 * by rename, so a reader without the lock sees either the old record or the new one.
 */
export class ReleaseUploadStore {
  readonly #directory: string;

  constructor(directory: string) {
    this.#directory = directory;
  }

  dataPath(appId: string, uploadId: string): string {
    return path.join(this.#sessionDir(appId, uploadId), DATA_FILE);
  }

  async create(input: {
    readonly appId: string;
    readonly size: number;
    readonly sha256: string;
  }): Promise<ReleaseUploadSession> {
    const uploadId = randomUUID();
    const now = new Date().toISOString();
    const session: ReleaseUploadSession = {
      uploadId,
      appId: input.appId,
      size: input.size,
      sha256: input.sha256,
      offset: 0,
      createdAt: now,
      updatedAt: now,
    };
    await mkdir(this.#appDir(input.appId), { recursive: true, mode: 0o700 });
    await mkdir(this.#sessionDir(input.appId, uploadId), { mode: 0o700 });
    await writeFile(this.dataPath(input.appId, uploadId), new Uint8Array(0), {
      flag: 'wx',
      mode: 0o600,
    });
    await this.write(session);
    return session;
  }

  /** The App's session with this ID, or `null` when it does not exist or its record cannot be read. */
  async read(
    appId: string,
    uploadId: string,
  ): Promise<ReleaseUploadSession | null> {
    if (!APP_ID_PATTERN.test(appId) || !isReleaseUploadId(uploadId))
      return null;
    let content: string;
    try {
      content = await readFile(
        path.join(this.#sessionDir(appId, uploadId), META_FILE),
        'utf8',
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    const session = parseSession(content, uploadId);
    return session?.appId === appId ? session : null;
  }

  /** Every App with a session directory on disk. */
  async apps(): Promise<readonly string[]> {
    return await this.#entries(this.#directory, (name) =>
      APP_ID_PATTERN.test(name),
    );
  }

  /** Every session ID of the App on disk, whether or not its record is readable. */
  async ids(appId: string): Promise<readonly string[]> {
    if (!APP_ID_PATTERN.test(appId)) return [];
    return await this.#entries(this.#appDir(appId), isReleaseUploadId);
  }

  async write(session: ReleaseUploadSession): Promise<void> {
    const target = path.join(
      this.#sessionDir(session.appId, session.uploadId),
      META_FILE,
    );
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(session)}\n`, {
        flag: 'wx',
        mode: 0o600,
      });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
  }

  async remove(appId: string, uploadId: string): Promise<void> {
    if (!APP_ID_PATTERN.test(appId) || !isReleaseUploadId(uploadId)) return;
    await rm(this.#sessionDir(appId, uploadId), {
      recursive: true,
      force: true,
    });
  }

  /** Removes every session of the App. */
  async removeApp(appId: string): Promise<void> {
    if (!APP_ID_PATTERN.test(appId)) return;
    await rm(this.#appDir(appId), { recursive: true, force: true });
  }

  async removeData(appId: string, uploadId: string): Promise<void> {
    await rm(this.dataPath(appId, uploadId), { force: true });
  }

  /**
   * Writes one chunk at `start` and flushes it to disk.
   *
   * Bytes past `start` left by an earlier interrupted chunk are discarded first. When the chunk does not arrive whole,
   * the file is cut back to `start`, so the recorded offset always equals the bytes safely on disk.
   */
  async append(
    appId: string,
    uploadId: string,
    start: number,
    length: number,
    chunks: AsyncIterable<Uint8Array>,
  ): Promise<void> {
    const file = await open(this.dataPath(appId, uploadId), 'r+');
    try {
      await file.truncate(start);
      let position = start;
      let received = 0;
      for await (const chunk of chunks) {
        received += chunk.byteLength;
        if (received > length)
          throw new HubError(
            'The chunk is longer than its Content-Length.',
            'INVALID_CHUNK',
            'INVALID_ARGUMENT',
          );
        let written = 0;
        while (written < chunk.byteLength) {
          const { bytesWritten } = await file.write(
            chunk,
            written,
            chunk.byteLength - written,
            position,
          );
          written += bytesWritten;
          position += bytesWritten;
        }
      }
      if (received !== length)
        throw new HubError(
          'The chunk ended before its Content-Length.',
          'INCOMPLETE_CHUNK',
          'INVALID_ARGUMENT',
        );
      await file.datasync();
    } catch (error) {
      await file.truncate(start).catch(() => undefined);
      throw error;
    } finally {
      await file.close();
    }
  }

  /** The SHA-256 hex digest of the staged bytes. */
  async digest(appId: string, uploadId: string): Promise<string> {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(this.dataPath(appId, uploadId)))
      hash.update(chunk as Buffer);
    return hash.digest('hex');
  }

  async #entries(
    directory: string,
    accept: (name: string) => boolean,
  ): Promise<readonly string[]> {
    try {
      return (await readdir(directory)).filter(accept);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  #appDir(appId: string): string {
    if (!APP_ID_PATTERN.test(appId))
      throw new HubError('Upload not found.', 'UPLOAD_NOT_FOUND', 'NOT_FOUND');
    return path.join(this.#directory, appId);
  }

  #sessionDir(appId: string, uploadId: string): string {
    if (!isReleaseUploadId(uploadId))
      throw new HubError('Upload not found.', 'UPLOAD_NOT_FOUND', 'NOT_FOUND');
    return path.join(this.#appDir(appId), uploadId);
  }
}

function parseSession(
  content: string,
  uploadId: string,
): ReleaseUploadSession | null {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    record.uploadId !== uploadId ||
    typeof record.appId !== 'string' ||
    typeof record.sha256 !== 'string' ||
    !Number.isSafeInteger(record.size) ||
    !Number.isSafeInteger(record.offset) ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string' ||
    Number.isNaN(Date.parse(record.updatedAt))
  )
    return null;
  return {
    uploadId,
    appId: record.appId,
    size: record.size as number,
    sha256: record.sha256,
    offset: record.offset as number,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(typeof record.releaseId === 'string'
      ? { releaseId: record.releaseId }
      : {}),
    ...(typeof record.reused === 'boolean' ? { reused: record.reused } : {}),
  };
}
