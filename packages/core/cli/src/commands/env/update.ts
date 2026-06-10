/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Args, Command, Flags } from '@oclif/core';
import { getCurrentEnvName, getEnv, replaceEnvConfig } from '../../lib/auth-store.js';
import { updateEnvRuntime } from '../../lib/bootstrap.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { appendDiagnosticLogPath } from '../../lib/cli-entry-error.js';
import { getActiveCommandLogFile } from '../../lib/command-log.js';
import { ENV_BOOLEAN_CONFIG_FLAG_MAP, ENV_STRING_CONFIG_FLAG_MAP } from '../../lib/env-command-config.js';
import { buildStoredEnvConfig, type StoredEnvConfigInput } from '../../lib/env-config.js';
import { validateApiBaseUrl } from '../../lib/prompt-validators.js';
import {
  failTask,
  printInfo,
  printVerbose,
  printWarningBlock,
  setVerboseMode,
  startTask,
  stopTask,
  succeedTask,
} from '../../lib/ui.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function throwValidationError(message: string): never {
  throw new Error(appendDiagnosticLogPath(message, getActiveCommandLogFile()));
}

const UPDATE_STRING_FLAGS = [
  'source',
  'download-version',
  'docker-registry',
  'docker-platform',
  'git-url',
  'npm-registry',
  'app-path',
  'app-root-path',
  'storage-path',
  'app-public-path',
  'cdn-base-url',
  'env-file',
  'app-port',
  'app-key',
  'timezone',
  'db-dialect',
  'builtin-db-image',
  'db-host',
  'db-port',
  'db-database',
  'db-user',
  'db-password',
  'db-schema',
  'db-table-prefix',
] as const;

const UPDATE_BOOLEAN_FLAGS = ['builtin-db', 'dev-dependencies', 'build', 'build-dts', 'db-underscored'] as const;

const UPDATE_SPECIAL_FIELDS = ['api-base-url', 'auth-type', 'access-token', 'username'] as const;

const UNSETTABLE_FIELDS = new Set<string>([...UPDATE_SPECIAL_FIELDS, ...UPDATE_STRING_FLAGS, ...UPDATE_BOOLEAN_FLAGS]);

const SOURCE_SETTING_FIELDS = new Set<string>([
  'source',
  'download-version',
  'docker-registry',
  'docker-platform',
  'git-url',
  'npm-registry',
  'dev-dependencies',
  'build',
  'build-dts',
]);

const APP_RESTART_FIELDS = new Set<string>([
  'app-path',
  'app-root-path',
  'storage-path',
  'app-public-path',
  'env-file',
  'app-port',
  'app-key',
  'timezone',
  'db-host',
  'db-port',
  'db-database',
  'db-user',
  'db-password',
  'db-schema',
  'db-table-prefix',
  'db-underscored',
]);

const APP_RESTART_WITH_DB_FIELDS = new Set<string>([
  'builtin-db',
  'db-dialect',
  'builtin-db-image',
  'db-port',
  'db-database',
  'db-user',
  'db-password',
  'storage-path',
]);

type EnvUpdateParsedFlags = {
  verbose: boolean;
  'api-base-url'?: string;
  'auth-type'?: string;
  'access-token'?: string;
  token?: string;
  username?: string;
  source?: string;
  'download-version'?: string;
  'docker-registry'?: string;
  'docker-platform'?: string;
  'git-url'?: string;
  'npm-registry'?: string;
  'dev-dependencies'?: boolean;
  build?: boolean;
  'build-dts'?: boolean;
  'app-path'?: string;
  'app-root-path'?: string;
  'storage-path'?: string;
  'app-public-path'?: string;
  'cdn-base-url'?: string;
  'env-file'?: string;
  'app-port'?: string;
  'app-key'?: string;
  timezone?: string;
  'builtin-db'?: boolean;
  'db-dialect'?: string;
  'builtin-db-image'?: string;
  'db-host'?: string;
  'db-port'?: string;
  'db-database'?: string;
  'db-user'?: string;
  'db-password'?: string;
  'db-schema'?: string;
  'db-table-prefix'?: string;
  'db-underscored'?: boolean;
  unset?: string[];
};

const __dirnameConfigFile = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'nocobase-ctl.config.json');

function hasTokenOverride(flags: EnvUpdateParsedFlags) {
  return flags['access-token'] !== undefined || flags.token !== undefined;
}

function collectProvidedConfigFields(flags: EnvUpdateParsedFlags): Set<string> {
  const fields = new Set<string>();

  for (const field of UPDATE_SPECIAL_FIELDS) {
    if (field === 'access-token') {
      if (hasTokenOverride(flags)) {
        fields.add(field);
      }
      continue;
    }
    if (flags[field] !== undefined) {
      fields.add(field);
    }
  }

  for (const field of UPDATE_STRING_FLAGS) {
    if (flags[field] !== undefined) {
      fields.add(field);
    }
  }

  for (const field of UPDATE_BOOLEAN_FLAGS) {
    if (flags[field] !== undefined) {
      fields.add(field);
    }
  }

  return fields;
}

function normalizeUnsetFields(unset: string[] | undefined): string[] {
  const normalized = (unset ?? [])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  for (const field of normalized) {
    if (!UNSETTABLE_FIELDS.has(field)) {
      throw new Error(
        `Unsupported --unset field "${field}". Supported fields: ${Array.from(UNSETTABLE_FIELDS).sort().join(', ')}.`,
      );
    }
  }

  return Array.from(new Set(normalized));
}

function buildCurrentConfigInput(
  env: NonNullable<Awaited<ReturnType<typeof getEnv>>>,
): StoredEnvConfigInput & Record<string, unknown> {
  return {
    ...env.config,
    apiBaseUrl: env.apiBaseUrl,
    authType: env.authType,
    authUsername: env.config.authUsername,
    accessToken: env.auth?.type === 'token' ? env.auth.accessToken : undefined,
  };
}

function applyUnsetField(nextInput: Record<string, unknown>, field: string) {
  switch (field) {
    case 'api-base-url':
      delete nextInput.apiBaseUrl;
      return;
    case 'auth-type':
      delete nextInput.authType;
      return;
    case 'access-token':
      delete nextInput.accessToken;
      return;
    case 'username':
      delete nextInput.authUsername;
      return;
    default:
      if (field in ENV_STRING_CONFIG_FLAG_MAP) {
        delete nextInput[ENV_STRING_CONFIG_FLAG_MAP[field as keyof typeof ENV_STRING_CONFIG_FLAG_MAP]];
        return;
      }
      if (field in ENV_BOOLEAN_CONFIG_FLAG_MAP) {
        delete nextInput[ENV_BOOLEAN_CONFIG_FLAG_MAP[field as keyof typeof ENV_BOOLEAN_CONFIG_FLAG_MAP]];
      }
  }
}

export default class EnvUpdate extends Command {
  static override summary =
    'Refresh an environment runtime from swagger:get, or update the saved env config for one environment';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> prod',
    '<%= config.bin %> <%= command.id %> prod --api-base-url http://localhost:13000/api --access-token <token>',
    '<%= config.bin %> <%= command.id %> local --app-port 13080 --timezone Asia/Shanghai',
    '<%= config.bin %> <%= command.id %> local --cdn-base-url https://cdn.example.com/nocobase/',
    '<%= config.bin %> <%= command.id %> local --unset git-url --unset npm-registry',
  ];

  static override args = {
    name: Args.string({
      description: 'Configured environment name to update. Defaults to the current env when omitted',
      required: false,
    }),
  };

  static override flags = {
    verbose: Flags.boolean({
      description: 'Show detailed progress output',
      default: false,
    }),
    'api-base-url': Flags.string({
      char: 'u',
      description: 'Root URL for HTTP API calls, including the /api prefix (e.g. http://localhost:13000/api)',
    }),
    'auth-type': Flags.string({
      description: 'Authentication: basic, token, or oauth',
      options: ['basic', 'token', 'oauth'],
    }),
    'access-token': Flags.string({
      char: 't',
      aliases: ['token'],
      description: 'API key or access token for token-based authentication',
    }),
    username: Flags.string({
      description: 'Username to save for basic authentication',
    }),
    source: Flags.string({
      description: 'Saved application source type for this env',
      options: ['docker', 'git', 'local', 'npm'],
    }),
    'download-version': Flags.string({
      aliases: ['version'],
      description: 'Saved downloaded app version for this env',
    }),
    'docker-registry': Flags.string({
      description: 'Saved Docker registry for this env',
    }),
    'docker-platform': Flags.string({
      description: 'Saved Docker image platform for this env',
      options: ['auto', 'linux/amd64', 'linux/arm64'],
    }),
    'git-url': Flags.string({
      description: 'Saved Git repository URL for this env',
    }),
    'npm-registry': Flags.string({
      description: 'Saved npm registry for this env',
    }),
    'dev-dependencies': Flags.boolean({
      allowNo: true,
      description: 'Whether development dependencies are installed for this env',
    }),
    build: Flags.boolean({
      allowNo: true,
      description: 'Whether the app should be built after source download',
    }),
    'build-dts': Flags.boolean({
      allowNo: true,
      description: 'Whether declaration files should be emitted during build',
    }),
    'app-path': Flags.string({
      description: 'Saved app path for this env',
    }),
    'app-root-path': Flags.string({
      hidden: true,
      description: 'Saved application root path for this env',
    }),
    'storage-path': Flags.string({
      hidden: true,
      description: 'Saved storage path for this env',
    }),
    'app-public-path': Flags.string({
      description: 'Saved application public path for this env',
    }),
    'cdn-base-url': Flags.string({
      description: 'Saved client asset CDN base URL (CDN_BASE_URL) for this env',
    }),
    'env-file': Flags.string({
      hidden: true,
      description: 'Saved Docker --env-file path for this env',
    }),
    'app-port': Flags.string({
      description: 'Saved application HTTP port for this env',
    }),
    'app-key': Flags.string({
      description: 'Saved application secret key for this env',
    }),
    timezone: Flags.string({
      description: 'Saved application timezone for this env',
    }),
    'builtin-db': Flags.boolean({
      allowNo: true,
      description: 'Whether this env uses a CLI-managed built-in database',
    }),
    'db-dialect': Flags.string({
      description: 'Saved database dialect for this env',
      options: ['kingbase', 'mariadb', 'mysql', 'postgres'],
    }),
    'builtin-db-image': Flags.string({
      description: 'Saved built-in database image for this env',
    }),
    'db-host': Flags.string({
      description: 'Saved database host for this env',
    }),
    'db-port': Flags.string({
      description: 'Saved database port for this env',
    }),
    'db-database': Flags.string({
      description: 'Saved database name for this env',
    }),
    'db-user': Flags.string({
      description: 'Saved database user for this env',
    }),
    'db-password': Flags.string({
      description: 'Saved database password for this env',
    }),
    'db-schema': Flags.string({
      description: 'Saved database schema for this env',
    }),
    'db-table-prefix': Flags.string({
      description: 'Saved database table prefix for this env',
    }),
    'db-underscored': Flags.boolean({
      allowNo: true,
      description: 'Whether this env uses underscored database naming',
    }),
    unset: Flags.string({
      multiple: true,
      description: 'Unset one or more saved env config fields by canonical flag name',
    }),
  };

  private buildRuntimeUpdateTaskMessage(envLabel: string) {
    return `Updating env runtime: ${envLabel}`;
  }

  private async refreshRuntime(envName: string | undefined, envLabel: string, verbose: boolean) {
    startTask(this.buildRuntimeUpdateTaskMessage(envLabel));
    try {
      const runtime = await updateEnvRuntime({
        envName,
        scope: resolveDefaultConfigScope(),
        configFile: __dirnameConfigFile,
        verbose,
      });

      if (verbose) {
        succeedTask(`Updated env "${envLabel}" to runtime "${runtime.version}".`);
      } else {
        stopTask();
        printVerbose(`Updated env "${envLabel}" to runtime "${runtime.version}".`);
      }
    } catch (error) {
      failTask(`Failed to update env "${envLabel}".`);
      throw error;
    }
  }

  private printConfigUpdateHints(
    envName: string,
    changedFields: Set<string>,
    nextConfig: ReturnType<typeof buildStoredEnvConfig>,
  ) {
    if (changedFields.size === 0) {
      return;
    }

    printInfo('Saved env config was updated. Runtime commands were not refreshed automatically.');

    const shouldRestartWithDb =
      Array.from(changedFields).some((field) => APP_RESTART_WITH_DB_FIELDS.has(field)) &&
      (nextConfig.builtinDb === true || changedFields.has('builtin-db'));
    if (shouldRestartWithDb) {
      printInfo(`Run \`nb app restart --env ${envName} --with-db\` when you're ready to apply these changes.`);
      return;
    }

    if (Array.from(changedFields).some((field) => APP_RESTART_FIELDS.has(field))) {
      printInfo(`Run \`nb app restart --env ${envName}\` when you're ready to apply these changes.`);
    }

    if (Array.from(changedFields).some((field) => SOURCE_SETTING_FIELDS.has(field))) {
      printInfo('Saved source settings were updated. Existing local source files are not replaced automatically.');
    }

    if (
      Array.from(changedFields).some(
        (field) => field === 'auth-type' || field === 'access-token' || field === 'username',
      ) &&
      (nextConfig.authType === 'basic' || nextConfig.authType === 'oauth' || !nextConfig.accessToken)
    ) {
      printInfo(
        `Run \`nb env auth ${envName}\` if you need to authenticate this env again before using runtime commands.`,
      );
    }
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvUpdate);
    const parsedFlags = flags as EnvUpdateParsedFlags;
    setVerboseMode(Boolean(parsedFlags.verbose));

    const unsetFields = normalizeUnsetFields(parsedFlags.unset);
    const providedFields = collectProvidedConfigFields(parsedFlags);
    const hasConfigChanges = providedFields.size > 0 || unsetFields.length > 0;
    const tokenOverride = hasTokenOverride(parsedFlags);

    for (const field of unsetFields) {
      if (providedFields.has(field)) {
        this.error(`Cannot combine --unset ${field} with an explicit update for the same field.`);
      }
    }

    if (tokenOverride && parsedFlags['auth-type'] && parsedFlags['auth-type'] !== 'token') {
      this.error('--access-token or --token can only be used with --auth-type token.');
    }

    if (!hasConfigChanges) {
      const envName = args.name;
      const envLabel = envName ?? (await getCurrentEnvName({ scope: resolveDefaultConfigScope() }));
      await this.refreshRuntime(envName, envLabel, Boolean(parsedFlags.verbose));
      return;
    }

    const currentEnv = await getEnv(args.name, { scope: resolveDefaultConfigScope() });
    if (!currentEnv) {
      this.error(
        args.name?.trim()
          ? `Env "${args.name.trim()}" is not configured`
          : 'No env is configured. Run `nb init --ui` or `nb env add <name> --api-base-url <url>` first.',
      );
    }

    const envName = String(currentEnv.name ?? '').trim();
    const effectiveAuthType = parsedFlags['auth-type'] ?? (tokenOverride ? 'token' : currentEnv.authType);
    if (parsedFlags.username !== undefined && effectiveAuthType !== 'basic') {
      this.error('--username can only be used when the env uses basic authentication.');
    }

    const nextInput = buildCurrentConfigInput(currentEnv);
    nextInput.apiBaseUrl = currentEnv.apiBaseUrl;
    nextInput.authType = currentEnv.authType;
    nextInput.authUsername = currentEnv.config.authUsername;

    if (parsedFlags['api-base-url'] !== undefined) {
      const apiBaseUrlValidationError = await validateApiBaseUrl(parsedFlags['api-base-url']);
      if (apiBaseUrlValidationError) {
        throwValidationError(apiBaseUrlValidationError);
      }
      nextInput.apiBaseUrl = parsedFlags['api-base-url'];
    }

    if (parsedFlags['auth-type'] !== undefined) {
      nextInput.authType = parsedFlags['auth-type'];
    }

    if (parsedFlags.username !== undefined) {
      nextInput.authUsername = String(parsedFlags.username ?? '').trim();
    }

    if (tokenOverride) {
      nextInput.authType = 'token';
      nextInput.accessToken = parsedFlags['access-token'] ?? parsedFlags.token;
    }

    for (const field of UPDATE_STRING_FLAGS) {
      if (parsedFlags[field] !== undefined) {
        nextInput[ENV_STRING_CONFIG_FLAG_MAP[field]] = parsedFlags[field];
      }
    }

    for (const field of UPDATE_BOOLEAN_FLAGS) {
      if (parsedFlags[field] !== undefined) {
        nextInput[ENV_BOOLEAN_CONFIG_FLAG_MAP[field]] = parsedFlags[field];
      }
    }

    for (const field of unsetFields) {
      applyUnsetField(nextInput, field);
    }

    const nextConfig = buildStoredEnvConfig(nextInput);

    startTask(`Saving env config: ${envName}`);
    try {
      await replaceEnvConfig(envName, nextConfig, { scope: resolveDefaultConfigScope() });
      succeedTask(`Saved env config for "${envName}".`);
    } catch (error) {
      failTask(`Failed to save env config for "${envName}".`);
      throw error;
    }

    const shouldRefreshRuntime = providedFields.has('api-base-url') || providedFields.has('access-token');
    if (!shouldRefreshRuntime) {
      this.printConfigUpdateHints(envName, new Set([...providedFields, ...unsetFields]), nextConfig);
      return;
    }

    try {
      await this.refreshRuntime(envName, envName, Boolean(parsedFlags.verbose));
    } catch (error) {
      this.printConfigUpdateHints(envName, new Set([...providedFields, ...unsetFields]), nextConfig);
      const message = error instanceof Error ? error.message : String(error);
      printWarningBlock(`Saved env config for "${envName}", but failed to refresh the runtime.\n${message}`);
      return;
    }

    printVerbose(`Updated env "${envName}" config and refreshed the runtime.`);
  }
}
