/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { formatMissingManagedAppEnvMessage, resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import { renderTable } from '../../lib/ui.js';
import { appRootPath, dbStatus, runtimeStatus, storagePath } from './shared.js';

type AppInfoValue = string | boolean | number | null | undefined;

type AppInfoGroup = Record<string, AppInfoValue>;

function normalizeJsonValue(value: AppInfoValue): string | boolean | number {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  return String(value);
}

function normalizeValue(value: AppInfoValue): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return String(value);
}

function maskSecret(value: AppInfoValue, showSecrets: boolean): string {
  const normalized = normalizeValue(value);
  if (normalized === '-') {
    return normalized;
  }

  return showSecrets ? normalized : '********';
}

function createGroupTable(title: string, values: AppInfoGroup): string {
  const rows = Object.entries(values).map(([field, value]) => [field, normalizeValue(value)]);
  return `${title}\n${renderTable(['Field', 'Value'], rows)}`;
}

function serializeGroup(values: AppInfoGroup): Record<string, string | boolean | number> {
  return Object.fromEntries(
    Object.entries(values).map(([field, value]) => [field, normalizeJsonValue(value)]),
  );
}

export default class AppInfo extends Command {
  static override hidden = false;
  static override description =
    'Show grouped details for the selected NocoBase app env, including app, database, API, and auth settings.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --json',
    '<%= config.bin %> <%= command.id %> --env app1 --show-secrets',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to inspect. Defaults to the current env when omitted',
    }),
    json: Flags.boolean({
      description: 'Output the result as JSON',
      default: false,
    }),
    'show-secrets': Flags.boolean({
      description: 'Show secret values in plain text',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppInfo);
    const requestedEnv = flags.env?.trim() || undefined;
    const showSecrets = flags['show-secrets'];
    const runtime = await resolveManagedAppRuntime(requestedEnv);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    const auth = runtime.env.auth;
    const appGroup: AppInfoGroup = {
      appRootPath: appRootPath(runtime),
      storagePath: storagePath(runtime),
      appPort: runtime.env.config.appPort,
      appStatus: await runtimeStatus(runtime),
      source: runtime.source,
      downloadVersion: runtime.env.config.downloadVersion,
      dockerRegistry: runtime.env.config.dockerRegistry,
      dockerPlatform: runtime.env.config.dockerPlatform,
      timezone: runtime.env.config.timezone,
    };

    const dbGroup: AppInfoGroup = {
      databaseStatus: await dbStatus(runtime),
      builtinDb: runtime.env.config.builtinDb,
      dbDialect: runtime.env.config.dbDialect,
      builtinDbImage: runtime.env.config.builtinDbImage,
      dbHost: runtime.env.config.dbHost,
      dbPort: runtime.env.config.dbPort,
      dbDatabase: runtime.env.config.dbDatabase,
      dbUser: runtime.env.config.dbUser,
      dbPassword: maskSecret(runtime.env.config.dbPassword, showSecrets),
    };

    const authGroup: AppInfoGroup = {
      type: auth?.type,
      expiresAt: auth?.type === 'oauth' ? auth.expiresAt : undefined,
      scope: auth?.type === 'oauth' ? auth.scope : undefined,
      issuer: auth?.type === 'oauth' ? auth.issuer : undefined,
      clientId: auth?.type === 'oauth' ? auth.clientId : undefined,
      resource: auth?.type === 'oauth' ? auth.resource : undefined,
      accessToken: maskSecret(auth?.accessToken, showSecrets),
      refreshToken: maskSecret(auth?.type === 'oauth' ? auth.refreshToken : undefined, showSecrets),
    };

    const apiGroup: AppInfoGroup = {
      apiBaseUrl: runtime.env.apiBaseUrl,
      'auth.type': authGroup.type,
      'auth.expiresAt': authGroup.expiresAt,
      'auth.scope': authGroup.scope,
      'auth.issuer': authGroup.issuer,
      'auth.clientId': authGroup.clientId,
      'auth.resource': authGroup.resource,
      'auth.accessToken': authGroup.accessToken,
      'auth.refreshToken': authGroup.refreshToken,
    };

    const output = {
      ok: true,
      env: runtime.envName,
      kind: runtime.kind,
      app: serializeGroup(appGroup),
      db: serializeGroup(dbGroup),
      api: {
        apiBaseUrl: normalizeJsonValue(runtime.env.apiBaseUrl),
        auth: serializeGroup(authGroup),
      },
    };

    if (flags.json) {
      this.log(JSON.stringify(output, null, 2));
      return;
    }

    this.log([
      createGroupTable('App', appGroup),
      createGroupTable('DB', dbGroup),
      createGroupTable('API', apiGroup),
    ].join('\n\n'));
  }
}
