import { createWriteStream, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  appendFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
  readFile,
  rmdir,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { FSDriver } from 'flydrive/drivers/fs';
import { tryStorageLock, withStorageLock } from './storage-lock.js';
import type { ReleaseStorageLock } from './storage-lock.js';

const marker = '.nocobase-backup';
const uploadPrefix = '.nocobase-backup-upload-';
const reserved = (name: string) =>
  name === marker ||
  name.startsWith(uploadPrefix) ||
  name.startsWith('.nocobase-restore-');

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
  readonly active: string;
  readonly conflict: string;
  constructor(readonly root: string) {
    this.state = join(root, marker);
    this.gate = join(this.state, 'readers.sqlite');
    this.mutex = join(this.state, 'writes.sqlite');
    this.active = join(this.state, 'active');
    this.conflict = join(this.state, 'conflict');
  }

  async start(): Promise<ReleaseStorageLock> {
    return withStorageLock(this.mutex, async () => {
      if (existsSync(this.active)) await this.flushIfIdle();
      await writeFile(this.active, '', { mode: 0o600 });
      const release = await tryStorageLock(this.gate, 'shared');
      if (!release) throw new Error('Could not acquire the Drive backup lock.');
      return release;
    });
  }

  async finish(
    release: ReleaseStorageLock,
    includesFile?: (file: string) => boolean,
  ): Promise<string[]> {
    try {
      return await withStorageLock(this.mutex, async () => {
        try {
          if (!includesFile || !existsSync(this.conflict)) return [];
          const log = await readFile(this.conflict, 'utf8');
          if (!log.endsWith('\0'))
            throw new Error('The Drive backup replacement log is incomplete.');
          const files = log.slice(0, -1).split('\0');
          if (!files.every(isAbsolute))
            throw new Error(
              'The Drive backup replacement log has an invalid path.',
            );
          return [...new Set(files)].filter(includesFile);
        } finally {
          release();
          await this.flushIfIdle();
        }
      });
    } finally {
      release();
    }
  }

  async mutate(work: (deferring: boolean) => Promise<void>): Promise<void> {
    await withStorageLock(this.mutex, async () => {
      const deferred = existsSync(this.active) && !(await this.flushIfIdle());
      await work(deferred);
    });
  }

  async markReplacement(
    key: string,
    deferred: boolean,
    followLink = true,
  ): Promise<void> {
    if (!deferred) return;
    const destination = join(this.root, key);
    let file: string;
    try {
      // A stream is published by rename. Replacing a symlink leaves its
      // target intact, while put, copy and move may write through the link.
      if (!followLink && (await lstat(destination)).isSymbolicLink()) return;
      file = await realpath(destination);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return;
      throw error;
    }
    // The mutex serializes writers in every process. Record the destination
    // before publishing, using a delimiter that cannot occur in a file name.
    await appendFile(this.conflict, file + '\0', { mode: 0o600 });
  }

  async publish(
    key: string,
    work: () => Promise<void>,
    followLink = true,
  ): Promise<void> {
    await this.mutate(async (deferred) => {
      await this.markReplacement(key, deferred, followLink);
      await work();
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
      await rm(this.conflict, { force: true });
      await rm(this.active, { force: true });
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

  async collect(
    key: string,
    recursive = false,
    items: PendingDelete[] = [],
  ): Promise<PendingDelete[]> {
    const path = join(this.root, key);
    const version = await fingerprint(path);
    if (!version) return items;
    const stat = await lstat(path);
    if (!stat.isDirectory()) {
      items.push({ key, version });
      return items;
    }
    if (!recursive)
      throw new Error('Use deleteAll to remove a Drive directory.');
    for (const child of await readdir(path)) {
      if (!reserved(child))
        await this.collect(
          relative(this.root, join(path, child)).split(sep).join('/'),
          true,
          items,
        );
    }
    if (key !== '/') items.push({ key, version, directory: true });
    return items;
  }
}

export class DriveBackupConflictError extends Error {
  constructor(
    readonly roots: readonly string[],
    readonly files: readonly string[],
  ) {
    super(
      'A local Drive file was replaced during the backup. Retry the backup.',
    );
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

/** Hold deletion deferral during capture and check replaced paths before releasing it. */
export async function withDriveBackup<T>(
  roots: readonly string[],
  operation: () => Promise<T>,
  includesFile: (file: string) => boolean = () => true,
): Promise<T> {
  const leases: { disk: DiskDeletions; release: ReleaseStorageLock }[] = [];
  let captured = false;
  try {
    for (const root of [...new Set(roots)].sort()) {
      const disk = new DiskDeletions(root);
      leases.push({ disk, release: await disk.start() });
    }
    const result = await operation();
    captured = true;
    return result;
  } finally {
    await releaseLeases(leases, captured ? includesFile : undefined);
  }
}

async function releaseLeases(
  leases: readonly { disk: DiskDeletions; release: ReleaseStorageLock }[],
  includesFile?: (file: string) => boolean,
): Promise<void> {
  const results = await Promise.allSettled(
    leases.map(({ disk, release }) => disk.finish(release, includesFile)),
  );
  const failures = results.flatMap((result): unknown[] =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (failures.length)
    throw new AggregateError(
      failures,
      'Could not flush deferred Drive deletions.',
    );
  const roots: string[] = [];
  const files = new Set<string>();
  for (const [index, result] of results.entries()) {
    if (result.status !== 'fulfilled' || !result.value.length) continue;
    roots.push(leases[index].disk.root);
    for (const file of result.value) files.add(file);
  }
  if (files.size) throw new DriveBackupConflictError(roots, [...files]);
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
    return this.deletions.publish(args[0], () => super.put(...args));
  }

  override async putStream(
    ...args: Parameters<FSDriver['putStream']>
  ): Promise<void> {
    const [key, contents, options] = args;
    if (!safeKey(key)) throw new Error('Invalid Drive write key.');
    const signal = options?.signal as AbortSignal | undefined;
    const destination = join(this.deletions.root, key);
    const parent = dirname(destination);
    let staging: string | undefined;
    // The source can fail while we create its temporary destination. Pipeline
    // will report its error even if the stream has already been destroyed.
    const watchSource = () => {};
    contents.on('error', watchSource);
    try {
      await mkdir(parent, { recursive: true });
      staging = await mkdtemp(join(parent, uploadPrefix));
      const temporary = join(staging, 'contents');
      await pipeline(contents, createWriteStream(temporary, { flags: 'wx' }), {
        signal,
      });
      await this.deletions.publish(
        key,
        async () => {
          signal?.throwIfAborted();
          await rename(temporary, destination);
        },
        false,
      );
    } finally {
      contents.removeListener('error', watchSource);
      if (staging) await rm(staging, { recursive: true, force: true });
    }
  }

  override async copy(source: string, destination: string): Promise<void> {
    if (!safeKey(source) || !safeKey(destination))
      throw new Error('Invalid Drive copy key.');
    if (source === destination) return super.copy(source, destination);
    return this.deletions.publish(destination, () =>
      super.copy(source, destination),
    );
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
    if (source === destination) return;
    return this.deletions.mutate(async (deferred) => {
      if (deferred) {
        const removal = await this.deletions.collect(source);
        await this.deletions.markReplacement(destination, deferred);
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
