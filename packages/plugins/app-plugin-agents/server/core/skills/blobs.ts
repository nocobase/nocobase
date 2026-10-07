/**
 * The contents of skills' files: each stored once, by the SHA-256 of its bytes, in the application's drive at
 * `skills/blobs/<sha256>` (`SkillDisk`), whichever versions and skills name it, and recorded in `agSkillBlobs` with its
 * size, whether it is text and when it was last stored or named. A version lists its files by hash
 * (`agSkillVersions.manifest`); nothing else points at a blob.
 *
 * Blobs are written outside the transaction that saves a version, so a save that fails leaves blobs nothing names. The
 * collector (`collect`) deletes those, and the ones no version names any more once their skill or version is gone,
 * after a grace period that spares a blob uploaded for a save still to come.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { DatabaseConnection, Repository } from '@nocobase/db';

import type { Clock } from '../../kernel/clock.js';
import type { TxRunner } from '../../kernel/tx.js';

/** Where blobs are kept: the application's drive (a flydrive disk), or memory in tests. */
export interface SkillDisk {
  put(key: string, contents: Uint8Array): Promise<void>;
  getBytes(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

export interface BlobRecord {
  readonly hash: string;
  readonly size: number;
  readonly text: boolean;
  readonly createdAt: string;
  readonly lastUsedAt: string;
}

export interface BlobInfo {
  readonly hash: string;
  readonly size: number;
  readonly text: boolean;
}

/** A disk in memory, for tests and an application without a drive. */
export function memoryDisk(): SkillDisk & { readonly keys: () => string[] } {
  const data = new Map<string, Uint8Array>();
  return {
    put: (key, contents) => {
      data.set(key, Uint8Array.from(contents));
      return Promise.resolve();
    },
    getBytes: (key) => {
      const found = data.get(key);
      return found
        ? Promise.resolve(Uint8Array.from(found))
        : Promise.reject(new Error(`No blob at ${key}.`));
    },
    delete: (key) => {
      data.delete(key);
      return Promise.resolve();
    },
    keys: () => [...data.keys()],
  };
}

/** A disk in a local directory, for an application without a drive. */
export function directoryDisk(root: string): SkillDisk {
  const at = (key: string) => path.join(root, ...key.split('/'));
  return {
    async put(key, contents) {
      await mkdir(path.dirname(at(key)), { recursive: true });
      await writeFile(at(key), contents);
    },
    async getBytes(key) {
      return new Uint8Array(await readFile(at(key)));
    },
    async delete(key) {
      await rm(at(key), { force: true });
    },
  };
}

export function blobKey(hash: string): string {
  return `skills/blobs/${hash}`;
}

export function sha256(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

const decoder = new TextDecoder('utf-8', { fatal: true });

/** Whether `bytes` read as text: valid UTF-8 without NUL bytes. */
export function isText(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  try {
    decoder.decode(bytes);
    return true;
  } catch {
    return false;
  }
}

function blobsRepo(conn: DatabaseConnection): Repository<BlobRecord> {
  return conn.repository<BlobRecord>('agSkillBlobs');
}

/** A least-recently-used cache of values with a size, bounded by their total. */
export class SizedCache<V> {
  private readonly entries = new Map<string, { value: V; size: number }>();
  private total = 0;

  public constructor(private readonly maxBytes: number) {}

  public get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  public set(key: string, value: V, size: number): void {
    if (size > this.maxBytes) return;
    const old = this.entries.get(key);
    if (old) {
      this.total -= old.size;
      this.entries.delete(key);
    }
    this.entries.set(key, { value, size });
    this.total += size;
    for (const [oldest, entry] of this.entries) {
      if (this.total <= this.maxBytes) break;
      this.entries.delete(oldest);
      this.total -= entry.size;
    }
  }
}

export interface SkillBlobs {
  /** Stores `bytes` unless stored already, and marks them used now. */
  store(bytes: Uint8Array): Promise<BlobInfo>;
  /** What is recorded of `hashes`; a hash not stored is missing from the map. */
  info(
    conn: DatabaseConnection,
    hashes: readonly string[],
  ): Promise<Map<string, BlobInfo>>;
  /** Marks `hashes` used now, so the collector spares them. */
  touch(conn: DatabaseConnection, hashes: readonly string[]): Promise<void>;
  /** The bytes of a stored blob. */
  read(hash: string): Promise<Uint8Array>;
  /**
   * Deletes the blobs no version names that were last used before the grace period; the number deleted. `referenced`
   * reads every hash versions name.
   */
  collect(
    referenced: (conn: DatabaseConnection) => Promise<Set<string>>,
    graceMs: number,
  ): Promise<number>;
}

export interface SkillBlobsDeps {
  readonly tx: TxRunner;
  readonly clock: Clock;
  /** Asked on each use: the drive is resolved when the first blob is stored or read. */
  readonly disk: () => SkillDisk;
  /** Bytes of blobs kept in memory for reads; 32 MB by default. */
  readonly cacheBytes?: number;
}

export function createSkillBlobs(deps: SkillBlobsDeps): SkillBlobs {
  const { tx, clock } = deps;
  const cache = new SizedCache<Uint8Array>(deps.cacheBytes ?? 32 * 1024 * 1024);

  const touch = async (
    conn: DatabaseConnection,
    hashes: readonly string[],
  ): Promise<void> => {
    const unique = [...new Set(hashes)];
    if (unique.length === 0) return;
    await blobsRepo(conn).updateMany({
      filter: (f) => f.or(unique.map((hash) => f.string('hash').eq(hash))),
      values: { lastUsedAt: clock.now().toISOString() },
    });
  };

  return {
    async store(bytes) {
      const hash = sha256(bytes);
      const conn = tx.read();
      const existing = await blobsRepo(conn).findOne({ filter: { hash } });
      if (existing) {
        await touch(conn, [hash]);
        return {
          hash,
          size: Number(existing.size),
          text: Boolean(existing.text),
        };
      }
      await deps.disk().put(blobKey(hash), bytes);
      const text = isText(bytes);
      const now = clock.now().toISOString();
      try {
        await blobsRepo(conn).createOne({
          values: {
            hash,
            size: bytes.length,
            text,
            createdAt: now,
            lastUsedAt: now,
          },
        });
      } catch (error) {
        // Stored by another request meanwhile.
        if (!(await blobsRepo(conn).findOne({ filter: { hash } }))) throw error;
        await touch(conn, [hash]);
      }
      cache.set(hash, Uint8Array.from(bytes), bytes.length);
      return { hash, size: bytes.length, text };
    },

    async info(conn, hashes) {
      const result = new Map<string, BlobInfo>();
      const unique = [...new Set(hashes)];
      if (unique.length === 0) return result;
      const rows = await blobsRepo(conn).findMany({
        filter: (f) => f.or(unique.map((hash) => f.string('hash').eq(hash))),
      });
      for (const row of rows)
        result.set(row.hash, {
          hash: row.hash,
          size: Number(row.size),
          text: Boolean(row.text),
        });
      return result;
    },

    touch,

    async read(hash) {
      const cached = cache.get(hash);
      if (cached) return cached;
      const bytes = await deps.disk().getBytes(blobKey(hash));
      cache.set(hash, bytes, bytes.length);
      return bytes;
    },

    async collect(referenced, graceMs) {
      const conn = tx.read();
      const cutoff = new Date(clock.now().getTime() - graceMs).toISOString();
      const named = await referenced(conn);
      const stale = await blobsRepo(conn).findMany({
        filter: (f) => f.date('lastUsedAt').before(cutoff),
      });
      let deleted = 0;
      for (const blob of stale) {
        if (named.has(blob.hash)) continue;
        // Only when still unused: a save may have named it since.
        const { deletedCount } = await blobsRepo(conn).deleteMany({
          filter: (f) =>
            f.and([
              f.string('hash').eq(blob.hash),
              f.date('lastUsedAt').before(cutoff),
            ]),
        });
        if (deletedCount === 0) continue;
        try {
          await deps.disk().delete(blobKey(blob.hash));
        } catch {
          // Already gone from the drive.
        }
        deleted += 1;
      }
      return deleted;
    },
  };
}
