/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { upsertEnv } from '../../lib/auth-store.js';
import { type CliHomeScope } from '../../lib/cli-home.js';
import {
  runPromptCatalog,
  type PromptCatalogValues,
  type PromptInitialValues,
  type PromptsCatalog,
} from '../../lib/prompt-catalog.js';
import {
  applyCliLocale,
  CLI_LOCALE_FLAG_DESCRIPTION,
  CLI_LOCALE_FLAG_OPTIONS,
  localeText,
} from '../../lib/cli-locale.js';
import { validateApiBaseUrl } from '../../lib/prompt-validators.js';
import { printVerbose, setVerboseMode } from '../../lib/ui.js';
import * as p from '@clack/prompts';

type EnvScope = Exclude<CliHomeScope, 'auto'>;
type EnvAddParsedFlags = {
  env?: string;
  verbose: boolean;
  locale?: string;
  'no-intro': boolean;
  scope?: string;
  'default-api-base-url'?: string;
  'api-base-url'?: string;
  'base-url'?: string;
  'auth-type'?: string;
  'access-token'?: string;
  token?: string;
  source?: string;
  'download-version'?: string;
  'docker-registry'?: string;
  'docker-platform'?: string;
  'git-url'?: string;
  'npm-registry'?: string;
  'dev-dependencies'?: boolean;
  build?: boolean;
  'build-dts'?: boolean;
  'app-root-path'?: string;
  'storage-path'?: string;
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
};

const ENV_RUNTIME_FLAG_MAP = {
  source: 'source',
  'download-version': 'downloadVersion',
  'docker-registry': 'dockerRegistry',
  'docker-platform': 'dockerPlatform',
  'git-url': 'gitUrl',
  'npm-registry': 'npmRegistry',
  'app-root-path': 'appRootPath',
  'storage-path': 'storagePath',
  'app-port': 'appPort',
  'app-key': 'appKey',
  timezone: 'timezone',
  'db-dialect': 'dbDialect',
  'builtin-db-image': 'builtinDbImage',
  'db-host': 'dbHost',
  'db-port': 'dbPort',
  'db-database': 'dbDatabase',
  'db-user': 'dbUser',
  'db-password': 'dbPassword',
} as const;

const ENV_BOOLEAN_RUNTIME_FLAG_MAP = {
  'builtin-db': 'builtinDb',
  'dev-dependencies': 'devDependencies',
  build: 'build',
  'build-dts': 'buildDts',
} as const;

const envAddText = (key: string, values?: Record<string, unknown>) =>
  localeText(`commands.envAdd.${key}`, values);

export default class EnvAdd extends Command {
  static override summary =
    'Save a named NocoBase API endpoint (token or OAuth), then switch the CLI to use it';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> local',
    '<%= config.bin %> <%= command.id %> local --scope project --api-base-url http://localhost:13000/api --auth-type oauth',
  ];

  static override args = {
    name: Args.string({
      description:
        'Label for this environment (optional first argument; in a TTY, prompted when omitted; required when not using a TTY)',
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
    scope: Flags.string({
      char: 's',
      description:
        'Where to store env config: project (.nocobase in the repo) or global (user-level); prompted in a TTY when omitted',
      options: ['project', 'global'],
      default: 'project',
    }),
    'default-api-base-url': Flags.string({
      char: 'd',
      hidden: true,
      description:
        'Default API base URL for HTTP API calls, including the /api prefix (e.g. http://localhost:13000/api); prompted in a TTY when omitted',
    }),
    'api-base-url': Flags.string({
      char: 'u',
      aliases: ['base-url'],
      description:
        'Root URL for HTTP API calls, including the /api prefix (e.g. http://localhost:13000/api); prompted in a TTY when omitted',
    }),
    'auth-type': Flags.string({
      char: 'a',
      description:
        'Authentication: token (API key) or oauth (browser login via `nb env auth`); prompted in a TTY when omitted',
      options: ['token', 'oauth'],
    }),
    'access-token': Flags.string({
      char: 't',
      aliases: ['token'],
      description:
        'API key or access token when using --auth-type token (prompted in a TTY when omitted)',
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
    'app-root-path': Flags.string({
      hidden: true,
      description: 'Application root path saved with this env',
    }),
    'storage-path': Flags.string({
      hidden: true,
      description: 'Storage path saved with this env',
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
  };

  static prompts: PromptsCatalog = {
    name: {
      type: 'text',
      message: envAddText('prompts.name.message'),
      placeholder: envAddText('prompts.name.placeholder'),
      required: true,
    },
    scope: {
      type: 'select',
      message: envAddText('prompts.scope.message'),
      options: [
        {
          value: 'project',
          label: envAddText('prompts.scope.projectLabel'),
          hint: envAddText('prompts.scope.projectHint'),
        },
        {
          value: 'global',
          label: envAddText('prompts.scope.globalLabel'),
          hint: envAddText('prompts.scope.globalHint'),
        },
      ],
      initialValue: 'project',
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
      ],
      initialValue: 'oauth',
      required: true,
    },
    accessToken: {
      type: 'text',
      message: envAddText('prompts.accessToken.message'),
      placeholder: envAddText('prompts.accessToken.placeholder'),
      required: true,
      hidden: (values) => values.authType !== 'token',
    },
  };

  private buildPromptValues(
    nameArg: string | undefined,
    flags: EnvAddParsedFlags,
  ): PromptInitialValues {
    const values: PromptInitialValues = {};
    const name = nameArg?.trim() || flags.env?.trim();
    if (name) {
      values.name = name;
    }
    if (flags.scope) {
      values.scope = flags.scope;
    }
    const apiFromFlag = flags['api-base-url'] ?? flags['base-url'];
    if (typeof apiFromFlag === 'string' && apiFromFlag.trim() !== '') {
      values.apiBaseUrl = apiFromFlag.trim();
    }
    if (flags['auth-type']) {
      values.authType = flags['auth-type'];
    }
    const token = flags['access-token'] ?? flags.token;
    if (typeof token === 'string' && token !== '') {
      values.accessToken = token;
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

  private buildEnvConfig(
    results: PromptCatalogValues,
    flags: EnvAddParsedFlags,
  ): Record<string, string | boolean | undefined> {
    const envConfig: Record<string, string | boolean | undefined> = {
      baseUrl: String(results.apiBaseUrl ?? ''),
    };

    for (const [flagName, configKey] of Object.entries(ENV_RUNTIME_FLAG_MAP)) {
      const value = flags[flagName as keyof typeof ENV_RUNTIME_FLAG_MAP];
      if (typeof value === 'string' && value.trim() !== '') {
        envConfig[configKey] = value.trim();
      }
    }

    for (const [flagName, configKey] of Object.entries(ENV_BOOLEAN_RUNTIME_FLAG_MAP)) {
      const value = flags[flagName as keyof typeof ENV_BOOLEAN_RUNTIME_FLAG_MAP];
      if (typeof value === 'boolean') {
        envConfig[configKey] = value;
      }
    }

    if (flags['builtin-db'] === false) {
      envConfig.builtinDbImage = undefined;
    }

    if (results.authType === 'token' && results.accessToken != null) {
      envConfig.accessToken = String(results.accessToken);
    }

    return envConfig;
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvAdd);
    const parsedFlags = flags as EnvAddParsedFlags;
    applyCliLocale(parsedFlags.locale);
    setVerboseMode(parsedFlags.verbose);
    if (!parsedFlags['no-intro']) {
      p.intro('Connect a NocoBase Environment');
    }

    const results = await runPromptCatalog(EnvAdd.prompts, {
      values: this.buildPromptValues(args.name, parsedFlags),
      initialValues: this.buildPromptInitialValues(parsedFlags),
      command: this,
    });
    const envName = String(results.name);
    const scope = results.scope as EnvScope;
    const envConfig = this.buildEnvConfig(results, parsedFlags);

    printVerbose(`Saving env "${envName}" with scope "${scope}".`);

    await upsertEnv(
      envName,
      envConfig,
      { scope },
    );

    if (results.authType === 'oauth') {
      await this.config.runCommand('env:auth', [envName]);
    }
    await this.config.runCommand('env:update', [envName]);

    p.outro(`Env "${envName}" added successfully.`);
  }
}
