/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { formatMissingManagedAppEnvMessage } from '../../lib/app-runtime.js';
import { getEnv } from '../../lib/auth-store.js';
import {
  checkExternalDbConnection,
  formatDbCheckAddress,
  readExternalDbConnectionConfig,
} from '../../lib/db-connection-check.ts';
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

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function resolveRequiredDbField(
  flagValue: unknown,
  envValue: unknown,
): string | undefined {
  return trimValue(flagValue) ?? trimValue(envValue);
}

function formatMissingFieldsMessage(missing: string[]): string {
  return [
    'Missing database settings for connectivity check.',
    `Required: ${missing.join(', ')}.`,
    'Pass `--env <name>` to reuse a saved env, or provide all `--db-*` flags explicitly.',
  ].join('\n');
}

export default class DbCheck extends Command {
  static override description =
    'Check whether the current machine can connect to a database using saved env config or explicit --db-* flags.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret',
    '<%= config.bin %> <%= command.id %> --env app1 --db-password new-secret --json',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to read saved database settings from. Defaults to the current env when omitted.',
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
    const envName = flags.env?.trim() || undefined;
    const env = envName || !flags['db-host'] ? await getEnv(envName) : undefined;

    if (envName && !env) {
      this.error(formatMissingManagedAppEnvMessage(envName));
    }

    const config = env?.config ?? {};
    const dbConfig = {
      builtinDb: false,
      dbDialect: resolveRequiredDbField(flags['db-dialect'], config.dbDialect),
      dbHost: resolveRequiredDbField(flags['db-host'], config.dbHost),
      dbPort: resolveRequiredDbField(flags['db-port'], config.dbPort),
      dbDatabase: resolveRequiredDbField(flags['db-database'], config.dbDatabase),
      dbUser: resolveRequiredDbField(flags['db-user'], config.dbUser),
      dbPassword: flags['db-password'] !== undefined
        ? String(flags['db-password'] ?? '')
        : String(config.dbPassword ?? ''),
    };

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
      this.error(formatMissingFieldsMessage(missing));
    }

    const portError = validateTcpPort(dbConfig.dbPort);
    if (portError) {
      this.error(portError);
    }

    const connectionConfig = readExternalDbConnectionConfig(dbConfig);
    if (!connectionConfig) {
      this.error('Unsupported or incomplete database settings for connectivity check.');
    }

    const address = formatDbCheckAddress(connectionConfig);
    const validationError = await checkExternalDbConnection(connectionConfig);

    if (flags.json) {
      this.log(JSON.stringify({
        ok: !validationError,
        env: env?.name,
        dialect: connectionConfig.dialect,
        address,
        error: validationError ?? null,
      }, null, 2));
      return;
    }

    if (validationError) {
      this.error(validationError);
    }

    this.log(
      env?.name
        ? `Database check passed for env "${env.name}" (${connectionConfig.dialect} ${address}).`
        : `Database check passed (${connectionConfig.dialect} ${address}).`,
    );
  }
}
