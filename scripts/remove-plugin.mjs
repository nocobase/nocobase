import { spawnSync } from 'node:child_process';
import { constants } from 'node:fs';
import {
  access,
  lstat,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createClientPluginsEditor,
  readClientPlugins,
} from '../packages/app/app-cli/src/lib/client-plugins.ts';
import {
  createServerPluginsEditor,
  readServerPlugins,
} from '../packages/app/app-cli/src/lib/server-plugins.ts';
import { normalizePluginName } from '../packages/tools/create-plugin/src/lib/names.ts';

const packagePrefix = '@nocobase/app-plugin-';
const directoryPrefix = 'app-plugin-';
const scriptPath = fileURLToPath(import.meta.url);
const defaultRepoRoot = path.resolve(path.dirname(scriptPath), '..');
const clientPluginsEditor = await createClientPluginsEditor(defaultRepoRoot);
const serverPluginsEditor = await createServerPluginsEditor(defaultRepoRoot);
const dependencyFields = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];
const skippedDirectoryNames = new Set([
  '.git',
  '.pnpm',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

const help = `Remove a NocoBase plugin package from packages/plugins/.

Usage:
  pnpm plugin:remove <name> [options]

Arguments:
  <name>        Short kebab-case name, for example audit-log
                (full @nocobase/app-plugin-* names also work)

Options:
  --no-install  Do not synchronize pnpm-lock.yaml after removal
  --dry-run     Validate and print the target without removing it
  --json        Print one machine-readable JSON result
  -h, --help    Show this help

Removal is refused while another workspace package references the plugin in a
dependency field, nocobase.plugins, client/plugins.ts, or server/plugins.ts.
Remove those registrations first.`;

export function parseRemovePluginArgs(args) {
  const options = {
    dryRun: false,
    help: false,
    install: true,
    json: false,
    name: undefined,
  };
  const positionals = [];

  for (const argument of args) {
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (argument === '--no-install') {
      options.install = false;
      continue;
    }
    if (argument === '--json') {
      options.json = true;
      continue;
    }
    if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    }
    positionals.push(argument);
  }

  if (positionals.length > 1) {
    throw new Error('Expected exactly one plugin name.');
  }
  options.name = positionals[0];

  if (!options.help && options.name === undefined) {
    throw new Error('A plugin name is required.');
  }

  return options;
}

export async function removePlugin({
  dryRun = false,
  install = true,
  name,
  repoRoot = defaultRepoRoot,
  synchronize = synchronizeWorkspace,
}) {
  const shortName = normalizePluginName(name);
  const packageName = `${packagePrefix}${shortName}`;
  const directoryName = `${directoryPrefix}${shortName}`;
  const resolvedRepoRoot = path.resolve(repoRoot);
  // Plugins are scaffolded into `packages/plugins/`, so that is the only directory removal targets.
  const packagesDirectory = path.join(resolvedRepoRoot, 'packages', 'plugins');
  const targetDirectory = path.join(packagesDirectory, directoryName);

  await access(packagesDirectory, constants.W_OK);
  await validatePluginTarget(targetDirectory, packageName);

  const references = await findWorkspaceReferences({
    packageName,
    repoRoot: resolvedRepoRoot,
    targetDirectory,
  });
  if (references.length > 0) {
    throw new PluginStillReferencedError(packageName, references);
  }

  const result = {
    directoryName,
    packageName,
    shortName,
    targetDirectory,
  };
  if (dryRun) {
    return result;
  }

  const backupDirectory = path.join(
    resolvedRepoRoot,
    `.plugin-remove-${directoryName}-${process.pid}-${Date.now()}`,
  );
  const lockfilePath = path.join(resolvedRepoRoot, 'pnpm-lock.yaml');
  const lockfileSnapshot = await readOptionalFile(lockfilePath);

  await rename(targetDirectory, backupDirectory);
  try {
    if (install) {
      synchronize(resolvedRepoRoot);
    }
    await rm(backupDirectory, { force: true, recursive: true });
  } catch (error) {
    const recoveryErrors = [];
    try {
      await rename(backupDirectory, targetDirectory);
    } catch (recoveryError) {
      recoveryErrors.push(recoveryError);
    }
    try {
      await restoreLockfile(lockfilePath, lockfileSnapshot);
    } catch (recoveryError) {
      recoveryErrors.push(recoveryError);
    }

    if (recoveryErrors.length > 0) {
      throw new AggregateError(
        [error, ...recoveryErrors],
        `Plugin removal failed and recovery was incomplete for ${targetDirectory}.`,
        { cause: error },
      );
    }

    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Plugin removal failed and ${targetDirectory} was restored: ${reason}`,
      { cause: error },
    );
  }

  return result;
}

export class PluginStillReferencedError extends Error {
  constructor(packageName, references) {
    super(formatReferenceError(packageName, references));
    this.name = 'PluginStillReferencedError';
    this.packageName = packageName;
    this.references = references;
  }
}

async function validatePluginTarget(targetDirectory, packageName) {
  let targetStats;
  try {
    targetStats = await lstat(targetDirectory);
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) {
      throw new Error(`Plugin does not exist: ${targetDirectory}`, {
        cause: error,
      });
    }
    throw error;
  }

  if (!targetStats.isDirectory() || targetStats.isSymbolicLink()) {
    throw new Error(
      `Plugin target must be a real directory: ${targetDirectory}`,
    );
  }

  const packageJsonPath = path.join(targetDirectory, 'package.json');
  const packageJson = await readJson(packageJsonPath);
  if (packageJson.name !== packageName) {
    throw new Error(
      `Refusing to remove ${targetDirectory}: expected package name ${packageName}, found ${String(packageJson.name)}.`,
    );
  }
}

async function findWorkspaceReferences({
  packageName,
  repoRoot,
  targetDirectory,
}) {
  // `packages/` now holds every workspace package, examples included, and the walk below is recursive, so one root
  // covers all of them.
  const packageJsonPaths = [path.join(repoRoot, 'package.json')];
  const packagesRoot = path.join(repoRoot, 'packages');
  if (await pathExists(packagesRoot)) {
    packageJsonPaths.push(
      ...(await findPackageJsonFiles(packagesRoot, targetDirectory)),
    );
  }

  const references = [];
  for (const packageJsonPath of packageJsonPaths) {
    if (!(await pathExists(packageJsonPath))) {
      continue;
    }
    const packageJson = await readJson(packageJsonPath);
    const locations = [];

    for (const field of dependencyFields) {
      if (hasOwn(packageJson[field], packageName)) {
        locations.push(field);
      }
    }
    if (hasOwn(packageJson.nocobase?.plugins, packageName)) {
      locations.push('nocobase.plugins');
    }
    // An application may import the plugin from client/plugins.ts without
    // declaring it anywhere in package.json; removing the package while that
    // import stands would leave the application unbuildable.
    if (
      await referencesClientPlugin(path.dirname(packageJsonPath), packageName)
    ) {
      locations.push('client/plugins.ts');
    }
    if (
      await referencesServerPlugin(path.dirname(packageJsonPath), packageName)
    ) {
      locations.push('server/plugins.ts');
    }

    if (locations.length > 0) {
      references.push({
        locations,
        packageJsonPath: path
          .relative(repoRoot, packageJsonPath)
          .split(path.sep)
          .join('/'),
      });
    }
  }

  return references;
}

async function referencesClientPlugin(appRoot, packageName) {
  const { exists, sourceText } = await readClientPlugins(appRoot);
  if (!exists) {
    return false;
  }
  try {
    return clientPluginsEditor
      .list(sourceText)
      .some((entry) => entry.packageName === packageName);
  } catch {
    // An unparsable file is the application author's to fix; treat it as no
    // reference rather than blocking an unrelated removal.
    return false;
  }
}

async function referencesServerPlugin(appRoot, packageName) {
  const { exists, sourceText } = await readServerPlugins(appRoot);
  if (!exists) {
    return false;
  }
  try {
    return serverPluginsEditor
      .list(sourceText)
      .some((entry) => entry.packageName === packageName);
  } catch {
    return false;
  }
}

async function findPackageJsonFiles(directory, targetDirectory) {
  if (path.resolve(directory) === path.resolve(targetDirectory)) {
    return [];
  }

  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!skippedDirectoryNames.has(entry.name)) {
        files.push(...(await findPackageJsonFiles(entryPath, targetDirectory)));
      }
      continue;
    }
    if (entry.isFile() && entry.name === 'package.json') {
      files.push(entryPath);
    }
  }
  return files;
}

function formatReferenceError(packageName, references) {
  const details = references
    .map(
      ({ locations, packageJsonPath }) =>
        `  ${packageJsonPath} (${locations.join(', ')})`,
    )
    .join('\n');
  const shortName = packageName.slice(packagePrefix.length);
  const unregisterCommands = [
    ...new Set(
      references.flatMap(({ locations, packageJsonPath }) => {
        if (
          !locations.includes('devDependencies') &&
          !locations.includes('nocobase.plugins') &&
          !locations.includes('client/plugins.ts') &&
          !locations.includes('server/plugins.ts')
        ) {
          return [];
        }
        const app = path.posix.basename(path.posix.dirname(packageJsonPath));
        return app === '.'
          ? []
          : [
              `  pnpm nocobase plugin remove ${shortName} --workspace-root . --app ${app}`,
            ];
      }),
    ),
  ];
  const suggestion =
    unregisterCommands.length > 0
      ? `\nUnregister the plugin before retrying:\n${unregisterCommands.join('\n')}`
      : '';
  return `Cannot remove ${packageName}; remove these workspace references first:\n${details}${suggestion}`;
}

async function readJson(file) {
  let contents;
  try {
    contents = await readFile(file, 'utf8');
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) {
      throw new Error(`Required package.json does not exist: ${file}`, {
        cause: error,
      });
    }
    throw error;
  }

  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}.`, { cause: error });
  }
}

async function readOptionalFile(file) {
  try {
    return await readFile(file);
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) {
      return undefined;
    }
    throw error;
  }
}

async function restoreLockfile(file, snapshot) {
  if (snapshot === undefined) {
    await rm(file, { force: true });
    return;
  }
  await writeFile(file, snapshot);
}

function synchronizeWorkspace(repoRoot) {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(pnpm, ['install', '--no-frozen-lockfile'], {
    cwd: repoRoot,
    env: { ...process.env, CI: 'true' },
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`pnpm install failed with exit code ${result.status}.`);
  }
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) {
      return false;
    }
    throw error;
  }
}

function hasOwn(value, key) {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, key)
  );
}

function isNodeError(error, code) {
  return error !== null && typeof error === 'object' && error.code === code;
}

export async function main(
  args = process.argv.slice(2),
  repoRoot = defaultRepoRoot,
) {
  const json = args.includes('--json');
  try {
    const options = parseRemovePluginArgs(args);
    if (options.help) {
      console.log(help);
      return;
    }

    const result = await removePlugin({ ...options, repoRoot });
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            schemaVersion: 1,
            ok: true,
            operation: 'plugin:remove',
            status: 'success',
            result: {
              mode: options.dryRun ? 'dry-run' : 'remove',
              ...result,
              commands:
                options.dryRun && options.install
                  ? ['CI=true pnpm install --no-frozen-lockfile']
                  : [],
            },
          },
          null,
          2,
        ),
      );
      return;
    }
    if (options.dryRun) {
      console.log(
        `Would remove ${result.packageName} from ${result.targetDirectory}`,
      );
      return;
    }

    console.log(`Removed ${result.packageName} from ${result.targetDirectory}`);
    if (!options.install) {
      console.log(
        'Skipped dependency installation. Run CI=true pnpm install --no-frozen-lockfile before committing.',
      );
    }
  } catch (error) {
    if (json) {
      const referenced = error instanceof PluginStillReferencedError;
      console.error(
        JSON.stringify(
          {
            schemaVersion: 1,
            ok: false,
            operation: 'plugin:remove',
            status: 'failure',
            error: {
              code: referenced
                ? 'PLUGIN_STILL_REFERENCED'
                : String(error?.message ?? error).startsWith(
                      'Plugin does not exist:',
                    )
                  ? 'PLUGIN_NOT_FOUND'
                  : 'PLUGIN_REMOVE_FAILED',
              message: error instanceof Error ? error.message : String(error),
              ...(referenced
                ? { details: { references: error.references } }
                : {}),
              suggestions: referenced
                ? unregisterSuggestions(error.packageName, error.references)
                : ['Run plugin:remove --help and correct the request.'],
            },
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }
    console.error(error instanceof Error ? error.message : error);
    console.error('Run pnpm plugin:remove --help for usage.');
    process.exitCode = 1;
  }
}

function unregisterSuggestions(packageName, references) {
  const shortName = packageName.slice(packagePrefix.length);
  const suggestions = new Map();
  for (const { packageJsonPath } of references) {
    const app = path.posix.basename(path.posix.dirname(packageJsonPath));
    if (app === '.') continue;
    const suggestion = {
      command: 'pnpm',
      args: ['plugin:remove', shortName, '--app', app],
    };
    suggestions.set(JSON.stringify(suggestion), suggestion);
  }
  return [...suggestions.values()];
}

const invokedPath = process.argv[1] && path.resolve(process.argv[1]);
if (invokedPath === scriptPath) {
  await main();
}
