import { resolveDatabaseConfig } from './resolve-config.js';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import {
  assertCollectionArtifactDirectoryNames,
  COLLECTION_ARTIFACT_FILE_NAMES,
  COLLECTION_ARTIFACT_MANIFEST_FILE_NAME,
  DirectoryCollectionMetadataStore,
  serializeCollectionArtifact,
  serializeCollectionArtifactManifest,
  type CollectionArtifactFileKind,
  type DatabaseConnection,
  type DatabaseDriverRegistration,
  type DatabaseManager,
} from '@nocobase/db';

import type { AppPaths } from '../config/index.js';
import {
  isCollectionMetadataStoreInstance,
  isAppCollectionsDirectory,
  resolveAppCollectionsDirectory,
  resolveAppMetadataStore,
} from './collections-directory.js';
import { createAppDatabaseManager } from './manager.js';
import { selectAppDatabaseConnections } from './connection-selection.js';
import {
  assertMissingExplicitSourcesRecorded,
  planAppDatabaseTasks,
} from './plan.js';
import type { AppDatabaseTasksResult } from './tasks.js';
import type { AppDatabaseConfig } from './types.js';

/**
 * Reads every Collection a connection resolves and writes it under
 * `database/<connection>/collections/<name>/` as three files, plus a
 * connection-level manifest. The directory is a cache for every connection,
 * external ones included: nothing here is read back at runtime, the generator
 * may rewrite or delete any of it, and migrations — or, for an external
 * connection, the database it points at and its hand-written
 * `database/<connection>/metadata/` — remain the authority.
 */
export interface AppCollectionsArtifactOptions {
  readonly paths?: AppPaths;
  readonly drivers?: Record<string, DatabaseDriverRegistration>;
  /** One connection; defaults to the default connection. Exclusive with `all`. */
  readonly connection?: string;
  /** Every configured connection, external ones included. */
  readonly all?: boolean;
  /** Compare the generated result with the files on disk and write nothing. */
  readonly check?: boolean;
  /** Reuse an open manager instead of creating and destroying one. */
  readonly database?: DatabaseManager;
}

export type AppCollectionsArtifactDifferenceKind =
  'missing' | 'stale' | 'unexpected';

/** One file that differs between the database and the directory; `path` is relative to the collections directory. */
export interface AppCollectionsArtifactDifference {
  path: string;
  kind: AppCollectionsArtifactDifferenceKind;
}

export interface AppCollectionsArtifactManifestSummary {
  dialect: string;
  /** An `external` connection has no migration history, so `migrationHead` is always `null` there. */
  schemaManagement: 'managed' | 'external';
  migrationHead: string | null;
  collections: string[];
}

export interface AppCollectionsArtifactConnectionResult {
  connection: string;
  /** Absolute path of `database/<connection>/collections`. */
  directory: string;
  status: 'completed' | 'stale' | 'failed';
  manifest?: AppCollectionsArtifactManifestSummary;
  /** Files created or rewritten, relative to `directory`. Empty in check mode. */
  written?: string[];
  /** Files removed because their Collection no longer exists. Empty in check mode. */
  deleted?: string[];
  /** Collections whose three files already matched. */
  unchanged?: number;
  /** Check mode only. */
  differences?: AppCollectionsArtifactDifference[];
  /**
   * Check mode only. False when `directory` does not exist: nothing has been
   * generated for this connection yet, which a reader has to tell apart from
   * artifacts that have drifted, because every expected file is then reported
   * `missing` and the two look alike.
   */
  directoryExists?: boolean;
  /**
   * Hand-written metadata documents, in this connection's metadata directory,
   * that name a Collection the database does not have. Reported for a person
   * to fix or remove; the generator never touches that directory.
   */
  unusedMetadata?: string[];
  error?: string;
}

export interface AppCollectionsArtifactResult {
  ok: boolean;
  status: 'completed' | 'stale' | 'failed' | 'not-configured';
  check: boolean;
  results: AppCollectionsArtifactConnectionResult[];
}

const STAGING_PREFIX = '.staging-';
const FILE_KINDS: readonly CollectionArtifactFileKind[] = [
  'collection',
  'metadata',
  'schema',
];
const FILE_NAME_KINDS: ReadonlyMap<string, CollectionArtifactFileKind> =
  new Map(
    FILE_KINDS.map((kind) => [COLLECTION_ARTIFACT_FILE_NAMES[kind], kind]),
  );

export async function generateAppCollectionsArtifact(
  config: AppDatabaseConfig,
  options: AppCollectionsArtifactOptions = {},
): Promise<AppCollectionsArtifactResult> {
  const check = options.check ?? false;
  const names = selectAppDatabaseConnections(config, options);
  if (names === undefined) {
    return { ok: true, status: 'not-configured', check, results: [] };
  }
  if (!options.database) {
    config = await resolveDatabaseConfig({
      ...config,
      drivers: { ...config.drivers, ...options.drivers },
    });
  }
  const database =
    options.database ??
    createAppDatabaseManager(config, options.paths, options.drivers);
  if (!database) {
    return { ok: true, status: 'not-configured', check, results: [] };
  }
  const results: AppCollectionsArtifactConnectionResult[] = [];
  try {
    for (const name of names) {
      const directory = resolveAppCollectionsDirectory(name, options.paths);
      try {
        results.push(
          await generateForConnection(database.connection(name), directory, {
            check,
            metadataDirectory: metadataDirectoryOf(config, name, options.paths),
            migrationHead: () =>
              readMigrationHead(database, config, name, options),
          }),
        );
      } catch (error) {
        results.push({
          connection: name,
          directory,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    if (!options.database) await database.destroy();
  }
  const status = results.some((entry) => entry.status === 'failed')
    ? 'failed'
    : results.some((entry) => entry.status === 'stale')
      ? 'stale'
      : 'completed';
  return { ok: status === 'completed', status, check, results };
}

/**
 * Mirrors the selection rules of `planAppDatabaseTasks` so the two commands
 * read the same flags the same way — except that external connections take
 * part: their schema is owned elsewhere, but a snapshot of what it resolves to
 * is exactly what a reader without database access needs from them.
 */
/**
 * The history table name is part of a connection's migration configuration,
 * which planning already resolves — including the legacy top-level form. Ask
 * the planner rather than duplicating that resolution here, but ask it about
 * this one connection: planning validates what it plans, and a misconfigured
 * connection nobody selected must not fail a run that never touches it. An
 * external connection has no history table at all, so it is not planned.
 */
async function readMigrationHead(
  database: DatabaseManager,
  config: AppDatabaseConfig,
  name: string,
  options: AppCollectionsArtifactOptions,
): Promise<string | null> {
  if (config.connections[name].schemaManagement === 'external') return null;
  const [task] = planAppDatabaseTasks(config, ['migrations'], {
    contributions: { appPackageName: 'app', migrations: [], seeds: [] },
    paths: options.paths,
    drivers: options.drivers,
    connection: name,
    // No migration runs here, so a directory that was removed after migrating
    // is no obstacle; a mistyped one is still rejected below.
    deferMissingMigrationSources: true,
  });
  const history = await database
    .createMigrator({
      connection: name,
      tableName: task?.config.tableName,
      sources: [],
    })
    .history();
  // The planner is given a placeholder application package name here, so the
  // history cannot be matched by package: any history marks the directory as one
  // that was removed, and a connection with none keeps the mistyped-path error.
  if (!history.length) {
    assertMissingExplicitSourcesRecorded(
      {
        connection: name,
        missingExplicitSources: task?.missingExplicitSources,
      },
      new Set(),
    );
  }
  return history.at(-1)?.name ?? null;
}

interface ConnectionRunOptions {
  readonly check: boolean;
  /** The directory a directory metadata store reads, when the connection has one. */
  readonly metadataDirectory: string | undefined;
  readonly migrationHead: () => Promise<string | null>;
}

/**
 * The directory a connection's metadata store reads hand-written documents
 * from, if it is a directory store. Such a directory must never be a generated
 * collections directory — the generator rewrites and deletes files there — so
 * a store configured onto one is refused before anything is written.
 */
function metadataDirectoryOf(
  config: AppDatabaseConfig,
  name: string,
  paths: AppPaths | undefined,
): string | undefined {
  const connection = config.connections[name];
  const store = resolveAppMetadataStore(connection.metadataStore, {
    name,
    external: connection.schemaManagement === 'external',
    shared: config.metadataStore,
    paths,
  });
  if (
    store === undefined ||
    isCollectionMetadataStoreInstance(store) ||
    store.type !== 'directory'
  ) {
    return undefined;
  }
  if (isAppCollectionsDirectory(store.directory, paths)) {
    throw new Error(
      `Connection "${name}" reads metadata from ${store.directory}, which is a generated collections directory. Keep hand-written metadata in database/<connection>/metadata/ as one <name>.json per Collection and point metadataStore there.`,
    );
  }
  return path.resolve(store.directory);
}

async function generateForConnection(
  connection: DatabaseConnection,
  directory: string,
  options: ConnectionRunOptions,
): Promise<AppCollectionsArtifactConnectionResult> {
  const names: string[] = [];
  for await (const collection of connection.collections.scan()) {
    if (collection.name) names.push(collection.name);
  }
  names.sort();
  assertCollectionArtifactDirectoryNames(names);

  const expected = new Map<string, string>();
  const perCollection = new Map<string, Map<string, string>>();
  for (const name of names) {
    const [resolution, physical, stored] = await Promise.all([
      connection.collections.getResolution(name),
      connection.collections.getPhysical(name),
      connection.collectionMetadata.get(name),
    ]);
    if (!resolution || !physical) {
      throw new Error(
        `Collection "${name}" disappeared while its artifact was being generated.`,
      );
    }
    const files = serializeCollectionArtifact({
      name,
      resolution,
      physical,
      metadata: stored?.document,
    });
    const own = new Map<string, string>();
    for (const kind of FILE_KINDS) {
      const relative = path.posix.join(
        name,
        COLLECTION_ARTIFACT_FILE_NAMES[kind],
      );
      own.set(relative, files[kind]);
      expected.set(relative, files[kind]);
    }
    perCollection.set(name, own);
  }
  const manifest: AppCollectionsArtifactManifestSummary = {
    dialect: connection.dialect,
    schemaManagement: connection.schemaManagement,
    migrationHead: await options.migrationHead(),
    collections: names,
  };
  expected.set(
    COLLECTION_ARTIFACT_MANIFEST_FILE_NAME,
    serializeCollectionArtifactManifest({
      connection: connection.name,
      ...manifest,
    }),
  );

  const disk = readDirectory(directory);
  const differences = diff(expected, disk);
  const unusedMetadata =
    options.metadataDirectory === undefined
      ? undefined
      : await unusedMetadataIn(options.metadataDirectory, names);
  const base = {
    connection: connection.name,
    directory,
    manifest,
    ...(unusedMetadata?.length ? { unusedMetadata } : {}),
  };

  if (options.check) {
    return {
      ...base,
      status: differences.length === 0 ? 'completed' : 'stale',
      directoryExists: disk.exists,
      differences,
      unchanged: countUnchanged(perCollection, differences),
    };
  }

  if (disk.unexpected.length > 0) {
    throw new Error(
      `Unexpected entries in ${directory}; remove them or move them out of the collections directory: ${disk.unexpected.join(', ')}.`,
    );
  }

  const changed = new Set(
    differences
      .filter((entry) => entry.kind !== 'unexpected')
      .map((entry) => entry.path.split('/')[0]),
  );
  const written: string[] = [];
  const deleted: string[] = [];
  mkdirSync(directory, { recursive: true });
  removeStaleStaging(directory);
  const staging = mkdtempSync(path.join(directory, STAGING_PREFIX));
  try {
    for (const [name, files] of perCollection) {
      if (!changed.has(name)) continue;
      const stagingDirectory = path.join(staging, name);
      mkdirSync(stagingDirectory);
      for (const [relative, content] of files) {
        writeFileSync(path.join(staging, relative), content);
        written.push(relative);
      }
      const target = path.join(directory, name);
      rmSync(target, { recursive: true, force: true });
      renameSync(stagingDirectory, target);
    }
    for (const name of disk.collections) {
      if (perCollection.has(name)) continue;
      for (const relative of disk.files.keys()) {
        if (relative.startsWith(`${name}/`)) deleted.push(relative);
      }
      rmSync(path.join(directory, name), { recursive: true, force: true });
    }
    if (changed.has(COLLECTION_ARTIFACT_MANIFEST_FILE_NAME)) {
      const stagingManifest = path.join(
        staging,
        COLLECTION_ARTIFACT_MANIFEST_FILE_NAME,
      );
      writeFileSync(
        stagingManifest,
        expected.get(COLLECTION_ARTIFACT_MANIFEST_FILE_NAME)!,
      );
      renameSync(
        stagingManifest,
        path.join(directory, COLLECTION_ARTIFACT_MANIFEST_FILE_NAME),
      );
      written.push(COLLECTION_ARTIFACT_MANIFEST_FILE_NAME);
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
  return {
    ...base,
    status: 'completed',
    written: written.sort(),
    deleted: deleted.sort(),
    unchanged: countUnchanged(perCollection, differences),
  };
}

async function unusedMetadataIn(
  directory: string,
  collections: readonly string[],
): Promise<string[]> {
  const present = new Set(collections);
  const store = new DirectoryCollectionMetadataStore({ directory });
  const unused: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await store.list(cursor === undefined ? {} : { cursor });
    for (const item of page.items) {
      if (!present.has(item.name)) unused.push(item.name);
    }
    cursor = page.nextCursor;
  } while (cursor !== undefined);
  return unused.sort();
}

interface DirectoryState {
  /** False when the directory itself is absent, as opposed to empty. */
  readonly exists: boolean;
  /** Known-shaped files, relative path → content. */
  readonly files: Map<string, string>;
  /** Collection directories present on disk. */
  readonly collections: string[];
  /** Entries the generator does not own and will not touch. */
  readonly unexpected: string[];
}

/**
 * Dot-prefixed entries are ignored rather than reported: editors and operating
 * systems drop them everywhere, and the generator's own staging directories
 * use the prefix too.
 */
function readDirectory(directory: string): DirectoryState {
  const files = new Map<string, string>();
  const collections: string[] = [];
  const unexpected: string[] = [];
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { exists: false, files, collections, unexpected };
    }
    throw error;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (
      entry.isFile() &&
      entry.name === COLLECTION_ARTIFACT_MANIFEST_FILE_NAME
    ) {
      files.set(
        entry.name,
        readFileSync(path.join(directory, entry.name), 'utf8'),
      );
      continue;
    }
    if (!entry.isDirectory() || entry.name.startsWith('_')) {
      unexpected.push(entry.name);
      continue;
    }
    collections.push(entry.name);
    const collectionDirectory = path.join(directory, entry.name);
    for (const child of readdirSync(collectionDirectory, {
      withFileTypes: true,
    })) {
      if (child.name.startsWith('.')) continue;
      const relative = path.posix.join(entry.name, child.name);
      if (child.isFile() && FILE_NAME_KINDS.has(child.name)) {
        files.set(
          relative,
          readFileSync(path.join(collectionDirectory, child.name), 'utf8'),
        );
      } else {
        unexpected.push(relative);
      }
    }
  }
  return {
    exists: true,
    files,
    collections: collections.sort(),
    unexpected: unexpected.sort(),
  };
}

function diff(
  expected: ReadonlyMap<string, string>,
  disk: DirectoryState,
): AppCollectionsArtifactDifference[] {
  const differences: AppCollectionsArtifactDifference[] = [];
  for (const [relative, content] of expected) {
    const current = disk.files.get(relative);
    if (current === undefined)
      differences.push({ path: relative, kind: 'missing' });
    else if (current !== content)
      differences.push({ path: relative, kind: 'stale' });
  }
  for (const relative of disk.files.keys()) {
    if (!expected.has(relative))
      differences.push({ path: relative, kind: 'unexpected' });
  }
  for (const relative of disk.unexpected) {
    differences.push({ path: relative, kind: 'unexpected' });
  }
  return differences.sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );
}

function countUnchanged(
  perCollection: ReadonlyMap<string, unknown>,
  differences: readonly AppCollectionsArtifactDifference[],
): number {
  const touched = new Set(differences.map((entry) => entry.path.split('/')[0]));
  let unchanged = 0;
  for (const name of perCollection.keys())
    if (!touched.has(name)) unchanged += 1;
  return unchanged;
}

function removeStaleStaging(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith(STAGING_PREFIX)) {
      rmSync(path.join(directory, entry.name), {
        recursive: true,
        force: true,
      });
    }
  }
}

/** How one connection's Collection cache refresh went, after the migrations that made it stale. */
export interface AppCollectionsRefreshResult {
  connection: string;
  status: 'completed' | 'failed';
  written?: string[];
  deleted?: string[];
  error?: string;
}

export interface RefreshAppCollectionsArtifactOptions {
  readonly paths?: AppPaths;
  /** The manager the migrations ran on, so the cache reads the state they left behind. */
  readonly database: DatabaseManager;
}

/**
 * Regenerates the Collection cache of every connection whose schema a
 * database run changed: migrations executed, rolled back, or rebuilt from
 * empty. Seeds write rows, never structure, and a preview changes nothing, so
 * neither triggers a refresh. Returns `undefined` when nothing changed.
 *
 * A failure is reported in the result, never raised: the migrations it
 * follows are already committed, and the cache can always be rebuilt with
 * `collections generate`.
 */
export async function refreshAppCollectionsArtifact(
  config: AppDatabaseConfig,
  result: AppDatabaseTasksResult,
  options: RefreshAppCollectionsArtifactOptions,
): Promise<AppCollectionsRefreshResult[] | undefined> {
  const names = new Set<string>();
  for (const entry of result.results) {
    if (
      entry.kind === 'migrations' &&
      entry.status === 'completed' &&
      !entry.dryRun &&
      (entry.fresh ||
        (entry.executed?.length ?? 0) > 0 ||
        (entry.rolledBack?.length ?? 0) > 0)
    ) {
      names.add(entry.connection);
    }
  }
  if (names.size === 0) return undefined;
  const refreshed: AppCollectionsRefreshResult[] = [];
  for (const connection of names) {
    try {
      const outcome = await generateAppCollectionsArtifact(config, {
        paths: options.paths,
        database: options.database,
        connection,
      });
      const entry = outcome.results[0];
      refreshed.push(
        entry?.status === 'completed'
          ? {
              connection,
              status: 'completed',
              written: entry.written ?? [],
              deleted: entry.deleted ?? [],
            }
          : {
              connection,
              status: 'failed',
              error: entry?.error ?? 'No Collection cache was generated.',
            },
      );
    } catch (error) {
      refreshed.push({
        connection,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return refreshed;
}
