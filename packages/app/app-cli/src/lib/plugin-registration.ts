// Registers and unregisters a plugin in an application.
//
// The same explicit edits happen wherever an application lives: the manifest gains a dependency,
// while the client and server composition roots gain imports and entries for the
// surfaces the package exports. Only plugin lookup and the recorded dependency range differ between this repository
// and a generated application, so those are parameters and everything else is shared.
//
// The plan/apply split exists so `--dry-run` reports exactly what a real run would write, and so a caller that has to
// roll back knows which files to snapshot before writing.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  MissingTypeScriptError,
  clientPluginsPath,
  createClientPluginsEditor,
  describeClientPluginEdit,
  formatClientPlugins,
  readClientPlugins,
  writeClientPlugins,
} from './client-plugins.ts';
import type { ManualClientPluginEdit } from './client-plugins.ts';
import {
  cliPluginsPath,
  createCliPluginsEditor,
  describeCliPluginEdit,
  formatCliPlugins,
  readCliPlugins,
  writeCliPlugins,
  type ManualCliPluginEdit,
} from './cli-plugins.ts';
import {
  createServerPluginsEditor,
  describeServerPluginEdit,
  formatServerPlugins,
  readServerPlugins,
  serverPluginsPath,
  writeServerPlugins,
  type ManualServerPluginEdit,
} from './server-plugins.ts';
import {
  planPackageSkillRemovals,
  removePackageSkills,
} from './skills-sync.ts';

const PACKAGE_SCOPE = '@nocobase/';
const PLUGIN_PREFIX = `${PACKAGE_SCOPE}app-plugin-`;
const SHORT_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export interface PluginRegistrationPlan {
  /** Whether anything would change; a re-registration of an unchanged plugin is a no-op. */
  readonly changed: boolean;
  readonly cliPluginsChanged: boolean;
  readonly cliPluginsPath: string;
  /** The updated `cli/plugins.ts`, absent when that file needs no change. */
  readonly cliPluginsText?: string;
  readonly clientPluginsChanged: boolean;
  readonly clientPluginsPath: string;
  /** The updated `client/plugins.ts`, absent when that file needs no change. */
  readonly clientPluginsText?: string;
  readonly enabled: boolean;
  readonly manifestChanged: boolean;
  readonly manifestPath: string;
  /** The updated `package.json`, absent when the manifest needs no change. */
  readonly manifestText?: string;
  /**
   * Set when the client entry could not be written automatically because the application has no TypeScript. The
   * registration still stands; these are the lines left for a person or an agent to add.
   */
  readonly manualClientEdit?: ManualClientPluginEdit;
  /** Manual fallback when TypeScript is unavailable for the server composition root. */
  readonly manualServerEdit?: ManualServerPluginEdit;
  /** Manual fallback when TypeScript is unavailable for the CLI composition root. */
  readonly manualCliEdit?: ManualCliPluginEdit;
  readonly packageName: string;
  /** Why the client entry was skipped, for commands that report it. */
  readonly skippedClientEntry?:
    'disabled' | 'no-client-entry' | 'no-typescript';
  readonly serverPluginsChanged: boolean;
  readonly serverPluginsPath: string;
  /** The updated `server/plugins.ts`, absent when that file needs no change. */
  readonly serverPluginsText?: string;
  /** Why the server entry was skipped, for commands that report it. */
  readonly skippedServerEntry?:
    'disabled' | 'no-server-entry' | 'no-typescript';
  /** Why the CLI entry was skipped, for commands that report it. */
  readonly skippedCliEntry?: 'disabled' | 'no-cli-entry' | 'no-typescript';
}

export interface PluginUnregistrationPlan {
  readonly changed: boolean;
  readonly cliPluginsChanged: boolean;
  readonly cliPluginsPath: string;
  readonly cliPluginsText?: string;
  readonly clientPluginsChanged: boolean;
  readonly clientPluginsPath: string;
  readonly clientPluginsText?: string;
  readonly manifestChanged: boolean;
  readonly manifestPath: string;
  readonly manifestText?: string;
  /** Set when client/plugins.ts still holds the entry because the app has no TypeScript to edit it with. */
  readonly manualClientEdit?: ManualClientPluginEdit;
  readonly manualServerEdit?: ManualServerPluginEdit;
  readonly manualCliEdit?: ManualCliPluginEdit;
  readonly packageName: string;
  /** Which parts of the application the plugin was removed from, for reporting. */
  readonly removedFrom: readonly string[];
  readonly serverPluginsChanged: boolean;
  readonly serverPluginsPath: string;
  readonly serverPluginsText?: string;
}

/**
 * Expands what a user typed into a full package name. Short names are the common case, but a full name has to keep
 * working because that is what the manifest and every error message show.
 */
export function pluginPackageName(name: string): string {
  const trimmed = name.trim();
  if (trimmed === '') {
    throw new Error('A plugin name is required.');
  }
  if (
    /^@[a-z0-9][a-z0-9-]*\/app-plugin-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(trimmed)
  )
    return trimmed;
  if (trimmed.startsWith(PLUGIN_PREFIX)) {
    const shortName = trimmed.slice(PLUGIN_PREFIX.length);
    if (!SHORT_NAME_PATTERN.test(shortName)) {
      throw new Error(
        `Plugin name "${trimmed}" must be lower-case kebab-case, for example ${PLUGIN_PREFIX}audit-log.`,
      );
    }
    return trimmed;
  }
  if (trimmed.includes('/') || trimmed.startsWith('@')) {
    throw new Error(
      `Plugin "${trimmed}" must be a short name such as audit-log, or a full ${PLUGIN_PREFIX}* package name.`,
    );
  }
  if (!SHORT_NAME_PATTERN.test(trimmed)) {
    throw new Error(
      `Plugin name "${trimmed}" must be lower-case kebab-case, for example audit-log.`,
    );
  }
  return `${PLUGIN_PREFIX}${trimmed}`;
}

/** The short name a package name carries, for messages and directory lookups. */
export function pluginShortName(packageName: string): string {
  const match = /^@[a-z0-9][a-z0-9-]*\/app-plugin-(.+)$/u.exec(packageName);
  return match?.[1] ?? packageName;
}

/**
 * Whether a plugin actually contributes to the client. A server-only plugin has neither client export, and writing an
 * import for one produces an application that fails to resolve at build time, so the client entry is skipped rather
 * than written blind.
 *
 * The registered import is `<package>/client`, so that is what must exist. `./client/plugin` alone is not enough: a
 * plugin published before the barrel gained its default export has the descriptor but no `./client` to import it
 * from. Requiring the entry that actually gets written keeps such a plugin out of client/plugins.ts instead of
 * wiring an import the app cannot resolve.
 */
async function hasPluginExport(
  pluginDirectory: string,
  exportName: './client' | './server' | './cli',
): Promise<boolean> {
  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(
      await readFile(path.join(pluginDirectory, 'package.json'), 'utf8'),
    ) as Record<string, unknown>;
  } catch {
    return false;
  }
  const exports = manifest.exports;
  if (!isRecord(exports)) {
    return false;
  }
  return exports[exportName] !== undefined;
}

export async function hasClientPluginEntry(
  pluginDirectory: string,
): Promise<boolean> {
  return hasPluginExport(pluginDirectory, './client');
}

export async function hasServerPluginEntry(
  pluginDirectory: string,
): Promise<boolean> {
  return hasPluginExport(pluginDirectory, './server');
}

export async function hasCliPluginEntry(
  pluginDirectory: string,
): Promise<boolean> {
  return hasPluginExport(pluginDirectory, './cli');
}

/**
 * Computes the registration without writing it. `pluginDirectory` is where the plugin package can be read from, which
 * is a workspace directory in this repository and an installed dependency in a generated application.
 */
export async function planPluginRegistration({
  appRoot,
  dependencyRange,
  enabled = true,
  packageName,
  pluginDirectory,
}: {
  appRoot: string;
  dependencyRange: string;
  enabled?: boolean;
  packageName: string;
  pluginDirectory: string;
}): Promise<PluginRegistrationPlan> {
  const manifestPath = path.join(appRoot, 'package.json');
  const originalManifest = await readFile(manifestPath, 'utf8');
  const manifest = parseJson(originalManifest, manifestPath);

  const manifestChanged = registerInManifest({
    dependencyRange,
    manifest,
    manifestPath,
    packageName,
  });

  // A disabled registration installs the dependency without wiring the client entry, and a server-only plugin has no
  // client entry to wire, so both leave client/plugins.ts untouched.
  const shipsClientEntry = await hasClientPluginEntry(pluginDirectory);
  const skippedClientEntry = !enabled
    ? 'disabled'
    : shipsClientEntry
      ? undefined
      : 'no-client-entry';

  const client =
    skippedClientEntry === undefined
      ? await planClientAddition(appRoot, packageName)
      : { changed: false, filePath: clientPluginsPath(appRoot) };

  const shipsServerEntry = await hasServerPluginEntry(pluginDirectory);
  const skippedServerEntry = !enabled
    ? 'disabled'
    : shipsServerEntry
      ? undefined
      : 'no-server-entry';
  const server =
    skippedServerEntry === undefined
      ? await planServerAddition(appRoot, packageName)
      : { changed: false, filePath: serverPluginsPath(appRoot) };

  const shipsCliEntry = await hasCliPluginEntry(pluginDirectory);
  const skippedCliEntry = !enabled
    ? 'disabled'
    : shipsCliEntry
      ? undefined
      : 'no-cli-entry';
  const cli =
    skippedCliEntry === undefined
      ? await planCliAddition(appRoot, packageName)
      : { changed: false, filePath: cliPluginsPath(appRoot) };

  // Losing the whole registration because the app cannot format one file would throw away a working install and a
  // correct manifest. The dependency and the skills need no compiler, so only this one edit
  // degrades, and it degrades into instructions precise enough to apply by hand.
  const resolvedSkip = client.missingTypeScript
    ? 'no-typescript'
    : skippedClientEntry;
  const resolvedServerSkip = server.missingTypeScript
    ? 'no-typescript'
    : skippedServerEntry;
  const resolvedCliSkip = cli.missingTypeScript
    ? 'no-typescript'
    : skippedCliEntry;

  return {
    changed: manifestChanged || client.changed || server.changed || cli.changed,
    cliPluginsChanged: cli.changed,
    cliPluginsPath: cli.filePath,
    ...(cli.sourceText === undefined ? {} : { cliPluginsText: cli.sourceText }),
    clientPluginsChanged: client.changed,
    clientPluginsPath: client.filePath,
    ...(client.sourceText === undefined
      ? {}
      : { clientPluginsText: client.sourceText }),
    enabled,
    ...(client.missingTypeScript
      ? { manualClientEdit: describeClientPluginEdit(appRoot, packageName) }
      : {}),
    ...(server.missingTypeScript
      ? { manualServerEdit: describeServerPluginEdit(appRoot, packageName) }
      : {}),
    ...(cli.missingTypeScript
      ? { manualCliEdit: describeCliPluginEdit(appRoot, packageName) }
      : {}),
    manifestChanged,
    manifestPath,
    ...(manifestChanged
      ? { manifestText: `${JSON.stringify(manifest, null, 2)}\n` }
      : {}),
    packageName,
    ...(resolvedSkip === undefined ? {} : { skippedClientEntry: resolvedSkip }),
    ...(resolvedCliSkip === undefined
      ? {}
      : { skippedCliEntry: resolvedCliSkip }),
    serverPluginsChanged: server.changed,
    serverPluginsPath: server.filePath,
    ...(server.sourceText === undefined
      ? {}
      : { serverPluginsText: server.sourceText }),
    ...(resolvedServerSkip === undefined
      ? {}
      : { skippedServerEntry: resolvedServerSkip }),
  };
}

/** Computes the removal of a registration without writing it. */
export async function planPluginUnregistration({
  appRoot,
  packageName,
}: {
  appRoot: string;
  packageName: string;
}): Promise<PluginUnregistrationPlan> {
  const manifestPath = path.join(appRoot, 'package.json');
  const originalManifest = await readFile(manifestPath, 'utf8');
  const manifest = parseJson(originalManifest, manifestPath);

  const removedFrom = unregisterInManifest(manifest, manifestPath, packageName);
  const client = await planClientRemoval(appRoot, packageName);
  if (client.changed) {
    removedFrom.push('client/plugins.ts');
  }
  const server = await planServerRemoval(appRoot, packageName);
  if (server.changed) {
    removedFrom.push('server/plugins.ts');
  }
  const cli = await planCliRemoval(appRoot, packageName);
  if (cli.changed) {
    removedFrom.push('cli/plugins.ts');
  }
  const compositionRoots = new Set([
    'client/plugins.ts',
    'server/plugins.ts',
    'cli/plugins.ts',
  ]);
  const manifestChanged = removedFrom.some(
    (entry) => !compositionRoots.has(entry),
  );

  return {
    changed: removedFrom.length > 0,
    cliPluginsChanged: cli.changed,
    cliPluginsPath: cli.filePath,
    ...(cli.sourceText === undefined ? {} : { cliPluginsText: cli.sourceText }),
    clientPluginsChanged: client.changed,
    clientPluginsPath: client.filePath,
    ...(client.sourceText === undefined
      ? {}
      : { clientPluginsText: client.sourceText }),
    manifestChanged,
    manifestPath,
    ...(manifestChanged
      ? { manifestText: `${JSON.stringify(manifest, null, 2)}\n` }
      : {}),
    ...(client.missingTypeScript
      ? { manualClientEdit: describeClientPluginEdit(appRoot, packageName) }
      : {}),
    ...(server.missingTypeScript
      ? { manualServerEdit: describeServerPluginEdit(appRoot, packageName) }
      : {}),
    ...(cli.missingTypeScript
      ? { manualCliEdit: describeCliPluginEdit(appRoot, packageName) }
      : {}),
    packageName,
    removedFrom,
    serverPluginsChanged: server.changed,
    serverPluginsPath: server.filePath,
    ...(server.sourceText === undefined
      ? {}
      : { serverPluginsText: server.sourceText }),
  };
}

/** Writes a plan produced by either planner. */
export async function applyPluginRegistration(
  appRoot: string,
  plan: PluginRegistrationPlan | PluginUnregistrationPlan,
): Promise<void> {
  if (plan.manifestText !== undefined) {
    await writeFile(plan.manifestPath, plan.manifestText);
  }
  if (plan.clientPluginsText !== undefined) {
    await writeClientPlugins(appRoot, plan.clientPluginsText);
  }
  if (plan.serverPluginsText !== undefined) {
    await writeServerPlugins(appRoot, plan.serverPluginsText);
  }
  if (plan.cliPluginsText !== undefined) {
    await writeCliPlugins(appRoot, plan.cliPluginsText);
  }
}

/** Deletes a plugin's synchronized skill directories and ownership records. */
export async function removePluginSkills(
  appRoot: string,
  packageName: string,
): Promise<string[]> {
  return removePackageSkills(appRoot, packageName);
}

/** Lists synchronized Skill directories an unregistration would remove. */
export async function planPluginSkillRemovals(
  appRoot: string,
  packageName: string,
): Promise<string[]> {
  return planPackageSkillRemovals(appRoot, packageName);
}

interface ClientEditPlan {
  readonly changed: boolean;
  readonly filePath: string;
  readonly missingTypeScript?: boolean;
  readonly sourceText?: string;
}

async function planClientAddition(
  appRoot: string,
  packageName: string,
): Promise<ClientEditPlan> {
  const { filePath, sourceText } = await readClientPlugins(appRoot);
  let editor;
  try {
    editor = await createClientPluginsEditor(appRoot);
  } catch (error) {
    if (error instanceof MissingTypeScriptError) {
      return { changed: false, filePath, missingTypeScript: true };
    }
    throw error;
  }
  const added = editor.add(sourceText, packageName);
  if (!added.changed) {
    return { changed: false, filePath };
  }
  return {
    changed: true,
    filePath,
    sourceText: await formatClientPlugins(appRoot, added.sourceText, filePath),
  };
}

async function planClientRemoval(
  appRoot: string,
  packageName: string,
): Promise<ClientEditPlan> {
  const { exists, filePath, sourceText } = await readClientPlugins(appRoot);
  if (!exists) {
    return { changed: false, filePath };
  }
  let editor;
  try {
    editor = await createClientPluginsEditor(appRoot);
  } catch (error) {
    if (error instanceof MissingTypeScriptError) {
      return { changed: false, filePath, missingTypeScript: true };
    }
    throw error;
  }
  const removed = editor.remove(sourceText, packageName);
  if (!removed.changed) {
    return { changed: false, filePath };
  }
  return {
    changed: true,
    filePath,
    sourceText: await formatClientPlugins(
      appRoot,
      removed.sourceText,
      filePath,
    ),
  };
}

async function planServerAddition(
  appRoot: string,
  packageName: string,
): Promise<ClientEditPlan> {
  const { filePath, sourceText } = await readServerPlugins(appRoot);
  let editor;
  try {
    editor = await createServerPluginsEditor(appRoot);
  } catch (error) {
    if (error instanceof MissingTypeScriptError) {
      return { changed: false, filePath, missingTypeScript: true };
    }
    throw error;
  }
  const added = editor.add(sourceText, packageName);
  if (!added.changed) {
    return { changed: false, filePath };
  }
  return {
    changed: true,
    filePath,
    sourceText: await formatServerPlugins(appRoot, added.sourceText, filePath),
  };
}

async function planServerRemoval(
  appRoot: string,
  packageName: string,
): Promise<ClientEditPlan> {
  const { exists, filePath, sourceText } = await readServerPlugins(appRoot);
  if (!exists) {
    return { changed: false, filePath };
  }
  let editor;
  try {
    editor = await createServerPluginsEditor(appRoot);
  } catch (error) {
    if (error instanceof MissingTypeScriptError) {
      return { changed: false, filePath, missingTypeScript: true };
    }
    throw error;
  }
  const removed = editor.remove(sourceText, packageName);
  if (!removed.changed) {
    return { changed: false, filePath };
  }
  return {
    changed: true,
    filePath,
    sourceText: await formatServerPlugins(
      appRoot,
      removed.sourceText,
      filePath,
    ),
  };
}

async function planCliAddition(
  appRoot: string,
  packageName: string,
): Promise<ClientEditPlan> {
  const { filePath, sourceText } = await readCliPlugins(appRoot);
  let editor;
  try {
    editor = await createCliPluginsEditor(appRoot);
  } catch (error) {
    if (error instanceof MissingTypeScriptError) {
      return { changed: false, filePath, missingTypeScript: true };
    }
    throw error;
  }
  const added = editor.add(sourceText, packageName);
  if (!added.changed) {
    return { changed: false, filePath };
  }
  return {
    changed: true,
    filePath,
    sourceText: await formatCliPlugins(appRoot, added.sourceText, filePath),
  };
}

async function planCliRemoval(
  appRoot: string,
  packageName: string,
): Promise<ClientEditPlan> {
  const { exists, filePath, sourceText } = await readCliPlugins(appRoot);
  if (!exists) {
    return { changed: false, filePath };
  }
  let editor;
  try {
    editor = await createCliPluginsEditor(appRoot);
  } catch (error) {
    if (error instanceof MissingTypeScriptError) {
      return { changed: false, filePath, missingTypeScript: true };
    }
    throw error;
  }
  const removed = editor.remove(sourceText, packageName);
  if (!removed.changed) {
    return { changed: false, filePath };
  }
  return {
    changed: true,
    filePath,
    sourceText: await formatCliPlugins(appRoot, removed.sourceText, filePath),
  };
}

function registerInManifest({
  dependencyRange,
  manifest,
  manifestPath,
  packageName,
}: {
  dependencyRange: string;
  manifest: Record<string, unknown>;
  manifestPath: string;
  packageName: string;
}): boolean {
  const dependencies = ensureRecord(manifest, 'dependencies', manifestPath);
  const devDependencies =
    manifest.devDependencies === undefined
      ? undefined
      : ensureRecord(manifest, 'devDependencies', manifestPath);
  // Preserve the declared runtime range when cleaning up a duplicate development declaration.
  const existingDependency =
    dependencies[packageName] ?? devDependencies?.[packageName];
  if (
    existingDependency !== undefined &&
    existingDependency !== dependencyRange
  ) {
    // A malformed manifest can hold a non-string here, so render it as JSON rather than letting an object stringify
    // to `[object Object]` in the very message meant to identify it.
    throw new Error(
      `${manifestPath} already declares ${packageName} as ${JSON.stringify(existingDependency)}; refusing to overwrite it.`,
    );
  }

  let changed = false;
  if (dependencies[packageName] === undefined) {
    insertSorted(dependencies, packageName, dependencyRange);
    changed = true;
  }
  if (devDependencies && Object.hasOwn(devDependencies, packageName)) {
    delete devDependencies[packageName];
    changed = true;
  }
  return changed;
}

function unregisterInManifest(
  manifest: Record<string, unknown>,
  manifestPath: string,
  packageName: string,
): string[] {
  const removedFrom: string[] = [];

  for (const field of ['dependencies', 'devDependencies'] as const) {
    const dependencies = manifest[field];
    if (dependencies === undefined) {
      continue;
    }
    if (!isRecord(dependencies)) {
      throw new Error(`${manifestPath} must define ${field} as an object.`);
    }
    if (Object.prototype.hasOwnProperty.call(dependencies, packageName)) {
      delete dependencies[packageName];
      removedFrom.push(field);
    }
  }

  const nocobase = manifest.nocobase;
  if (nocobase !== undefined && !isRecord(nocobase)) {
    throw new Error(`${manifestPath} must define nocobase as an object.`);
  }
  const plugins = nocobase?.plugins;
  if (plugins !== undefined && !isRecord(plugins)) {
    throw new Error(
      `${manifestPath} must define nocobase.plugins as an object.`,
    );
  }
  if (
    plugins !== undefined &&
    Object.prototype.hasOwnProperty.call(plugins, packageName)
  ) {
    delete plugins[packageName];
    removedFrom.push('nocobase.plugins');
  }

  return removedFrom;
}

function ensureRecord(
  parent: Record<string, unknown>,
  key: string,
  file: string,
): Record<string, unknown> {
  const value = parent[key];
  if (value === undefined) {
    const created: Record<string, unknown> = {};
    parent[key] = created;
    return created;
  }
  if (!isRecord(value)) {
    throw new Error(`${file} must define ${key} as an object.`);
  }
  return value;
}

/** Inserts in key order, so a registration produces the same diff wherever it runs. */
function insertSorted(
  record: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  const entries = Object.entries(record);
  const nextEntryIndex = entries.findIndex(
    ([existingKey]) => existingKey > key,
  );
  if (nextEntryIndex === -1) {
    record[key] = value;
    return;
  }

  const nextEntries: [string, unknown][] = [
    ...entries.slice(0, nextEntryIndex),
    [key, value],
    ...entries.slice(nextEntryIndex),
  ];
  for (const existingKey of Object.keys(record)) {
    delete record[existingKey];
  }
  for (const [entryKey, entryValue] of nextEntries) {
    record[entryKey] = entryValue;
  }
}

function parseJson(contents: string, file: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}.`, { cause: error });
  }
  if (!isRecord(value)) {
    throw new Error(`${file} must contain a JSON object.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
