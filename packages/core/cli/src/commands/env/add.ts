/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { setCurrentEnv, upsertEnv } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { ENV_BOOLEAN_CONFIG_FLAG_MAP, ENV_STRING_CONFIG_FLAG_MAP } from '../../lib/env-command-config.js';
import { buildStoredEnvConfig, type StoredEnvConfig, type StoredEnvConfigInput } from '../../lib/env-config.js';
import {
  runPromptCatalog,
  type PromptCatalogValues,
  type PromptInitialValues,
  type PasswordPromptBlock,
  type PromptsCatalog,
  type TextPromptBlock,
} from '../../lib/prompt-catalog.js';
import {
  applyCliLocale,
  CLI_LOCALE_FLAG_DESCRIPTION,
  CLI_LOCALE_FLAG_OPTIONS,
  localeText,
} from '../../lib/cli-locale.js';
import { validateApiBaseUrl } from '../../lib/prompt-validators.js';
import { printInfo, printStage, printSuccess, printVerbose, setVerboseMode } from '../../lib/ui.js';

type EnvAddParsedFlags = {
  env?: string;
  verbose: boolean;
  locale?: string;
  'no-intro': boolean;
  'default-api-base-url'?: string;
  'api-base-url'?: string;
  'auth-type'?: string;
  'access-token'?: string;
  token?: string;
  username?: string;
  password?: string;
  'skip-auth': boolean;
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
  'root-username'?: string;
  'root-email'?: string;
  'root-password'?: string;
  'root-nickname'?: string;
};

const envAddText = (key: string, values?: Record<string, unknown>) => localeText(`commands.envAdd.${key}`, values);

const envAddAccessTokenPrompt: TextPromptBlock = {
  type: 'text',
  message: envAddText('prompts.accessToken.message'),
  required: true,
  hidden: (values) => values.authType !== 'token' || values.skipAuth === true,
};

const envAddUsernamePrompt: TextPromptBlock = {
  type: 'text',
  message: envAddText('prompts.username.message'),
  placeholder: envAddText('prompts.username.placeholder'),
  required: true,
  hidden: (values) => values.authType !== 'basic' || values.skipAuth === true,
};

const envAddPasswordPrompt: PasswordPromptBlock = {
  type: 'password',
  message: envAddText('prompts.password.message'),
  required: true,
  hidden: (values) => values.authType !== 'basic' || values.skipAuth === true,
};

function formatDeferredAuthMessage(envName: string, authType: unknown): string {
  const normalizedAuthType = String(authType ?? '').trim();
  const nextStep = `Authentication was skipped for env "${envName}". Run \`nb env auth ${envName}\` to finish setup.`;

  if (normalizedAuthType === 'basic') {
    return `${nextStep} You will be prompted for a username and password.`;
  }

  if (normalizedAuthType === 'token') {
    return `${nextStep} You will be prompted for an access token.`;
  }

  if (normalizedAuthType === 'oauth') {
    return `${nextStep} A browser sign-in flow will be started.`;
  }

  return nextStep;
}

export default class EnvAdd extends Command {
  static override summary =
    'Save a named NocoBase API endpoint (basic, token, or OAuth), then switch the CLI to use it';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> local',
    '<%= config.bin %> <%= command.id %> local --api-base-url http://localhost:13000/api --auth-type oauth',
  ];

  static override args = {
    name: Args.string({
      description:
        'Environment name to save (optional first argument; in a TTY, prompted when omitted; required when not using a TTY)',
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
    verbose: Flags.boolean({
      description: 'Print detailed progress while writing config',
      default: false,
    }),
    locale: Flags.string({
      description: CLI_LOCALE_FLAG_DESCRIPTION,
      options: CLI_LOCALE_FLAG_OPTIONS,
    }),
    'no-intro': Flags.boolean({
      hidden: true,
      description: 'Skip command intro when invoked by another CLI command',
      default: false,
    }),
    'default-api-base-url': Flags.string({
      char: 'd',
      hidden: true,
      description:
        'Default API base URL for HTTP API calls, including the /api prefix (e.g. http://localhost:13000/api); prompted in a TTY when omitted',
    }),
    'api-base-url': Flags.string({
      char: 'u',
      description:
        'Root URL for HTTP API calls, including the /api prefix (e.g. http://localhost:13000/api); prompted in a TTY when omitted',
    }),
    'auth-type': Flags.string({
      char: 'a',
      description:
        'Authentication: basic (username/password login), token (API key), or oauth (browser login via `nb env auth`); prompted in a TTY when omitted',
      options: ['basic', 'token', 'oauth'],
    }),
    'access-token': Flags.string({
      char: 't',
      aliases: ['token'],
      description: 'API key or access token when using --auth-type token (prompted in a TTY when omitted)',
    }),
    username: Flags.string({
      description: 'Username when using --auth-type basic (prompted in a TTY when omitted)',
    }),
    password: Flags.string({
      description: 'Password when using --auth-type basic (prompted in a TTY when omitted)',
    }),
    'skip-auth': Flags.boolean({
      description: 'Save the env now and finish authentication later with `nb env auth`',
      default: false,
    }),
    source: Flags.string({
      hidden: true,
      description: 'Application source saved with this env',
    }),
    'download-version': Flags.string({
      hidden: true,
      description: 'Downloaded app version saved with this env',
    }),
    'docker-registry': Flags.string({
      hidden: true,
      description: 'Docker registry saved with this env',
    }),
    'docker-platform': Flags.string({
      hidden: true,
      description: 'Docker image platform saved with this env',
    }),
    'git-url': Flags.string({
      hidden: true,
      description: 'Git repository URL saved with this env',
    }),
    'npm-registry': Flags.string({
      hidden: true,
      description: 'npm registry saved with this env',
    }),
    'dev-dependencies': Flags.boolean({
      allowNo: true,
      hidden: true,
      description: 'Whether development dependencies were installed for this env',
    }),
    build: Flags.boolean({
      allowNo: true,
      hidden: true,
      description: 'Whether the app was built after download for this env',
    }),
    'build-dts': Flags.boolean({
      allowNo: true,
      hidden: true,
      description: 'Whether declaration files were emitted during build for this env',
    }),
    'app-path': Flags.string({
      hidden: true,
      description: 'App path saved with this env',
    }),
    'app-root-path': Flags.string({
      hidden: true,
      deprecated: true,
      description: 'Application root path saved with this env',
    }),
    'storage-path': Flags.string({
      hidden: true,
      deprecated: true,
      description: 'Storage path saved with this env',
    }),
    'app-public-path': Flags.string({
      hidden: true,
      description: 'Application public path saved with this env',
    }),
    'env-file': Flags.string({
      hidden: true,
      description: 'Docker env file saved with this env',
    }),
    'app-port': Flags.string({
      hidden: true,
      description: 'Application HTTP port saved with this env',
    }),
    'app-key': Flags.string({
      hidden: true,
      description: 'Application secret key saved with this env',
    }),
    timezone: Flags.string({
      hidden: true,
      description: 'Application timezone saved with this env',
    }),
    'builtin-db': Flags.boolean({
      allowNo: true,
      hidden: true,
      description: 'Whether this env uses a CLI-managed built-in database',
    }),
    'db-dialect': Flags.string({
      hidden: true,
      description: 'Database dialect saved with this env',
    }),
    'builtin-db-image': Flags.string({
      hidden: true,
      description: 'Built-in database image saved with this env',
    }),
    'db-host': Flags.string({
      hidden: true,
      description: 'Database host saved with this env',
    }),
    'db-port': Flags.string({
      hidden: true,
      description: 'Database port saved with this env',
    }),
    'db-database': Flags.string({
      hidden: true,
      description: 'Database name saved with this env',
    }),
    'db-user': Flags.string({
      hidden: true,
      description: 'Database user saved with this env',
    }),
    'db-password': Flags.string({
      hidden: true,
      description: 'Database password saved with this env',
    }),
    'db-schema': Flags.string({
      hidden: true,
      description: 'Database schema saved with this env',
    }),
    'db-table-prefix': Flags.string({
      hidden: true,
      description: 'Database table prefix saved with this env',
    }),
    'db-underscored': Flags.boolean({
      allowNo: true,
      hidden: true,
      description: 'Whether this env uses underscored database naming',
    }),
    'root-username': Flags.string({
      hidden: true,
      description: 'Initial root username saved with this env',
    }),
    'root-email': Flags.string({
      hidden: true,
      description: 'Initial root email saved with this env',
    }),
    'root-password': Flags.string({
      hidden: true,
      description: 'Initial root password saved with this env',
    }),
    'root-nickname': Flags.string({
      hidden: true,
      description: 'Initial root nickname saved with this env',
    }),
  };

  static prompts: PromptsCatalog = {
    name: {
      type: 'text',
      message: envAddText('prompts.name.message'),
      placeholder: envAddText('prompts.name.placeholder'),
      required: true,
    },
    apiBaseUrl: {
      type: 'text',
      message: envAddText('prompts.apiBaseUrl.message'),
      placeholder: envAddText('prompts.apiBaseUrl.placeholder'),
      required: true,
      validate: validateApiBaseUrl,
    },
    authType: {
      type: 'select',
      message: envAddText('prompts.authType.message'),
      options: [
        {
          value: 'oauth',
          label: envAddText('prompts.authType.oauthLabel'),
          hint: envAddText('prompts.authType.oauthHint'),
        },
        { value: 'token', label: envAddText('prompts.authType.tokenLabel') },
        {
          value: 'basic',
          label: envAddText('prompts.authType.basicLabel'),
          hint: envAddText('prompts.authType.basicHint'),
        },
      ],
      initialValue: 'oauth',
      required: true,
    },
    username: envAddUsernamePrompt,
    password: envAddPasswordPrompt,
    accessToken: envAddAccessTokenPrompt,
  };

  private buildPromptValues(nameArg: string | undefined, flags: EnvAddParsedFlags): PromptInitialValues {
    const values: PromptInitialValues = {};
    const name = nameArg?.trim() || flags.env?.trim();
    if (name) {
      values.name = name;
    }
    const apiFromFlag = flags['api-base-url'];
    if (typeof apiFromFlag === 'string' && apiFromFlag.trim() !== '') {
      values.apiBaseUrl = apiFromFlag.trim();
    }
    if (flags['auth-type']) {
      values.authType = flags['auth-type'];
    }
    if (flags['skip-auth']) {
      values.skipAuth = true;
    }
    const token = flags['access-token'] ?? flags.token;
    if (typeof token === 'string' && token !== '') {
      values.accessToken = token;
    }
    if (flags.username !== undefined) {
      values.username = String(flags.username ?? '').trim();
    }
    if (flags.password !== undefined) {
      values.password = String(flags.password ?? '');
    }
    return values;
  }

  private buildPromptInitialValues(flags: EnvAddParsedFlags): PromptInitialValues {
    const initialValues: PromptInitialValues = {};
    const defaultApiBaseUrl = flags['default-api-base-url']?.trim();
    if (defaultApiBaseUrl) {
      initialValues.apiBaseUrl = defaultApiBaseUrl;
    }
    return initialValues;
  }

  private buildPromptCatalog(flags: EnvAddParsedFlags): PromptsCatalog {
    if (!flags['skip-auth']) {
      return EnvAdd.prompts;
    }

    return {
      ...EnvAdd.prompts,
      username: {
        ...envAddUsernamePrompt,
        hidden: () => true,
      },
      password: {
        ...envAddPasswordPrompt,
        hidden: () => true,
      },
      accessToken: {
        ...envAddAccessTokenPrompt,
        hidden: () => true,
      },
    };
  }

  private buildEnvConfig(results: PromptCatalogValues, flags: EnvAddParsedFlags): StoredEnvConfig {
    const authType = String(results.authType ?? '').trim();
    const authUsername = authType === 'basic' ? String(results.username ?? flags.username ?? '').trim() : '';
    const envConfigInput: StoredEnvConfigInput & Record<string, unknown> = {
      apiBaseUrl: results.apiBaseUrl,
      authType,
      authUsername: authUsername || undefined,
      accessToken: results.accessToken,
    };

    for (const [flagName, configKey] of Object.entries(ENV_STRING_CONFIG_FLAG_MAP)) {
      const value = flags[flagName as keyof typeof ENV_STRING_CONFIG_FLAG_MAP];
      envConfigInput[configKey] = value;
    }

    for (const [flagName, configKey] of Object.entries(ENV_BOOLEAN_CONFIG_FLAG_MAP)) {
      const value = flags[flagName as keyof typeof ENV_BOOLEAN_CONFIG_FLAG_MAP];
      envConfigInput[configKey] = value;
    }

    return buildStoredEnvConfig(envConfigInput);
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvAdd);
    const parsedFlags = flags as EnvAddParsedFlags;
    if (parsedFlags['skip-auth'] && (parsedFlags['access-token'] !== undefined || parsedFlags.token !== undefined)) {
      this.error('--skip-auth cannot be used with --access-token or --token.');
    }
    applyCliLocale(parsedFlags.locale);
    setVerboseMode(parsedFlags.verbose);
    if (!parsedFlags['no-intro']) {
      printStage('Connect to NocoBase');
    }

    const results = await runPromptCatalog(this.buildPromptCatalog(parsedFlags), {
      values: this.buildPromptValues(args.name, parsedFlags),
      initialValues: this.buildPromptInitialValues(parsedFlags),
      command: this,
    });
    const envName = String(results.name);
    const envConfig = this.buildEnvConfig(results, parsedFlags);

    printVerbose(`Saving env "${envName}" globally.`);

    await upsertEnv(envName, envConfig, { scope: resolveDefaultConfigScope() });
    await setCurrentEnv(envName, { scope: resolveDefaultConfigScope() });

    if (parsedFlags['skip-auth']) {
      printSuccess(`✔ Env "${envName}" was saved.`);
      printInfo(formatDeferredAuthMessage(envName, results.authType));
      return;
    }

    if (results.authType === 'oauth' || results.authType === 'basic') {
      const authArgv = [envName];
      if (results.authType === 'basic') {
        authArgv.push('--auth-type', 'basic');
        const username = String(results.username ?? '').trim();
        const password = String(results.password ?? '');
        if (username) {
          authArgv.push('--username', username);
        }
        if (password) {
          authArgv.push('--password', password);
        }
      }
      await this.config.runCommand('env:auth', authArgv);
    }

    await this.config.runCommand('env:update', [envName]);

    printSuccess(`✔ Env "${envName}" is ready.`);
  }
}
