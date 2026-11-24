import { constants, createWriteStream } from 'node:fs';
import {
  cp,
  mkdir,
  mkdtemp,
  open,
  readdir,
  rename,
  rm,
  rmdir,
} from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { describeEntry } from './archive.js';
import { BackupError, checkAbort } from './errors.js';
import { assertArchivePath, canonical, contains, fileStat } from './paths.js';
import type {
  BackupDisk,
  BackupTarget,
  DiskManifest,
  FileReference,
} from './types.js';

type FsDisk = Extract<BackupDisk, { driver: 'fs' }>;
type FileDisk = Extract<DiskManifest, { mode: 'files' }>;

export interface ResolvedDisk {
  config: FsDisk;
  root: string;
  protected: string[];
}

const internal = (segment: string) =>
  segment === '.nocobase-backup' ||
  segment.startsWith('.nocobase-backup-upload-') ||
  segment.startsWith('.nocobase-restore-');
const beneath = (parent: string, child: string) =>
  parent === child || child.startsWith(parent + '/');
const portableRelative = (parent: string, child: string) =>
  relative(parent, child).split(sep).join('/');

export async function resolveDisks(
  target: BackupTarget,
  extraPaths: readonly string[],
): Promise<Map<string, ResolvedDisk>> {
  const disks = await Promise.all(
    target.disks
      .filter((disk): disk is FsDisk => disk.driver === 'fs')
      .map(async (config) => ({
        config,
        root: await canonical(config.root),
      })),
  );
  if (new Set(disks.map(({ root }) => root)).size !== disks.length) {
    throw new BackupError(
      'BACKUP_INVALID_TARGET',
      'Two file disks resolve to the same root directory.',
    );
  }
  const sqlite = target.connections.flatMap((connection) =>
    connection.dialect === 'sqlite'
      ? ['', '-wal', '-shm', '-journal'].map(
          (suffix) => connection.filename + suffix,
        )
      : [],
  );
  const globallyProtected = await Promise.all(
    [...sqlite, ...(target.skipPaths ?? []), ...extraPaths].map(canonical),
  );
  return new Map(
    await Promise.all(
      disks.map(async ({ config, root }) => {
        const paths = new Set(
          globallyProtected
            .filter((path) => contains(root, path))
            .map((path) => portableRelative(root, path)),
        );
        const nested = disks.filter(
          (disk) => disk.root !== root && contains(root, disk.root),
        );
        for (const disk of nested) paths.add(portableRelative(root, disk.root));
        for (const path of config.excludePaths ?? []) {
          assertArchivePath(path);
          // Protect both the configured name and any resolved path within the disk.
          paths.add(path);
          const resolved = await canonical(join(root, path));
          if (resolved === root || !contains(root, resolved)) {
            throw new BackupError(
              'BACKUP_UNSAFE_PATH',
              'A backup exclusion must resolve to a path below its filesystem disk root.',
              { disk: config.name, path },
            );
          }
          paths.add(portableRelative(root, resolved));
        }
        if (paths.has('')) {
          throw new BackupError(
            'BACKUP_INVALID_TARGET',
            'An excluded path is the root of a configured file disk.',
            { disk: config.name },
          );
        }
        return [
          config.name,
          { config, root, protected: [...paths].sort() },
        ] as const;
      }),
    ),
  );
}

export async function copyDisk(
  disk: ResolvedDisk,
  directory: string,
  signal?: AbortSignal,
): Promise<{
  manifest: FileDisk;
  entries: Awaited<ReturnType<typeof describeEntry>>[];
}> {
  const { config, root } = disk;
  const manifest: FileDisk = {
    name: config.name,
    driver: 'fs',
    mode: 'files',
    count: 0,
    size: 0,
    skippedPaths: [],
  };
  const skipped = new Set(disk.protected);
  const entries: Awaited<ReturnType<typeof describeEntry>>[] = [];
  async function walk(dir: string, relativePath: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      checkAbort(signal);
      const key = relativePath ? relativePath + '/' + entry.name : entry.name;
      assertArchivePath(key);
      if (internal(entry.name) || entry.isSymbolicLink()) {
        skipped.add(key);
        continue;
      }
      if (disk.protected.some((path) => beneath(path, key))) continue;
      const source = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(source, key);
      } else if (entry.isFile()) {
        const archivePath = `files/${config.name}/${key}`;
        const destination = join(directory, archivePath);
        await mkdir(join(destination, '..'), { recursive: true, mode: 0o700 });
        const file = await open(
          source,
          constants.O_RDONLY | constants.O_NOFOLLOW,
        );
        try {
          await pipeline(
            file.createReadStream(),
            createWriteStream(destination, { flags: 'wx', mode: 0o600 }),
            { signal },
          );
        } finally {
          await file.close();
        }
        const info = await describeEntry(directory, archivePath, signal);
        entries.push(info);
        manifest.count += 1;
        manifest.size += info.size;
      } else {
        skipped.add(key);
      }
    }
  }
  const info = await fileStat(root);
  if (info) {
    if (!info.isDirectory())
      throw new BackupError(
        'BACKUP_INVALID_TARGET',
        'A file disk root must be a directory.',
        { disk: config.name },
      );
    await walk(root, '');
  }
  manifest.skippedPaths = [...skipped].sort();
  return { manifest, entries };
}

interface Move {
  from: string;
  to: string;
}

export interface DiskStage {
  directory: string;
  moves: readonly Move[];
  applied: Move[];
  rootCreated: boolean;
  diskRoot: string;
}

async function children(dir: string): Promise<string[]> {
  const info = await fileStat(dir);
  if (!info) return [];
  if (!info.isDirectory())
    throw new BackupError(
      'RESTORE_DISK_PATH_CONFLICT',
      'A protected file path has a non-directory parent.',
    );
  return readdir(dir);
}

export async function stageDisk(
  disk: ResolvedDisk,
  manifest: FileDisk,
  payload: string,
  signal?: AbortSignal,
): Promise<DiskStage> {
  const diskRoot = disk.root;
  const existing = await fileStat(diskRoot);
  if (existing && !existing.isDirectory())
    throw new BackupError(
      'RESTORE_DISK_PATH_CONFLICT',
      'A file disk root must be a directory.',
    );
  if (!existing) await mkdir(diskRoot, { recursive: true, mode: 0o700 });
  const directory = await mkdtemp(join(diskRoot, '.nocobase-restore-'));
  const stage: DiskStage = {
    directory,
    moves: [],
    applied: [],
    diskRoot,
    rootCreated: !existing,
  };
  try {
    const incoming = join(directory, 'incoming');
    const old = join(directory, 'previous');
    if (await fileStat(payload))
      await cp(payload, incoming, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
    await mkdir(old, { mode: 0o700 });
    const protectedPaths = [...manifest.skippedPaths, ...disk.protected];
    const moves: Move[] = [];
    async function plan(
      prefix: string,
      source: string,
      destination: string,
      previous: string,
      validateOnly = false,
    ): Promise<void> {
      const fromBackup = new Set(await children(source));
      const current = new Set(await children(destination));
      for (const name of new Set([...current, ...fromBackup])) {
        checkAbort(signal);
        const key = prefix ? prefix + '/' + name : name;
        if (
          internal(name) ||
          protectedPaths.some((path) => beneath(path, key))
        ) {
          if (fromBackup.has(name)) {
            throw new BackupError(
              'RESTORE_PROTECTED_PATH',
              'The backup would overwrite a protected path.',
              { disk: manifest.name, path: key },
            );
          }
          continue;
        }
        const from = join(source, name);
        const to = join(destination, name);
        const saved = join(previous, name);
        if (protectedPaths.some((path) => beneath(key, path))) {
          if (!validateOnly) await mkdir(saved, { mode: 0o700 });
          const absent = !current.has(name);
          await plan(key, from, to, saved, validateOnly || absent);
          if (!validateOnly && absent && fromBackup.has(name))
            moves.push({ from, to });
          continue;
        }
        if (validateOnly) continue;
        if (current.has(name)) moves.push({ from: to, to: saved });
        if (fromBackup.has(name)) moves.push({ from, to });
      }
    }
    await plan('', incoming, diskRoot, old);
    return { ...stage, moves };
  } catch (error) {
    await discardDiskStage(stage, false);
    throw error;
  }
}

export async function installDisk(
  stage: DiskStage,
  signal?: AbortSignal,
): Promise<void> {
  for (const move of stage.moves) {
    checkAbort(signal);
    await rename(move.from, move.to);
    stage.applied.push(move);
  }
}

export async function undoDisk(stage: DiskStage): Promise<void> {
  for (const move of [...stage.applied].reverse())
    await rename(move.to, move.from);
}

export async function discardDiskStage(
  stage: DiskStage,
  keepRoot: boolean,
): Promise<void> {
  await rm(stage.directory, { recursive: true, force: true });
  if (!keepRoot && stage.rootCreated) await rmdir(stage.diskRoot);
}

export async function fileExists(
  disk: ResolvedDisk,
  key: string,
): Promise<boolean> {
  assertArchivePath(key);
  let path = disk.root;
  const segments = key.split('/');
  for (const [index, part] of segments.entries()) {
    path = join(path, part);
    const info = await fileStat(path);
    if (
      !info ||
      (index === segments.length - 1 ? !info.isFile() : !info.isDirectory())
    )
      return false;
  }
  return true;
}

export function missingFromArchive(
  refs: Iterable<FileReference>,
  included: ReadonlySet<string>,
  files: ReadonlySet<string>,
): FileReference[] {
  const missing: FileReference[] = [];
  for (const ref of refs) {
    if (!included.has(ref.disk)) continue;
    assertArchivePath(ref.key);
    if (!files.has(`files/${ref.disk}/${ref.key}`)) missing.push(ref);
  }
  return missing;
}
