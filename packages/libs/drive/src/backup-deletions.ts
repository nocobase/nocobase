import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  lstat,
  readdir,
  rename,
  rm,
  unlink,
  writeFile,
  readFile,
  rmdir,
} from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { FSDriver } from 'flydrive/drivers/fs';
import { tryStorageLock, withStorageLock } from './storage-lock.js';
import type { ReleaseStorageLock } from './storage-lock.js';

const marker = '.nocobase-backup';
const reserved = (name: string) =>
  name === marker || name.startsWith('.nocobase-restore-');

function safeKey(key: string): boolean {
  return (
    !key.includes('\\') &&
    key
      .split('/')
      .every((part) => part && part !== '.' && part !== '..' && !reserved(part))
  );
}

async function fingerprint(path: string): Promise<string | undefined> {
  try {
    const stat = await lstat(path, { bigint: true });
    return [stat.dev, stat.ino, stat.size, stat.ctimeNs, stat.mtimeNs].join(
      '/',
    );
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== 'ENOENT'
    )
      throw error;
  }
}

interface PendingDelete {
  key: string;
  version: string;
  directory?: boolean;
}

class DiskDeletions {
  readonly state: string;
  readonly gate: string;
  readonly mutex: string;
  constructor(readonly root: string) {
    this.state = join(root, marker);
    this.gate = join(this.state, 'readers.sqlite');
    this.mutex = join(this.state, 'writes.sqlite');
  }

  async start(): Promise<ReleaseStorageLock> {
    return withStorageLock(this.mutex, async () => {
      await this.flushIfIdle();
      const release = await tryStorageLock(this.gate, 'shared');
      if (!release) throw new Error('Could not acquire the Drive backup lock.');
      return release;
    });
  }

  async finish(release: ReleaseStorageLock): Promise<void> {
    try {
      await withStorageLock(this.mutex, async () => {
        release();
        await this.flushIfIdle();
      });
    } finally {
      release();
    }
  }

  async mutate(work: (deferring: boolean) => Promise<void>): Promise<void> {
    await withStorageLock(this.mutex, async () => {
      const clear = await this.flushIfIdle();
      await work(!clear);
    });
  }

  async flushIfIdle(): Promise<boolean> {
    const release = await tryStorageLock(this.gate, 'exclusive');
    if (!release) return false;
    try {
      for (const file of await readdir(this.state)) {
        const path = join(this.state, file);
        if (/^delete-[0-9a-f-]+\.part$/.test(file)) {
          await rm(path, { force: true });
          continue;
        }
        if (!/^delete-[0-9a-f-]+\.json$/.test(file)) continue;
        const items = JSON.parse(
          await readFile(path, 'utf8'),
        ) as PendingDelete[];
        for (const { key, version, directory } of items) {
          if (!safeKey(key))
            throw new Error('Invalid deferred Drive deletion key.');
          const target = join(this.root, key);
          if (directory) {
            // Deletions are replayed in post-order. Never remove a newly
            // uploaded file when removing the directory that used to hold it.
            await rmEmptyDirectory(target);
          } else if ((await fingerprint(target)) === version) {
            await unlink(target);
          }
        }
        await unlink(path);
      }
      return true;
    } finally {
      release();
    }
  }

  async queue(items: PendingDelete[]): Promise<void> {
    if (!items.length) return;
    const file = join(this.state, 'delete-' + randomUUID());
    try {
      await writeFile(file + '.part', JSON.stringify(items), {
        mode: 0o600,
        flag: 'wx',
      });
      await rename(file + '.part', file + '.json');
    } finally {
      await rm(file + '.part', { force: true });
    }
  }

  async collect(key: string, recursive = false): Promise<PendingDelete[]> {
    const path = join(this.root, key);
    const version = await fingerprint(path);
    if (!version) return [];
    const stat = await lstat(path);
    if (!stat.isDirectory()) return [{ key, version }];
    if (!recursive)
      throw new Error('Use deleteAll to remove a Drive directory.');
    const items: PendingDelete[] = [];
    for (const child of await readdir(path)) {
      if (!reserved(child))
        items.push(
          ...(await this.collect(
            relative(this.root, join(path, child)).split(sep).join('/'),
            true,
          )),
        );
    }
    if (key !== '/') items.push({ key, version, directory: true });
    return items;
  }
}

async function rmEmptyDirectory(path: string): Promise<void> {
  try {
    await rmdir(path);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      !['ENOENT', 'ENOTEMPTY', 'ENOTDIR', 'EEXIST'].includes(String(error.code))
    )
      throw error;
  }
}

/** Hold deletion deferral on each root for the complete consistent capture. */
export async function withDriveBackup<T>(
  roots: readonly string[],
  operation: () => Promise<T>,
): Promise<T> {
  const leases: { disk: DiskDeletions; release: ReleaseStorageLock }[] = [];
  try {
    for (const root of [...new Set(roots)].sort()) {
      const disk = new DiskDeletions(root);
      leases.push({ disk, release: await disk.start() });
    }
    return await operation();
  } finally {
    await releaseLeases(leases);
  }
}

async function releaseLeases(
  leases: readonly { disk: DiskDeletions; release: ReleaseStorageLock }[],
): Promise<void> {
  const results = await Promise.allSettled(
    leases.map(({ disk, release }) => disk.finish(release)),
  );
  const failures = results.flatMap((result): unknown[] =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (failures.length)
    throw new AggregateError(
      failures,
      'Could not flush deferred Drive deletions.',
    );
}

export class BackupAwareFsDriver extends FSDriver {
  private readonly deletions: DiskDeletions;
  constructor(
    options: ConstructorParameters<typeof FSDriver>[0],
    root: string,
  ) {
    super(options);
    this.deletions = new DiskDeletions(root);
  }

  override async put(...args: Parameters<FSDriver['put']>): Promise<void> {
    if (!safeKey(args[0])) throw new Error('Invalid Drive write key.');
    return super.put(...args);
  }

  override async putStream(
    ...args: Parameters<FSDriver['putStream']>
  ): Promise<void> {
    if (!safeKey(args[0])) throw new Error('Invalid Drive write key.');
    return super.putStream(...args);
  }

  override async copy(source: string, destination: string): Promise<void> {
    if (!safeKey(source) || !safeKey(destination))
      throw new Error('Invalid Drive copy key.');
    return super.copy(source, destination);
  }

  override async listAll(
    ...args: Parameters<FSDriver['listAll']>
  ): ReturnType<FSDriver['listAll']> {
    const [prefix] = args;
    if (prefix !== '/' && !safeKey(prefix))
      throw new Error('Invalid Drive listing prefix.');
    const result = await super.listAll(...args);
    const root = this.deletions.root;
    return {
      ...result,
      objects: {
        *[Symbol.iterator]() {
          for (const entry of result.objects) {
            const key = entry.isDirectory ? entry.prefix : entry.key;
            const parts = key.split('/');
            // Flydrive removes the leading dot when reporting a root-level object.
            const hiddenRoot =
              reserved('.' + parts[0]) && !existsSync(join(root, key));
            if (!hiddenRoot && !parts.some(reserved)) yield entry;
          }
        },
      },
    };
  }

  override async delete(key: string): Promise<void> {
    if (!safeKey(key)) throw new Error('Invalid Drive deletion key.');
    return this.deletions.mutate(async (deferred) => {
      if (deferred)
        await this.deletions.queue(await this.deletions.collect(key));
      else await super.delete(key);
    });
  }

  override async move(source: string, destination: string): Promise<void> {
    if (!safeKey(source) || !safeKey(destination))
      throw new Error('Invalid Drive move key.');
    return this.deletions.mutate(async (deferred) => {
      if (deferred && source !== destination) {
        const removal = await this.deletions.collect(source);
        await super.copy(source, destination);
        await this.deletions.queue(removal);
      } else {
        await super.move(source, destination);
      }
    });
  }

  override async deleteAll(prefix: string): Promise<void> {
    if (prefix !== '/' && !safeKey(prefix))
      throw new Error('Invalid Drive deletion prefix.');
    return this.deletions.mutate(async (deferred) => {
      const removals = await this.deletions.collect(prefix, true);
      if (deferred) {
        await this.deletions.queue(removals);
      } else {
        for (const { key, directory } of removals) {
          if (directory) await rmEmptyDirectory(join(this.deletions.root, key));
          else await super.delete(key);
        }
      }
    });
  }
}
