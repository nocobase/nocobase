/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import pc from 'picocolors';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { stdin as stdinStream, stdout as stdoutStream } from 'node:process';
import { getEnv, upsertEnv } from '../lib/auth-store.ts';
import {
  type PromptBlock,
  type PromptCatalogValues,
  type PromptInitialValues,
  type PasswordPromptBlock,
  type PromptValue,
  type PromptsCatalog,
  type SelectPromptBlock,
  type TextPromptBlock,
  runPromptCatalog,
} from '../lib/prompt-catalog.ts';
import { applyCliLocale, localeText, translateCli } from '../lib/cli-locale.ts';
import { resolveConfiguredEnvPath, resolveDefaultConfigScope, resolveEnvRelativePath } from '../lib/cli-home.js';
import { getCliConfigValue, resolveDefaultApiHost, resolveDefaultUiHost } from '../lib/cli-config.js';
import { resolveOfficialDockerRegistry } from '../lib/docker-image.js';
import {
  areConfiguredPathsEquivalent,
  deriveConfiguredSourcePath,
  deriveConfiguredStoragePath,
  inferConfiguredAppPathFromLegacyConfig,
} from '../lib/env-paths.js';
import { formatMissingManagedAppEnvMessage } from '../lib/app-runtime.js';
import { type RunPromptCatalogWebUIStage, runPromptCatalogWebUI } from '../lib/prompt-web-ui.ts';
import { validateApiBaseUrl, validateEnvKey } from '../lib/prompt-validators.ts';
import { installNocoBaseSkills, isNpmRegistryUnavailable } from '../lib/skills-manager.js';
import { omitKeys, pickKeys } from '../lib/object-utils.ts';
import { ENV_CONFIG_SCHEMA_VERSION } from '../lib/env-config.js';
import { printInfo, printStage, printVerbose, printWarning } from '../lib/ui.js';
import { persistHookScript } from '../lib/hook-script.js';
import Download from './download.ts';
import EnvAdd from './env/add.ts';
import Install, { defaultDbPortForDialect } from './install.ts';

const DEFAULT_INIT_API_BASE_URL = 'http://localhost:13000/api';
const DEFAULT_INIT_APP_NAME = 'local';
const DOWNLOAD_OUTPUT_DIR_PROMPT = Download.prompts.outputDir as TextPromptBlock;
const INIT_SETUP_MODES = ['install-new', 'manage-local', 'connect-remote'] as const;
type InitSetupMode = (typeof INIT_SETUP_MODES)[number];
const INIT_ENV_ADD_FLAG_NAMES = [
  'locale',
  'default-api-base-url',
  'api-base-url',
  'auth-type',
  'access-token',
  'token',
  'username',
  'password',
  'skip-auth',
] as const;

const initText = (key: string, values?: Record<string, unknown>) => localeText(`commands.init.${key}`, values);

function withExtraHidden<T extends PromptBlock>(def: T, extraHidden: (values: PromptCatalogValues) => boolean): T {
  if (def.type === 'run') {
    return def;
  }

  return {
    ...def,
    hidden: (values) => extraHidden(values) || (def.hidden?.(values) ?? false),
  } as T;
}

function normalizeInitSetupMode(value: unknown): InitSetupMode {
  const mode = String(value ?? '').trim();
  if (mode === 'manage-local' || mode === 'connect-remote' || mode === 'install-new') {
    return mode;
  }
  if (mode === 'yes') {
    return 'connect-remote';
  }
  if (mode === 'no') {
    return 'install-new';
  }
  return 'install-new';
}

function resolveInitSetupMode(values: PromptCatalogValues | Record<string, unknown>): InitSetupMode {
  return normalizeInitSetupMode(values.setupMode ?? values.hasNocobase);
}

function isRemoteSetupMode(values: PromptCatalogValues | Record<string, unknown>): boolean {
  return resolveInitSetupMode(values) === 'connect-remote';
}

function isInstallNewSetupMode(values: PromptCatalogValues | Record<string, unknown>): boolean {
  return resolveInitSetupMode(values) === 'install-new';
}

function isInstallLikeSetupMode(values: PromptCatalogValues | Record<string, unknown>): boolean {
  return !isRemoteSetupMode(values);
}

function remoteConnectionOnly<T extends PromptBlock>(def: T): T {
  return withExtraHidden(def, (values) => !isRemoteSetupMode(values));
}

function installLikeOnly<T extends PromptBlock>(def: T): T {
  return withExtraHidden(def, (values) => !isInstallLikeSetupMode(values));
}

function installNewOnly<T extends PromptBlock>(def: T): T {
  return withExtraHidden(def, (values) => !isInstallNewSetupMode(values));
}

function installConnectionOnly<T extends PromptBlock>(def: T): T {
  return withExtraHidden(def, (values) => !isInstallNewSetupMode(values));
}

function installLikeDownloadExecutionOnly<T extends PromptBlock>(def: T): T {
  return withExtraHidden(def, (values) => !isInstallLikeSetupMode(values) || values.skipDownload === true);
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
  return version === 'latest' || version === 'beta' || version === 'alpha' ? version : 'other';
}

function yesInitialValue(def: PromptBlock, fallback: string): string {
  if ('yesInitialValue' in def && def.yesInitialValue !== undefined) {
    return String(def.yesInitialValue);
  }
  return fallback;
}

function hasDownloadOverride(flags: { source?: string; version?: string }): boolean {
  return Boolean(String(flags.source ?? '').trim() || String(flags.version ?? '').trim());
}

function explicitApiBaseUrlFlag(flags: { 'api-base-url'?: string }): string {
  return String(flags['api-base-url'] ?? '').trim();
}

function explicitDbHostFlag(flags: { 'db-host'?: string }): string {
  return String(flags['db-host'] ?? '').trim();
}

function explicitSetupModeFlag(flags: { 'setup-mode'?: string }): InitSetupMode | undefined {
  const mode = String(flags['setup-mode'] ?? '').trim();
  return mode ? normalizeInitSetupMode(mode) : undefined;
}

function applyLegacyHasNocobaseAlias(values: Record<string, unknown>): void {
  if (
    !Object.prototype.hasOwnProperty.call(values, 'setupMode') &&
    !Object.prototype.hasOwnProperty.call(values, 'hasNocobase')
  ) {
    return;
  }
  const setupMode = resolveInitSetupMode(values);
  if (setupMode === 'connect-remote') {
    values.hasNocobase = 'yes';
    return;
  }
  if (setupMode === 'install-new') {
    values.hasNocobase = 'no';
    return;
  }
  delete values.hasNocobase;
}

function optionalInitString(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function resolveManagedAppKey(value: unknown): string {
  return optionalInitString(value) ?? crypto.randomBytes(32).toString('hex');
}

function resolveManagedTimeZone(value: unknown): string {
  return optionalInitString(value) ?? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
}

function normalizeConnectionString(value: unknown): string {
  return String(value ?? '').trim();
}

function deriveInstallConnectionApiBaseUrl(
  values: PromptCatalogValues | Record<string, unknown>,
  defaultApiHost = '127.0.0.1',
): string {
  const appPort = normalizeConnectionString(values.appPort);
  return appPort ? `http://${defaultApiHost}:${appPort}/api` : DEFAULT_INIT_API_BASE_URL;
}

function createInstallConnectionApiBaseUrlPrompt(defaultApiHost: string): TextPromptBlock {
  return installConnectionOnly({
    type: 'text',
    message: initText('prompts.apiBaseUrl.message'),
    placeholder: initText('prompts.apiBaseUrl.placeholder'),
    required: true,
    initialValue: (values) => deriveInstallConnectionApiBaseUrl(values, defaultApiHost),
  }) as TextPromptBlock;
}

const installConnectionAuthTypePrompt: SelectPromptBlock = installConnectionOnly({
  ...(EnvAdd.prompts.authType as SelectPromptBlock),
}) as SelectPromptBlock;

const installConnectionUsernamePrompt: TextPromptBlock = installConnectionOnly({
  ...(Install.rootUserPrompts.rootUsername as TextPromptBlock),
  hidden: () => true,
  initialValue: (values) => normalizeConnectionString(values.rootUsername),
}) as TextPromptBlock;

const installConnectionPasswordPrompt: PasswordPromptBlock = installConnectionOnly({
  ...(Install.rootUserPrompts.rootPassword as PasswordPromptBlock),
  hidden: () => true,
  initialValue: (values) => String(values.rootPassword ?? ''),
}) as PasswordPromptBlock;

const installConnectionAccessTokenPrompt: TextPromptBlock = installConnectionOnly({
  ...(EnvAdd.prompts.accessToken as TextPromptBlock),
  hidden: (values) => values.installAuthType !== 'token' || values.skipAuth === true,
}) as TextPromptBlock;

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
  return message.replace(/Env "([^"]+)"/, (_match, envName: string) => `Env ${pc.cyan(pc.bold(`"${envName}"`))}`);
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
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`;
}

function initTitle(): string {
  return 'Set up NocoBase';
}

function logInitStage(title: string) {
  printStage(title);
}

function logInitUiReady(command: { log: (message: string) => void }, url: string) {
  command.log(translateCli('commands.init.messages.uiReady'));
  command.log(translateCli('commands.init.messages.uiReadyHelp'));
  command.log(`URL: ${url}`);
}

function logInitUiBrowserOpenFallback() {
  printWarning(translateCli('commands.init.messages.uiOpenBrowserFallback'));
}

function formatBrowserOpenError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export default class Init extends Command {
  static override summary = 'Set up or connect a NocoBase environment in the current workspace';
  static override description = `Set up NocoBase in the current workspace.

\`nb init\` helps you install a new NocoBase app, take over managing one that already exists on this machine, or connect a remote NocoBase app and save it as a CLI env.

You can use the saved environment directly, or let a coding agent access it later. It can also install NocoBase AI coding skills (\`nocobase/skills\`) when you want agent-specific workflow guidance.

If setup was interrupted earlier, use \`--resume\` with an existing env name to continue from the saved workspace config.

Prompt modes:
- Default: guided prompts in the terminal.
- \`--ui\`: open the same setup flow in a local browser form.
- \`-y\`, \`--yes\`: skip prompts. In this mode \`--env <envName>\` is required, and init uses flags plus safe defaults for the selected setup mode.

\`--ui\` cannot be combined with \`--yes\`.`;

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --ui',
    '<%= config.bin %> <%= command.id %> --ui',
    '<%= config.bin %> <%= command.id %> --env app1 --yes',
    '<%= config.bin %> <%= command.id %> --env app1 --resume',
    '<%= config.bin %> <%= command.id %> --env app1 --yes --source docker --version alpha',
    '<%= config.bin %> <%= command.id %> --env app1 --yes --setup-mode manage-local --source npm --version beta',
    '<%= config.bin %> <%= command.id %> --env app1 --yes --source npm --version alpha --app-port 13080',
    '<%= config.bin %> <%= command.id %> --env app1 --yes --source git --version fix/cli-v2',
    '<%= config.bin %> <%= command.id %> --env staging --yes --setup-mode connect-remote --api-base-url https://demo.example.com/api',
    '<%= config.bin %> <%= command.id %> --ui --ui-port 3000',
  ];

  static prompts: PromptsCatalog = {
    seedResume: {
      type: 'run',
      run: (values, command) => {
        const record = values as Record<string, PromptValue>;
        if (record.resume === undefined) {
          const flags = (command as Init | undefined)?.parsedFlagsForPromptSeeds;
          record.resume = Boolean(flags?.resume);
        }
      },
    },
    seedEnvName: {
      type: 'run',
      run: (values) => {
        const record = values as Record<string, PromptValue>;
        const appName = String(record.appName ?? '').trim();
        if (appName && record.env === undefined) {
          record.env = appName;
        }
      },
    },
    appName: {
      type: 'text',
      message: initText('prompts.appName.message'),
      placeholder: initText('prompts.appName.placeholder'),
      required: true,
      validate: validateInitAppName,
    },
    setupMode: {
      type: 'select',
      variant: 'radio',
      message: initText('prompts.setupMode.message'),
      options: [
        {
          value: 'install-new',
          label: initText('prompts.setupMode.installNewLabel'),
          hint: initText('prompts.setupMode.installNewHint'),
        },
        {
          value: 'connect-remote',
          label: initText('prompts.setupMode.connectRemoteLabel'),
          hint: initText('prompts.setupMode.connectRemoteHint'),
        },
        {
          value: 'manage-local',
          label: initText('prompts.setupMode.manageLocalLabel'),
          hint: initText('prompts.setupMode.manageLocalHint'),
          disabled: true,
        },
      ],
      initialValue: 'install-new',
      yesInitialValue: 'install-new',
      required: true,
    },
    apiBaseUrl: remoteConnectionOnly({
      type: 'text',
      message: initText('prompts.apiBaseUrl.message'),
      placeholder: initText('prompts.apiBaseUrl.placeholder'),
      required: true,
      validate: validateApiBaseUrl,
    }),
    authType: remoteConnectionOnly(EnvAdd.prompts.authType),
    username: remoteConnectionOnly(EnvAdd.prompts.username),
    password: remoteConnectionOnly(EnvAdd.prompts.password),
    accessToken: remoteConnectionOnly(EnvAdd.prompts.accessToken),
    lang: installLikeOnly(Install.appPrompts.lang),
    appPath: installLikeOnly(Install.appPrompts.appPath),
    appPort: installLikeOnly(Install.appPrompts.appPort),
    appPublicPath: installLikeOnly(Install.appPrompts.appPublicPath),
    skipDownload: installNewOnly({
      type: 'boolean',
      message: initText('prompts.skipDownload.message'),
      initialValue: false,
      yesInitialValue: false,
    }),
    source: installLikeOnly(Download.prompts.source),
    version: installLikeOnly(Download.prompts.version),
    otherVersion: installLikeOnly(Download.prompts.otherVersion),
    dockerRegistry: installLikeOnly(Download.prompts.dockerRegistry),
    dockerPlatform: installLikeOnly(Download.prompts.dockerPlatform),
    dockerSave: installLikeDownloadExecutionOnly(Download.prompts.dockerSave),
    gitUrl: installLikeOnly(Download.prompts.gitUrl),
    outputDir: installLikeDownloadExecutionOnly({
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
          const appPath = String(
            values.appPath ?? inferConfiguredAppPathFromLegacyConfig(values as Record<string, unknown>) ?? '',
          ).trim();
          const appRootPath =
            String(values.appRootPath ?? '').trim() || (appPath ? deriveConfiguredSourcePath(appPath) : '');
          if (appRootPath) {
            return appRootPath;
          }
        }
        const initialValue = DOWNLOAD_OUTPUT_DIR_PROMPT.initialValue;
        return typeof initialValue === 'function' ? initialValue(values) : String(initialValue ?? '');
      },
    }),
    npmRegistry: installLikeOnly(Download.prompts.npmRegistry),
    replace: installLikeDownloadExecutionOnly(Download.prompts.replace),
    devDependencies: installLikeDownloadExecutionOnly(Download.prompts.devDependencies),
    build: installLikeDownloadExecutionOnly(Download.prompts.build),
    buildDts: installLikeDownloadExecutionOnly(Download.prompts.buildDts),
    dbDialect: installLikeOnly(Install.dbPrompts.dbDialect),
    builtinDb: installLikeOnly(Install.dbPrompts.builtinDb),
    builtinDbImage: installLikeOnly(Install.dbPrompts.builtinDbImage),
    dbHost: installLikeOnly(Install.dbPrompts.dbHost),
    dbPort: installLikeOnly(Install.dbPrompts.dbPort),
    dbDatabase: installLikeOnly(Install.dbPrompts.dbDatabase),
    dbUser: installLikeOnly(Install.dbPrompts.dbUser),
    dbPassword: installLikeOnly(Install.dbPrompts.dbPassword),
    dbSchema: installLikeOnly(Install.dbPrompts.dbSchema),
    dbTablePrefix: installLikeOnly(Install.dbPrompts.dbTablePrefix),
    dbUnderscored: installLikeOnly(Install.dbPrompts.dbUnderscored),
    rootUsername: installNewOnly(Install.rootUserPrompts.rootUsername),
    rootEmail: installNewOnly(Install.rootUserPrompts.rootEmail),
    rootPassword: installNewOnly(Install.rootUserPrompts.rootPassword),
    rootNickname: installNewOnly(Install.rootUserPrompts.rootNickname),
    installAuthType: installConnectionAuthTypePrompt,
    installUsername: installConnectionUsernamePrompt,
    installPassword: installConnectionPasswordPrompt,
    installAccessToken: installConnectionAccessTokenPrompt,
  };

  private buildPromptCatalog(flags: { 'skip-auth'?: boolean }, options: { defaultApiHost: string }): PromptsCatalog {
    const prompts: PromptsCatalog = {
      ...Init.prompts,
      installApiBaseUrl: createInstallConnectionApiBaseUrlPrompt(options.defaultApiHost),
    };

    if (flags['skip-auth']) {
      const accessTokenPrompt: TextPromptBlock = {
        ...(EnvAdd.prompts.accessToken as TextPromptBlock),
        hidden: () => true,
      };
      const usernamePrompt: TextPromptBlock = {
        ...(EnvAdd.prompts.username as TextPromptBlock),
        hidden: () => true,
      };
      const passwordPrompt = {
        ...EnvAdd.prompts.password,
        hidden: () => true,
      };
      const installAccessTokenPrompt: TextPromptBlock = {
        ...installConnectionAccessTokenPrompt,
        hidden: () => true,
      };
      const installUsernamePrompt: TextPromptBlock = {
        ...installConnectionUsernamePrompt,
        hidden: () => true,
      };
      const installPasswordPrompt: PasswordPromptBlock = {
        ...installConnectionPasswordPrompt,
        hidden: () => true,
      };

      prompts.username = remoteConnectionOnly(usernamePrompt);
      prompts.password = remoteConnectionOnly(passwordPrompt);
      prompts.accessToken = remoteConnectionOnly(accessTokenPrompt);
      prompts.installUsername = installUsernamePrompt;
      prompts.installPassword = installPasswordPrompt;
      prompts.installAccessToken = installAccessTokenPrompt;
    }

    return prompts;
  }

  private parsedFlagsForPromptSeeds?:
    | {
        resume?: boolean;
      }
    | undefined;

  static flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip prompts and use flags plus defaults for the selected setup mode. Requires an env name.',
      default: false,
    }),
    env: Flags.string({
      char: 'e',
      description: 'Env name for this setup. Required with --yes and --resume',
    }),
    'setup-mode': Flags.string({
      description: 'Setup mode: install a new app, manage a local app by reusing its database, or connect a remote app',
      options: [...INIT_SETUP_MODES],
    }),
    ui: Flags.boolean({
      description: 'Open the guided setup flow in a local browser form (not valid with --yes)',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed command output',
      default: true,
    }),
    'skip-skills': Flags.boolean({
      description: 'Skip installing NocoBase AI coding skills during init',
      default: false,
    }),
    'ui-host': Flags.string({
      description: 'Browser-accessible host for the --ui setup page URL (default: 127.0.0.1)',
    }),
    'ui-port': Flags.integer({
      description: 'Port for the local --ui setup server; 0 lets the OS choose an available port',
      min: 0,
      max: 65535,
    }),
    ...pickKeys(EnvAdd.flags, INIT_ENV_ADD_FLAG_NAMES),
    ...omitKeys(Install.flags, ['yes', 'env', 'verbose']),
  };

  public async run(): Promise<void> {
    const parsedResult = await this.parse(Init);
    applyCliLocale((parsedResult.flags as { locale?: string }).locale);
    const flags = parsedResult.flags;
    const normalizedFlags = { ...flags };
    this.parsedFlagsForPromptSeeds = {
      resume: Boolean(normalizedFlags.resume),
    };

    if (normalizedFlags.ui && normalizedFlags.yes) {
      this.error('--ui cannot be used with --yes.');
    }

    if (
      normalizedFlags['skip-auth'] &&
      (normalizedFlags['access-token'] !== undefined || normalizedFlags.token !== undefined)
    ) {
      this.error('--skip-auth cannot be used with --access-token or --token.');
    }

    if (normalizedFlags['prepare-only'] && explicitSetupModeFlag(normalizedFlags) === 'connect-remote') {
      this.error('--prepare-only is only available for local or install-new setup flows.');
    }

    if (!normalizedFlags.ui && (normalizedFlags['ui-host'] !== undefined || normalizedFlags['ui-port'] !== undefined)) {
      this.error('--ui-host and --ui-port require --ui.');
    }

    if (normalizedFlags.resume && !normalizedFlags.ui) {
      const envName = String(normalizedFlags.env ?? '').trim();
      if (!envName) {
        this.error(formatResumeEnvRequiredMessage());
        this.exit(1);
      }

      logInitStage(initTitle());

      await this.syncNocoBaseSkills({
        skip: Boolean(normalizedFlags['skip-skills']),
      });

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
              'app-path'?: string;
              'app-root-path'?: string;
              'app-port'?: string;
              'storage-path'?: string;
              'app-public-path'?: string;
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
              'db-schema'?: string;
              'db-table-prefix'?: string;
              'db-underscored'?: boolean;
              'skip-download'?: boolean;
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
              'setup-mode'?: string;
              'prepare-only'?: boolean;
              'hook-script'?: string;
            },
          ),
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      }

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
        'app-path'?: string;
        'app-root-path'?: string;
        'app-port'?: string;
        'storage-path'?: string;
        'app-public-path'?: string;
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
        'db-schema'?: string;
        'db-table-prefix'?: string;
        'db-underscored'?: boolean;
        'skip-download'?: boolean;
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
        'setup-mode'?: string;
        'hook-script'?: string;
      },
    );

    if (normalizedFlags.resume) {
      const resumeEnvName = String(normalizedFlags.env ?? '').trim();
      if (resumeEnvName) {
        const resumeEnv = await getEnv(resumeEnvName, {
          scope: resolveDefaultConfigScope(),
        });
        if (!resumeEnv) {
          this.error(formatMissingManagedAppEnvMessage(resumeEnvName));
        }
        const resumePresetValues = Install.buildResumePresetValues(resumeEnv);
        presetValues = {
          ...resumePresetValues.envPreset,
          ...resumePresetValues.appPreset,
          ...resumePresetValues.downloadPreset,
          ...resumePresetValues.dbPreset,
          ...resumePresetValues.rootPreset,
          ...resumePresetValues.envAddPreset,
          ...presetValues,
        };

        const savedAppPort = String(resumeEnv.config.appPort ?? '').trim();
        const savedDbPort = String(resumeEnv.config.dbPort ?? '').trim();
        if (savedAppPort) {
          presetValues.resumeSavedAppPort = savedAppPort;
        }
        if (savedDbPort) {
          presetValues.resumeSavedDbPort = savedDbPort;
        }
      }
    }

    if (normalizedFlags.yes && !String(presetValues.appName ?? '').trim()) {
      const formatted = formatSkippedAppNameRequiredMessage();
      this.error(highlightInitValidationMessage(formatted));
      this.exit(1);
    }

    const appName = String(presetValues.appName ?? '').trim();
    if (useBrowserUi) {
      logInitStage(initTitle());
      this.log(translateCli('commands.init.messages.uiOpening'));
    } else {
      logInitStage(initTitle());

      if (normalizedFlags.yes) {
        printInfo(`Non-interactive setup for env "${appName}" (--yes).`);
      } else if (!interactive) {
        printWarning(
          'No interactive terminal detected. NocoBase will be installed using the provided flags and safe defaults.',
        );
      }
    }

    const dynamicInitialValues = await Init.buildDynamicInitialValuesForInstall(
      normalizedFlags as {
        'app-port'?: string;
        'db-port'?: string;
        'app-public-path'?: string;
        yes?: boolean;
      },
      presetValues,
    );
    const defaultUiHost = await resolveDefaultUiHost();
    const defaultApiHost = await resolveDefaultApiHost();
    const promptCatalog = this.buildPromptCatalog(normalizedFlags, { defaultApiHost });
    if (useBrowserUi) {
      presetValues = await runPromptCatalogWebUI({
        stages: Init.buildWebUiStages(promptCatalog),
        values: {
          ...dynamicInitialValues,
          ...presetValues,
        },
        host: normalizedFlags['ui-host']?.trim() || defaultUiHost,
        port: normalizedFlags['ui-port'] ?? 0,
        pageTitle: initText('webUi.pageTitle'),
        documentHeading: initText('webUi.documentHeading'),
        documentHint: initText('webUi.documentHint'),
        onServerStart: ({ url }) => {
          logInitUiReady(this, url);
        },
        onOpenBrowserError: (_url, err) => {
          logInitUiBrowserOpenFallback();
          this.log(`Browser open error: ${formatBrowserOpenError(err)}`);
        },
      });
    }

    const results = await runPromptCatalog(promptCatalog, {
      initialValues: {
        ...dynamicInitialValues,
        ...(presetValues.setupMode === undefined && presetValues.hasNocobase !== undefined
          ? { setupMode: normalizeInitSetupMode(presetValues.hasNocobase) }
          : {}),
      },
      values: presetValues,
      yes: normalizedFlags.yes || useBrowserUi || !interactive,
      hooks: {
        onCancel: () => {
          this.exit(0);
        },
        onMissingNonInteractive: (message) => {
          const formatted = formatInitValidationMessage(message);
          this.error(highlightInitValidationMessage(formatted));
          this.exit(1);
        },
      },
      command: this,
    });
    const normalizedResults = this.normalizeInitResults({
      ...pickKeys(presetValues, [
        'defaultApiHost',
        'authType',
        'accessToken',
        'dbSchema',
        'dbTablePrefix',
        'dbUnderscored',
        'installApiBaseUrl',
        'installAuthType',
        'installAccessToken',
        'installUsername',
        'installPassword',
        'skipAuth',
        'username',
        'password',
      ]),
      defaultApiHost,
      ...results,
    });
    const setupMode = resolveInitSetupMode(normalizedResults);
    const existingEnv = isInstallLikeSetupMode(normalizedResults)
      ? await getEnv(String(normalizedResults.appName ?? '').trim(), { scope: resolveDefaultConfigScope() })
      : undefined;

    if (existingEnv && Boolean(normalizedFlags.force)) {
      printWarning(
        `Reconfiguring existing env ${pc.cyan(
          pc.bold(`"${existingEnv.name}"`),
        )} from the global config because ${pc.bold(
          '--force',
        )} was set. The env config will be updated before install starts, then refreshed again after install succeeds.`,
      );
    }

    await this.syncNocoBaseSkills({
      skip: Boolean(normalizedFlags['skip-skills']),
    });

    let managedInstallResults: Record<string, string | number | boolean> | undefined;

    try {
      // oclif explicit registry keys use `:` (e.g. `env:add`); users still type `nb env add`.
      if (setupMode === 'connect-remote') {
        logInitStage('Connecting to the env');
        printVerbose('Running nb env add');
        await this.config.runCommand('env:add', this.buildEnvAddArgv(normalizedResults));
      } else {
        logInitStage('Saving env config');
        await this.persistManagedEnvConfig(normalizedResults, normalizedFlags);
        managedInstallResults = normalizedResults;
        printInfo(
          `Saved env config for "${
            String(normalizedResults.appName ?? DEFAULT_INIT_APP_NAME).trim() || DEFAULT_INIT_APP_NAME
          }".`,
        );
        printVerbose('Running nb install');
        await this.config.runCommand('install', this.buildInstallArgv(normalizedResults, normalizedFlags));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const formatted = managedInstallResults
        ? await this.formatManagedInstallFailureMessage(message, managedInstallResults, normalizedFlags)
        : message;
      this.error(pc.red(formatted));
      this.exit(1);
    }
  }

  private static async buildDynamicInitialValuesForInstall(
    flags: {
      'app-path'?: string;
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
          'app-path': flags['app-path'] ?? '',
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
    if (flags.yes && !Object.prototype.hasOwnProperty.call(downloadSeed, 'source')) {
      downloadSeed.source = 'docker';
    }

    const builtinDbImageRegistry =
      String(presetValues.dockerRegistry ?? '').trim() ||
      resolveOfficialDockerRegistry(await getCliConfigValue('nb-image-registry'));

    if (!Object.prototype.hasOwnProperty.call(presetValues, 'dockerRegistry')) {
      out.dockerRegistry = builtinDbImageRegistry;
    }
    out.builtinDbImageRegistry = builtinDbImageRegistry;

    const dbInitial = await Install.buildDbPromptInitialValues({
      flags,
      downloadResults: downloadSeed as Record<string, PromptValue>,
      dbPreset: presetValues,
      warnOnPortFallback: false,
    });
    for (const [key, value] of Object.entries(dbInitial)) {
      if (key === 'builtinDbImage') {
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(presetValues, key)) {
        out[key] = value;
      }
    }

    return out;
  }

  private static buildWebUiStages(c: PromptsCatalog = Init.prompts): RunPromptCatalogWebUIStage[] {
    return [
      {
        sectionTitle: initText('webUi.gettingStarted.title'),
        sectionDescription: initText('webUi.gettingStarted.description'),
        catalog: {
          appName: c.appName,
          setupMode: c.setupMode,
        } satisfies PromptsCatalog,
      },
      {
        sectionTitle: initText('webUi.connectExistingApp.title'),
        sectionDescription: initText('webUi.connectExistingApp.description'),
        catalog: {
          apiBaseUrl: c.apiBaseUrl,
          authType: c.authType,
          username: c.username,
          password: c.password,
          accessToken: c.accessToken,
        } satisfies PromptsCatalog,
      },
      {
        sectionTitle: initText('webUi.createNewApp.title'),
        sectionDescription: initText('webUi.createNewApp.description'),
        catalog: {
          lang: c.lang,
          appPath: c.appPath,
          appPort: c.appPort,
          appPublicPath: c.appPublicPath,
          skipDownload: c.skipDownload,
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
          dbSchema: c.dbSchema,
          dbTablePrefix: c.dbTablePrefix,
          dbUnderscored: c.dbUnderscored,
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
      {
        sectionTitle: initText('webUi.connectExistingApp.title'),
        sectionDescription: initText('webUi.connectExistingApp.description'),
        catalog: {
          installApiBaseUrl: c.installApiBaseUrl,
          installAuthType: c.installAuthType,
          installAccessToken: c.installAccessToken,
        } satisfies PromptsCatalog,
      },
    ];
  }

  private buildPresetValuesFromFlags(flags: {
    env?: string;
    'setup-mode'?: string;
    locale?: string;
    'default-api-base-url'?: string;
    'api-base-url'?: string;
    'auth-type'?: string;
    'access-token'?: string;
    token?: string;
    username?: string;
    password?: string;
    lang?: string;
    'app-root-path'?: string;
    'app-port'?: string;
    'storage-path'?: string;
    'app-public-path'?: string;
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
    'db-schema'?: string;
    'db-table-prefix'?: string;
    'db-underscored'?: boolean;
    'skip-download'?: boolean;
    'app-path'?: string;
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
    'skip-auth'?: boolean;
  }): PromptInitialValues {
    const preset: PromptInitialValues = {};
    const argv = process.argv.slice(2);
    const setupMode = explicitSetupModeFlag(flags);

    if (flags.env !== undefined && String(flags.env).trim() !== '') {
      preset.appName = String(flags.env).trim();
    }
    if (setupMode) {
      preset.setupMode = setupMode;
    }
    const apiBaseUrl = explicitApiBaseUrlFlag(flags);
    if (apiBaseUrl) {
      preset.setupMode ??= 'connect-remote';
      preset.apiBaseUrl = apiBaseUrl;
      preset.installApiBaseUrl = apiBaseUrl;
    } else if (flags['default-api-base-url'] !== undefined && String(flags['default-api-base-url']).trim() !== '') {
      const defaultApiBaseUrl = String(flags['default-api-base-url']).trim();
      preset.apiBaseUrl = defaultApiBaseUrl;
      preset.installApiBaseUrl = defaultApiBaseUrl;
    }
    if (flags['auth-type'] !== undefined && String(flags['auth-type']).trim() !== '') {
      const authType = String(flags['auth-type']).trim();
      preset.authType = authType;
      preset.installAuthType = authType;
    }
    if (flags['skip-auth']) {
      preset.skipAuth = true;
    }
    const accessToken = String(flags['access-token'] ?? flags.token ?? '');
    if (flags['access-token'] !== undefined || flags.token !== undefined) {
      preset.accessToken = accessToken;
      preset.installAccessToken = accessToken;
    }
    if (flags.username !== undefined) {
      const username = String(flags.username ?? '').trim();
      preset.username = username;
      preset.installUsername = username;
    }
    if (flags.password !== undefined) {
      const password = String(flags.password ?? '');
      preset.password = password;
      preset.installPassword = password;
    }
    if (flags.lang !== undefined && String(flags.lang).trim() !== '') {
      preset.lang = String(flags.lang).trim();
    }
    if (flags['app-path'] !== undefined && String(flags['app-path']).trim() !== '') {
      preset.appPath = String(flags['app-path']).trim();
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
    if (flags['app-public-path'] !== undefined && String(flags['app-public-path']).trim() !== '') {
      preset.appPublicPath = String(flags['app-public-path']).trim();
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
    if (flags['db-schema'] !== undefined && String(flags['db-schema']).trim() !== '') {
      preset.dbSchema = String(flags['db-schema']).trim();
    }
    if (flags['db-table-prefix'] !== undefined && String(flags['db-table-prefix']).trim() !== '') {
      preset.dbTablePrefix = String(flags['db-table-prefix']).trim();
    }
    if (argvHasToken(argv, ['--db-underscored', '--no-db-underscored'])) {
      preset.dbUnderscored = Boolean(flags['db-underscored']);
    }
    if (argvHasToken(argv, ['--skip-download'])) {
      preset.skipDownload = Boolean(flags['skip-download']);
      if (preset.skipDownload) {
        preset.dockerSave = false;
        preset.replace = false;
        preset.devDependencies = false;
        preset.build = false;
        preset.buildDts = false;
      }
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
    if (!preset.setupMode && hasDownloadOverride(flags)) {
      preset.setupMode = 'install-new';
    }
    if (preset.setupMode === 'manage-local') {
      preset.skipDownload = false;
    }
    applyLegacyHasNocobaseAlias(preset as Record<string, unknown>);

    return preset;
  }

  protected hasAgentsDirInCwd(): boolean {
    return existsSync(path.resolve(process.cwd(), '.agents'));
  }

  private async syncNocoBaseSkills(options?: { skip?: boolean }): Promise<void> {
    if (options?.skip) {
      printVerbose('Skipped agent skills sync.');
      return;
    }

    try {
      logInitStage('Syncing agent skills');
      await installNocoBaseSkills();
      printInfo('Agent skills ready.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (isNpmRegistryUnavailable(error)) {
        printWarning(translateCli('commands.init.messages.skillsSyncRegistryUnavailable'));
        printVerbose(`Skipped agent skills sync because the npm registry was unavailable: ${message}`);
        return;
      }
      this.error(pc.red(`Skills sync failed: ${message}`));
      this.exit(1);
    }
  }

  private async persistManagedEnvConfig(
    results: Record<string, string | number | boolean>,
    flags: {
      'db-host'?: string;
      'db-schema'?: string;
      'db-table-prefix'?: string;
      'db-underscored'?: boolean;
      'hook-script'?: string;
    } = {},
  ): Promise<void> {
    const envName = String(results.appName ?? DEFAULT_INIT_APP_NAME).trim() || DEFAULT_INIT_APP_NAME;
    const existingEnv = await getEnv(envName, { scope: resolveDefaultConfigScope() });
    const appPort = String(results.appPort ?? '').trim();
    const appPublicPath = String(results.appPublicPath ?? '').trim();
    const source = String(results.source ?? '').trim();
    const version = resolveInitDownloadVersion(results);
    const dockerRegistry = String(results.dockerRegistry ?? '').trim();
    const dockerPlatform = String(results.dockerPlatform ?? '').trim();
    const gitUrl = String(results.gitUrl ?? '').trim();
    const npmRegistry = String(results.npmRegistry ?? '').trim();
    const appPath =
      String(results.appPath ?? '').trim() ||
      inferConfiguredAppPathFromLegacyConfig({
        appRootPath: results.appRootPath,
        storagePath: results.storagePath,
      }) ||
      '';
    const appRootPath = String(results.appRootPath ?? '').trim();
    const storagePath = String(results.storagePath ?? '').trim();
    const derivedAppRootPath = appPath ? deriveConfiguredSourcePath(appPath) : '';
    const derivedStoragePath = appPath ? deriveConfiguredStoragePath(appPath) : '';
    const dbDialect = String(results.dbDialect ?? '').trim();
    const builtinDbImage = String(results.builtinDbImage ?? '').trim();
    const dbHost = String(results.dbHost ?? '').trim();
    const dbPort = String(results.dbPort ?? '').trim();
    const dbDatabase = String(results.dbDatabase ?? '').trim();
    const dbUser = String(results.dbUser ?? '').trim();
    const dbPassword = String(results.dbPassword ?? '');
    const dbSchema = String(results.dbSchema ?? '').trim();
    const dbTablePrefix = String(results.dbTablePrefix ?? '').trim();
    const apiBaseUrl = String(results.apiBaseUrl ?? '').trim();
    const authType = String(results.authType ?? '').trim() || 'oauth';
    const authUsername = authType === 'basic' ? String(results.username ?? results.rootUsername ?? '').trim() : '';
    const accessToken = String(results.accessToken ?? '');
    const skipDownload = results.skipDownload === true;
    const appKey = resolveManagedAppKey(results.appKey ?? existingEnv?.config.appKey);
    const timeZone = resolveManagedTimeZone(results.timeZone ?? existingEnv?.config.timezone);
    const hookScriptInput = String(flags['hook-script'] ?? '').trim();
    const hookAppPath = appPath || `./${envName}/`;
    const hookScript = hookScriptInput
      ? await persistHookScript({
          sourcePath: hookScriptInput,
          appPath: resolveConfiguredEnvPath(hookAppPath) ?? resolveEnvRelativePath(hookAppPath),
        })
      : String(results.hookScript ?? '').trim();
    const builtinDb = explicitDbHostFlag(flags)
      ? false
      : results.builtinDb === undefined
        ? undefined
        : Boolean(results.builtinDb);

    results.appKey = appKey;
    results.timeZone = timeZone;

    await upsertEnv(
      envName,
      {
        schemaVersion: ENV_CONFIG_SCHEMA_VERSION,
        ...(source === 'docker'
          ? { kind: 'docker' }
          : source || appPath || appRootPath
            ? { kind: 'local' }
            : appPort
              ? { kind: 'http' }
              : {}),
        ...(apiBaseUrl ? { apiBaseUrl } : appPort ? { apiBaseUrl: `http://127.0.0.1:${appPort}/api` } : {}),
        ...(authType ? { authType } : {}),
        ...(authUsername ? { authUsername } : {}),
        ...((authType === 'token' || authType === 'basic') && accessToken ? { accessToken } : {}),
        ...(source ? { source } : {}),
        ...(version ? { downloadVersion: version } : {}),
        ...(dockerRegistry ? { dockerRegistry } : {}),
        ...(dockerPlatform ? { dockerPlatform } : {}),
        ...(gitUrl ? { gitUrl } : {}),
        ...(npmRegistry ? { npmRegistry } : {}),
        ...(hookScript ? { hookScript } : {}),
        ...(appPath ? { appPath } : {}),
        ...(appRootPath && !areConfiguredPathsEquivalent(appRootPath, derivedAppRootPath) ? { appRootPath } : {}),
        ...(storagePath && !areConfiguredPathsEquivalent(storagePath, derivedStoragePath) ? { storagePath } : {}),
        ...(appPort ? { appPort } : {}),
        ...(appPublicPath ? { appPublicPath } : {}),
        ...(appKey ? { appKey } : {}),
        ...(timeZone ? { timezone: timeZone } : {}),
        ...(!skipDownload && results.devDependencies !== undefined
          ? { devDependencies: Boolean(results.devDependencies) }
          : {}),
        ...(!skipDownload && results.build !== undefined ? { build: Boolean(results.build) } : {}),
        ...(!skipDownload && results.buildDts !== undefined ? { buildDts: Boolean(results.buildDts) } : {}),
        ...(builtinDb !== undefined ? { builtinDb } : {}),
        ...(dbDialect ? { dbDialect } : {}),
        ...(builtinDbImage || builtinDb === false ? { builtinDbImage: builtinDbImage || undefined } : {}),
        ...(dbHost ? { dbHost } : {}),
        ...(dbPort ? { dbPort } : {}),
        ...(dbDatabase ? { dbDatabase } : {}),
        ...(dbUser ? { dbUser } : {}),
        ...(dbPassword ? { dbPassword } : {}),
        ...(dbSchema ? { dbSchema } : {}),
        ...(dbTablePrefix ? { dbTablePrefix } : {}),
        ...(results.dbUnderscored !== undefined ? { dbUnderscored: Boolean(results.dbUnderscored) } : {}),
        setupState: 'prepared',
        ...(String(results.lang ?? '').trim() ? { lang: String(results.lang ?? '').trim() } : {}),
      },
      { scope: resolveDefaultConfigScope() },
    );
  }

  private buildEnvAddArgv(results: Record<string, string | number | boolean>): string[] {
    const argv = [String(results.appName ?? DEFAULT_INIT_APP_NAME)];
    argv.push('--no-intro');
    argv.push('--api-base-url', String(results.apiBaseUrl ?? DEFAULT_INIT_API_BASE_URL));
    argv.push('--auth-type', String(results.authType ?? 'oauth'));
    const accessToken = String(results.accessToken ?? '');
    const username = String(results.username ?? '').trim();
    const password = String(results.password ?? '');
    if (results.skipAuth === true) {
      argv.push('--skip-auth');
    } else if (results.authType === 'token' && accessToken) {
      argv.push('--access-token', accessToken);
    }
    if (results.authType === 'basic' && username) {
      argv.push('--username', username);
    }
    if (results.authType === 'basic' && results.skipAuth !== true && password) {
      argv.push('--password', password);
    }

    return argv;
  }

  private buildInstallArgv(
    results: Record<string, string | number | boolean>,
    flags: {
      yes?: boolean;
      force?: boolean;
      build?: boolean;
      verbose?: boolean;
      username?: string;
      password?: string;
      'skip-auth'?: boolean;
      'skip-download'?: boolean;
      'app-path'?: string;
      'db-host'?: string;
      'db-schema'?: string;
      'db-table-prefix'?: string;
      'db-underscored'?: boolean;
      'setup-mode'?: string;
      'prepare-only'?: boolean;
      'hook-script'?: string;
    },
    options?: {
      nonInteractive?: boolean;
      resume?: boolean;
    },
  ): string[] {
    const argv = ['--no-intro'];
    if (options?.nonInteractive ?? true) {
      argv.unshift('-y');
    }
    argv.push('--skip-save-env-log');
    const processArgv = process.argv.slice(2);
    const envName = String(results.appName ?? DEFAULT_INIT_APP_NAME).trim() || DEFAULT_INIT_APP_NAME;
    const source = String(results.source ?? '').trim();
    const setupMode = resolveInitSetupMode({
      setupMode: results.setupMode ?? flags['setup-mode'],
      hasNocobase: results.hasNocobase,
    });
    const skipDownload =
      setupMode === 'manage-local' ? false : Boolean(flags['skip-download']) || results.skipDownload === true;
    const apiBaseUrl = String(results.apiBaseUrl ?? '').trim();
    const authType = String(results.authType ?? '').trim();
    const accessToken = String(results.accessToken ?? '');
    const username = String(results.username ?? flags.username ?? '').trim();
    const password = String(results.password ?? flags.password ?? '');

    argv.push('--env', envName);
    if (options?.resume) {
      argv.push('--resume');
    }
    if (flags['prepare-only']) {
      argv.push('--prepare-only');
    }

    const hookScript = String(results.hookScript ?? flags['hook-script'] ?? '').trim();
    if (hookScript) {
      argv.push('--hook-script', hookScript);
    }

    if (flags.verbose) {
      argv.push('--verbose');
    }

    if (setupMode === 'connect-remote' && apiBaseUrl) {
      argv.push('--api-base-url', apiBaseUrl);
    }

    if (authType) {
      argv.push('--auth-type', authType);
    }

    if (Boolean(flags['skip-auth']) || results.skipAuth === true) {
      argv.push('--skip-auth');
    }

    if (authType === 'token' && accessToken) {
      argv.push('--access-token', accessToken);
    }
    if (authType === 'basic' && username) {
      argv.push('--username', username);
    }
    if (authType === 'basic' && password) {
      argv.push('--password', password);
    }

    const lang = String(results.lang ?? '').trim();
    if (lang) {
      argv.push('--lang', lang);
    }

    const appPath =
      String(results.appPath ?? '').trim() ||
      inferConfiguredAppPathFromLegacyConfig({
        appRootPath: results.appRootPath,
        storagePath: results.storagePath,
      }) ||
      '';
    if (appPath) {
      argv.push('--app-path', appPath);
    }

    const appRootPath = String(results.appRootPath ?? '').trim();
    if (appRootPath && (!appPath || !areConfiguredPathsEquivalent(appRootPath, deriveConfiguredSourcePath(appPath)))) {
      argv.push('--app-root-path', appRootPath);
    }

    const appPort = String(results.appPort ?? '').trim();
    if (appPort && (!flags.yes || argvHasToken(processArgv, ['--app-port']) || appPort !== '13000')) {
      argv.push('--app-port', appPort);
    }

    const storagePath = String(results.storagePath ?? '').trim();
    if (storagePath && (!appPath || !areConfiguredPathsEquivalent(storagePath, deriveConfiguredStoragePath(appPath)))) {
      argv.push('--storage-path', storagePath);
    }

    const appPublicPath = String(results.appPublicPath ?? '').trim();
    if (appPublicPath) {
      argv.push('--app-public-path', appPublicPath);
    }

    if (flags.force) {
      argv.push('--force');
    }

    if (source) {
      argv.push('--source', source);
    }

    const version = resolveInitDownloadVersion(results);
    if (version) {
      argv.push('--version', version);
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

    if (skipDownload) {
      argv.push('--skip-download');
    } else {
      const outputDir = String(results.outputDir ?? '').trim();
      if (outputDir) {
        argv.push('--output-dir', outputDir);
      }

      if (results.replace) {
        argv.push('--replace');
      }
      if (results.devDependencies) {
        argv.push('--dev-dependencies');
      }
      if (results.dockerSave) {
        argv.push('--docker-save');
      }
      if (results.build !== undefined && !results.build) {
        argv.push('--no-build');
      } else if (argvHasToken(processArgv, ['--build', '--no-build']) && flags.build === false) {
        argv.push('--no-build');
      }
      if (results.buildDts) {
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
      dbPort &&
      (!dockerBuiltinDbPortIsHidden || dbPortWasProvided) &&
      (!flags.yes || dbPortWasProvided || dbPort !== dbDefaultPort)
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
    const dbSchema = String(results.dbSchema ?? '').trim();
    if (dbSchema) {
      argv.push('--db-schema', dbSchema);
    }
    const dbTablePrefix = String(results.dbTablePrefix ?? '').trim();
    if (dbTablePrefix) {
      argv.push('--db-table-prefix', dbTablePrefix);
    }
    if (results.dbUnderscored !== undefined) {
      argv.push(results.dbUnderscored ? '--db-underscored' : '--no-db-underscored');
    }

    const includeRootUser = setupMode === 'install-new';
    const rootUsername = String(results.rootUsername ?? '').trim();
    if (includeRootUser && rootUsername) {
      argv.push('--root-username', rootUsername);
    }

    const rootEmail = String(results.rootEmail ?? '').trim();
    if (includeRootUser && rootEmail) {
      argv.push('--root-email', rootEmail);
    }

    const rootPassword = String(results.rootPassword ?? '');
    if (includeRootUser && rootPassword) {
      argv.push('--root-password', rootPassword);
    }

    const rootNickname = String(results.rootNickname ?? '').trim();
    if (includeRootUser && rootNickname) {
      argv.push('--root-nickname', rootNickname);
    }

    return argv;
  }

  private buildManagedInstallResumeCommand(
    results: Record<string, string | number | boolean>,
    flags: { ui?: boolean; yes?: boolean },
  ): string {
    const argv = ['nb', 'init'];
    const envName = String(results.appName ?? DEFAULT_INIT_APP_NAME).trim() || DEFAULT_INIT_APP_NAME;
    argv.push('--env', envName);
    if (flags.yes) {
      argv.push('--yes');
    }
    if (flags.ui) {
      argv.push('--ui');
    }
    argv.push('--resume');
    return argv.map(shellQuoteArg).join(' ');
  }

  private async formatManagedInstallFailureMessage(
    message: string,
    results: Record<string, string | number | boolean>,
    flags: { ui?: boolean; yes?: boolean },
  ): Promise<string> {
    const envName = String(results.appName ?? DEFAULT_INIT_APP_NAME).trim() || DEFAULT_INIT_APP_NAME;
    const savedEnv = await getEnv(envName, { scope: resolveDefaultConfigScope() });
    if (savedEnv?.config.setupState === 'installed') {
      return message;
    }

    const command = this.buildManagedInstallResumeCommand(results, flags);
    return [message, '', translateCli('commands.init.messages.resumeAfterInstallFailure', { command })].join('\n');
  }

  private buildResumeInstallArgv(flags: {
    yes?: boolean;
    env?: string;
    'setup-mode'?: string;
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
    'db-schema'?: string;
    'db-table-prefix'?: string;
    'db-underscored'?: boolean;
    'skip-download'?: boolean;
    'app-path'?: string;
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
    'skip-auth'?: boolean;
    'prepare-only'?: boolean;
    'hook-script'?: string;
  }): string[] {
    const preset = this.buildPresetValuesFromFlags(flags) as Record<string, string | number | boolean>;
    const setupMode = resolveInitSetupMode(preset);
    if (flags.yes) {
      preset.lang ??= yesInitialValue(Install.appPrompts.lang, 'en-US');
      if (setupMode === 'install-new') {
        preset.rootUsername ??= yesInitialValue(Install.rootUserPrompts.rootUsername, 'nocobase');
        preset.rootEmail ??= yesInitialValue(Install.rootUserPrompts.rootEmail, 'admin@nocobase.com');
        preset.rootPassword ??= yesInitialValue(Install.rootUserPrompts.rootPassword, 'admin123');
        preset.rootNickname ??= yesInitialValue(Install.rootUserPrompts.rootNickname, 'Super Admin');
      }
    }
    if (setupMode === 'manage-local') {
      preset.skipDownload = false;
    } else if (!flags['skip-download']) {
      preset.replace ??= true;
    }

    return this.buildInstallArgv(preset, flags, {
      nonInteractive: Boolean(flags.yes),
      resume: true,
    });
  }

  private normalizeInitResults(
    results: Record<string, string | number | boolean>,
  ): Record<string, string | number | boolean> {
    const normalized = { ...results };
    const setupMode = resolveInitSetupMode(normalized);
    const defaultApiHost = normalizeConnectionString(normalized.defaultApiHost) || '127.0.0.1';
    if (setupMode === 'install-new') {
      normalized.apiBaseUrl =
        normalizeConnectionString(normalized.installApiBaseUrl) ||
        deriveInstallConnectionApiBaseUrl(normalized, defaultApiHost);
      normalized.authType = normalizeConnectionString(normalized.installAuthType) || 'oauth';
      normalized.username =
        normalized.authType === 'basic'
          ? normalizeConnectionString(normalized.installUsername) || normalizeConnectionString(normalized.rootUsername)
          : normalizeConnectionString(normalized.installUsername);
      normalized.password =
        normalized.authType === 'basic'
          ? String(normalized.installPassword ?? '') || String(normalized.rootPassword ?? '')
          : String(normalized.installPassword ?? '');
      normalized.accessToken = String(normalized.installAccessToken ?? '');
    }
    normalized.setupMode = setupMode;
    applyLegacyHasNocobaseAlias(normalized as Record<string, unknown>);
    if (setupMode === 'manage-local') {
      normalized.skipDownload = false;
      delete normalized.rootUsername;
      delete normalized.rootEmail;
      delete normalized.rootPassword;
      delete normalized.rootNickname;
    }
    delete normalized.installApiBaseUrl;
    delete normalized.installAuthType;
    delete normalized.installUsername;
    delete normalized.installPassword;
    delete normalized.installAccessToken;
    delete normalized.defaultApiHost;
    return normalized;
  }
}
