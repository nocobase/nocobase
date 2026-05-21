/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { getEnvAsync } from '@nocobase/license-kit';
import { validateTcpPort } from '../../lib/prompt-validators.ts';
import { licenseJsonFlag, withLicenseEnvVars } from './shared.js';

type LicenseEnvFlags = {
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
    'Missing database settings for license environment inspection.',
    `Required: ${missing.join(', ')}.`,
    'Pass all required `--db-*` flags explicitly.',
  ].join('\n');
}

export default class LicenseEnv extends Command {
  static override hidden = true;

  static override flags = {
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
    json: licenseJsonFlag,
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicenseEnv);
    const envVars = {
      DB_DIALECT: trimValue(flags['db-dialect']),
      DB_HOST: trimValue(flags['db-host']),
      DB_PORT: trimValue(flags['db-port']),
      DB_DATABASE: trimValue(flags['db-database']),
      DB_USER: trimValue(flags['db-user']),
      DB_PASSWORD: flags['db-password'] !== undefined ? String(flags['db-password']) : undefined,
    };

    const missing: string[] = [];
    if (!envVars.DB_DIALECT) {
      missing.push('--db-dialect');
    }
    if (!envVars.DB_HOST) {
      missing.push('--db-host');
    }
    if (!envVars.DB_PORT) {
      missing.push('--db-port');
    }
    if (!envVars.DB_DATABASE) {
      missing.push('--db-database');
    }
    if (!envVars.DB_USER) {
      missing.push('--db-user');
    }
    if (!envVars.DB_PASSWORD) {
      missing.push('--db-password');
    }
    if (missing.length > 0) {
      this.error(formatMissingFieldsMessage(missing));
    }

    const portError = validateTcpPort(envVars.DB_PORT);
    if (portError) {
      this.error(portError);
    }

    const env = await withLicenseEnvVars(envVars as Record<string, string>, async () => await getEnvAsync());
    if (flags.json) {
      this.log(JSON.stringify({
        ok: true,
        env,
      }, null, 2));
      return;
    }

    this.log(JSON.stringify(env, null, 2));
  }
}
