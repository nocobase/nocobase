/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import type { ManagedAppRuntime } from '../../lib/app-runtime.js';
import { formatMissingManagedAppEnvMessage, resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import type { EnvConfigEntry } from '../../lib/auth-store.js';
import { resolveBuiltinDbConnection } from '../../lib/builtin-db.js';
import {
  checkExternalDbConnection,
  formatDbCheckAddress,
  readExternalDbConnectionConfig,
} from '../../lib/db-connection-check.ts';
import {
  DEFAULT_DOCKER_REGISTRY,
  DEFAULT_DOCKER_VERSION,
  resolveDockerImageRef,
} from '../../lib/docker-image.ts';
import { commandOutput } from '../../lib/run-npm.js';
import { validateTcpPort } from '../../lib/prompt-validators.ts';

type DbCheckFlags = {
  env?: string;
  'db-dialect'?: string;
  'db-host'?: string;
  'db-port'?: string;
  'db-database'?: string;
  'db-user'?: string;
  'db-password'?: string;
  json: boolean;
};

type ResolvedDbCheckInput = {
  envName?: string;
  kind?: ManagedAppRuntime['kind'];
  dbConfig: {
    builtinDb: false;
    dbDialect?: string;
    dbHost?: string;
    dbPort?: string;
    dbDatabase?: string;
    dbUser?: string;
    dbPassword?: string;
  };
  runtime?: ManagedAppRuntime;
};

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function resolveRequiredDbField(flagValue: unknown, envValue: unknown): string | undefined {
  return trimValue(flagValue) ?? trimValue(envValue);
}

function normalizeDockerPlatform(value: unknown): string | undefined {
  const text = trimValue(value);
  if (!text || text === 'auto') {
    return undefined;
  }

  if (text === 'linux/amd64' || text === 'linux/arm64') {
    return text;
  }

  return undefined;
}

function formatMissingFieldsMessage(missing: string[], hasEnv: boolean): string {
  return [
    'Missing database settings for connectivity check.',
    `Required: ${missing.join(', ')}.`,
    hasEnv
      ? 'Pass `--env <name>` to reuse a saved env, or provide the missing `--db-*` flags explicitly.'
      : 'Provide all required `--db-*` flags explicitly, or pass `--env <name>` to reuse a saved env.',
  ].join('\n');
}

function resolveDbConfigFromFlags(
  flags: DbCheckFlags,
  envConfig?: Partial<EnvConfigEntry>,
): ResolvedDbCheckInput['dbConfig'] {
  return {
    builtinDb: false,
    dbDialect: resolveRequiredDbField(flags['db-dialect'], envConfig?.dbDialect),
    dbHost: resolveRequiredDbField(flags['db-host'], envConfig?.dbHost),
    dbPort: resolveRequiredDbField(flags['db-port'], envConfig?.dbPort),
    dbDatabase: resolveRequiredDbField(flags['db-database'], envConfig?.dbDatabase),
    dbUser: resolveRequiredDbField(flags['db-user'], envConfig?.dbUser),
    dbPassword: flags['db-password'] !== undefined
      ? String(flags['db-password'] ?? '')
      : envConfig?.dbPassword !== undefined
        ? String(envConfig.dbPassword ?? '')
        : undefined,
  };
}

function validateDbConfigOrThrow(
  command: Pick<DbCheck, 'error'>,
  dbConfig: ResolvedDbCheckInput['dbConfig'],
  hasEnv: boolean,
) {
  const missing: string[] = [];
  if (!dbConfig.dbDialect) {
    missing.push('--db-dialect');
  }
  if (!dbConfig.dbHost) {
    missing.push('--db-host');
  }
  if (!dbConfig.dbPort) {
    missing.push('--db-port');
  }
  if (!dbConfig.dbDatabase) {
    missing.push('--db-database');
  }
  if (!dbConfig.dbUser) {
    missing.push('--db-user');
  }
  if (!dbConfig.dbPassword) {
    missing.push('--db-password');
  }

  if (missing.length > 0) {
    command.error(formatMissingFieldsMessage(missing, hasEnv));
  }

  const portError = validateTcpPort(dbConfig.dbPort);
  if (portError) {
    command.error(portError);
  }
}

async function resolveDbCheckInput(
  command: Pick<DbCheck, 'error'>,
  flags: DbCheckFlags,
): Promise<ResolvedDbCheckInput> {
  const envName = flags.env?.trim() || undefined;
  if (!envName) {
    const dbConfig = resolveDbConfigFromFlags(flags);
    validateDbConfigOrThrow(command, dbConfig, false);
    return {
      dbConfig,
    };
  }

  const runtime = await resolveManagedAppRuntime(envName);
  if (!runtime) {
    command.error(formatMissingManagedAppEnvMessage(envName));
  }

  const envConfig = { ...runtime!.env.config };
  if ((runtime!.kind === 'local' || runtime!.kind === 'docker') && runtime!.env.config.builtinDb) {
    const builtinDbConnection = await resolveBuiltinDbConnection(runtime!);
    envConfig.dbHost = builtinDbConnection.dbHost;
    envConfig.dbPort = builtinDbConnection.dbPort;
    envConfig.dbDialect = builtinDbConnection.dbDialect;
  }
  const dbConfig = resolveDbConfigFromFlags(flags, envConfig);
  validateDbConfigOrThrow(command, dbConfig, true);
  return {
    envName: runtime!.envName,
    kind: runtime!.kind,
    runtime: runtime!,
    dbConfig,
  };
}

function buildConnectionConfigOrThrow(
  command: Pick<DbCheck, 'error'>,
  dbConfig: ResolvedDbCheckInput['dbConfig'],
) {
  const connectionConfig = readExternalDbConnectionConfig(dbConfig);
  if (!connectionConfig) {
    command.error('Unsupported or incomplete database settings for connectivity check.');
  }
  return connectionConfig!;
}

async function runExplicitDbCheck(
  command: Pick<DbCheck, 'error'>,
  dbConfig: ResolvedDbCheckInput['dbConfig'],
) {
  const connectionConfig = buildConnectionConfigOrThrow(command, dbConfig);
  const address = formatDbCheckAddress(connectionConfig);
  const validationError = await checkExternalDbConnection(connectionConfig);
  return {
    ok: !validationError,
    dialect: connectionConfig.dialect,
    address,
    error: validationError ?? null,
  };
}

async function runDockerDbCheck(
  command: Pick<DbCheck, 'error'>,
  runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
  dbConfig: ResolvedDbCheckInput['dbConfig'],
) {
  const connectionConfig = buildConnectionConfigOrThrow(command, dbConfig);
  const config = runtime.env.config ?? {};
  const imageRef = resolveDockerImageRef(config.dockerRegistry, config.downloadVersion, {
    defaultRegistry: DEFAULT_DOCKER_REGISTRY,
    defaultVersion: DEFAULT_DOCKER_VERSION,
  });
  const args = [
    'run',
    '--rm',
    '--network',
    runtime.dockerNetworkName || runtime.workspaceName,
  ];
  const dockerPlatform = normalizeDockerPlatform(config.dockerPlatform);
  if (dockerPlatform) {
    args.push('--platform', dockerPlatform);
  }
  args.push(
    '--entrypoint',
    'nb',
    imageRef,
    'db',
    'check',
    '--db-dialect',
    connectionConfig.dialect,
    '--db-host',
    connectionConfig.host,
    '--db-port',
    String(connectionConfig.port),
    '--db-database',
    connectionConfig.database,
    '--db-user',
    connectionConfig.user,
    '--db-password',
    connectionConfig.password,
    '--json',
  );

  const output = await commandOutput('docker', args, {
    errorName: 'docker run',
  });

  let payload: {
    ok?: unknown;
    dialect?: unknown;
    address?: unknown;
    error?: unknown;
  };
  try {
    payload = JSON.parse(output) as {
      ok?: unknown;
      dialect?: unknown;
      address?: unknown;
      error?: unknown;
    };
  } catch {
    command.error(`Failed to parse database check response from Docker: ${output}`);
  }

  const ok = Boolean(payload!.ok);
  const dialect = trimValue(payload!.dialect) || connectionConfig.dialect;
  const address = trimValue(payload!.address) || formatDbCheckAddress(connectionConfig);
  const error = trimValue(payload!.error) || null;

  return {
    ok,
    dialect,
    address,
    error,
  };
}

async function runDbCheckForRuntime(
  command: Pick<DbCheck, 'error'>,
  runtime: ManagedAppRuntime,
  dbConfig: ResolvedDbCheckInput['dbConfig'],
) {
  if (runtime.kind === 'docker') {
    return await runDockerDbCheck(command, runtime, dbConfig);
  }

  if (runtime.kind === 'local') {
    return await runExplicitDbCheck(command, dbConfig);
  }

  command.error(`Env "${runtime.envName}" does not support automatic database connectivity checks.`);
}

export default class DbCheck extends Command {
  static override description =
    'Check whether a database is reachable using the selected env settings or explicit `--db-*` flags.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --db-password new-secret --json',
    '<%= config.bin %> <%= command.id %> --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to read saved database settings from. Defaults to the current env when omitted',
    }),
    'db-dialect': Flags.string({
      description: 'Database dialect: postgres, kingbase, mysql, or mariadb.',
      options: ['postgres', 'kingbase', 'mysql', 'mariadb'],
    }),
    'db-host': Flags.string({
      description: 'Database host name or IP address.',
    }),
    'db-port': Flags.string({
      description: 'Database TCP port.',
    }),
    'db-database': Flags.string({
      description: 'Database name.',
    }),
    'db-user': Flags.string({
      description: 'Database username.',
    }),
    'db-password': Flags.string({
      description: 'Database password.',
    }),
    json: Flags.boolean({
      description: 'Output the check result as JSON.',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DbCheck);
    const input = await resolveDbCheckInput(this, flags);
    const result = input.runtime
      ? await runDbCheckForRuntime(this, input.runtime, input.dbConfig)
      : await runExplicitDbCheck(this, input.dbConfig);

    if (flags.json) {
      this.log(JSON.stringify({
        ok: result.ok,
        env: input.envName,
        kind: input.kind,
        dialect: result.dialect,
        address: result.address,
        error: result.error,
      }, null, 2));
      return;
    }

    if (!result.ok) {
      this.error(result.error ?? 'Database check failed.');
    }

    this.log(
      input.envName
        ? `Database check passed for env "${input.envName}" (${result.dialect} ${result.address}).`
        : `Database check passed (${result.dialect} ${result.address}).`,
    );
  }
}
