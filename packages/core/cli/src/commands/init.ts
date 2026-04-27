/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { stdin as stdinStream, stdout as stdoutStream } from 'node:process';
import { getEnv, upsertEnv } from '../lib/auth-store.ts';
import {
  type PromptBlock,
  type PromptCatalogValues,
  type PromptInitialValues,
  type PromptValue,
  type PromptsCatalog,
  type TextPromptBlock,
  runPromptCatalog,
} from '../lib/prompt-catalog.ts';
import { applyCliLocale, localeText, translateCli } from '../lib/cli-locale.ts';
import { resolveDefaultConfigScope } from '../lib/cli-home.js';
import {
  type RunPromptCatalogWebUIStage,
  runPromptCatalogWebUI,
} from '../lib/prompt-web-ui.ts';
import { validateApiBaseUrl, validateEnvKey } from '../lib/prompt-validators.ts';
import { run } from '../lib/run-npm.ts';
import {
  inspectSkillsStatus,
  installNocoBaseSkills,
  updateNocoBaseSkills,
} from '../lib/skills-manager.js';
import Download from './download.ts';
import EnvAdd from './env/add.ts';
import Install, { defaultDbPortForDialect } from './install.ts';
import _ from 'lodash';

const DEFAULT_INIT_API_BASE_URL = 'http://localhost:13000/api';
const DEFAULT_INIT_APP_NAME = 'local';
const DOWNLOAD_OUTPUT_DIR_PROMPT = Download.prompts.outputDir as TextPromptBlock;
const INIT_ENV_ADD_FLAG_NAMES = [
  'locale',
  'default-api-base-url',
  'api-base-url',
  'auth-type',
  'access-token',
  'token',
] as const;

const initText = (key: string, values?: Record<string, unknown>) =>
  localeText(`commands.init.${key}`, values);

function withExtraHidden(
  def: PromptBlock,
  extraHidden: (values: PromptCatalogValues) => boolean,
): PromptBlock {
  if (def.type === 'run') {
    return def;
  }

  return {
    ...def,
    hidden: (values) => extraHidden(values) || (def.hidden?.(values) ?? false),
  };
}

function existingAppOnly(def: PromptBlock): PromptBlock {
  return withExtraHidden(def, (values) => values.hasNocobase !== 'yes');
}

function newInstallOnly(def: PromptBlock): PromptBlock {
  return withExtraHidden(def, (values) => values.hasNocobase !== 'no');
}

function downloadInNewInstallOnly(def: PromptBlock): PromptBlock {
  return withExtraHidden(
    def,
    (values) => values.hasNocobase !== 'no' || values.fetchSource !== true,
  );
}

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((token) => argv.includes(token));
}

function resolveInitDownloadVersion(results: Record<string, string | number | boolean>): string {
  const preset = String(results.version ?? '').trim();
  if (preset === 'other') {
    return String(results.otherVersion ?? '').trim();
  }
  return preset;
}

function initVersionPromptValue(version: string): 'latest' | 'beta' | 'alpha' | 'other' {
  return version === 'latest' || version === 'beta' || version === 'alpha'
    ? version
    : 'other';
}

function yesInitialValue(def: PromptBlock, fallback: string): string {
  if ('yesInitialValue' in def && def.yesInitialValue !== undefined) {
    return String(def.yesInitialValue);
  }
  return fallback;
}

function hasDownloadOverride(flags: { source?: string; version?: string }): boolean {
  return Boolean(
    String(flags.source ?? '').trim()
    || String(flags.version ?? '').trim(),
  );
}

function explicitApiBaseUrlFlag(
  flags: { 'api-base-url'?: string },
): string {
  return String(flags['api-base-url'] ?? '').trim();
}

function explicitDbHostFlag(flags: { 'db-host'?: string }): string {
  return String(flags['db-host'] ?? '').trim();
}

function shouldAllowExistingInitEnv(): boolean {
  return argvHasToken(process.argv.slice(2), ['--force', '-f']);
}

async function validateInitAppName(value: PromptValue): Promise<string | undefined> {
  const formatError = validateEnvKey(value);
  if (formatError) {
    return formatError;
  }

  const envName = String(value ?? '').trim();
  if (!envName) {
    return undefined;
  }

  const existingEnv = await getEnv(envName, { scope: resolveDefaultConfigScope() });
  if (existingEnv) {
    if (shouldAllowExistingInitEnv()) {
      return undefined;
    }
    return translateCli('commands.init.validation.envExists', { envName });
  }

  return undefined;
}

function highlightInitValidationMessage(message: string): string {
  return message.replace(
    /Env "([^"]+)"/,
    (_match, envName: string) => `Env ${pc.cyan(pc.bold(`"${envName}"`))}`,
  );
}

function formatInitValidationMessage(message: string): string {
  return message;
}

function formatResumeEnvRequiredMessage(): string {
  return [
    translateCli('commands.init.messages.resumeEnvRequired'),
    translateCli('commands.init.messages.resumeEnvHelp'),
  ].join('\n');
}

function formatSkippedAppNameRequiredMessage(): string {
  return [
    translateCli('commands.init.messages.appNameRequiredWhenSkipped'),
    translateCli('commands.init.messages.appNameEnvHelp'),
  ].join('\n');
}

function shellQuoteArg(value: string): string {
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(value)
    ? value
    : `'${value.replace(/'/g, `'\\''`)}'`;
}

function initTitle(): string {
  return translateCli('commands.init.messages.title');
}

function logInitUiReady(command: { log: (message: string) => void }, url: string) {
  p.log.step(translateCli('commands.init.messages.uiReady'));
  p.log.info(translateCli('commands.init.messages.uiReadyHelp'));
  command.log(`URL: ${url}`);
}

function logInitUiBrowserOpenFallback() {
  p.log.warn(translateCli('commands.init.messages.uiOpenBrowserFallback'));
}

export default class Init extends Command {
  static override summary =
    'Set up NocoBase so coding agents can connect and work with it';
  static override description = `Set up NocoBase for coding agents in the current workspace.

\`nb init\` prepares a NocoBase environment that coding agents can use. It supports two setup paths:

- Connect an existing NocoBase app and save it as a CLI env.
- Install a new NocoBase app, then save it as a CLI env.

It can also install NocoBase AI coding skills (\`nocobase/skills\`) so agents get the project-specific workflow guidance.

If setup was interrupted earlier, use \`--resume\` with an existing env name to continue from the saved workspace config.

Prompt modes:
- Default: guided prompts in the terminal.
- \`--ui\`: open the same setup flow in a local browser form.
- \`-y\`, \`--yes\`: skip prompts. In this mode \`--env <envName>\` is required, and init creates a new local NocoBase app with safe defaults.

\`--ui\` cannot be combined with \`--yes\`.`;

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --ui',
    '<%= config.bin %> <%= command.id %> --ui',
    '<%= config.bin %> <%= command.id %> --env app1 --yes',
    '<%= config.bin %> <%= command.id %> --env app1 --resume',
    '<%= config.bin %> <%= command.id %> --env app1 --yes --source docker --version alpha',
    '<%= config.bin %> <%= command.id %> --env app1 --yes --source npm --version alpha --app-port 13080',
    '<%= config.bin %> <%= command.id %> --env app1 --yes --source git --version fix/cli-v2',
    '<%= config.bin %> <%= command.id %> --ui --ui-port 3000',
  ];

  static prompts: PromptsCatalog = {
    appName: {
      type: 'text',
      message: initText('prompts.appName.message'),
      placeholder: initText('prompts.appName.placeholder'),
      required: true,
      validate: validateInitAppName,
    },
    hasNocobase: {
      type: 'select',
      variant: 'radio',
      message: initText('prompts.hasNocobase.message'),
      options: [
        {
          value: 'no',
          label: initText('prompts.hasNocobase.noLabel'),
        },
        {
          value: 'yes',
          label: initText('prompts.hasNocobase.yesLabel'),
        },
      ],
      initialValue: 'no',
      yesInitialValue: 'no',
      required: true,
    },
    apiBaseUrl: existingAppOnly({
      type: 'text',
      message: initText('prompts.apiBaseUrl.message'),
      placeholder: initText('prompts.apiBaseUrl.placeholder'),
      required: true,
      validate: validateApiBaseUrl,
    }),
    authType: existingAppOnly(EnvAdd.prompts.authType),
    accessToken: existingAppOnly(EnvAdd.prompts.accessToken),
    lang: newInstallOnly(Install.appPrompts.lang),
    appRootPath: newInstallOnly(Install.appPrompts.appRootPath),
    appPort: newInstallOnly(Install.appPrompts.appPort),
    storagePath: newInstallOnly(Install.appPrompts.storagePath),
    fetchSource: newInstallOnly(Install.appPrompts.fetchSource),
    source: downloadInNewInstallOnly(Download.prompts.source),
    version: downloadInNewInstallOnly(Download.prompts.version),
    otherVersion: downloadInNewInstallOnly(Download.prompts.otherVersion),
    dockerRegistry: downloadInNewInstallOnly(Download.prompts.dockerRegistry),
    dockerPlatform: downloadInNewInstallOnly(Download.prompts.dockerPlatform),
    dockerSave: downloadInNewInstallOnly(Download.prompts.dockerSave),
    gitUrl: downloadInNewInstallOnly(Download.prompts.gitUrl),
    outputDir: downloadInNewInstallOnly({
      ...DOWNLOAD_OUTPUT_DIR_PROMPT,
      hidden: (values) => {
        const source = String(values.source ?? '').trim();
        if (source === 'npm' || source === 'git') {
          return true;
        }
        return DOWNLOAD_OUTPUT_DIR_PROMPT.hidden?.(values) ?? false;
      },
      initialValue: (values) => {
        const source = String(values.source ?? '').trim();
        if (source === 'npm' || source === 'git') {
          const appRootPath = String(values.appRootPath ?? '').trim();
          if (appRootPath) {
            return appRootPath;
          }
        }
        const initialValue = DOWNLOAD_OUTPUT_DIR_PROMPT.initialValue;
        return typeof initialValue === 'function' ? initialValue(values) : String(initialValue ?? '');
      },
    }),
    npmRegistry: downloadInNewInstallOnly(Download.prompts.npmRegistry),
    replace: downloadInNewInstallOnly(Download.prompts.replace),
    devDependencies: downloadInNewInstallOnly(Download.prompts.devDependencies),
    build: downloadInNewInstallOnly(Download.prompts.build),
    buildDts: downloadInNewInstallOnly(Download.prompts.buildDts),
    dbDialect: newInstallOnly(Install.dbPrompts.dbDialect),
    builtinDb: newInstallOnly(Install.dbPrompts.builtinDb),
    builtinDbImage: newInstallOnly(Install.dbPrompts.builtinDbImage),
    dbHost: newInstallOnly(Install.dbPrompts.dbHost),
    dbPort: newInstallOnly(Install.dbPrompts.dbPort),
    dbDatabase: newInstallOnly(Install.dbPrompts.dbDatabase),
    dbUser: newInstallOnly(Install.dbPrompts.dbUser),
    dbPassword: newInstallOnly(Install.dbPrompts.dbPassword),
    rootUsername: newInstallOnly(Install.rootUserPrompts.rootUsername),
    rootEmail: newInstallOnly(Install.rootUserPrompts.rootEmail),
    rootPassword: newInstallOnly(Install.rootUserPrompts.rootPassword),
    rootNickname: newInstallOnly(Install.rootUserPrompts.rootNickname),
  };

  static flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip prompts and create a new local NocoBase app. Requires an env name.',
      default: false,
    }),
    env: Flags.string({
      char: 'e',
      description: 'Env name for this setup. Required with --yes and --resume',
    }),
    ui: Flags.boolean({
      description:
        'Open the guided setup flow in a local browser form (not valid with --yes)',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed command output',
      default: false,
    }),
    'ui-host': Flags.string({
      description:
        'Host for the local --ui setup server (default: 127.0.0.1)',
    }),
    'ui-port': Flags.integer({
      description:
        'Port for the local --ui setup server; 0 lets the OS choose an available port',
      min: 0,
      max: 65535,
    }),
    ..._.pick(EnvAdd.flags, INIT_ENV_ADD_FLAG_NAMES),
    ..._.omit(Install.flags, ['yes', 'env']),
  };

  public async run(): Promise<void> {
    const parsedResult = await this.parse(Init);
    applyCliLocale((parsedResult.flags as { locale?: string }).locale);
    const flags = parsedResult.flags;
    const normalizedFlags = { ...flags };

    if (normalizedFlags.ui && normalizedFlags.yes) {
      this.error('--ui cannot be used with --yes.');
    }

    if (normalizedFlags.ui && normalizedFlags.resume) {
      this.error('--ui cannot be used with --resume.');
    }

    if (
      !normalizedFlags.ui &&
      (normalizedFlags['ui-host'] !== undefined || normalizedFlags['ui-port'] !== undefined)
    ) {
      this.error('--ui-host and --ui-port require --ui.');
    }

    if (normalizedFlags.resume) {
      const envName = String(normalizedFlags.env ?? '').trim();
      if (!envName) {
        p.log.error(formatResumeEnvRequiredMessage());
        this.exit(1);
      }

      p.intro(initTitle());

      await this.syncNocoBaseSkills();

      try {
        await this.config.runCommand(
          'install',
          this.buildResumeInstallArgv(
            normalizedFlags as {
              yes?: boolean;
              env?: string;
              lang?: string;
              force?: boolean;
              replace?: boolean;
              'app-root-path'?: string;
              'app-port'?: string;
              'storage-path'?: string;
              'root-username'?: string;
              'root-email'?: string;
              'root-password'?: string;
              'root-nickname'?: string;
              'builtin-db'?: boolean;
              'db-dialect'?: string;
              'builtin-db-image'?: string;
              'db-host'?: string;
              'db-port'?: string;
              'db-database'?: string;
              'db-user'?: string;
              'db-password'?: string;
              'fetch-source'?: boolean;
              source?: string;
              version?: string;
              'dev-dependencies'?: boolean;
              build?: boolean;
              'build-dts'?: boolean;
              'output-dir'?: string;
              'git-url'?: string;
              'docker-registry'?: string;
              'docker-platform'?: string;
              'docker-save'?: boolean;
              'npm-registry'?: string;
            },
          ),
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      }

      p.outro('Workspace init finished.');
      return;
    }

    const interactive = Boolean(stdinStream.isTTY && stdoutStream.isTTY);
    const useBrowserUi = Boolean(normalizedFlags.ui);

    let presetValues = this.buildPresetValuesFromFlags(
      normalizedFlags as {
        env?: string;
        lang?: string;
        force?: boolean;
        replace?: boolean;
        'app-root-path'?: string;
        'app-port'?: string;
        'storage-path'?: string;
        'root-username'?: string;
        'root-email'?: string;
        'root-password'?: string;
        'root-nickname'?: string;
        'builtin-db'?: boolean;
        'db-dialect'?: string;
        'builtin-db-image'?: string;
        'db-host'?: string;
        'db-port'?: string;
        'db-database'?: string;
        'db-user'?: string;
        'db-password'?: string;
        'fetch-source'?: boolean;
        source?: string;
        version?: string;
        'dev-dependencies'?: boolean;
        build?: boolean;
        'build-dts'?: boolean;
        'output-dir'?: string;
        'git-url'?: string;
        'docker-registry'?: string;
        'docker-platform'?: string;
        'docker-save'?: boolean;
        'npm-registry'?: string;
      },
    );

    if (normalizedFlags.yes && !String(presetValues.appName ?? '').trim()) {
      const formatted = formatSkippedAppNameRequiredMessage();
      p.log.error(highlightInitValidationMessage(formatted));
      this.exit(1);
    }

    const appName = String(presetValues.appName ?? '').trim();
    if (useBrowserUi) {
      p.intro(initTitle());
      p.log.info(translateCli('commands.init.messages.uiOpening'));
    } else {
      p.intro(initTitle());

      if (normalizedFlags.yes) {
        p.log.info(
          `Prompts skipped (--yes). NocoBase will be installed for env "${appName}" using the provided flags and safe defaults.`,
        );
      } else if (!interactive) {
        p.log.warn(
          'No interactive terminal detected. NocoBase will be installed using the provided flags and safe defaults.',
        );
      }
    }

    const dynamicInitialValues = await Init.buildDynamicInitialValuesForInstall(
      normalizedFlags as {
        'app-port'?: string;
        'db-port'?: string;
        yes?: boolean;
      },
      presetValues,
    );
    if (useBrowserUi) {
      presetValues = await runPromptCatalogWebUI({
        stages: Init.buildWebUiStages(),
        values: {
          ...dynamicInitialValues,
          ...presetValues,
        },
        host: normalizedFlags['ui-host']?.trim() || '127.0.0.1',
        port: normalizedFlags['ui-port'] ?? 0,
        pageTitle: initText('webUi.pageTitle'),
        documentHeading: initText('webUi.documentHeading'),
        documentHint: initText('webUi.documentHint'),
        onServerStart: ({ url }) => {
          logInitUiReady(this, url);
        },
        onOpenBrowserError: (_url, _err) => {
          logInitUiBrowserOpenFallback();
        },
      });
    }

    const results = await runPromptCatalog(Init.prompts, {
      initialValues: dynamicInitialValues,
      values: presetValues,
      yes: normalizedFlags.yes || useBrowserUi || !interactive,
      hooks: {
        onCancel: () => {
          p.cancel('Init cancelled.');
          this.exit(0);
        },
        onMissingNonInteractive: (message) => {
          const formatted = formatInitValidationMessage(message);
          p.log.error(highlightInitValidationMessage(formatted));
          this.exit(1);
        },
      },
      command: this,
    });

    const hasNocobase = results.hasNocobase === 'yes';
    const existingEnv = !hasNocobase
      ? await getEnv(String(results.appName ?? '').trim(), { scope: resolveDefaultConfigScope() })
      : undefined;

    if (existingEnv && Boolean(normalizedFlags.force)) {
      p.log.warn(
        `Reconfiguring existing env ${pc.cyan(pc.bold(`"${existingEnv.name}"`))} from the global config because ${pc.bold('--force')} was set. The env config will be updated before install starts, then refreshed again after install succeeds.`,
      );
    }

    await this.syncNocoBaseSkills();

    let managedInstallResults: Record<string, string | number | boolean> | undefined;

    try {
      // oclif explicit registry keys use `:` (e.g. `env:add`); users still type `nb env add`.
      if (hasNocobase) {
        p.log.step('Running nb env add');
        await this.config.runCommand('env:add', this.buildEnvAddArgv(results));
      } else {
        p.log.step('Saving the local env config');
        await this.persistManagedEnvConfig(results, normalizedFlags);
        managedInstallResults = results;
        p.log.step('Running nb install');
        await this.config.runCommand('install', this.buildInstallArgv(results, normalizedFlags));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const formatted = managedInstallResults
        ? this.formatManagedInstallFailureMessage(message, managedInstallResults, normalizedFlags)
        : message;
      p.outro(pc.red(formatted));
      this.exit(1);
    }

    p.outro('Workspace init finished.');
  }

  private static async buildDynamicInitialValuesForInstall(
    flags: {
      'app-root-path'?: string;
      'app-port'?: string;
      'storage-path'?: string;
      'db-port'?: string;
      yes?: boolean;
    },
    presetValues: PromptInitialValues,
  ): Promise<PromptInitialValues> {
    const out: PromptInitialValues = {};

    if (!Object.prototype.hasOwnProperty.call(presetValues, 'appPort')) {
      const appInitialValues = await Install.buildAppPromptInitialValues({
        envName: String(presetValues.appName ?? '').trim(),
        flags: {
          ...flags,
          'app-root-path': flags['app-root-path'] ?? '',
          'storage-path': flags['storage-path'] ?? '',
        },
        warnOnPortFallback: false,
      });
      if (appInitialValues.appPort !== undefined) {
        out.appPort = appInitialValues.appPort;
      }
    }

    const downloadSeed = { ...presetValues };
    if (
      flags.yes
      && !Object.prototype.hasOwnProperty.call(downloadSeed, 'source')
      && downloadSeed.fetchSource !== false
    ) {
      downloadSeed.source = 'docker';
    }

    const dbInitial = await Install.buildDbPromptInitialValues({
      flags,
      downloadResults: downloadSeed as Record<string, PromptValue>,
      dbPreset: presetValues,
      warnOnPortFallback: false,
    });
    for (const [key, value] of Object.entries(dbInitial)) {
      if (!Object.prototype.hasOwnProperty.call(presetValues, key)) {
        out[key] = value;
      }
    }

    return out;
  }

  private static buildWebUiStages(): RunPromptCatalogWebUIStage[] {
    const c = Init.prompts;

    return [
      {
        sectionTitle: initText('webUi.gettingStarted.title'),
        sectionDescription: initText('webUi.gettingStarted.description'),
        catalog: {
          appName: c.appName,
          hasNocobase: c.hasNocobase,
        } satisfies PromptsCatalog,
      },
      {
        sectionTitle: initText('webUi.connectExistingApp.title'),
        sectionDescription: initText('webUi.connectExistingApp.description'),
        catalog: {
          apiBaseUrl: c.apiBaseUrl,
          authType: c.authType,
          accessToken: c.accessToken,
        } satisfies PromptsCatalog,
      },
      {
        sectionTitle: initText('webUi.createNewApp.title'),
        sectionDescription: initText('webUi.createNewApp.description'),
        catalog: {
          lang: c.lang,
          appRootPath: c.appRootPath,
          appPort: c.appPort,
          storagePath: c.storagePath,
          fetchSource: c.fetchSource,
        } satisfies PromptsCatalog,
      },
      {
        sectionTitle: initText('webUi.downloadAppFiles.title'),
        sectionDescription: initText('webUi.downloadAppFiles.description'),
        catalog: {
          source: c.source,
          version: c.version,
          otherVersion: c.otherVersion,
          dockerRegistry: c.dockerRegistry,
          dockerPlatform: c.dockerPlatform,
          dockerSave: c.dockerSave,
          gitUrl: c.gitUrl,
          outputDir: c.outputDir,
          npmRegistry: c.npmRegistry,
          replace: c.replace,
          devDependencies: c.devDependencies,
          build: c.build,
          buildDts: c.buildDts,
        } satisfies PromptsCatalog,
      },
      {
        sectionTitle: initText('webUi.configureDatabase.title'),
        sectionDescription: initText('webUi.configureDatabase.description'),
        catalog: {
          dbDialect: c.dbDialect,
          builtinDb: c.builtinDb,
          builtinDbImage: c.builtinDbImage,
          dbHost: c.dbHost,
          dbPort: c.dbPort,
          dbDatabase: c.dbDatabase,
          dbUser: c.dbUser,
          dbPassword: c.dbPassword,
        } satisfies PromptsCatalog,
      },
      {
        sectionTitle: initText('webUi.createAdminAccount.title'),
        sectionDescription: initText('webUi.createAdminAccount.description'),
        catalog: {
          rootUsername: c.rootUsername,
          rootEmail: c.rootEmail,
          rootPassword: c.rootPassword,
          rootNickname: c.rootNickname,
        } satisfies PromptsCatalog,
      },
    ];
  }

  private buildPresetValuesFromFlags(flags: {
    env?: string;
    locale?: string;
    'default-api-base-url'?: string;
    'api-base-url'?: string;
    'auth-type'?: string;
    'access-token'?: string;
    token?: string;
    lang?: string;
    'app-root-path'?: string;
    'app-port'?: string;
    'storage-path'?: string;
    'root-username'?: string;
    'root-email'?: string;
    'root-password'?: string;
    'root-nickname'?: string;
    'builtin-db'?: boolean;
    'db-dialect'?: string;
    'builtin-db-image'?: string;
    'db-host'?: string;
    'db-port'?: string;
    'db-database'?: string;
    'db-user'?: string;
    'db-password'?: string;
    'fetch-source'?: boolean;
    source?: string;
    version?: string;
    replace?: boolean;
    'dev-dependencies'?: boolean;
    build?: boolean;
    'build-dts'?: boolean;
    'output-dir'?: string;
    'git-url'?: string;
    'docker-registry'?: string;
    'docker-platform'?: string;
    'docker-save'?: boolean;
    'npm-registry'?: string;
  }): PromptInitialValues {
    const preset: PromptInitialValues = {};
    const argv = process.argv.slice(2);

    if (flags.env !== undefined && String(flags.env).trim() !== '') {
      preset.appName = String(flags.env).trim();
    }
    const apiBaseUrl = explicitApiBaseUrlFlag(flags);
    if (apiBaseUrl) {
      preset.hasNocobase = 'yes';
      preset.apiBaseUrl = apiBaseUrl;
    } else if (
      flags['default-api-base-url'] !== undefined
      && String(flags['default-api-base-url']).trim() !== ''
    ) {
      preset.apiBaseUrl = String(flags['default-api-base-url']).trim();
    }
    if (flags['auth-type'] !== undefined && String(flags['auth-type']).trim() !== '') {
      preset.authType = String(flags['auth-type']).trim();
    }
    const accessToken = String(flags['access-token'] ?? flags.token ?? '');
    if (flags['access-token'] !== undefined || flags.token !== undefined) {
      preset.accessToken = accessToken;
    }
    if (flags.lang !== undefined && String(flags.lang).trim() !== '') {
      preset.lang = String(flags.lang).trim();
    }
    if (flags['app-root-path'] !== undefined && String(flags['app-root-path']).trim() !== '') {
      preset.appRootPath = String(flags['app-root-path']).trim();
    }
    if (flags['app-port'] !== undefined && String(flags['app-port']).trim() !== '') {
      preset.appPort = String(flags['app-port']).trim();
    }
    if (flags['storage-path'] !== undefined && String(flags['storage-path']).trim() !== '') {
      preset.storagePath = String(flags['storage-path']).trim();
    }
    if (flags['root-username'] !== undefined) {
      preset.rootUsername = String(flags['root-username'] ?? '').trim();
    }
    if (flags['root-email'] !== undefined) {
      preset.rootEmail = String(flags['root-email'] ?? '').trim();
    }
    if (flags['root-password'] !== undefined) {
      preset.rootPassword = String(flags['root-password'] ?? '');
    }
    if (flags['root-nickname'] !== undefined) {
      preset.rootNickname = String(flags['root-nickname'] ?? '').trim();
    }
    if (flags['db-dialect'] !== undefined && String(flags['db-dialect']).trim() !== '') {
      preset.dbDialect = String(flags['db-dialect']).trim();
    }
    if (flags['builtin-db-image'] !== undefined && String(flags['builtin-db-image']).trim() !== '') {
      preset.builtinDbImage = String(flags['builtin-db-image']).trim();
    }
    if (flags['db-host'] !== undefined && String(flags['db-host']).trim() !== '') {
      preset.dbHost = String(flags['db-host']).trim();
      preset.builtinDb = false;
    }
    if (flags['db-port'] !== undefined && String(flags['db-port']).trim() !== '') {
      preset.dbPort = String(flags['db-port']).trim();
    }
    if (flags['db-database'] !== undefined && String(flags['db-database']).trim() !== '') {
      preset.dbDatabase = String(flags['db-database']).trim();
    }
    if (flags['db-user'] !== undefined && String(flags['db-user']).trim() !== '') {
      preset.dbUser = String(flags['db-user']).trim();
    }
    if (flags['db-password'] !== undefined) {
      preset.dbPassword = String(flags['db-password'] ?? '');
    }
    if (argvHasToken(argv, ['--fetch-source'])) {
      preset.fetchSource = Boolean(flags['fetch-source']);
    }
    if (flags.source !== undefined && String(flags.source).trim() !== '') {
      preset.source = String(flags.source).trim();
    }
    if (flags.version !== undefined) {
      const version = String(flags.version).trim() || 'latest';
      preset.version = initVersionPromptValue(version);
      if (preset.version === 'other') {
        preset.otherVersion = version;
      }
    }
    if (flags['docker-registry'] !== undefined && String(flags['docker-registry']).trim() !== '') {
      preset.dockerRegistry = String(flags['docker-registry']).trim();
    }
    if (flags['docker-platform'] !== undefined && String(flags['docker-platform']).trim() !== '') {
      preset.dockerPlatform = String(flags['docker-platform']).trim();
    }
    if (flags['output-dir'] !== undefined && String(flags['output-dir']).trim() !== '') {
      preset.outputDir = String(flags['output-dir']).trim();
    }
    if (flags['git-url'] !== undefined && String(flags['git-url']).trim() !== '') {
      preset.gitUrl = String(flags['git-url']).trim();
    }
    if (flags['npm-registry'] !== undefined) {
      preset.npmRegistry = String(flags['npm-registry'] ?? '');
    }
    if (argvHasToken(argv, ['--replace', '-r'])) {
      preset.replace = Boolean(flags.replace);
    }
    if (argvHasToken(argv, ['--dev-dependencies', '--no-dev-dependencies', '-D'])) {
      preset.devDependencies = Boolean(flags['dev-dependencies']);
    }
    if (argvHasToken(argv, ['--docker-save', '--no-docker-save'])) {
      preset.dockerSave = Boolean(flags['docker-save']);
    }
    if (argvHasToken(argv, ['--build', '--no-build'])) {
      preset.build = Boolean(flags.build);
    }
    if (argvHasToken(argv, ['--build-dts', '--no-build-dts'])) {
      preset.buildDts = Boolean(flags['build-dts']);
    }
    if (argvHasToken(argv, ['--builtin-db', '--no-builtin-db'])) {
      preset.builtinDb = Boolean(flags['builtin-db']);
    }
    if (explicitDbHostFlag(flags)) {
      preset.builtinDb = false;
    }
    if (!preset.hasNocobase && hasDownloadOverride(flags)) {
      preset.hasNocobase = 'no';
    }

    return preset;
  }

  protected hasAgentsDirInCwd(): boolean {
    return existsSync(path.resolve(process.cwd(), '.agents'));
  }

  private async syncNocoBaseSkills(): Promise<void> {
    try {
      const status = await inspectSkillsStatus();
      if (!status.installed) {
        p.log.step('Installing NocoBase agent skills (nb skills install)');
        await installNocoBaseSkills();
        return;
      }

      p.log.step('Updating NocoBase agent skills (nb skills update)');
      await updateNocoBaseSkills();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      p.outro(pc.red(`Skills sync failed: ${message}`));
      this.exit(1);
    }
  }

  private async persistManagedEnvConfig(
    results: Record<string, string | number | boolean>,
    flags: { 'db-host'?: string } = {},
  ): Promise<void> {
    const envName = String(results.appName ?? DEFAULT_INIT_APP_NAME).trim() || DEFAULT_INIT_APP_NAME;
    const appPort = String(results.appPort ?? '').trim();
    const source = String(results.source ?? '').trim();
    const version = resolveInitDownloadVersion(results);
    const dockerRegistry = String(results.dockerRegistry ?? '').trim();
    const dockerPlatform = String(results.dockerPlatform ?? '').trim();
    const gitUrl = String(results.gitUrl ?? '').trim();
    const npmRegistry = String(results.npmRegistry ?? '').trim();
    const appRootPath = String(results.appRootPath ?? '').trim();
    const storagePath = String(results.storagePath ?? '').trim();
    const dbDialect = String(results.dbDialect ?? '').trim();
    const builtinDbImage = String(results.builtinDbImage ?? '').trim();
    const dbHost = String(results.dbHost ?? '').trim();
    const dbPort = String(results.dbPort ?? '').trim();
    const dbDatabase = String(results.dbDatabase ?? '').trim();
    const dbUser = String(results.dbUser ?? '').trim();
    const dbPassword = String(results.dbPassword ?? '');
    const builtinDb =
      explicitDbHostFlag(flags)
        ? false
        : results.builtinDb === undefined
          ? undefined
          : Boolean(results.builtinDb);

    await upsertEnv(
      envName,
      {
        ...(source === 'docker'
          ? { kind: 'docker' }
          : source || appRootPath
            ? { kind: 'local' }
            : appPort
              ? { kind: 'http' }
              : {}),
        ...(appPort ? { apiBaseUrl: `http://127.0.0.1:${appPort}/api` } : {}),
        ...(source ? { source } : {}),
        ...(version ? { downloadVersion: version } : {}),
        ...(dockerRegistry ? { dockerRegistry } : {}),
        ...(dockerPlatform ? { dockerPlatform } : {}),
        ...(gitUrl ? { gitUrl } : {}),
        ...(npmRegistry ? { npmRegistry } : {}),
        ...(appRootPath ? { appRootPath } : {}),
        ...(storagePath ? { storagePath } : {}),
        ...(appPort ? { appPort } : {}),
        ...(results.devDependencies !== undefined ? { devDependencies: Boolean(results.devDependencies) } : {}),
        ...(results.build !== undefined ? { build: Boolean(results.build) } : {}),
        ...(results.buildDts !== undefined ? { buildDts: Boolean(results.buildDts) } : {}),
        ...(builtinDb !== undefined ? { builtinDb } : {}),
        ...(dbDialect ? { dbDialect } : {}),
        ...(builtinDbImage || builtinDb === false ? { builtinDbImage: builtinDbImage || undefined } : {}),
        ...(dbHost ? { dbHost } : {}),
        ...(dbPort ? { dbPort } : {}),
        ...(dbDatabase ? { dbDatabase } : {}),
        ...(dbUser ? { dbUser } : {}),
        ...(dbPassword ? { dbPassword } : {}),
      },
      { scope: resolveDefaultConfigScope() },
    );
  }

  private buildEnvAddArgv(results: Record<string, string | number | boolean>): string[] {
    const argv = [String(results.appName ?? DEFAULT_INIT_APP_NAME)];
    argv.push('--no-intro');
    argv.push('--api-base-url', String(results.apiBaseUrl ?? DEFAULT_INIT_API_BASE_URL));
    argv.push('--auth-type', String(results.authType ?? 'oauth'));

    if (results.authType === 'token') {
      argv.push('--access-token', String(results.accessToken ?? ''));
    }

    return argv;
  }

  private buildInstallArgv(
    results: Record<string, string | number | boolean>,
    flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean; 'db-host'?: string },
    options?: {
      nonInteractive?: boolean;
      resume?: boolean;
    },
  ): string[] {
    const argv = ['--no-intro'];
    if (options?.nonInteractive ?? true) {
      argv.unshift('-y');
    }
    const processArgv = process.argv.slice(2);
    const envName = String(results.appName ?? DEFAULT_INIT_APP_NAME).trim() || DEFAULT_INIT_APP_NAME;
    const source = String(results.source ?? '').trim();

    argv.push('--env', envName);
    if (options?.resume) {
      argv.push('--resume');
    }

    if (Boolean(flags.verbose)) {
      argv.push('--verbose');
    }

    const lang = String(results.lang ?? '').trim();
    if (lang) {
      argv.push('--lang', lang);
    }

    const appRootPath = String(results.appRootPath ?? '').trim();
    if (appRootPath) {
      argv.push('--app-root-path', appRootPath);
    }

    const appPort = String(results.appPort ?? '').trim();
    if (appPort && (!flags.yes || argvHasToken(processArgv, ['--app-port']) || appPort !== '13000')) {
      argv.push('--app-port', appPort);
    }

    const storagePath = String(results.storagePath ?? '').trim();
    if (storagePath) {
      argv.push('--storage-path', storagePath);
    }

    if (Boolean(flags.force)) {
      argv.push('--force');
    }

    if (Boolean(results.fetchSource)) {
      argv.push('--fetch-source');

      if (source) {
        argv.push('--source', source);
      }

      const version = resolveInitDownloadVersion(results);
      if (version) {
        argv.push('--version', version);
      }

      const outputDir = String(results.outputDir ?? '').trim();
      if (outputDir) {
        argv.push('--output-dir', outputDir);
      }

      const gitUrl = String(results.gitUrl ?? '').trim();
      if (gitUrl) {
        argv.push('--git-url', gitUrl);
      }

      const dockerRegistry = String(results.dockerRegistry ?? '').trim();
      if (dockerRegistry) {
        argv.push('--docker-registry', dockerRegistry);
      }

      const dockerPlatform = String(results.dockerPlatform ?? '').trim();
      if (dockerPlatform) {
        argv.push('--docker-platform', dockerPlatform);
      }

      const npmRegistry = String(results.npmRegistry ?? '').trim();
      if (npmRegistry) {
        argv.push('--npm-registry', npmRegistry);
      }

      if (Boolean(results.replace)) {
        argv.push('--replace');
      }
      if (Boolean(results.devDependencies)) {
        argv.push('--dev-dependencies');
      }
      if (Boolean(results.dockerSave)) {
        argv.push('--docker-save');
      }
      if (results.build !== undefined && !Boolean(results.build)) {
        argv.push('--no-build');
      } else if (argvHasToken(processArgv, ['--build', '--no-build']) && flags.build === false) {
        argv.push('--no-build');
      }
      if (Boolean(results.buildDts)) {
        argv.push('--build-dts');
      }
    }

    const explicitDbHost = explicitDbHostFlag(flags);
    const dbHost = explicitDbHost || String(results.dbHost ?? '').trim();
    const builtinDb = explicitDbHost ? false : Boolean(results.builtinDb);
    if (builtinDb) {
      argv.push('--builtin-db');
    } else if (explicitDbHost || results.builtinDb !== undefined) {
      argv.push('--no-builtin-db');
    }

    const dbDialect = String(results.dbDialect ?? '').trim();
    if (dbDialect) {
      argv.push('--db-dialect', dbDialect);
    }

    const builtinDbImage = String(results.builtinDbImage ?? '').trim();
    if (builtinDb && builtinDbImage) {
      argv.push('--builtin-db-image', builtinDbImage);
    }

    if (dbHost) {
      argv.push('--db-host', dbHost);
    }

    const dbPort = String(results.dbPort ?? '').trim();
    const dbPortWasProvided = argvHasToken(processArgv, ['--db-port']);
    const dockerBuiltinDbPortIsHidden = builtinDb && source === 'docker';
    const dbDefaultPort = defaultDbPortForDialect(dbDialect);
    if (
      dbPort
      && (!dockerBuiltinDbPortIsHidden || dbPortWasProvided)
      && (!flags.yes || dbPortWasProvided || dbPort !== dbDefaultPort)
    ) {
      argv.push('--db-port', dbPort);
    }

    const dbDatabase = String(results.dbDatabase ?? '').trim();
    if (dbDatabase) {
      argv.push('--db-database', dbDatabase);
    }

    const dbUser = String(results.dbUser ?? '').trim();
    if (dbUser) {
      argv.push('--db-user', dbUser);
    }

    const dbPassword = String(results.dbPassword ?? '');
    if (dbPassword) {
      argv.push('--db-password', dbPassword);
    }

    const rootUsername = String(results.rootUsername ?? '').trim();
    if (rootUsername) {
      argv.push('--root-username', rootUsername);
    }

    const rootEmail = String(results.rootEmail ?? '').trim();
    if (rootEmail) {
      argv.push('--root-email', rootEmail);
    }

    const rootPassword = String(results.rootPassword ?? '');
    if (rootPassword) {
      argv.push('--root-password', rootPassword);
    }

    const rootNickname = String(results.rootNickname ?? '').trim();
    if (rootNickname) {
      argv.push('--root-nickname', rootNickname);
    }

    return argv;
  }

  private buildManagedInstallResumeCommand(
    results: Record<string, string | number | boolean>,
    flags: { yes?: boolean },
  ): string {
    const argv = ['nb', 'init'];
    if (Boolean(flags.yes)) {
      argv.push('--yes');
    }

    const envName = String(results.appName ?? DEFAULT_INIT_APP_NAME).trim() || DEFAULT_INIT_APP_NAME;
    argv.push('--env', envName);

    if (Boolean(results.fetchSource)) {
      const source = String(results.source ?? '').trim();
      if (source) {
        argv.push('--source', source);
      }

      const version = resolveInitDownloadVersion(results);
      if (version) {
        argv.push('--version', version);
      }

      const outputDir = String(results.outputDir ?? '').trim();
      if (outputDir && outputDir !== String(results.appRootPath ?? '').trim()) {
        argv.push('--output-dir', outputDir);
      }

      const gitUrl = String(results.gitUrl ?? '').trim();
      if (gitUrl) {
        argv.push('--git-url', gitUrl);
      }

      const dockerRegistry = String(results.dockerRegistry ?? '').trim();
      if (dockerRegistry) {
        argv.push('--docker-registry', dockerRegistry);
      }

      const dockerPlatform = String(results.dockerPlatform ?? '').trim();
      if (dockerPlatform) {
        argv.push('--docker-platform', dockerPlatform);
      }

      const npmRegistry = String(results.npmRegistry ?? '').trim();
      if (npmRegistry) {
        argv.push('--npm-registry', npmRegistry);
      }

      if (Boolean(results.devDependencies)) {
        argv.push('--dev-dependencies');
      }
      if (Boolean(results.dockerSave)) {
        argv.push('--docker-save');
      }
      if (results.build !== undefined && !Boolean(results.build)) {
        argv.push('--no-build');
      }
      if (Boolean(results.buildDts)) {
        argv.push('--build-dts');
      }
    }

    argv.push('--resume', '--verbose');
    return argv.map(shellQuoteArg).join(' ');
  }

  private formatManagedInstallFailureMessage(
    message: string,
    results: Record<string, string | number | boolean>,
    flags: { yes?: boolean },
  ): string {
    const command = this.buildManagedInstallResumeCommand(results, flags);
    return [
      message,
      '',
      translateCli('commands.init.messages.resumeAfterInstallFailure', { command }),
    ].join('\n');
  }

  private buildResumeInstallArgv(flags: {
    yes?: boolean;
    env?: string;
    lang?: string;
    force?: boolean;
    replace?: boolean;
    'app-root-path'?: string;
    'app-port'?: string;
    'storage-path'?: string;
    'root-username'?: string;
    'root-email'?: string;
    'root-password'?: string;
    'root-nickname'?: string;
    'builtin-db'?: boolean;
    'db-dialect'?: string;
    'builtin-db-image'?: string;
    'db-host'?: string;
    'db-port'?: string;
    'db-database'?: string;
    'db-user'?: string;
    'db-password'?: string;
    'fetch-source'?: boolean;
    source?: string;
    version?: string;
    'dev-dependencies'?: boolean;
    build?: boolean;
    'build-dts'?: boolean;
    'output-dir'?: string;
    'git-url'?: string;
    'docker-registry'?: string;
    'docker-platform'?: string;
    'docker-save'?: boolean;
    'npm-registry'?: string;
  }): string[] {
    const preset = this.buildPresetValuesFromFlags(flags) as Record<string, string | number | boolean>;
    if (flags.yes) {
      preset.lang ??= yesInitialValue(Install.appPrompts.lang, 'en-US');
      preset.rootUsername ??= yesInitialValue(Install.rootUserPrompts.rootUsername, 'nocobase');
      preset.rootEmail ??= yesInitialValue(Install.rootUserPrompts.rootEmail, 'admin@nocobase.com');
      preset.rootPassword ??= yesInitialValue(Install.rootUserPrompts.rootPassword, 'admin123');
      preset.rootNickname ??= yesInitialValue(Install.rootUserPrompts.rootNickname, 'Super Admin');
    }
    if (hasDownloadOverride(flags)) {
      preset.fetchSource ??= true;
    }
    preset.replace ??= true;

    return this.buildInstallArgv(
      preset,
      flags,
      {
        nonInteractive: Boolean(flags.yes),
        resume: true,
      },
    );
  }
}
