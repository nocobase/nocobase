/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { formatMissingManagedAppEnvMessage, resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import { resolveBuiltinDbConnection } from '../../lib/builtin-db.js';
import { renderTable } from '../../lib/ui.js';
import { appPath, appUrl, dbStatus, runtimeStatus, sourcePath, storagePath } from './shared.js';

type EnvInfoValue = string | boolean | number | null | undefined;

type EnvInfoGroup = Record<string, EnvInfoValue>;
const MISSING_FIELD = Symbol('missingField');
const FORBIDDEN_FIELD_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function normalizeJsonValue(value: EnvInfoValue): string | boolean | number {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  return String(value);
}

function normalizeValue(value: EnvInfoValue): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return String(value);
}

function maskSecret(value: EnvInfoValue, showSecrets: boolean): string {
  const normalized = normalizeValue(value);
  if (normalized === '-') {
    return normalized;
  }

  return showSecrets ? normalized : '********';
}

function createGroupTable(title: string, values: EnvInfoGroup): string {
  const rows = Object.entries(values).map(([field, value]) => [field, normalizeValue(value)]);
  return `${title}\n${renderTable(['Field', 'Value'], rows)}`;
}

function serializeGroup(values: EnvInfoGroup): Record<string, string | boolean | number> {
  return Object.fromEntries(Object.entries(values).map(([field, value]) => [field, normalizeJsonValue(value)]));
}

function resolveFieldPath(value: unknown, path: string): unknown | typeof MISSING_FIELD {
  const segments = path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) {
    return MISSING_FIELD;
  }

  let current: unknown = value;
  for (const segment of segments) {
    if (
      !current ||
      typeof current !== 'object' ||
      FORBIDDEN_FIELD_PATH_SEGMENTS.has(segment) ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return MISSING_FIELD;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

export default class EnvInfo extends Command {
  static override hidden = false;
  static override description =
    'Show grouped details for the selected NocoBase env, including app, database, API, and auth settings.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> app1',
    '<%= config.bin %> <%= command.id %> app1 --json',
    '<%= config.bin %> <%= command.id %> app1 --show-secrets',
    '<%= config.bin %> <%= command.id %> app1 --field app.url',
  ];

  static override args = {
    name: Args.string({
      description: 'Configured environment name to inspect. Defaults to the current env when omitted',
      required: false,
    }),
  };

  static override flags = {
    env: Flags.string({
      char: 'e',
      hidden: true,
      deprecated: true,
      description:
        'Environment name (same as the optional positional argument; for compatibility with -e/--env on other commands)',
    }),
    json: Flags.boolean({
      description: 'Output the result as JSON',
      default: false,
    }),
    field: Flags.string({
      description: 'Return only a single field using dot notation, for example app.url or api.auth.type',
    }),
    'show-secrets': Flags.boolean({
      description: 'Show secret values in plain text',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvInfo);
    const envNameArg = args.name?.trim() || undefined;
    const envNameFlag = flags.env?.trim() || undefined;
    if (envNameArg && envNameFlag && envNameArg !== envNameFlag) {
      this.error(
        `Environment name was provided both as the argument ("${envNameArg}") and as --env ("${envNameFlag}"). Please use only one.`,
      );
    }
    const requestedEnv = envNameArg || envNameFlag;
    const showSecrets = flags['show-secrets'];
    const fieldPath = flags.field?.trim() || undefined;
    const runtime = await resolveManagedAppRuntime(requestedEnv);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    const auth = runtime.env.auth;
    const builtinDbConnection =
      (runtime.kind === 'local' || runtime.kind === 'docker') && runtime.env.config.builtinDb
        ? await resolveBuiltinDbConnection(runtime)
        : undefined;
    const dbDialect = builtinDbConnection?.dbDialect ?? runtime.env.config.dbDialect;
    const appGroup: EnvInfoGroup = {
      url: appUrl(runtime),
      appPath: appPath(runtime),
      sourcePath: sourcePath(runtime),
      storagePath: storagePath(runtime),
      appPort: runtime.env.config.appPort,
      appStatus: await runtimeStatus(runtime),
      source: runtime.source,
      downloadVersion: runtime.env.config.downloadVersion,
      dockerRegistry: runtime.env.config.dockerRegistry,
      dockerPlatform: runtime.env.config.dockerPlatform,
      timezone: runtime.env.config.timezone,
    };

    const dbGroup: EnvInfoGroup = {
      databaseStatus: await dbStatus(runtime),
      builtinDb: runtime.env.config.builtinDb,
      dbDialect,
      builtinDbImage: runtime.env.config.builtinDbImage,
      dbHost: builtinDbConnection?.dbHost ?? runtime.env.config.dbHost,
      dbPort: builtinDbConnection?.dbPort ?? runtime.env.config.dbPort,
      dbDatabase: runtime.env.config.dbDatabase,
      dbUser: runtime.env.config.dbUser,
      dbPassword: maskSecret(runtime.env.config.dbPassword, showSecrets),
      dbTablePrefix: runtime.env.config.dbTablePrefix,
      dbUnderscored: runtime.env.config.dbUnderscored,
      ...(dbDialect === 'postgres' ? { dbSchema: runtime.env.config.dbSchema } : {}),
    };

    const authGroup: EnvInfoGroup = {
      type: runtime.env.authType ?? auth?.type,
      sessionType: auth?.type,
      username: runtime.env.config.authUsername,
      expiresAt: auth?.type === 'oauth' ? auth.expiresAt : undefined,
      scope: auth?.type === 'oauth' ? auth.scope : undefined,
      issuer: auth?.type === 'oauth' ? auth.issuer : undefined,
      clientId: auth?.type === 'oauth' ? auth.clientId : undefined,
      resource: auth?.type === 'oauth' ? auth.resource : undefined,
      accessToken: maskSecret(auth?.accessToken, showSecrets),
      refreshToken: maskSecret(auth?.type === 'oauth' ? auth.refreshToken : undefined, showSecrets),
    };

    const apiGroup: EnvInfoGroup = {
      apiBaseUrl: runtime.env.apiBaseUrl,
      'auth.type': authGroup.type,
      'auth.sessionType': authGroup.sessionType,
      'auth.username': authGroup.username,
      'auth.expiresAt': authGroup.expiresAt,
      'auth.scope': authGroup.scope,
      'auth.issuer': authGroup.issuer,
      'auth.clientId': authGroup.clientId,
      'auth.resource': authGroup.resource,
      'auth.accessToken': authGroup.accessToken,
      'auth.refreshToken': authGroup.refreshToken,
    };
    const envGroup: EnvInfoGroup = {
      name: runtime.envName,
      kind: runtime.kind,
    };

    const output = {
      ok: true,
      name: runtime.envName,
      env: runtime.envName,
      kind: runtime.kind,
      app: serializeGroup(appGroup),
      db: serializeGroup(dbGroup),
      api: {
        apiBaseUrl: normalizeJsonValue(runtime.env.apiBaseUrl),
        auth: serializeGroup(authGroup),
      },
    };

    if (fieldPath) {
      const selected = resolveFieldPath(output, fieldPath);
      if (selected === MISSING_FIELD) {
        this.error(`Unknown field "${fieldPath}". Use dot notation like app.url, db.databaseStatus, or api.auth.type.`);
      }

      if (flags.json) {
        this.log(JSON.stringify(selected, null, 2));
        return;
      }

      this.log(typeof selected === 'object' ? JSON.stringify(selected, null, 2) : String(selected));
      return;
    }

    if (flags.json) {
      this.log(JSON.stringify(output, null, 2));
      return;
    }

    this.log(
      [
        createGroupTable('Env', envGroup),
        createGroupTable('App', appGroup),
        createGroupTable('DB', dbGroup),
        createGroupTable('API', apiGroup),
      ].join('\n\n'),
    );
  }
}
