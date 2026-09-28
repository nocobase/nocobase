import { existsSync, readFileSync } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createAppPaths } from '@nocobase/app-server/config';
import {
  checkConnections,
  OFFICIAL_DIALECTS,
  resolveDatabaseConfig,
  type AppDatabaseConfig,
  type ConnectionCheckResult,
  type OfficialDialect,
} from '@nocobase/app-server/database';
import { parseDocument } from 'yaml';

import type { CommandSuggestion } from '../command/errors.ts';
import { quoteForShell } from '@nocobase/cli-envelope';
import { buildConfigFile } from './config-file.ts';
import { configureDatabase } from './database-config.ts';

/**
 * Where the command is running, which decides both what it may offer and what it can tell the user to do about a
 * missing driver.
 *
 * A source checkout has the application's TypeScript beside it and a package manager that can install into it. A
 * deployment root is an extracted `dist/`, where the drivers were fixed when the application was built: adding one
 * there writes into a tree the next build regenerates, and on a cross-platform build it would fetch a binary for the
 * wrong platform. So the two differ in where the dialect list comes from and in what the error says, and in nothing
 * else — the file this writes is identical.
 */
export type ConfigInitMode = 'source' | 'deployment';

export type ConfigInitErrorReason =
  | 'unknown-dialect'
  | 'no-drivers'
  | 'driver-missing'
  | 'already-configured'
  | 'dialect-required'
  | 'directory-missing'
  | 'cancelled'
  | 'application-not-found';

export class ConfigInitError extends Error {
  public readonly reason: ConfigInitErrorReason;
  /** The command that gets past this, as the executable and its arguments, when one exists. */
  public readonly suggestion?: CommandSuggestion;
  public readonly details?: Readonly<Record<string, unknown>>;

  public constructor(
    reason: ConfigInitErrorReason,
    message: string,
    options: {
      readonly suggestion?: CommandSuggestion;
      readonly details?: Readonly<Record<string, unknown>>;
    } = {},
  ) {
    super(message);
    this.name = 'ConfigInitError';
    this.reason = reason;
    this.suggestion = options.suggestion;
    this.details = options.details;
  }
}

/**
 * The stable `--json` error code for a configuration command's refusal: its reason in UPPER_SNAKE, such as
 * `DRIVER_MISSING` for `driver-missing`.
 */
export function configErrorCode(reason: string): string {
  return reason.toUpperCase().replaceAll('-', '_');
}

export interface ConfigInitOptions {
  /** The application root the CLI was assembled with: the project directory, or `dist` in a deployment. */
  readonly rootDir: string;
  readonly dialect?: string;
  /** `--config`, resolved against `rootDir` exactly as the runtime resolves `APP_CONFIG_FILE`. */
  readonly configPath?: string;
  readonly force?: boolean;
  readonly environment?: NodeJS.ProcessEnv;
  /**
   * Asks which of several installed drivers to configure. Supplied by the command when a terminal is attached; its
   * absence is what makes a scripted run fail with `dialect-required` instead of waiting on a read that never returns.
   */
  readonly selectDialect?: (
    available: readonly OfficialDialect[],
  ) => Promise<OfficialDialect>;
  /**
   * The dialect an existing configuration uses, as the application resolves it. Asked only when the application is
   * already configured and `--dialect` was given, to tell a repeated run from one that asks for something else.
   */
  readonly readConfiguredDialect?: () => Promise<string | undefined>;
  /**
   * Asks for the main connection's settings, starting from the generated ones. Supplied by the command when a
   * terminal is attached; without it the generated placeholders are written and listed in `requiredSettings`.
   */
  readonly askConnection?: (
    dialect: OfficialDialect,
    defaults: Readonly<Record<string, unknown>>,
  ) => Promise<Readonly<Record<string, unknown>>>;
  /**
   * Receives the result of connecting with the settings about to be written, and decides whether to write them.
   * Without it no connection is attempted.
   */
  readonly onConnectionTested?: (
    result: ConnectionCheckResult,
  ) => Promise<boolean>;
}

export interface ConfigInitResult {
  /** `unchanged` when the application was already configured and nothing asked for a different configuration. */
  readonly status: 'configured' | 'unchanged';
  readonly mode: ConfigInitMode;
  /** The dialect written, or the one an unchanged configuration uses when it could be read. */
  readonly dialect?: OfficialDialect;
  readonly configFile: string;
  readonly configKey: string;
  /** Environment variables that already carry a value this file also sets, and therefore override it. */
  readonly overriddenByEnvironment: readonly string[];
  /**
   * Settings still at a generated placeholder that have to be set before the application can reach its database —
   * with `pnpm nocobase config set`, or `pnpm nocobase config set --from-env` for the password.
   */
  readonly requiredSettings: readonly string[];
  /** The commands to run next, in order. */
  readonly nextCommands: readonly string[];
  /** The connection attempted before writing, when one was. */
  readonly connectionTest?: ConnectionCheckResult;
}

/** Connection settings a generated configuration fills with placeholders, in the order they are asked for. */
const CONNECTION_FIELDS = [
  'host',
  'port',
  'database',
  'serviceName',
  'username',
  'password',
] as const;

/** The extensions the runtime accepts, in the order it probes them. */
const CONFIG_EXTENSIONS = ['.yml', '.yaml', '.toml', '.json'] as const;

/**
 * Secrets the standard templates map from the environment.
 *
 * The mapping belongs to the application, not to this command, so this is a check for the conventional names rather
 * than an authoritative reading of the sections' `env` declarations, which `config env` lists. It only ever produces a warning: a value set here wins
 * over the file, so writing a fresh secret into `config.yml` would look like it worked and change nothing.
 */
const ENVIRONMENT_SECRETS = ['AUTH_SECRET', 'SESSION_SECRET'] as const;

/** Detects a source checkout by the extension of the runtime module, the same signal the runtime itself uses. */
export async function detectConfigInitMode(
  rootDir: string,
): Promise<ConfigInitMode> {
  for (const [extension, mode] of [
    ['ts', 'source'],
    ['js', 'deployment'],
  ] as const) {
    if (await isFile(path.join(rootDir, 'server', `runtime.${extension}`))) {
      return mode;
    }
  }

  throw new ConfigInitError(
    'application-not-found',
    `No application found at ${rootDir}: expected server/runtime.ts or server/runtime.js.`,
  );
}

/**
 * The directory configuration and storage live in, which is the application root in a checkout and the directory
 * holding `dist` in a deployment. This mirrors `deploymentRootDir` in the application's own runtime definition.
 */
export function resolveDeploymentRootDir(
  rootDir: string,
  mode: ConfigInitMode,
): string {
  return mode === 'source' ? rootDir : path.resolve(rootDir, '..');
}

/**
 * Dialects this application can actually load a driver for.
 *
 * In a checkout that is whatever is installed, found by walking up for `node_modules` rather than by resolving the
 * package: `@nocobase/db-sqlite` does not export its own `package.json`, so the obvious `require.resolve` of it fails
 * with `ERR_PACKAGE_PATH_NOT_EXPORTED` on a package that is present. Walking also gives the answer the runtime will
 * get, which is what matters — a workspace member resolving a driver from the repository root is correctly reported
 * as having it, even though its own manifest never declares it.
 *
 * In a deployment the installed tree is the build's, so the manifest is the honest source: it lists exactly the
 * drivers `pnpm build` carried over from the application's dependencies.
 */
export async function findAvailableDialects(
  rootDir: string,
  mode: ConfigInitMode,
): Promise<readonly OfficialDialect[]> {
  if (mode === 'deployment') {
    const manifest = await readJson(path.join(rootDir, 'package.json'));
    const dependencies = isRecord(manifest.dependencies)
      ? manifest.dependencies
      : {};
    return OFFICIAL_DIALECTS.filter((dialect) =>
      Object.hasOwn(dependencies, driverPackage(dialect)),
    );
  }

  return OFFICIAL_DIALECTS.filter((dialect) =>
    Boolean(findInstalledPackage(rootDir, driverPackage(dialect))),
  );
}

export function driverPackage(dialect: OfficialDialect): string {
  return `@nocobase/db-${dialect}`;
}

/**
 * Validates everything, then writes once.
 *
 * The order matters more than it looks. A run that wrote the file and then reported a missing driver would leave the
 * user unable to retry: the second run refuses because the application is already configured, and the only way out is
 * to delete a file they were never told about. Every check therefore happens before anything is written, so a failed
 * run leaves the directory exactly as it found it and `config init` can simply be run again.
 */
export async function runConfigInit(
  options: ConfigInitOptions,
): Promise<ConfigInitResult> {
  const rootDir = path.resolve(options.rootDir);
  const mode = await detectConfigInitMode(rootDir);
  const deploymentRootDir = resolveDeploymentRootDir(rootDir, mode);
  const configFile = resolveConfigFile(
    rootDir,
    deploymentRootDir,
    options.configPath,
  );

  // First, before drivers are looked at or anything is asked. An application that is already configured is the one
  // answer that makes every other question moot: prompting for a dialect, or reporting a driver as missing, and only
  // then saying the file already exists would make someone decide something that was never going to be used.
  const existing =
    options.force === true
      ? undefined
      : findExistingConfiguration({
          configFile,
          deploymentRootDir,
          explicit: options.configPath !== undefined,
        });
  if (existing !== undefined) {
    return alreadyConfigured(existing, mode, options);
  }

  const available = await findAvailableDialects(rootDir, mode);
  const dialect = await resolveDialect(
    options.dialect,
    available,
    { rootDir, mode },
    options.selectDialect,
  );

  // Checked here rather than left to the write, so that a mistyped --config reports the directory it could not find
  // instead of an ENOENT naming the file the user did ask for.
  const targetDirectory = path.dirname(configFile);
  if (!existsSync(targetDirectory)) {
    throw new ConfigInitError(
      'directory-missing',
      `Cannot write the configuration: ${targetDirectory} does not exist.`,
      { details: { directory: targetDirectory } },
    );
  }

  const environment = options.environment ?? process.env;
  const overriddenByEnvironment = ENVIRONMENT_SECRETS.filter(
    (name) => (environment[name] ?? '').trim() !== '',
  );

  const example = await readConfigExample(deploymentRootDir);
  let configured = configureDatabase(
    example ?? '',
    dialect,
    path.basename(deploymentRootDir),
  );

  // SQLite is a file beside the application: there is nothing to ask and nothing to reach.
  const generated = mainConnection(configured);
  const answers =
    dialect !== 'sqlite' && options.askConnection
      ? await options.askConnection(dialect, pickConnectionFields(generated))
      : {};
  if (Object.keys(answers).length > 0) {
    configured = applyConnection(configured, answers);
  }

  let connectionTest: ConnectionCheckResult | undefined;
  if (dialect !== 'sqlite' && options.onConnectionTested) {
    connectionTest = await testConnection(
      { ...generated, ...answers },
      rootDir,
      deploymentRootDir,
    );
    if (!(await options.onConnectionTested(connectionTest))) {
      throw new ConfigInitError(
        'cancelled',
        'Nothing was written. Run pnpm nocobase config init again with the right settings.',
        { details: { connectionTest } },
      );
    }
  }

  await writeFile(configFile, buildConfigFile({ example: configured }), {
    encoding: 'utf8',
    flag: options.force === true ? 'w' : 'wx',
    mode: 0o600,
  });

  return {
    status: 'configured',
    mode,
    dialect,
    configFile,
    configKey: 'database.connections.main',
    overriddenByEnvironment,
    requiredSettings:
      dialect === 'sqlite'
        ? []
        : Object.keys(pickConnectionFields(generated))
            .filter((field) => !(field in answers))
            .map((field) => `database.connections.main.${field}`),
    nextCommands: nextCommands(mode, rootDir),
    ...(connectionTest ? { connectionTest } : {}),
  };
}

/**
 * What follows configuration: check it, then start. A deployment has no pnpm — a built `dist/` has no `.bin` and its
 * runtime image leaves the package manager out — so there both run through `node`, by absolute path.
 */
function nextCommands(
  mode: ConfigInitMode,
  rootDir: string,
): readonly string[] {
  if (mode === 'source') return ['pnpm nocobase config check', 'pnpm dev'];
  const node = (file: string, ...args: string[]): string =>
    ['node', path.join(rootDir, file), ...args].map(quoteForShell).join(' ');
  return [
    node(path.join('cli', 'index.js'), 'config', 'check'),
    node(path.join('server', 'standalone.js')),
  ];
}

/**
 * An already configured application is not an error to run this against.
 *
 * Re-running a setup sequence after a failure part-way through is exactly what an agent — and often a person — does,
 * and refusing the step that already succeeded stops the sequence for nothing. It is only refused when `--dialect` asks
 * for something other than what the configuration already uses, because treating that as success would report a
 * change that never happened.
 */
async function alreadyConfigured(
  existing: string,
  mode: ConfigInitMode,
  options: ConfigInitOptions,
): Promise<ConfigInitResult> {
  const requested = options.dialect;
  let current: string | undefined;
  if (requested !== undefined || options.readConfiguredDialect) {
    current = await options.readConfiguredDialect?.().catch(() => undefined);
  }

  if (requested !== undefined && requested !== current) {
    if (!isOfficialDialect(requested)) {
      throw new ConfigInitError(
        'unknown-dialect',
        `Unknown dialect "${requested}". Choose one of: ${OFFICIAL_DIALECTS.join(', ')}.`,
      );
    }
    throw new ConfigInitError(
      'already-configured',
      current === undefined
        ? `This application is already configured: ${existing}, and which database it uses could not be read. Edit that file, or run with --force to replace it.`
        : `This application is already configured for ${current}: ${existing}. Run with --force to replace it with a configuration for ${requested}, or edit that file.`,
      {
        details: {
          configFile: existing,
          requestedDialect: requested,
          ...(current ? { configuredDialect: current } : {}),
        },
      },
    );
  }

  return {
    status: 'unchanged',
    mode,
    ...(current !== undefined && isOfficialDialect(current)
      ? { dialect: current }
      : {}),
    configFile: existing,
    configKey: 'database.connections.main',
    overriddenByEnvironment: [],
    requiredSettings: [],
    nextCommands: nextCommands(mode, path.resolve(options.rootDir)),
  };
}

function mainConnection(yaml: string): Record<string, unknown> {
  const value: unknown = parseDocument(yaml).getIn(
    ['database', 'connections', 'main'],
    false,
  );
  const plain =
    typeof value === 'object' && value !== null && 'toJSON' in value
      ? (value as { toJSON(): unknown }).toJSON()
      : value;
  return isRecord(plain) ? plain : {};
}

function pickConnectionFields(
  connection: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return Object.fromEntries(
    CONNECTION_FIELDS.filter((field) => field in connection).map((field) => [
      field,
      connection[field],
    ]),
  );
}

function applyConnection(
  yaml: string,
  answers: Readonly<Record<string, unknown>>,
): string {
  const document = parseDocument(yaml);
  for (const [field, value] of Object.entries(answers)) {
    document.setIn(['database', 'connections', 'main', field], value);
  }
  return document.toString();
}

/**
 * Connects with the settings about to be written, before writing them. The driver is loaded the way the runtime loads
 * it, so a connection that works here is one the application can open.
 */
async function testConnection(
  connection: Readonly<Record<string, unknown>>,
  rootDir: string,
  deploymentRootDir: string,
): Promise<ConnectionCheckResult> {
  const dialect = String(connection.dialect);
  try {
    const database = await resolveDatabaseConfig({
      default: 'main',
      connections: { main: connection },
    } as unknown as AppDatabaseConfig);
    const [result] = await checkConnections(
      database,
      createAppPaths({ rootDir, deploymentRootDir }),
    );
    return (
      result ?? {
        name: 'main',
        dialect,
        status: 'failed',
        reason: 'No connection was configured.',
      }
    );
  } catch (error) {
    return {
      name: 'main',
      dialect,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Picks the dialect, and refuses rather than guessing when the driver for it is absent.
 *
 * With exactly one driver installed there is nothing to ask: the application can only run on that one, and a prompt
 * offering a single choice is a keystroke that carries no decision.
 */
async function resolveDialect(
  requested: string | undefined,
  available: readonly OfficialDialect[],
  where: DriverLocation,
  select:
    | ((available: readonly OfficialDialect[]) => Promise<OfficialDialect>)
    | undefined,
): Promise<OfficialDialect> {
  if (requested !== undefined) {
    if (!isOfficialDialect(requested)) {
      throw new ConfigInitError(
        'unknown-dialect',
        `Unknown dialect "${requested}". Choose one of: ${OFFICIAL_DIALECTS.join(', ')}.`,
      );
    }
    assertDriverInstalled(requested, available, where);
    return requested;
  }

  if (available.length === 0) {
    throw noDriversError(where);
  }

  if (available.length === 1) {
    return available[0];
  }

  if (select) {
    const chosen = await select(available);
    assertDriverInstalled(chosen, available, where);
    return chosen;
  }

  throw new ConfigInitError(
    'dialect-required',
    `Several database drivers are installed (${available.join(', ')}). Pass --dialect to choose one.`,
    { details: { availableDialects: available } },
  );
}

interface DriverLocation {
  readonly rootDir: string;
  readonly mode: ConfigInitMode;
}

function assertDriverInstalled(
  dialect: OfficialDialect,
  available: readonly OfficialDialect[],
  where: DriverLocation,
): void {
  if (available.includes(dialect)) {
    return;
  }

  const packageName = driverPackage(dialect);

  if (where.mode === 'deployment') {
    throw new ConfigInitError(
      'driver-missing',
      `This build does not include ${packageName}. Install it in the application sources and build again.`,
      { details: { dialect, missingDrivers: [packageName] } },
    );
  }

  throw new ConfigInitError(
    'driver-missing',
    `The ${dialect} driver is not installed.`,
    {
      suggestion: installSuggestion(where.rootDir, packageName),
      details: { dialect, missingDrivers: [packageName] },
    },
  );
}

function noDriversError(where: DriverLocation): ConfigInitError {
  if (where.mode === 'deployment') {
    return new ConfigInitError(
      'no-drivers',
      'This build includes no database driver. Install one in the application sources and build again.',
    );
  }

  const packageName = driverPackage('sqlite');
  return new ConfigInitError(
    'no-drivers',
    `No database driver is installed. Install the one this application should use, for example: ${packageName}.`,
    { suggestion: installSuggestion(where.rootDir, packageName) },
  );
}

/**
 * The `pnpm add` for a driver, pinned to the range the installed runtime accepts, as a suggestion whose `run` holds the
 * executable and its arguments.
 *
 * A bare `pnpm add @nocobase/db-postgres` installs whatever is newest, which during a prerelease can be a version the
 * application's `@nocobase/app-server` was never built against. The runtime declares every official driver as an
 * optional peer with the range it supports, so that range is read from the copy actually installed — no registry
 * request, and the answer describes this application rather than the latest release. Without a readable range, or in a
 * workspace where it is still a `workspace:` protocol, the command falls back to the bare name.
 */
export function installSuggestion(
  rootDir: string,
  packageName: string,
): CommandSuggestion {
  return {
    message: 'Install the driver:',
    run: {
      command: 'pnpm',
      args: ['add', installSpecifier(rootDir, packageName)],
    },
  };
}

/** The same `pnpm add` as one line a shell runs as written, for the `fix` of a `config check` finding. */
export function installCommand(rootDir: string, packageName: string): string {
  const specifier = installSpecifier(rootDir, packageName);
  // A range such as `>=1 <2` has to reach pnpm as one argument.
  return /^[\w@/.^~*+-]+$/u.test(specifier)
    ? `pnpm add ${specifier}`
    : `pnpm add ${JSON.stringify(specifier)}`;
}

function installSpecifier(rootDir: string, packageName: string): string {
  const range = readPeerRange(rootDir, packageName);
  return range === undefined ? packageName : `${packageName}@${range}`;
}

function readPeerRange(
  rootDir: string,
  packageName: string,
): string | undefined {
  const runtime = findInstalledPackage(rootDir, '@nocobase/app-server');
  if (runtime === undefined) return undefined;
  try {
    const manifest: unknown = JSON.parse(
      readFileSync(path.join(runtime, 'package.json'), 'utf8'),
    );
    const peers = isRecord(manifest) ? manifest.peerDependencies : undefined;
    const range = isRecord(peers) ? peers[packageName] : undefined;
    return typeof range === 'string' &&
      range.trim() !== '' &&
      !range.startsWith('workspace:')
      ? range.trim()
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Where the file goes, mirroring how the application resolves it.
 *
 * The asymmetry is the application's, not an accident here: a configured path is taken relative to the root the
 * runtime was given, while the default sits beside the deployment root along with `storage/`. Writing the default to
 * the other one produces a file the application never reads.
 */
function resolveConfigFile(
  rootDir: string,
  deploymentRootDir: string,
  configPath: string | undefined,
): string {
  return configPath === undefined
    ? path.join(deploymentRootDir, 'config.yml')
    : path.resolve(rootDir, configPath);
}

/**
 * The configuration file an application already has, if any.
 *
 * All four extensions are checked, not just the one being written, because the runtime probes all four and takes the
 * first: writing `config.yml` beside an existing `config.toml` produces a file that is silently ignored.
 */
function findExistingConfiguration(options: {
  readonly configFile: string;
  readonly deploymentRootDir: string;
  readonly explicit: boolean;
}): string | undefined {
  const candidates = options.explicit
    ? [options.configFile]
    : CONFIG_EXTENSIONS.map((extension) =>
        path.join(options.deploymentRootDir, `config${extension}`),
      );
  return candidates.find((candidate) => existsSync(candidate));
}

/** The example is optional: an application without one still gets the secrets it cannot start without. */
async function readConfigExample(
  deploymentRootDir: string,
): Promise<string | undefined> {
  try {
    return await readFile(
      path.join(deploymentRootDir, 'config.example.yml'),
      'utf8',
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

/** Walks up for an installed package, which is what Node's own resolution does and what pnpm's layouts require. */
function findInstalledPackage(
  fromDir: string,
  packageName: string,
): string | undefined {
  let directory = path.resolve(fromDir);

  for (;;) {
    const candidate = path.join(
      directory,
      'node_modules',
      ...packageName.split('/'),
    );

    if (existsSync(candidate)) return candidate;

    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

function isOfficialDialect(value: string): value is OfficialDialect {
  return (OFFICIAL_DIALECTS as readonly string[]).includes(value);
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = JSON.parse(await readFile(filePath, 'utf8'));
    return isRecord(parsed) ? parsed : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
