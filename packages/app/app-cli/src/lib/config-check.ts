import { existsSync } from 'node:fs';
import path from 'node:path';

import { isPlaceholderSecret } from '@nocobase/app-server/config';
import {
  checkConnections,
  MissingDatabaseDriversError,
  type AppDatabaseConfig,
  type ConnectionCheckResult,
} from '@nocobase/app-server/database';

import type { AppCommandRuntime } from '../context.ts';
import {
  detectConfigInitMode,
  installCommand,
  type ConfigInitMode,
} from './config-init.ts';
import {
  activeConfigFile,
  closestKey,
  exampleSections,
} from './config-keys.ts';

export type ConfigCheckLevel = 'error' | 'warning';

export type ConfigCheckCode =
  | 'load-failed'
  | 'driver-missing'
  | 'secret-missing'
  | 'secret-placeholder'
  | 'secrets-missing'
  | 'session-secret-ephemeral'
  | 'unknown-key'
  | 'unexpanded-reference'
  | 'invalid'
  | 'connection-failed';

export interface ConfigCheckFinding {
  readonly level: ConfigCheckLevel;
  readonly code: ConfigCheckCode;
  /** The configuration key the finding is about, when there is one. */
  readonly key?: string;
  readonly message: string;
  /** A command that resolves it, runnable as written. */
  readonly fix?: string;
}

/**
 * When to open database connections.
 *
 * `auto` connects to every connection that is not SQLite. A SQLite database is a local file, so there is nothing to
 * reach, and opening one would create the file as a side effect of checking; any other dialect is exactly where a
 * configuration that loads cleanly still fails to start, so leaving it out would make a passing check the
 * least trustworthy answer this command can give.
 */
export type ConfigCheckConnectMode = 'auto' | 'always' | 'never';

export interface ConfigCheckOptions {
  readonly rootDir: string;
  /** Loads the application exactly as a start would, without starting it. */
  readonly loadRuntime: () => Promise<AppCommandRuntime>;
  readonly connect?: ConfigCheckConnectMode;
  readonly connectTimeoutMs?: number;
  readonly environment?: NodeJS.ProcessEnv;
}

export interface ConfigCheckResult {
  readonly ok: boolean;
  readonly mode: ConfigInitMode;
  /** The configuration file the application reads, when it has one. */
  readonly configFile?: string;
  readonly findings: readonly ConfigCheckFinding[];
  readonly connections: readonly ConnectionCheckResult[];
  /**
   * What the browser receives through `config.public`, nested under section names. Lets a change be checked without
   * opening the application.
   */
  readonly public: Readonly<Record<string, unknown>>;
}

const REFERENCE = /\$\{[A-Za-z_][A-Za-z0-9_]*\}/u;

/**
 * Checks a configuration by loading it the way the application does, then asking of it what startup would.
 *
 * Nothing here re-implements a rule the runtime already applies. Loading goes through the application's own runtime
 * definition, so a file that fails to parse, a dialect with no driver or a configured path that is not there fails here
 * for the same reason it would fail a start. What loading cannot show — a secret left at the placeholder, a section
 * name misspelled so that it is silently ignored, a database that cannot be reached — is then asked of the result.
 *
 * The application is never created. Creating it connects, starts queues, and with `autoRun` applies migrations, none of
 * which a check may do.
 */
export async function runConfigCheck(
  options: ConfigCheckOptions,
): Promise<ConfigCheckResult> {
  const rootDir = path.resolve(options.rootDir);
  const mode = await detectConfigInitMode(rootDir);
  const findings: ConfigCheckFinding[] = [];

  let runtime: AppCommandRuntime;
  try {
    runtime = await options.loadRuntime();
  } catch (error) {
    findings.push(...loadFailureFindings(error, rootDir, mode));
    return { ok: false, mode, findings, connections: [], public: {} };
  }

  try {
    const environment = options.environment ?? process.env;
    const configFile = activeConfigFile(
      rootDir,
      runtime.paths.deploymentRootDir,
      runtime,
      environment,
    );

    findings.push(...secretFindings(runtime, configFile));
    // The rules each section declares with defineAppConfig, the same ones a start enforces.
    for (const issue of await runtime.config.validate()) {
      findings.push({
        level: issue.level,
        code: 'invalid',
        key: issue.path,
        message: `${issue.path} ${issue.message}`,
        ...(issue.fix ? { fix: issue.fix } : {}),
      });
    }

    const layers = runtime.config.layers();
    const known = new Set([
      ...Object.keys(layers.defaults),
      ...(await exampleSections(runtime.paths.deploymentRootDir)),
    ]);
    findings.push(...unknownKeyFindings(layers.overrides, known));
    findings.push(...referenceFindings(layers.overrides));

    const database = runtime.config.get<AppDatabaseConfig>('database');
    const connectMode = options.connect ?? 'auto';
    const connections =
      database === undefined ||
      database.default === 'none' ||
      connectMode === 'never'
        ? []
        : await checkConnections(database, runtime.paths, {
            include: (_name, dialect) =>
              connectMode === 'always' || dialect !== 'sqlite',
            timeoutMs: options.connectTimeoutMs,
          });
    for (const connection of connections) {
      if (connection.status !== 'failed') continue;
      findings.push({
        level: 'error',
        code: 'connection-failed',
        key: `database.connections.${connection.name}`,
        message: `Cannot connect to the ${connection.dialect} database for "${connection.name}": ${connection.reason ?? 'unknown error'}`,
      });
    }

    return {
      ok: findings.every((finding) => finding.level !== 'error'),
      mode,
      configFile: existsSync(configFile) ? configFile : undefined,
      findings,
      connections,
      public: runtime.config.publicValues(),
    };
  } finally {
    await runtime.scope.destroy();
  }
}

/** Turns a failed load into findings, one per missing driver when that is what failed. */
function loadFailureFindings(
  error: unknown,
  rootDir: string,
  mode: ConfigInitMode,
): ConfigCheckFinding[] {
  const missing = findMissingDrivers(error);
  if (missing) {
    return missing.missing.map((entry) => ({
      level: 'error',
      code: 'driver-missing',
      key: `database.connections.${entry.connection}`,
      message:
        mode === 'deployment'
          ? `This build does not include ${entry.packageName}, which the "${entry.connection}" connection needs. Install it in the application sources and build again.`
          : `The "${entry.connection}" connection needs ${entry.packageName}, which is not installed.`,
      ...(mode === 'source'
        ? { fix: installCommand(rootDir, entry.packageName) }
        : {}),
    }));
  }
  return [
    {
      level: 'error',
      code: 'load-failed',
      message: `The configuration could not be loaded: ${messageOf(error)}`,
    },
  ];
}

/** The runtime may wrap the error on the way out, so the cause chain is searched rather than the top only. */
function findMissingDrivers(
  error: unknown,
): MissingDatabaseDriversError | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== undefined; depth += 1) {
    if (current instanceof MissingDatabaseDriversError) return current;
    if (
      current instanceof Error &&
      current.name === 'MissingDatabaseDriversError' &&
      Array.isArray((current as MissingDatabaseDriversError).missing)
    )
      return current as MissingDatabaseDriversError;
    current = current instanceof Error ? current.cause : undefined;
  }
  return undefined;
}

/**
 * The secrets checks, asked of the merged configuration so that a key supplied through the environment counts.
 *
 * `secrets.keys` has to be present: the sign-in keys are derived from it, and everything the application encrypts at
 * rest needs it. The keys themselves — strength, placeholder, duplicate versions — are checked by the section's own
 * validator. `auth.secret` and `session.secret` are optional now, but one left at the placeholder is still refused at
 * startup. Without `session.secret` or secrets keys the application makes a session key up at every start, which
 * works and is almost never what was meant, so that is a warning.
 */
function secretFindings(
  runtime: AppCommandRuntime,
  configFile: string,
): ConfigCheckFinding[] {
  const findings: ConfigCheckFinding[] = [];
  const configured = existsSync(configFile);
  const keys = runtime.config.get<unknown>('secrets.keys');
  const hasKeys = Array.isArray(keys) && keys.length > 0;

  if (!hasKeys) {
    findings.push({
      level: 'error',
      code: 'secrets-missing',
      key: 'secrets.keys',
      message: configured
        ? 'secrets.keys is not set: the application cannot sign anyone in or encrypt what it stores without it.'
        : 'This application has no configuration, and it does not start without secrets.keys.',
      fix: configured
        ? 'Add secrets.keys to the configuration file with a key from: openssl rand -hex 32, or set SECRETS_KEYS=1:<key> in the environment.'
        : 'pnpm nocobase config init',
    });
  }

  for (const key of ['auth.secret', 'session.secret']) {
    if (isPlaceholderSecret(runtime.config.get<string>(key))) {
      findings.push(placeholderFinding(key));
    }
  }

  if (runtime.config.get<unknown>('session.enabled') !== false && !hasKeys) {
    const sessionSecret = runtime.config.get<unknown>('session.secret');
    if (typeof sessionSecret !== 'string' || sessionSecret.trim() === '') {
      findings.push({
        level: 'warning',
        code: 'session-secret-ephemeral',
        key: 'session.secret',
        message:
          'Neither secrets.keys nor session.secret is set, so a session key is generated at every start: sessions end when the process restarts and are not shared between instances.',
        fix: 'Set secrets.keys, which the session key is derived from.',
      });
    }
  }

  return findings;
}

function placeholderFinding(key: string): ConfigCheckFinding {
  return {
    level: 'error',
    code: 'secret-placeholder',
    key,
    message: `${key} is still the placeholder from config.example.yml, which the application refuses to start with.`,
    fix: `Replace it with a unique value, for example one generated with: openssl rand -hex 32`,
  };
}

/**
 * A top-level key the application neither defaults nor documents is almost always a misspelling: the section is loaded
 * and nothing ever reads it, so `databse:` fails silently rather than loudly. It is a warning rather than an error
 * because an application is free to read sections of its own that neither place mentions.
 */
function unknownKeyFindings(
  overrides: Record<string, unknown>,
  known: ReadonlySet<string>,
): ConfigCheckFinding[] {
  return Object.keys(overrides)
    .filter((key) => !known.has(key))
    .map((key) => {
      const suggestion = closestKey(key, known);
      return {
        level: 'warning',
        code: 'unknown-key',
        key,
        message: `"${key}" is not a configuration section this application knows, so nothing reads it.${
          suggestion ? ` Did you mean "${suggestion}"?` : ''
        }`,
      };
    });
}

/**
 * `${NAME}` written into the configuration is used as that literal text — a password of `${DB_PASSWORD}`, sent to the
 * database. Nothing in the configuration expands it; a variable reaches a field only through the `env` mapping of the
 * section that owns it.
 */
function referenceFindings(
  overrides: Record<string, unknown>,
): ConfigCheckFinding[] {
  const findings: ConfigCheckFinding[] = [];
  const visit = (value: unknown, keyPath: readonly string[]): void => {
    if (typeof value === 'string') {
      const match = REFERENCE.exec(value);
      if (match)
        findings.push({
          level: 'warning',
          code: 'unexpanded-reference',
          key: keyPath.join('.'),
          message: `${match[0]} is not expanded here: the value is used as that literal text.`,
          fix: 'Write the value itself, or supply it through an environment variable the application maps.',
        });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...keyPath, String(index)]));
      return;
    }
    if (typeof value === 'object' && value !== null) {
      for (const [key, child] of Object.entries(value)) {
        visit(child, [...keyPath, key]);
      }
    }
  };
  visit(overrides, []);
  return findings;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
