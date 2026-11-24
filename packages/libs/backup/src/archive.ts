import { cleanAbandonedWork, temporaryName } from './temporary.js';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { create, list } from 'tar';
import { z } from 'zod';
import { asBackupError, BackupError, checkAbort } from './errors.js';
import { assertArchivePath, assertName, isMissing } from './paths.js';
import type { BackupManifest, MigrationFingerprint } from './types.js';

interface ArchiveEntry {
  path: string;
  size: number;
  sha256: string;
}

export interface OpenBackup {
  directory: string;
  sha256: string;
  manifest: BackupManifest;
}

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const size = z.number().int().nonnegative();
const name = z.string().min(1);
const dialect = z.enum(['sqlite', 'postgres', 'mysql']);
const migration = z.strictObject({ packageName: name, name, checksum: name });
const entrySchema = z.strictObject({ path: name, size, sha256: digest });

const connection = { name, dialect };
const includedConnection = {
  ...connection,
  server: z.strictObject({
    type: z.enum(['sqlite', 'postgres', 'mysql', 'mariadb']),
    version: name,
    majorVersion: z.number().int().positive(),
    charset: name,
    lowerCaseTableNames: z.number().int().min(0).max(2).optional(),
  }),
  snapshot: z.strictObject({
    time: z.iso.datetime({ offset: true }),
    lsn: name.optional(),
  }),
  migrations: z.strictObject({
    history: z.array(migration),
    last: migration.nullable(),
    sha256: digest,
  }),
};
const manifestSchema: z.ZodType<BackupManifest> = z.strictObject({
  formatVersion: z.literal(1),
  app: z.strictObject({ name, version: name }),
  createdAt: z.iso.datetime({ offset: true }),
  online: z.boolean(),
  connections: z.array(
    z.discriminatedUnion('mode', [
      z.strictObject({
        ...connection,
        mode: z.literal('excluded'),
        reason: z.enum(['external', 'excluded', 'unselected']),
      }),
      z.strictObject({
        ...includedConnection,
        mode: z.literal('dump'),
        path: name,
        sha256: digest,
        size,
      }),
    ]),
  ),
  disks: z.array(
    z.discriminatedUnion('mode', [
      z.strictObject({
        name,
        driver: z.enum(['fs', 's3', 'oss']),
        mode: z.literal('excluded'),
        reason: z.enum(['excluded', 'unselected']),
      }),
      z.strictObject({
        name,
        driver: z.enum(['s3', 'oss']),
        mode: z.literal('reference'),
        bucket: name,
        prefix: z.string().optional(),
      }),
      z.strictObject({
        name,
        driver: z.literal('fs'),
        mode: z.literal('files'),
        count: size,
        size,
        skippedPaths: z.array(name),
      }),
    ]),
  ),
  secrets: z.strictObject({
    fingerprints: z.array(
      z.strictObject({ version: name, fingerprint: digest }),
    ),
  }),
  indexSha256: digest,
  limitations: z.tuple([]),
});

export const dumpExtension: Readonly<
  Record<BackupManifest['connections'][number]['dialect'], string>
> = {
  sqlite: 'sqlite',
  postgres: 'pgdump',
  mysql: 'sql',
};

export async function withWorkspace<T>(
  base: string | undefined,
  operation: (dir: string) => Promise<T>,
): Promise<T> {
  const parent = base ?? tmpdir();
  const prefix = 'nocobase-backup-';
  await cleanAbandonedWork(parent, prefix, 'directory');
  const directory = join(parent, temporaryName(prefix));
  await mkdir(directory, { mode: 0o700 });
  try {
    return await operation(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export function migrationSummary(history: readonly MigrationFingerprint[]): {
  history: MigrationFingerprint[];
  last: MigrationFingerprint | null;
  sha256: string;
} {
  const fingerprints = history.map(({ packageName, name, checksum }) => ({
    packageName,
    name,
    checksum,
  }));
  return {
    history: fingerprints,
    last: fingerprints.at(-1) ?? null,
    sha256: createHash('sha256')
      .update(JSON.stringify(fingerprints))
      .digest('hex'),
  };
}

export async function fileDigest(
  file: string,
  signal?: AbortSignal,
): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file, {
    signal,
  }) as AsyncIterable<Buffer>)
    hash.update(chunk);
  return hash.digest('hex');
}

export async function describeEntry(
  directory: string,
  path: string,
  signal?: AbortSignal,
): Promise<ArchiveEntry> {
  const file = join(directory, path);
  return {
    path,
    size: (await stat(file)).size,
    sha256: await fileDigest(file, signal),
  };
}

export async function writeArchive(
  directory: string,
  file: string,
  entries: readonly ArchiveEntry[],
  manifest: BackupManifest,
  signal?: AbortSignal,
): Promise<void> {
  const indexPath = join(directory, 'index.jsonl');
  await pipeline(
    (function* () {
      for (const entry of entries) yield JSON.stringify(entry) + '\n';
    })(),
    createWriteStream(indexPath, { mode: 0o600 }),
    { signal },
  );
  manifest.indexSha256 = await fileDigest(indexPath, signal);
  await writeFile(
    join(directory, 'manifest.json'),
    JSON.stringify(manifest) + '\n',
    { mode: 0o600, signal },
  );
  await pipeline(
    create({ cwd: directory, gzip: true, portable: true, strict: true }, [
      ...entries.map((entry) => entry.path),
      'index.jsonl',
      'manifest.json',
    ]),
    createWriteStream(file, { flags: 'wx', mode: 0o600 }),
    { signal },
  );
}

async function unpack(
  file: string,
  directory: string,
  signal?: AbortSignal,
): Promise<{ paths: Set<string>; sha256: string }> {
  const paths = new Set<string>();
  const directories = new Set<string>();
  const hash = createHash('sha256');
  const abort = new AbortController();
  const extractionSignal = signal
    ? AbortSignal.any([signal, abort.signal])
    : abort.signal;
  const writes = new Set<Promise<void>>();
  let writeError: Error | undefined;
  const parser = list({
    strict: true,
    noResume: true,
    onReadEntry(entry) {
      const write = (async () => {
        const path = entry.path;
        const components = path.split('/');
        const allowed =
          path === 'manifest.json' ||
          path === 'index.jsonl' ||
          (components[0] === 'db' && components.length === 2) ||
          (components[0] === 'files' && components.length >= 3);
        assertArchivePath(path);
        const parents = components
          .slice(0, -1)
          .map((_, index) => components.slice(0, index + 1).join('/'));
        if (
          !allowed ||
          entry.type !== 'File' ||
          paths.has(path) ||
          directories.has(path) ||
          parents.some((parent) => paths.has(parent))
        ) {
          throw new BackupError(
            'BACKUP_UNSAFE_PATH',
            'The archive contains an unsupported, duplicate, or unsafe entry.',
          );
        }
        paths.add(path);
        for (const parent of parents) directories.add(parent);
        const destination = join(directory, path);
        await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
        await pipeline(
          entry,
          createWriteStream(destination, { flags: 'wx', mode: 0o600 }),
          { signal: extractionSignal },
        );
      })()
        .catch((error: Error) => {
          writeError ??= error;
          entry.resume();
          abort.abort();
        })
        .finally(() => {
          writes.delete(write);
        });
      writes.add(write);
    },
  });
  try {
    await pipeline(
      createReadStream(file),
      new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          hash.update(chunk);
          callback(null, chunk);
        },
      }),
      createGunzip(),
      parser,
      { signal: extractionSignal },
    );
  } catch (error) {
    abort.abort();
    throw writeError ?? error;
  } finally {
    await Promise.all(writes);
  }
  if (writeError) throw writeError;
  return { paths, sha256: hash.digest('hex') };
}

function assertUnique(values: readonly string[]): void {
  if (new Set(values).size !== values.length) {
    throw new BackupError(
      'BACKUP_INVALID_MANIFEST',
      'The manifest contains duplicate identifiers.',
    );
  }
}

function validateManifest(manifest: BackupManifest): void {
  assertUnique(manifest.connections.map(({ name }) => name));
  assertUnique(manifest.disks.map(({ name }) => name));
  assertUnique(manifest.secrets.fingerprints.map(({ version }) => version));
  for (const connection of manifest.connections) {
    assertName(connection.name);
    if (connection.mode === 'excluded') continue;
    const { server, dialect, migrations } = connection;
    const summary = migrationSummary(migrations.history);
    const typeMatches =
      server.type === dialect ||
      (dialect === 'mysql' && server.type === 'mariadb');
    const pathMatches =
      connection.mode !== 'dump' ||
      connection.path === `db/${connection.name}.${dumpExtension[dialect]}`;
    assertUnique(
      migrations.history.map((entry) =>
        JSON.stringify([entry.packageName, entry.name]),
      ),
    );
    if (
      !typeMatches ||
      !pathMatches ||
      (dialect === 'mysql' && server.lowerCaseTableNames === undefined) ||
      summary.sha256 !== migrations.sha256 ||
      JSON.stringify(summary.last) !== JSON.stringify(migrations.last)
    ) {
      throw new BackupError(
        'BACKUP_INVALID_MANIFEST',
        'Connection metadata is inconsistent with the manifest.',
        { connection: connection.name },
      );
    }
  }
  for (const disk of manifest.disks) {
    assertName(disk.name);
    if (disk.mode === 'files') disk.skippedPaths.forEach(assertArchivePath);
  }
}

async function verifyIndex(
  directory: string,
  manifest: BackupManifest,
  paths: Set<string>,
  signal?: AbortSignal,
): Promise<void> {
  const index = join(directory, 'index.jsonl');
  if ((await fileDigest(index, signal)) !== manifest.indexSha256) {
    throw new BackupError(
      'BACKUP_DIGEST_MISMATCH',
      'The archive index digest does not match the manifest.',
    );
  }
  const db = new Map(
    manifest.connections.flatMap((connection) =>
      connection.mode === 'dump' ? [[connection.path, connection]] : [],
    ),
  );
  const disks = new Map(
    manifest.disks.flatMap((disk) =>
      disk.mode === 'files' ? [[disk.name, { count: 0, size: 0, disk }]] : [],
    ),
  );
  paths.delete('manifest.json');
  paths.delete('index.jsonl');
  const input = createReadStream(index, { signal });
  const lines = createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      checkAbort(signal);
      const entry = entrySchema.parse(JSON.parse(line));
      if (!paths.delete(entry.path)) {
        throw new BackupError(
          'BACKUP_INVALID_INDEX',
          'The index lists a missing or duplicate entry.',
        );
      }
      const actual = await describeEntry(directory, entry.path, signal);
      if (actual.size !== entry.size || actual.sha256 !== entry.sha256) {
        throw new BackupError(
          'BACKUP_DIGEST_MISMATCH',
          'An archive entry failed its size or digest check.',
          { path: entry.path },
        );
      }
      const [, name, ...key] = entry.path.split('/');
      const disk = disks.get(name);
      const database = db.get(entry.path);
      if (entry.path.startsWith('files/') && disk) {
        const path = key.join('/');
        if (
          disk.disk.skippedPaths.some(
            (skip) => path === skip || path.startsWith(skip + '/'),
          )
        ) {
          throw new BackupError(
            'BACKUP_INVALID_INDEX',
            'The archive contains a file from an excluded path.',
          );
        }
        disk.count += 1;
        disk.size += entry.size;
      } else if (
        !database ||
        database.size !== entry.size ||
        database.sha256 !== entry.sha256
      ) {
        throw new BackupError(
          'BACKUP_INVALID_INDEX',
          'An archive entry does not match the manifest.',
        );
      } else {
        db.delete(entry.path);
      }
    }
  } finally {
    lines.close();
    input.destroy();
  }
  if (
    paths.size ||
    db.size ||
    [...disks.values()].some(
      ({ disk, count, size }) => count !== disk.count || size !== disk.size,
    )
  ) {
    throw new BackupError(
      'BACKUP_INVALID_INDEX',
      'The archive inventory does not match the manifest.',
    );
  }
}

export async function openArchive(
  file: string,
  directory: string,
  expectedSha256?: string,
  signal?: AbortSignal,
): Promise<OpenBackup> {
  try {
    await mkdir(directory, { mode: 0o700 });
    const { paths, sha256 } = await unpack(file, directory, signal);
    if (expectedSha256 !== undefined && expectedSha256 !== sha256) {
      throw new BackupError(
        'BACKUP_DIGEST_MISMATCH',
        'The backup file digest does not match the supplied digest.',
      );
    }
    if (!paths.has('manifest.json') || !paths.has('index.jsonl')) {
      throw new BackupError(
        'BACKUP_INVALID_MANIFEST',
        'The archive must contain its manifest and index.',
      );
    }
    const data: unknown = JSON.parse(
      await readFile(join(directory, 'manifest.json'), {
        encoding: 'utf8',
        signal,
      }),
    );
    const manifest = manifestSchema.parse(data);
    validateManifest(manifest);
    await verifyIndex(directory, manifest, paths, signal);
    return { directory, manifest, sha256 };
  } catch (error) {
    throw asBackupError(
      error,
      isMissing(error) ? 'BACKUP_FILE_MISSING' : 'BACKUP_INVALID_ARCHIVE',
      isMissing(error)
        ? 'The backup file could not be found.'
        : 'The backup archive is corrupt or has an invalid format.',
      signal,
    );
  }
}
