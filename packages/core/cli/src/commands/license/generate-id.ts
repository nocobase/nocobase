/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { validateTcpPort } from '../../lib/prompt-validators.ts';
import { generateValidatedInstanceIdFromEnvVars, licenseJsonFlag } from './shared.js';

type GenerateIdFlags = {
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

function formatMissingFieldsMessage(missing: string[]): string {
  return [
    'Missing database settings for instance ID generation.',
    `Required: ${missing.join(', ')}.`,
    'Pass all required `--db-*` flags explicitly.',
  ].join('\n');
}

export default class LicenseGenerateId extends Command {
  static override hidden = true;
  static override summary = 'Generate a commercial license instance ID from explicit database settings';
  static override description =
    'Generate the commercial licensing instance ID from explicit `--db-*` flags. This command only prints the generated ID and does not save it.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret',
    '<%= config.bin %> <%= command.id %> --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret --json',
  ];

  static override flags = {
    'db-dialect': Flags.string({
      description: 'Database dialect: postgres, kingbase, mysql, or mariadb.',
      options: ['postgres', 'kingbase', 'mysql', 'mariadb'],
      required: false,
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
    json: licenseJsonFlag,
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicenseGenerateId);
    const dbConfig = {
      dbDialect: trimValue(flags['db-dialect']),
      dbHost: trimValue(flags['db-host']),
      dbPort: trimValue(flags['db-port']),
      dbDatabase: trimValue(flags['db-database']),
      dbUser: trimValue(flags['db-user']),
      dbPassword: flags['db-password'] !== undefined ? String(flags['db-password']) : undefined,
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

    const envVars = {
      DB_DIALECT: dbConfig.dbDialect!,
      DB_HOST: dbConfig.dbHost!,
      DB_PORT: dbConfig.dbPort!,
      DB_DATABASE: dbConfig.dbDatabase!,
      DB_USER: dbConfig.dbUser!,
      DB_PASSWORD: dbConfig.dbPassword!,
    };
    const instanceId = await generateValidatedInstanceIdFromEnvVars(envVars);

    if (flags.json) {
      this.log(JSON.stringify({
        ok: true,
        instanceId,
      }, null, 2));
      return;
    }

    this.log(instanceId);
  }
}
