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
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { exit, stdin as stdinStream, stdout as stdoutStream } from 'node:process';
import { appendAppPublicPath } from '../lib/app-public-path.js';
import {
  type PromptCatalogValues,
  type PromptInitialValues,
  type PromptsCatalog,
  type PromptValue,
  type RunPromptCatalogOptions,
  type TextPromptBlock,
  runPromptCatalog,
} from '../lib/prompt-catalog.ts';
import { applyCliLocale, localeText, resolveCliLocale, translateCli } from '../lib/cli-locale.ts';
import {
  resolveConfiguredEnvPath,
  resolveDefaultConfigScope,
  resolveEnvRoot,
  resolveEnvRelativePath,
} from '../lib/cli-home.js';
import {
  defaultDockerContainerPrefix,
  defaultDockerNetworkName,
  managedAppLifecycleEnvVars,
} from '../lib/app-runtime.js';
import {
  getCliConfigValue,
  resolveDefaultApiHost,
  resolveDockerContainerPrefix,
  resolveDockerNetworkName,
} from '../lib/cli-config.js';
import {
  DEFAULT_DOCKER_VERSION,
  DEFAULT_NB_IMAGE_VARIANT,
  inferNbImageRegistryFromRepository,
  normalizeNbImageVariant,
  resolveBuiltinDbImage,
  resolveDockerImageContainerPort,
  resolveDockerImageRef,
  resolveOfficialDockerRegistry,
} from '../lib/docker-image.ts';
import {
  findAvailableTcpPort,
  validateAppPublicPath,
  validateAvailableTcpPort,
  validateTcpPort,
  validateEnvKey,
} from '../lib/prompt-validators.ts';
import { validateExternalDbConfig, validateMysqlLowerCaseTableNamesCompatibility } from '../lib/db-connection-check.ts';
import { formatMissingManagedAppEnvMessage } from '../lib/app-runtime.js';
import { commandOutput, commandSucceeds, ensureDockerDaemonRunning, run, runNocoBaseCommand } from '../lib/run-npm.js';
import { printInfo, printStage, printVerbose, printWarning, setVerboseMode } from '../lib/ui.js';
import { omitKeys, upperFirst } from '../lib/object-utils.ts';
import { clearEnvRootSetup, getEnv, loadAuthConfig, setCurrentEnv, type Env, upsertEnv } from '../lib/auth-store.js';
import { buildStoredEnvConfig, type StoredEnvConfig } from '../lib/env-config.js';
import { resolveDockerEnvFileArg } from '../lib/docker-env-file.ts';
import { startDockerLogFollower } from '../lib/docker-log-stream.js';
import { buildInitAppEnvVarsFromConfig } from '../lib/managed-init-env.js';
import {
  buildHookContext,
  persistHookScript,
  resolveHookScriptPath,
  runHookScriptHook,
  type HookName,
} from '../lib/hook-script.js';
import {
  areConfiguredPathsEquivalent,
  deriveConfiguredSourcePath,
  deriveConfiguredStoragePath,
  inferConfiguredAppPathFromLegacyConfig,
} from '../lib/env-paths.js';
import Download, { DownloadParsedFlags, defaultDockerRegistryForLang, type DownloadCommandResult } from './download.js';
import EnvAdd from './env/add.ts';
import { resolveAppUrlFromApiBaseUrl } from './env/shared.ts';

const DEFAULT_INSTALL_ENV_NAME = 'local';
const DEFAULT_INSTALL_LANG = 'en-US';
const DEFAULT_INSTALL_APP_PORT = '13000';
const DEFAULT_INSTALL_DB_HOST = '127.0.0.1';
const DEFAULT_INSTALL_BUILTIN_DB_HOST = 'postgres';
const DEFAULT_INSTALL_DB_PORTS = {
  postgres: '5432',
  mysql: '3306',
  mariadb: '3306',
  kingbase: '54321',
} as const;
const DEFAULT_INSTALL_DB_DATABASE = 'nocobase';
const DEFAULT_INSTALL_DB_USER = 'nocobase';
const DEFAULT_INSTALL_DB_PASSWORD = 'nocobase';
const DEFAULT_INSTALL_ROOT_USERNAME = 'nocobase';
const DEFAULT_INSTALL_ROOT_EMAIL = 'admin@nocobase.com';
const DEFAULT_INSTALL_ROOT_PASSWORD = 'admin123';
const DEFAULT_INSTALL_ROOT_NICKNAME = 'Super Admin';
const DEFAULT_INSTALL_API_HOST = '127.0.0.1';

function toOptionalPromptString(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function buildInstallApiBaseUrl(
  appResults: Record<string, PromptValue>,
  defaultApiHost = DEFAULT_INSTALL_API_HOST,
): string {
  const appPort = String(appResults.appPort ?? DEFAULT_INSTALL_APP_PORT).trim() || DEFAULT_INSTALL_APP_PORT;
  const appPublicPath = String(appResults.appPublicPath ?? '').trim();
  return `http://${defaultApiHost}:${appPort}${appendAppPublicPath(appPublicPath, 'api', { trailingSlash: false })}`;
}

function formatInstallDisplayUrl(apiBaseUrl: string): string {
  return resolveAppUrlFromApiBaseUrl(apiBaseUrl) || apiBaseUrl.replace(/\/api\/?$/, '');
}
const APP_HEALTH_CHECK_INTERVAL_MS = 2_000;
const APP_HEALTH_CHECK_TIMEOUT_MS = 600_000;
const APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS = 5_000;

const INSTALL_DB_DIALECTS = ['postgres', 'mysql', 'mariadb', 'kingbase'] as const;
const INSTALL_LANGUAGE_CODES = {
  'ar-EG': { label: 'العربية' },
  'az-AZ': { label: 'Azərbaycan dili' },
  'bg-BG': { label: 'Български' },
  'bn-BD': { label: 'Bengali' },
  'by-BY': { label: 'Беларускі' },
  'ca-ES': { label: 'Сatalà/Espanya' },
  'cs-CZ': { label: 'Česky' },
  'da-DK': { label: 'Dansk' },
  'de-DE': { label: 'Deutsch' },
  'el-GR': { label: 'Ελληνικά' },
  'en-GB': { label: 'English(GB)' },
  'en-US': { label: 'English' },
  'es-ES': { label: 'Español' },
  'et-EE': { label: 'Estonian (Eesti)' },
  'fa-IR': { label: 'فارسی' },
  'fi-FI': { label: 'Suomi' },
  'fr-BE': { label: 'Français(BE)' },
  'fr-CA': { label: 'Français(CA)' },
  'fr-FR': { label: 'Français' },
  'ga-IE': { label: 'Gaeilge' },
  'gl-ES': { label: 'Galego' },
  'he-IL': { label: 'עברית' },
  'hi-IN': { label: 'हिन्दी' },
  'hr-HR': { label: 'Hrvatski jezik' },
  'hu-HU': { label: 'Magyar' },
  'hy-AM': { label: 'Հայերեն' },
  'id-ID': { label: 'Bahasa Indonesia' },
  'is-IS': { label: 'Íslenska' },
  'it-IT': { label: 'Italiano' },
  'ja-JP': { label: '日本語' },
  'ka-GE': { label: 'ქართული' },
  'kk-KZ': { label: 'Қазақ тілі' },
  'km-KH': { label: 'ភាសាខ្មែរ' },
  'kn-IN': { label: 'ಕನ್ನಡ' },
  'ko-KR': { label: '한국어' },
  'ku-IQ': { label: 'کوردی' },
  'lt-LT': { label: 'lietuvių' },
  'lv-LV': { label: 'Latviešu valoda' },
  'mk-MK': { label: 'македонски јазик' },
  'ml-IN': { label: 'മലയാളം' },
  'mn-MN': { label: 'Монгол хэл' },
  'ms-MY': { label: 'بهاس ملايو' },
  'nb-NO': { label: 'Norsk bokmål' },
  'ne-NP': { label: 'नेपाली' },
  'nl-BE': { label: 'Vlaams' },
  'nl-NL': { label: 'Nederlands' },
  'pl-PL': { label: 'Polski' },
  'pt-BR': { label: 'Português brasileiro' },
  'pt-PT': { label: 'Português' },
  'ro-RO': { label: 'România' },
  'ru-RU': { label: 'Русский' },
  'si-LK': { label: 'සිංහල' },
  'sk-SK': { label: 'Slovenčina' },
  'sl-SI': { label: 'Slovenščina' },
  'sr-RS': { label: 'српски језик' },
  'sv-SE': { label: 'Svenska' },
  'ta-IN': { label: 'Tamil' },
  'th-TH': { label: 'ภาษาไทย' },
  'tk-TK': { label: 'Turkmen' },
  'tr-TR': { label: 'Türkçe' },
  'uk-UA': { label: 'Українська' },
  'ur-PK': { label: 'Oʻzbekcha' },
  'vi-VN': { label: 'Tiếng Việt' },
  'zh-CN': { label: '简体中文' },
  'zh-HK': { label: '繁體中文（香港）' },
  'zh-TW': { label: '繁體中文（台湾）' },
} as const;
const INSTALL_LANGUAGE_OPTIONS = Object.entries(INSTALL_LANGUAGE_CODES).map(([value, { label }]) => ({
  value,
  label: `${label} (${value})`,
}));

const installText = (key: string, values?: Record<string, unknown>) => localeText(`commands.install.${key}`, values);

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

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((t) => argv.includes(t));
}

function isInstallDbDialect(value: string): value is (typeof INSTALL_DB_DIALECTS)[number] {
  return (INSTALL_DB_DIALECTS as readonly string[]).includes(value);
}

function downloadVersionPromptValue(version: string): 'latest' | 'beta' | 'alpha' | 'other' {
  return version === 'latest' || version === 'beta' || version === 'alpha' ? version : 'other';
}

function supportsBuiltinDbDialect(value: PromptValue | undefined): value is (typeof INSTALL_DB_DIALECTS)[number] {
  const dialect = String(value ?? '').trim();
  return (INSTALL_DB_DIALECTS as readonly string[]).includes(dialect);
}

export function defaultDbPortForDialect(value: PromptValue | undefined): string {
  const dialect = String(value ?? 'postgres').trim();
  return DEFAULT_INSTALL_DB_PORTS[isInstallDbDialect(dialect) ? dialect : 'postgres'];
}

function defaultBuiltinDbImageForDialect(value: PromptValue | undefined, options?: { registry?: string }): string {
  const dialect = String(value ?? 'postgres').trim();
  return resolveBuiltinDbImage(dialect, { registry: options?.registry });
}

function defaultDbDatabaseForDialect(value: PromptValue | undefined): string {
  return String(value ?? '').trim() === 'kingbase' ? 'kingbase' : DEFAULT_INSTALL_DB_DATABASE;
}

function supportsDbSchemaPrompt(value: PromptValue | undefined): boolean {
  const dialect = String(value ?? '').trim();
  return dialect === 'postgres' || dialect === 'kingbase';
}

function defaultDbHostForBuiltinDb(values: PromptCatalogValues): string {
  return values.builtinDb ? DEFAULT_INSTALL_BUILTIN_DB_HOST : DEFAULT_INSTALL_DB_HOST;
}

function validateBuiltinDbEnabled(value: PromptValue, values: PromptCatalogValues): string | undefined {
  if (!value) {
    return undefined;
  }

  const dialect = String(values.dbDialect ?? 'postgres').trim() || 'postgres';
  if (supportsBuiltinDbDialect(dialect)) {
    return undefined;
  }

  return translateCli('commands.install.validation.builtinDbUnsupported', { dialect });
}

async function validateExternalDbPromptField(
  value: PromptValue,
  values: PromptCatalogValues,
): Promise<string | undefined> {
  const builtinDb = values.builtinDb === undefined ? true : Boolean(values.builtinDb);
  if (builtinDb) {
    return undefined;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  const connectionError = await validateExternalDbConfig(values);
  if (connectionError) {
    return connectionError;
  }

  if (!Object.prototype.hasOwnProperty.call(values, 'dbUnderscored')) {
    return undefined;
  }

  return await validateMysqlLowerCaseTableNamesCompatibility(values);
}

function defaultInstallAppPath(envName: PromptValue | undefined): string {
  const name = String(envName ?? DEFAULT_INSTALL_ENV_NAME).trim() || DEFAULT_INSTALL_ENV_NAME;
  return `./${name}/`;
}

function defaultInstallAppRootPath(envName: PromptValue | undefined): string {
  return deriveConfiguredSourcePath(defaultInstallAppPath(envName));
}

function defaultInstallStoragePath(envName: PromptValue | undefined): string {
  return deriveConfiguredStoragePath(defaultInstallAppPath(envName));
}

function resolveConfiguredAppPathValue(values: Record<string, PromptValue>): string | undefined {
  const explicitAppPath = toOptionalPromptString(values.appPath);
  if (explicitAppPath) {
    return explicitAppPath;
  }

  return inferConfiguredAppPathFromLegacyConfig({
    appRootPath: toOptionalPromptString(values.appRootPath),
    storagePath: toOptionalPromptString(values.storagePath),
  });
}

function resolveConfiguredSourcePathValue(values: Record<string, PromptValue>, envName: string): string {
  const legacyAppRootPath = toOptionalPromptString(values.appRootPath);
  if (legacyAppRootPath) {
    return legacyAppRootPath;
  }

  const appPath = resolveConfiguredAppPathValue(values) ?? defaultInstallAppPath(envName);
  return deriveConfiguredSourcePath(appPath);
}

function resolveConfiguredStoragePathValue(values: Record<string, PromptValue>, envName: string): string {
  const legacyStoragePath = toOptionalPromptString(values.storagePath);
  if (legacyStoragePath) {
    return legacyStoragePath;
  }

  const appPath = resolveConfiguredAppPathValue(values) ?? defaultInstallAppPath(envName);
  return deriveConfiguredStoragePath(appPath);
}

function pickPresetKeys(source: PromptInitialValues, keys: readonly string[]): PromptInitialValues {
  const out: PromptInitialValues = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(source, k)) {
      out[k] = source[k];
    }
  }
  return out;
}

function optionalEnvString(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function optionalEnvBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return Boolean(value);
}

function resolveExtractClientAssetsDefaultEnabled(value: unknown): boolean {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!text) {
    return true;
  }

  return !['0', 'false', 'no', 'off'].includes(text);
}

function pushOptionalEnvArg(args: string[], key: string, value: string | boolean | undefined): void {
  if (typeof value === 'string') {
    if (!value) {
      return;
    }
    args.push('-e', `${key}=${value}`);
    return;
  }

  if (typeof value === 'boolean') {
    args.push('-e', `${key}=${String(value)}`);
  }
}

function setOptionalEnvVar(out: Record<string, string>, key: string, value: string | boolean | undefined): void {
  if (typeof value === 'string') {
    if (!value) {
      return;
    }
    out[key] = value;
    return;
  }

  if (typeof value === 'boolean') {
    out[key] = String(value);
  }
}

/** Parsed `nb install` flags (oclif output shape). */
type InstallParsedFlags = {
  yes: boolean;
  resume: boolean;
  verbose: boolean;
  locale?: string;
  env?: string;
  'default-api-base-url'?: string;
  'api-base-url'?: string;
  'auth-type'?: string;
  'access-token'?: string;
  token?: string;
  username?: string;
  password?: string;
  'skip-auth'?: boolean;
  lang?: string;
  force: boolean;
  'app-path'?: string;
  'app-root-path'?: string;
  'app-port'?: string;
  'storage-path'?: string;
  'app-public-path'?: string;
  'root-username'?: string;
  'root-email'?: string;
  'root-password'?: string;
  'root-nickname'?: string;
  'skip-download': boolean;
  'builtin-db': boolean;
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
  'no-intro'?: boolean;
  'hook-script'?: string;
};

/** Flags from `nb install` that influence `nocobase-v1 install` argv (subset for typing). */
type NocoBaseInstallArgvFlags = {
  force?: boolean;
  lang?: string;
  rootUserName?: string;
  rootEmail?: string;
  rootPassword?: string;
  rootNickname?: string;
};

export type BuiltinDbPlan = {
  source?: string;
  dbDialect: string;
  dbHost: string;
  dbPort: string;
  dbDatabase: string;
  dbUser: string;
  dbPassword: string;
  builtinDbImage?: string;
  networkName: string;
  containerName: string;
  dataDir: string;
  image: string;
  args: string[];
};

type DockerAppPlan = {
  source: 'docker';
  networkName: string;
  containerName: string;
  imageRef: string;
  appPort: string;
  storagePath: string;
  envFile?: string;
  appKey: string;
  timeZone: string;
  args: string[];
};

type LocalAppPlan = {
  source: 'npm' | 'git';
  projectRoot: string;
  appPort: string;
  storagePath: string;
  appKey: string;
  timeZone: string;
  env: Record<string, string>;
  args: string[];
};

type InstallPromptResults = {
  envName: string;
  envResults: Record<string, PromptValue>;
  appResults: Record<string, PromptValue>;
  downloadResults: Record<string, PromptValue>;
  dbResults: Record<string, PromptValue>;
  rootResults: Record<string, PromptValue>;
  envAddResults: Record<string, PromptValue>;
};

type ResumePresetValues = {
  envPreset: PromptInitialValues;
  appPreset: PromptInitialValues;
  downloadPreset: PromptInitialValues;
  dbPreset: PromptInitialValues;
  rootPreset: PromptInitialValues;
  envAddPreset: PromptInitialValues;
};

type ResumePortValidationContext = {
  envName: string;
  dockerNetworkName?: string;
  dockerContainerPrefix?: string;
  source?: string;
  builtinDb?: boolean;
  dbDialect?: string;
  appRootPath?: string;
};

export default class Install extends Command {
  private readonly ensuredDockerNetworks = new Set<string>();

  private logStage(title: string) {
    printStage(title);
  }

  private logDetail(message: string) {
    printVerbose(message);
  }

  static override hidden = true;
  static override description =
    'Install NocoBase: database, storage, admin user, and `nocobase-v1 install`. Optionally run `nb source download` first; distribution and image details are configured on `nb source download`, not here. Use `--resume` to continue an interrupted setup from the saved workspace env config.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --resume',
    '<%= config.bin %> <%= command.id %> --env app1 -f',
    '<%= config.bin %> <%= command.id %> --env app1 -l zh-CN',
    '<%= config.bin %> <%= command.id %> --env app1 --root-username nocobase --root-email admin@nocobase.com --root-password admin123',
    '<%= config.bin %> <%= command.id %> --env app1 --root-nickname "Super Admin"',
    '<%= config.bin %> <%= command.id %> --env myenv --app-path=./myenv/',
    '<%= config.bin %> <%= command.id %> --env dev -y --app-path=./dev/',
    '<%= config.bin %> <%= command.id %> --env dev -y --skip-download --source git --app-path=./dev/',
  ];
  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip interactive prompts; use flags and defaults only',
      default: false,
    }),
    resume: Flags.boolean({
      description: 'Resume a previous unfinished setup for this env using the saved workspace env config',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed command output',
      default: false,
    }),
    'skip-save-env-log': Flags.boolean({
      hidden: true,
      default: false,
    }),
    'prepare-only': Flags.boolean({
      description: 'Prepare the env and save config without installing or starting the application yet',
      default: false,
    }),
    env: Flags.string({
      char: 'e',
      description:
        'App/env name to create or update. Defaults the app path to ./<envName>/ and derives source/storage inside it.',
    }),
    'default-api-base-url': Flags.string({
      char: 'd',
      hidden: true,
      description:
        'Default API base URL for HTTP API calls, including the /api prefix (e.g. http://localhost:13000/api)',
    }),
    'api-base-url': Flags.string({
      char: 'u',
      description: 'Root URL for HTTP API calls, including the /api prefix (e.g. http://localhost:13000/api)',
    }),
    'auth-type': Flags.string({
      char: 'a',
      description:
        'Authentication: basic (username/password login), token (API key), or oauth (browser login via `nb env auth`)',
      options: ['basic', 'token', 'oauth'],
    }),
    'access-token': Flags.string({
      char: 't',
      aliases: ['token'],
      description: 'API key or access token when using --auth-type token',
    }),
    username: Flags.string({
      description: 'Username when using --auth-type basic',
    }),
    password: Flags.string({
      description: 'Password when using --auth-type basic',
    }),
    'skip-auth': Flags.boolean({
      description: 'Save the env auth mode now and finish authentication later with `nb env auth`',
      default: false,
    }),
    lang: Flags.string({ description: 'Language for the installed NocoBase app', char: 'l', required: false }),
    force: Flags.boolean({
      description: 'Reconfigure an existing env and replace conflicting runtime resources when needed',
      char: 'f',
      required: false,
    }),
    'app-path': Flags.string({
      description: 'App directory for a local npm/git app (default: ./<envName>/)',
    }),
    'app-root-path': Flags.string({
      hidden: true,
      deprecated: true,
      description: 'Legacy source directory for a local npm/git app',
    }),
    'app-port': Flags.string({
      description: 'HTTP port for the local app (default: 13000, or an available port with --yes)',
    }),
    'storage-path': Flags.string({
      hidden: true,
      deprecated: true,
      description: 'Legacy storage directory for uploads and managed database data',
    }),
    'app-public-path': Flags.string({
      description: 'Public path for the local app, for example / or /console/',
    }),
    'root-username': Flags.string({
      description: 'Initial admin username for the installed app',
      required: false,
    }),
    'root-email': Flags.string({
      description: 'Initial admin email for the installed app',
      required: false,
    }),
    'root-password': Flags.string({
      description: 'Initial admin password for the installed app',
      required: false,
    }),
    'root-nickname': Flags.string({
      description: 'Initial admin display name for the installed app',
      required: false,
    }),
    'builtin-db': Flags.boolean({
      allowNo: true,
      description: 'Create and connect a CLI-managed built-in database for the app',
      default: false,
    }),
    'db-dialect': Flags.string({
      description: 'Database dialect for the app',
      options: ['postgres', 'mysql', 'mariadb', 'kingbase'],
    }),
    'builtin-db-image': Flags.string({
      description: 'Docker image for the built-in database container (default follows the selected database)',
    }),
    'db-host': Flags.string({
      description: 'Database host for the app',
    }),
    'db-port': Flags.string({
      description: 'Database port for the app',
    }),
    'db-database': Flags.string({
      description: 'Database name for the app',
    }),
    'db-user': Flags.string({
      description: 'Database username for the app',
    }),
    'db-password': Flags.string({
      description: 'Database password for the app',
    }),
    'db-schema': Flags.string({
      description: 'Database schema for the app',
    }),
    'db-table-prefix': Flags.string({
      description: 'Database table prefix for the app',
    }),
    'db-underscored': Flags.boolean({
      allowNo: true,
      description: 'Use underscored database naming for the app',
      default: false,
    }),
    'skip-download': Flags.boolean({
      description: 'Skip the download step and reuse an existing local app directory or Docker image',
      default: false,
    }),
    'hook-script': Flags.string({
      description: 'Hook module copied to <appPath>/.nb/hooks.mjs and run before npm/git dependency installation.',
    }),
    ...omitKeys(Download.flags, ['yes', 'hook-script']),
  };

  /** Environment name only: run before {@link Install.prompts} (see `run`). */
  static envPrompts: PromptsCatalog = {
    env: {
      type: 'text',
      message: installText('prompts.env.message'),
      placeholder: installText('prompts.env.placeholder'),
      required: true,
      validate: validateEnvKey,
    },
  };

  static get appPrompts(): PromptsCatalog {
    return {
      lang: {
        type: 'select',
        message: installText('prompts.lang.message'),
        options: INSTALL_LANGUAGE_OPTIONS,
        initialValue: DEFAULT_INSTALL_LANG,
        yesInitialValue: DEFAULT_INSTALL_LANG,
      },
      // force: {
      //   type: 'boolean',
      //   message: 'Reinstall the application by clearing the database? (-f / --force)',
      //   initialValue: false,
      //   yesInitialValue: false,
      // },
      appPath: {
        type: 'text',
        message: installText('prompts.appPath.message', { root: resolveEnvRoot() }),
        placeholder: installText('prompts.appPath.placeholder'),
        initialValue: (values) => defaultInstallAppPath(values.env ?? values.appName),
        hidden: (values) => Boolean(Install.toOptionalPromptString(values.appRootPath)),
      },
      appPort: {
        type: 'text',
        message: installText('prompts.appPort.message'),
        placeholder: installText('prompts.appPort.placeholder'),
        validate: Install.validateAppPort,
      },
      appPublicPath: {
        type: 'text',
        message: installText('prompts.appPublicPath.message'),
        placeholder: installText('prompts.appPublicPath.placeholder'),
        initialValue: '/',
        yesInitialValue: '/',
        validate: validateAppPublicPath,
      },
    };
  }

  static dbPrompts: PromptsCatalog = {
    dbDialect: {
      type: 'select',
      message: installText('prompts.dbDialect.message'),
      options: [
        { value: 'postgres', label: 'PostgreSQL' },
        { value: 'mysql', label: 'MySQL' },
        { value: 'mariadb', label: 'MariaDB' },
        { value: 'kingbase', label: 'KingbaseES' },
      ],
      initialValue: 'postgres',
      yesInitialValue: 'postgres',
      required: true,
    },
    builtinDb: {
      type: 'boolean',
      message: installText('prompts.builtinDb.message'),
      initialValue: true,
      yesInitialValue: true,
      validate: validateBuiltinDbEnabled,
    },
    builtinDbImage: {
      type: 'text',
      message: installText('prompts.builtinDbImage.message'),
      placeholder: installText('prompts.builtinDbImage.placeholder'),
      initialValue: (values) =>
        defaultBuiltinDbImageForDialect(values.dbDialect, {
          registry: String(values.builtinDbImageRegistry ?? '').trim() || undefined,
        }),
      hidden: (values) => !values.builtinDb || !supportsBuiltinDbDialect(values.dbDialect),
      required: true,
    },
    dbHost: {
      type: 'text',
      message: installText('prompts.dbHost.message'),
      placeholder: installText('prompts.dbHost.placeholder'),
      initialValue: (values) => defaultDbHostForBuiltinDb(values),
      yesInitialValue: DEFAULT_INSTALL_BUILTIN_DB_HOST,
      required: true,
      validate: validateExternalDbPromptField,
      hidden: (values) => Boolean(values.builtinDb),
    },
    dbPort: {
      type: 'text',
      message: installText('prompts.dbPort.message'),
      placeholder: installText('prompts.dbPort.placeholder'),
      initialValue: (values) => defaultDbPortForDialect(values.dbDialect),
      required: true,
      validate: Install.validateDbPort,
      hidden: (values) => Boolean(values.builtinDb) && String(values.source ?? '').trim() === 'docker',
    },
    dbDatabase: {
      type: 'text',
      message: installText('prompts.dbDatabase.message'),
      initialValue: (values) => defaultDbDatabaseForDialect(values.dbDialect),
      required: true,
      validate: validateExternalDbPromptField,
    },
    dbUser: {
      type: 'text',
      message: installText('prompts.dbUser.message'),
      initialValue: DEFAULT_INSTALL_DB_USER,
      yesInitialValue: DEFAULT_INSTALL_DB_USER,
      required: true,
      validate: validateExternalDbPromptField,
    },
    dbPassword: {
      type: 'password',
      message: installText('prompts.dbPassword.message'),
      initialValue: DEFAULT_INSTALL_DB_PASSWORD,
      yesInitialValue: DEFAULT_INSTALL_DB_PASSWORD,
      required: true,
      validate: validateExternalDbPromptField,
    },
    dbSchema: {
      type: 'text',
      message: installText('prompts.dbSchema.message'),
      placeholder: installText('prompts.dbSchema.placeholder'),
      hidden: (values) => !supportsDbSchemaPrompt(values.dbDialect),
    },
    dbTablePrefix: {
      type: 'text',
      message: installText('prompts.dbTablePrefix.message'),
      placeholder: installText('prompts.dbTablePrefix.placeholder'),
    },
    dbUnderscored: {
      type: 'boolean',
      message: installText('prompts.dbUnderscored.message'),
      initialValue: false,
      yesInitialValue: false,
      validate: (value, values) =>
        validateExternalDbPromptField(value, {
          ...values,
          dbUnderscored: Boolean(value),
        }),
    },
  };

  static rootUserPrompts: PromptsCatalog = {
    rootUsername: {
      type: 'text',
      message: installText('prompts.rootUsername.message'),
      placeholder: installText('prompts.rootUsername.placeholder'),
      yesInitialValue: DEFAULT_INSTALL_ROOT_USERNAME,
      required: true,
    },
    rootEmail: {
      type: 'text',
      message: installText('prompts.rootEmail.message'),
      placeholder: installText('prompts.rootEmail.placeholder'),
      yesInitialValue: DEFAULT_INSTALL_ROOT_EMAIL,
      required: true,
    },
    rootPassword: {
      type: 'password',
      message: installText('prompts.rootPassword.message'),
      yesInitialValue: DEFAULT_INSTALL_ROOT_PASSWORD,
      required: true,
    },
    rootNickname: {
      type: 'text',
      message: installText('prompts.rootNickname.message'),
      placeholder: installText('prompts.rootNickname.placeholder'),
      yesInitialValue: DEFAULT_INSTALL_ROOT_NICKNAME,
      required: true,
    },
  };

  /**
   * App catalog with `env` seeded into `out` first so app path defaults can see `values.env`
   * (same iteration order as {@link runPromptCatalog}).
   */
  private static buildAppPromptsCatalog(seedEnv: string, options?: { resume?: boolean }): PromptsCatalog {
    return {
      seedEnv: {
        type: 'run',
        run: (values) => {
          (values as Record<string, PromptValue>).env = seedEnv;
        },
      },
      seedResume: {
        type: 'run',
        run: (values) => {
          const record = values as Record<string, PromptValue>;
          record.resume = Boolean(options?.resume);
        },
      },
      ...Install.appPrompts,
    };
  }

  private static buildDbPromptsCatalog(
    envName: string,
    downloadResults: Record<string, PromptValue>,
    options?: { resume?: boolean },
  ): PromptsCatalog {
    const source = String(downloadResults.source ?? '').trim();
    return {
      seedEnv: {
        type: 'run',
        run: (values) => {
          if (envName) {
            (values as Record<string, PromptValue>).env = envName;
          }
        },
      },
      seedDownloadSource: {
        type: 'run',
        run: (values) => {
          if (source) {
            (values as Record<string, PromptValue>).source = source;
          }
        },
      },
      seedResume: {
        type: 'run',
        run: (values) => {
          const record = values as Record<string, PromptValue>;
          record.resume = Boolean(options?.resume);
        },
      },
      ...Install.dbPrompts,
    };
  }

  /** Preset for {@link Install.envPrompts} only (`env` flag). */
  private static buildEnvPresetValuesFromFlags(flags: InstallParsedFlags): PromptInitialValues {
    const preset: PromptInitialValues = {};
    if (flags.env !== undefined && String(flags.env).trim() !== '') {
      preset.env = String(flags.env).trim();
    }
    return preset;
  }

  /**
   * Preset `values` for `runPromptCatalog`: keys here skip that prompt and fix the result.
   * Booleans with defaults are only preset when the user passed the flag on argv (see `download`).
   * Does not include `env` — use {@link buildEnvPresetValuesFromFlags} for {@link Install.envPrompts}.
   */
  private static buildPresetValuesFromFlags(
    flags: InstallParsedFlags,
    argv: string[] = process.argv.slice(2),
  ): PromptInitialValues {
    const preset: PromptInitialValues = {};

    const apiBaseUrl = Install.toOptionalPromptString(flags['api-base-url']);
    if (apiBaseUrl) {
      preset.apiBaseUrl = apiBaseUrl;
    } else if (flags['default-api-base-url'] !== undefined) {
      const defaultApiBaseUrl = Install.toOptionalPromptString(flags['default-api-base-url']);
      if (defaultApiBaseUrl) {
        preset.apiBaseUrl = defaultApiBaseUrl;
      }
    }

    if (flags['auth-type'] !== undefined) {
      const authType = Install.toOptionalPromptString(flags['auth-type']);
      if (authType) {
        preset.authType = authType;
      }
    }

    if (flags['skip-auth']) {
      preset.skipAuth = true;
    }

    if (flags['access-token'] !== undefined || flags.token !== undefined) {
      preset.accessToken = String(flags['access-token'] ?? flags.token ?? '');
    }

    if (flags.username !== undefined) {
      preset.username = String(flags.username ?? '').trim();
    }

    if (flags.password !== undefined) {
      preset.password = String(flags.password ?? '');
    }

    if (flags.lang !== undefined) {
      const v = String(flags.lang).trim();
      if (v) {
        preset.lang = v;
      }
    }

    if (argvHasToken(argv, ['--force', '-f'])) {
      preset.force = flags.force;
    }

    if (flags['app-path'] !== undefined) {
      const v = flags['app-path']?.trim();
      if (v) {
        preset.appPath = v;
      }
    }

    if (flags['app-root-path'] !== undefined) {
      const v = flags['app-root-path']?.trim();
      if (v) {
        preset.appRootPath = v;
      }
    }

    if (flags['app-port'] !== undefined) {
      const v = String(flags['app-port'] ?? '').trim();
      if (v) {
        preset.appPort = v;
      }
    }

    if (flags['storage-path'] !== undefined) {
      const v = flags['storage-path']?.trim();
      if (v) {
        preset.storagePath = v;
      }
    }

    if (flags['app-public-path'] !== undefined) {
      const v = String(flags['app-public-path'] ?? '').trim();
      if (v) {
        preset.appPublicPath = v;
      }
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

    if (argvHasToken(argv, ['--skip-download'])) {
      preset.skipDownload = flags['skip-download'];
      if (flags['skip-download']) {
        preset.dockerSave = false;
        preset.replace = false;
        preset.devDependencies = false;
        preset.build = false;
        preset.buildDts = false;
      }
    }

    if (argvHasToken(argv, ['--builtin-db', '--no-builtin-db'])) {
      preset.builtinDb = flags['builtin-db'];
    }

    if (flags['db-dialect'] !== undefined) {
      const t = String(flags['db-dialect']).trim();
      if (t && isInstallDbDialect(t)) {
        preset.dbDialect = t;
      }
    }
    if (flags['builtin-db-image'] !== undefined) {
      const v = String(flags['builtin-db-image'] ?? '').trim();
      if (v) {
        preset.builtinDbImage = v;
      }
    }

    if (flags['db-host'] !== undefined) {
      const v = String(flags['db-host'] ?? '').trim();
      if (v) {
        preset.dbHost = v;
        preset.builtinDb = false;
      }
    }
    if (flags['db-port'] !== undefined) {
      const v = String(flags['db-port'] ?? '').trim();
      if (v) {
        preset.dbPort = v;
      }
    }
    if (flags['db-database'] !== undefined) {
      const v = String(flags['db-database'] ?? '').trim();
      if (v) {
        preset.dbDatabase = v;
      }
    }
    if (flags['db-user'] !== undefined) {
      const v = String(flags['db-user'] ?? '').trim();
      if (v) {
        preset.dbUser = v;
      }
    }
    if (flags['db-password'] !== undefined) {
      preset.dbPassword = String(flags['db-password'] ?? '');
    }
    if (flags['db-schema'] !== undefined) {
      const v = String(flags['db-schema'] ?? '').trim();
      if (v) {
        preset.dbSchema = v;
      }
    }
    if (flags['db-table-prefix'] !== undefined) {
      const v = String(flags['db-table-prefix'] ?? '').trim();
      if (v) {
        preset.dbTablePrefix = v;
      }
    }
    if (argvHasToken(argv, ['--db-underscored', '--no-db-underscored'])) {
      preset.dbUnderscored = flags['db-underscored'];
    }

    return preset;
  }

  private static buildAppPresetValuesFromFlags(
    flags: InstallParsedFlags,
    argv: string[] = process.argv.slice(2),
  ): PromptInitialValues {
    return pickPresetKeys(Install.buildPresetValuesFromFlags(flags, argv), [
      'lang',
      'force',
      'appPath',
      'appRootPath',
      'appPort',
      'storagePath',
      'appPublicPath',
    ]);
  }

  private static buildDbPresetValuesFromFlags(
    flags: InstallParsedFlags,
    argv: string[] = process.argv.slice(2),
  ): PromptInitialValues {
    return pickPresetKeys(Install.buildPresetValuesFromFlags(flags, argv), [
      'builtinDb',
      'dbDialect',
      'builtinDbImage',
      'dbHost',
      'dbPort',
      'dbDatabase',
      'dbUser',
      'dbPassword',
      'dbSchema',
      'dbTablePrefix',
      'dbUnderscored',
    ]);
  }

  private static buildRootPresetValuesFromFlags(
    flags: InstallParsedFlags,
    argv: string[] = process.argv.slice(2),
  ): PromptInitialValues {
    return pickPresetKeys(Install.buildPresetValuesFromFlags(flags, argv), [
      'rootUsername',
      'rootEmail',
      'rootPassword',
      'rootNickname',
    ]);
  }

  private static buildEnvAddPresetValuesFromFlags(
    flags: InstallParsedFlags,
    argv: string[] = process.argv.slice(2),
  ): PromptInitialValues {
    return pickPresetKeys(Install.buildPresetValuesFromFlags(flags, argv), [
      'apiBaseUrl',
      'authType',
      'username',
      'password',
      'accessToken',
    ]);
  }

  private buildEnvAddPromptsForInstall(parsed: InstallParsedFlags): PromptsCatalog {
    const apiBaseUrlPrompt: TextPromptBlock = {
      ...(EnvAdd.prompts.apiBaseUrl as TextPromptBlock),
      validate: undefined,
    };
    const prompts: PromptsCatalog = {
      ...EnvAdd.prompts,
      apiBaseUrl: apiBaseUrlPrompt,
    };

    if (!parsed['skip-auth']) {
      return prompts;
    }

    const accessTokenPrompt: TextPromptBlock = {
      ...(EnvAdd.prompts.accessToken as TextPromptBlock),
      hidden: () => true,
    };

    return {
      ...prompts,
      accessToken: accessTokenPrompt,
    };
  }

  private static toOptionalPromptString(value: unknown): string | undefined {
    return toOptionalPromptString(value);
  }

  private static resolveManagedAppKey(value: unknown): string {
    return Install.toOptionalPromptString(value) ?? crypto.randomBytes(32).toString('hex');
  }

  private static resolveManagedTimeZone(value: unknown): string {
    return Install.toOptionalPromptString(value) ?? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  }

  private static formatLocalClientExtractWarning(envName: string, message: string): string {
    return [
      `Client assets were not extracted for "${envName}".`,
      'NocoBase will keep starting, but versioned client files for CDN or external distribution may be stale or missing.',
      `Details: ${message}`,
    ].join('\n');
  }

  private async ensureManagedAppRuntimeConfig(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
  }): Promise<void> {
    const savedEnv = await getEnv(params.envName, { scope: resolveDefaultConfigScope() });
    const savedConfig = savedEnv?.config;
    params.appResults.appKey = Install.resolveManagedAppKey(params.appResults.appKey ?? savedConfig?.appKey);
    params.appResults.timeZone = Install.resolveManagedTimeZone(params.appResults.timeZone ?? savedConfig?.timezone);
  }

  private static async validateAppPort(value, values): Promise<void | string | undefined> {
    const formatError = validateTcpPort(value);
    if (formatError) {
      return formatError;
    }

    return await Install.validateResumeAwareTcpPort(value, values, 'app');
  }

  private static async validateDbPort(value, values): Promise<void | string | undefined> {
    const formatError = validateTcpPort(value);
    if (formatError) {
      return formatError;
    }

    const builtinDb = values.builtinDb === undefined ? true : Boolean(values.builtinDb);
    const source = String(values.source ?? '').trim();
    if (!builtinDb || source === 'docker') {
      if (!builtinDb) {
        return await validateExternalDbConfig({ ...values, dbPort: value });
      }
      return undefined;
    }

    return await Install.validateResumeAwareTcpPort(value, values, 'db');
  }

  private static async validateResumeAwareTcpPort(
    value: PromptValue,
    values: PromptCatalogValues,
    target: 'app' | 'db',
  ): Promise<string | undefined> {
    const portError = await validateAvailableTcpPort(value);
    if (!portError) {
      return undefined;
    }

    const context = await Install.readResumePortValidationContext(values);
    if (!context) {
      return portError;
    }

    const port = Install.toOptionalPromptString(value);
    if (!port) {
      return portError;
    }

    const reusesManagedPort = await Install.isResumeManagedPortReuse({
      target,
      port,
      context,
    });
    return reusesManagedPort ? undefined : portError;
  }

  private static async ensureExternalDbReadyForInstall(dbResults: Record<string, PromptValue>): Promise<void> {
    const builtinDb = dbResults.builtinDb === undefined ? true : Boolean(dbResults.builtinDb);
    if (builtinDb) {
      return;
    }

    const dialect = String(dbResults.dbDialect ?? 'postgres').trim() || 'postgres';
    const host = String(dbResults.dbHost ?? '').trim();
    const port = String(dbResults.dbPort ?? '').trim();
    const database = String(dbResults.dbDatabase ?? '').trim();
    const address = host && port ? `${host}:${port}` : host || port || '(unknown address)';
    const target = database ? `${address}/${database}` : address;
    printVerbose(`Checking external ${dialect} database: ${target}`);

    const validationError = await validateExternalDbConfig(dbResults as PromptCatalogValues);
    if (validationError) {
      throw new Error(validationError);
    }

    const compatibilityError = await validateMysqlLowerCaseTableNamesCompatibility(dbResults as PromptCatalogValues);
    if (compatibilityError) {
      throw new Error(compatibilityError);
    }
  }

  private static async readResumePortValidationContext(
    values: PromptCatalogValues,
  ): Promise<ResumePortValidationContext | undefined> {
    if (!values.resume) {
      return undefined;
    }

    const envName = Install.toOptionalPromptString(values.env);
    if (!envName) {
      return undefined;
    }

    const source = Install.toOptionalPromptString(values.source);
    const builtinDb = values.builtinDb === undefined ? undefined : Boolean(values.builtinDb);
    const dbDialect = Install.toOptionalPromptString(values.dbDialect);
    const appRootPath = resolveConfiguredSourcePathValue(values as Record<string, PromptValue>, envName);
    const dockerNetworkName = await Install.resolveResumeDockerNetworkName();
    const dockerContainerPrefix = await Install.resolveResumeDockerContainerPrefix();

    return {
      envName,
      ...(dockerNetworkName ? { dockerNetworkName } : {}),
      ...(dockerContainerPrefix ? { dockerContainerPrefix } : {}),
      ...(source ? { source } : {}),
      ...(builtinDb !== undefined ? { builtinDb } : {}),
      ...(dbDialect ? { dbDialect } : {}),
      ...(appRootPath ? { appRootPath } : {}),
    };
  }

  private static async resolveResumeDockerNetworkName(): Promise<string | undefined> {
    return await resolveDockerNetworkName({ scope: resolveDefaultConfigScope() });
  }

  private static async resolveResumeDockerContainerPrefix(): Promise<string | undefined> {
    return await resolveDockerContainerPrefix({ scope: resolveDefaultConfigScope() });
  }

  private static async isResumeManagedPortReuse(params: {
    target: 'app' | 'db';
    port: string;
    context: ResumePortValidationContext;
  }): Promise<boolean> {
    if (params.target === 'app') {
      if ((params.context.source === 'npm' || params.context.source === 'git') && params.context.appRootPath) {
        return await Install.isLocalPm2ProcessUsingPort(params.context.appRootPath, params.port);
      }

      const containerName = Install.buildDockerAppContainerName(
        params.context.envName,
        params.context.dockerContainerPrefix,
      );
      return await Install.isDockerContainerPublishingPort(containerName, params.port);
    }

    if (!params.context.builtinDb || params.context.source === 'docker') {
      return false;
    }

    const containerName = Install.buildBuiltinDbContainerName(
      params.context.envName,
      params.context.dbDialect ?? 'postgres',
      params.context.dockerContainerPrefix,
    );
    return await Install.isDockerContainerPublishingPort(containerName, params.port);
  }

  private static async isDockerContainerPublishingPort(containerName: string, port: string): Promise<boolean> {
    if (!containerName || !port) {
      return false;
    }

    const exists = await commandSucceeds('docker', ['container', 'inspect', containerName]);
    if (!exists) {
      return false;
    }

    try {
      const output = await commandOutput('docker', ['port', containerName]);
      return output.split(/\r?\n/).some((line) => line.includes(`:${port}`));
    } catch {
      return false;
    }
  }

  private static async isLocalPm2ProcessUsingPort(appRootPath: string, port: string): Promise<boolean> {
    const cwd = resolveConfiguredEnvPath(appRootPath);
    if (!cwd) {
      return false;
    }

    try {
      const output = await commandOutput('pm2', ['jlist'], { cwd });
      const rows = JSON.parse(output) as Array<{
        pm2_env?: {
          pm_cwd?: string;
          env?: Record<string, string | undefined>;
        };
      }>;

      return rows.some((row) => {
        const pmCwd = Install.toOptionalPromptString(row.pm2_env?.pm_cwd);
        const appPort = Install.toOptionalPromptString(row.pm2_env?.env?.APP_PORT);
        return Boolean(pmCwd && appPort && pmCwd === cwd && appPort === port);
      });
    } catch {
      return false;
    }
  }

  static buildResumePresetValues(env: Pick<Env, 'name' | 'config'>) {
    const envName = String(env.name ?? '').trim();
    const config = env.config ?? {};
    const source = Install.toOptionalPromptString(config.source);
    const appPath = Install.toOptionalPromptString(config.appPath) ?? inferConfiguredAppPathFromLegacyConfig(config);
    const appRootPath = Install.toOptionalPromptString(config.appRootPath);
    const appPort = Install.toOptionalPromptString(config.appPort);
    const storagePath = Install.toOptionalPromptString(config.storagePath);
    const appPublicPath = Install.toOptionalPromptString(config.appPublicPath);
    const hookScript = Install.toOptionalPromptString(config.hookScript);
    const apiBaseUrl = Install.toOptionalPromptString(config.apiBaseUrl);
    const downloadVersion = Install.toOptionalPromptString(config.downloadVersion);
    const dockerRegistry = Install.toOptionalPromptString(config.dockerRegistry);
    const dockerPlatform = Install.toOptionalPromptString(config.dockerPlatform);
    const gitUrl = Install.toOptionalPromptString(config.gitUrl);
    const npmRegistry = Install.toOptionalPromptString(config.npmRegistry);
    const dbDialect = Install.toOptionalPromptString(config.dbDialect);
    const dbHost = Install.toOptionalPromptString(config.dbHost);
    const dbPort = Install.toOptionalPromptString(config.dbPort);
    const dbDatabase = Install.toOptionalPromptString(config.dbDatabase);
    const dbUser = Install.toOptionalPromptString(config.dbUser);
    const dbPassword = Install.toOptionalPromptString(config.dbPassword);
    const dbSchema = Install.toOptionalPromptString(config.dbSchema);
    const dbTablePrefix = Install.toOptionalPromptString(config.dbTablePrefix);
    const dbUnderscored = typeof config.dbUnderscored === 'boolean' ? config.dbUnderscored : undefined;
    const builtinDbImage = Install.toOptionalPromptString(config.builtinDbImage);
    const rootUsername = Install.toOptionalPromptString(config.rootUsername);
    const rootEmail = Install.toOptionalPromptString(config.rootEmail);
    const rootPassword = Install.toOptionalPromptString(config.rootPassword);
    const rootNickname = Install.toOptionalPromptString(config.rootNickname);
    const lang = Install.toOptionalPromptString(config.lang);
    const auth = config.auth as { type?: string; accessToken?: string } | undefined;
    const savedAuthType = Install.toOptionalPromptString(config.authType) ?? Install.toOptionalPromptString(auth?.type);

    const appPreset: PromptInitialValues = {
      ...(lang ? { lang } : {}),
      ...(appPath ? { appPath } : {}),
      ...(appRootPath ? { appRootPath } : {}),
      ...(appPort ? { appPort } : {}),
      ...(storagePath ? { storagePath } : {}),
      ...(appPublicPath ? { appPublicPath } : {}),
      ...(hookScript ? { hookScript } : {}),
    };

    const downloadPreset: PromptInitialValues = {
      ...(source ? { source } : {}),
      ...(downloadVersion
        ? {
            version: downloadVersionPromptValue(downloadVersion),
            ...(downloadVersionPromptValue(downloadVersion) === 'other' ? { otherVersion: downloadVersion } : {}),
          }
        : {}),
      ...(dockerRegistry ? { dockerRegistry } : {}),
      ...(dockerPlatform ? { dockerPlatform } : {}),
      ...(gitUrl ? { gitUrl } : {}),
      ...(npmRegistry ? { npmRegistry } : {}),
      ...(typeof config.devDependencies === 'boolean' ? { devDependencies: config.devDependencies } : {}),
      ...(typeof config.build === 'boolean' ? { build: config.build } : {}),
      ...(typeof config.buildDts === 'boolean' ? { buildDts: config.buildDts } : {}),
    };

    const dbPreset: PromptInitialValues = {
      ...(typeof config.builtinDb === 'boolean' ? { builtinDb: config.builtinDb } : {}),
      ...(dbDialect ? { dbDialect } : {}),
      ...(builtinDbImage ? { builtinDbImage } : {}),
      ...(dbHost ? { dbHost } : {}),
      ...(dbPort ? { dbPort } : {}),
      ...(dbDatabase ? { dbDatabase } : {}),
      ...(dbUser ? { dbUser } : {}),
      ...(dbPassword ? { dbPassword } : {}),
      ...(dbSchema ? { dbSchema } : {}),
      ...(dbTablePrefix ? { dbTablePrefix } : {}),
      ...(dbUnderscored !== undefined ? { dbUnderscored } : {}),
    };

    const rootPreset: PromptInitialValues = {
      ...(rootUsername ? { rootUsername } : {}),
      ...(rootEmail ? { rootEmail } : {}),
      ...(rootPassword ? { rootPassword } : {}),
      ...(rootNickname ? { rootNickname } : {}),
    };

    const envAddPreset: PromptInitialValues = {};
    if (apiBaseUrl) {
      envAddPreset.apiBaseUrl = apiBaseUrl;
    }
    if (savedAuthType === 'token') {
      envAddPreset.authType = 'token';
      if (Install.toOptionalPromptString(auth.accessToken)) {
        envAddPreset.accessToken = String(auth.accessToken);
      }
    } else if (savedAuthType === 'basic') {
      envAddPreset.authType = 'basic';
      const authUsername = Install.toOptionalPromptString(config.authUsername) ?? rootUsername;
      if (authUsername) {
        envAddPreset.username = authUsername;
      }
    } else if (savedAuthType === 'oauth') {
      envAddPreset.authType = 'oauth';
    }

    return {
      envPreset: {
        ...(envName ? { env: envName } : {}),
      },
      appPreset,
      downloadPreset,
      dbPreset,
      rootPreset,
      envAddPreset,
    };
  }

  private static buildResumeMissingYesFlags(
    flags: InstallParsedFlags,
    resumePreset: Pick<ResumePresetValues, 'appPreset' | 'rootPreset'>,
  ): string[] {
    const missing: string[] = [];
    if (!Install.toOptionalPromptString(flags.lang) && !Install.toOptionalPromptString(resumePreset.appPreset.lang)) {
      missing.push('--lang');
    }
    if (
      !Install.toOptionalPromptString(flags['root-username']) &&
      !Install.toOptionalPromptString(resumePreset.rootPreset.rootUsername)
    ) {
      missing.push('--root-username');
    }
    if (
      !Install.toOptionalPromptString(flags['root-email']) &&
      !Install.toOptionalPromptString(resumePreset.rootPreset.rootEmail)
    ) {
      missing.push('--root-email');
    }
    if (
      !Install.toOptionalPromptString(flags['root-password']) &&
      !Install.toOptionalPromptString(resumePreset.rootPreset.rootPassword)
    ) {
      missing.push('--root-password');
    }
    if (
      !Install.toOptionalPromptString(flags['root-nickname']) &&
      !Install.toOptionalPromptString(resumePreset.rootPreset.rootNickname)
    ) {
      missing.push('--root-nickname');
    }
    return missing;
  }

  private async resolveResumePresetValues(
    parsed: InstallParsedFlags & DownloadParsedFlags,
    yes: boolean,
  ): Promise<ResumePresetValues | undefined> {
    if (!parsed.resume) {
      return undefined;
    }

    const env = await getEnv(parsed.env, { scope: resolveDefaultConfigScope() });
    if (!env) {
      throw new Error(formatMissingManagedAppEnvMessage(parsed.env));
    }

    const resumePreset = Install.buildResumePresetValues(env);

    if (yes) {
      const missingFlags = Install.buildResumeMissingYesFlags(parsed, resumePreset);
      if (missingFlags.length > 0) {
        throw new Error(
          [
            `Cannot continue setup for "${env.name}" in non-interactive resume mode yet.`,
            `These setup-only flags are not saved in the env config: ${missingFlags.join(', ')}`,
            `Run \`nb init --ui --env ${env.name} --resume\` without \`--yes\`, or pass those flags again.`,
          ].join('\n'),
        );
      }
    }

    return resumePreset;
  }

  static async resolveAvailableDefaultPort(
    defaultPort: string,
    options?: {
      label?: string;
      warn?: boolean;
    },
  ): Promise<string> {
    const normalized = String(defaultPort).trim();
    const portError = await validateAvailableTcpPort(normalized);

    if (!portError) {
      return normalized;
    }

    const nextPort = await findAvailableTcpPort();
    if (options?.warn) {
      printWarning(
        `${
          options.label ?? 'Default port'
        } ${normalized} is already in use. Using available port ${nextPort} for this setup.`,
      );
    }

    return nextPort;
  }

  static async buildAppPromptInitialValues(params: {
    envName?: string;
    flags: Pick<InstallParsedFlags, 'app-port' | 'app-path' | 'app-root-path' | 'storage-path'>;
    warnOnPortFallback?: boolean;
  }): Promise<PromptInitialValues> {
    const initialValues: PromptInitialValues = {};
    const envName = params.envName ?? DEFAULT_INSTALL_ENV_NAME;

    if (params.flags['app-path'] === undefined && params.flags['app-root-path'] === undefined) {
      initialValues.appPath = defaultInstallAppPath(envName);
    }

    if (params.flags['app-root-path'] === undefined) {
      initialValues.appRootPath = defaultInstallAppRootPath(envName);
    }

    if (params.flags['storage-path'] === undefined) {
      initialValues.storagePath = defaultInstallStoragePath(envName);
    }

    if (params.flags['app-port'] === undefined) {
      initialValues.appPort = await Install.resolveAvailableDefaultPort(DEFAULT_INSTALL_APP_PORT, {
        label: 'Default app port',
        warn: params.warnOnPortFallback ?? true,
      });
    }

    return initialValues;
  }

  private static shouldPublishBuiltinDbPortForValues(values: Record<string, PromptValue>): boolean {
    const builtinDb = values.builtinDb === undefined ? true : Boolean(values.builtinDb);
    return builtinDb && Install.shouldPublishBuiltinDbPort(values.source);
  }

  static async buildDbPromptInitialValues(params: {
    flags: Pick<InstallParsedFlags, 'db-port'>;
    downloadResults: Record<string, PromptValue>;
    dbPreset: PromptInitialValues;
    warnOnPortFallback?: boolean;
  }): Promise<PromptInitialValues> {
    const configuredRegistry = await getCliConfigValue('nb-image-registry');
    const values = {
      ...params.downloadResults,
      ...params.dbPreset,
    } as Record<string, PromptValue>;
    const dockerRegistry =
      String(values.dockerRegistry ?? '').trim() || resolveOfficialDockerRegistry(configuredRegistry);
    const dialect = String(values.dbDialect ?? 'postgres').trim() || 'postgres';
    const initialValues: PromptInitialValues =
      values.builtinDb !== false && params.dbPreset.builtinDbImage === undefined
        ? { builtinDbImage: defaultBuiltinDbImageForDialect(dialect, { registry: dockerRegistry }) }
        : {};

    if (params.flags['db-port'] !== undefined) {
      return initialValues;
    }

    if (!Install.shouldPublishBuiltinDbPortForValues(values)) {
      return initialValues;
    }

    const defaultPort = defaultDbPortForDialect(dialect);
    return {
      ...initialValues,
      dbPort: await Install.resolveAvailableDefaultPort(defaultPort, {
        label: `Default ${dialect} port`,
        warn: params.warnOnPortFallback ?? true,
      }),
    };
  }

  /**
   * When install runs {@link Download.prompts} after app prompts, align the download
   * output directory with app settings, while Docker registry defaults follow the CLI locale.
   */
  private static async buildDownloadPromptOptionsForInstall(
    appResults: Record<string, PromptValue>,
    envName: string,
  ): Promise<RunPromptCatalogOptions> {
    const appRoot = resolveConfiguredSourcePathValue(appResults, envName);
    const lang = String(appResults.lang ?? DEFAULT_INSTALL_LANG).trim() || DEFAULT_INSTALL_LANG;
    const dockerRegistry = resolveOfficialDockerRegistry(await getCliConfigValue('nb-image-registry'));
    const initialValues: PromptInitialValues = {
      lang,
      dockerRegistry,
      outputDir: appRoot,
    };

    const values: PromptInitialValues = {
      lang,
    };

    return {
      initialValues,
      values,
      yes: false,
      hooks: {
        onCancel: () => {
          exit(0);
        },
        onMissingNonInteractive: (message: string) => {
          console.error(message);
          exit(1);
        },
      },
    };
  }

  /**
   * Resolve the effective preset `values` for the embedded download step.
   * Explicit download flags win; otherwise `-y` falls back to the docker + alpha quickstart path.
   */
  private static buildDownloadPresetValuesForInstall(
    flags: DownloadParsedFlags & Pick<InstallParsedFlags, 'resume'>,
    appResults: Record<string, PromptValue>,
    envName: string,
    yes: boolean,
    argv: string[] = process.argv.slice(2),
  ): PromptInitialValues {
    const preset: PromptInitialValues = {};
    const appRoot = resolveConfiguredSourcePathValue(appResults, envName);
    const lang = String(appResults.lang ?? DEFAULT_INSTALL_LANG).trim() || DEFAULT_INSTALL_LANG;

    preset.lang = lang;

    if (flags.source !== undefined && String(flags.source).trim() !== '') {
      preset.source = String(flags.source).trim();
    }

    if (flags.version !== undefined) {
      const version = String(flags.version).trim() || 'latest';
      preset.version = downloadVersionPromptValue(version);
      if (preset.version === 'other') {
        preset.otherVersion = version;
      }
    }

    if (flags['docker-registry'] !== undefined) {
      const value = String(flags['docker-registry'] ?? '').trim();
      if (value) {
        preset.dockerRegistry = value;
      }
    }

    if (flags['docker-platform'] !== undefined) {
      const value = String(flags['docker-platform'] ?? '').trim();
      if (value) {
        preset.dockerPlatform = value;
      }
    }

    if (flags['output-dir'] !== undefined) {
      const value = String(flags['output-dir'] ?? '').trim();
      if (value) {
        preset.outputDir = value;
      }
    }

    if (flags['git-url'] !== undefined) {
      const value = String(flags['git-url'] ?? '').trim();
      if (value) {
        preset.gitUrl = value;
      }
    }

    if (flags['npm-registry'] !== undefined) {
      preset.npmRegistry = typeof flags['npm-registry'] === 'string' ? flags['npm-registry'] : '';
    }

    if (flags.resume && !argvHasToken(argv, ['--replace', '-r'])) {
      preset.replace = true;
    } else if (argvHasToken(argv, ['--replace', '-r'])) {
      preset.replace = flags.replace;
    }

    if (argvHasToken(argv, ['--dev-dependencies', '--no-dev-dependencies', '-D'])) {
      preset.devDependencies = flags['dev-dependencies'];
    }

    if (argvHasToken(argv, ['--docker-save', '--no-docker-save'])) {
      preset.dockerSave = flags['docker-save'];
    }

    if (argvHasToken(argv, ['--build', '--no-build'])) {
      preset.build = flags.build;
    }

    if (argvHasToken(argv, ['--build-dts', '--no-build-dts'])) {
      preset.buildDts = flags['build-dts'];
    }

    if (yes && !flags.resume) {
      preset.source ??= 'docker';
      preset.version ??= 'alpha';
      preset.outputDir ??= appRoot;
    }

    return preset;
  }

  private static sanitizeDockerResourceName(value: string): string {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || 'nocobase';
  }

  private static defaultDockerNetworkName(): string {
    return Install.sanitizeDockerResourceName(defaultDockerNetworkName());
  }

  private static defaultDockerContainerPrefix(): string {
    return Install.sanitizeDockerResourceName(
      defaultDockerContainerPrefix(resolveEnvRoot(resolveDefaultConfigScope())),
    );
  }

  private static buildBuiltinDbContainerPrefix(containerPrefix?: PromptValue): string {
    const storedName = String(containerPrefix ?? '').trim();
    return storedName ? Install.sanitizeDockerResourceName(storedName) : Install.defaultDockerContainerPrefix();
  }

  private static buildManagedDockerNetworkName(networkName?: PromptValue): string {
    const storedName = String(networkName ?? '').trim();
    return storedName ? Install.sanitizeDockerResourceName(storedName) : Install.defaultDockerNetworkName();
  }

  private static buildBuiltinDbNetworkName(envName: string, networkName?: PromptValue): string {
    void envName;
    return Install.buildManagedDockerNetworkName(networkName);
  }

  private static buildBuiltinDbContainerName(
    envName: string,
    dbDialect: string,
    containerPrefix?: PromptValue,
  ): string {
    return Install.sanitizeDockerResourceName(
      `${Install.buildBuiltinDbContainerPrefix(containerPrefix)}-${envName}-${dbDialect}`,
    );
  }

  private static buildDockerAppContainerName(envName: string, containerPrefix?: PromptValue): string {
    return Install.sanitizeDockerResourceName(
      `${Install.buildBuiltinDbContainerPrefix(containerPrefix)}-${envName}-app`,
    );
  }

  private static buildInitAppEnvVars(params: {
    appResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
  }): Record<string, string> {
    return buildInitAppEnvVarsFromConfig({
      lang: String(params.appResults.lang ?? ''),
      rootUsername: String(params.rootResults.rootUsername ?? ''),
      rootEmail: String(params.rootResults.rootEmail ?? ''),
      rootPassword: String(params.rootResults.rootPassword ?? ''),
      rootNickname: String(params.rootResults.rootNickname ?? ''),
    });
  }

  private static shouldPublishBuiltinDbPort(source: PromptValue | undefined): boolean {
    return String(source ?? '').trim() !== 'docker';
  }

  static buildBuiltinDbPlan(params: {
    envName: string;
    workspaceName?: PromptValue;
    dockerNetworkName?: PromptValue;
    dockerContainerPrefix?: PromptValue;
    appPath?: PromptValue;
    storagePath: string;
    source?: PromptValue;
    dbDialect?: PromptValue;
    dbHost?: PromptValue;
    dbPort?: PromptValue;
    dbDatabase?: PromptValue;
    dbUser?: PromptValue;
    dbPassword?: PromptValue;
    builtinDbImage?: PromptValue;
  }): BuiltinDbPlan {
    const dbDialect = String(params.dbDialect ?? 'postgres').trim() || 'postgres';
    const dbPort =
      String(params.dbPort ?? defaultDbPortForDialect(dbDialect)).trim() || defaultDbPortForDialect(dbDialect);
    const defaultDbDatabase = defaultDbDatabaseForDialect(dbDialect);
    const networkName = Install.buildBuiltinDbNetworkName(
      params.envName,
      params.dockerNetworkName ?? params.workspaceName,
    );
    const containerName = Install.buildBuiltinDbContainerName(
      params.envName,
      dbDialect,
      params.dockerContainerPrefix ?? params.workspaceName,
    );
    const dbHostInput = String(params.dbHost ?? '').trim();
    const dbHost = Install.shouldPublishBuiltinDbPort(params.source)
      ? dbHostInput && dbHostInput !== DEFAULT_INSTALL_BUILTIN_DB_HOST && dbHostInput !== containerName
        ? dbHostInput
        : DEFAULT_INSTALL_DB_HOST
      : dbHostInput && dbHostInput !== DEFAULT_INSTALL_DB_HOST && dbHostInput !== 'localhost'
        ? dbHostInput
        : containerName;

    const storagePath =
      resolveConfiguredEnvPath(params.storagePath) ??
      resolveEnvRelativePath(
        resolveConfiguredStoragePathValue({ appPath: params.appPath, storagePath: params.storagePath }, params.envName),
      );

    if (dbDialect === 'postgres') {
      const image = String(params.builtinDbImage ?? '').trim() || defaultBuiltinDbImageForDialect(dbDialect);
      const dataDir = path.resolve(storagePath, 'db', 'postgres');
      const args = [
        'run',
        '-d',
        '--name',
        containerName,
        '--network',
        networkName,
        '-e',
        `POSTGRES_USER=${String(params.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER}`,
        '-e',
        `POSTGRES_DB=${String(params.dbDatabase ?? DEFAULT_INSTALL_DB_DATABASE).trim() || DEFAULT_INSTALL_DB_DATABASE}`,
        '-e',
        `POSTGRES_PASSWORD=${String(params.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD}`,
        '-v',
        `${dataDir}:/var/lib/postgresql/data`,
      ];

      if (Install.shouldPublishBuiltinDbPort(params.source)) {
        args.push('-p', `${dbPort}:5432`);
      }

      args.push(image, 'postgres', '-c', 'wal_level=logical');

      return {
        source: String(params.source ?? '').trim() || undefined,
        dbDialect,
        dbHost,
        dbPort,
        dbDatabase: String(params.dbDatabase ?? defaultDbDatabase).trim() || defaultDbDatabase,
        dbUser: String(params.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER,
        dbPassword: String(params.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD,
        networkName,
        containerName,
        dataDir,
        builtinDbImage: image,
        image,
        args,
      };
    }

    if (dbDialect === 'mysql') {
      const image = String(params.builtinDbImage ?? '').trim() || defaultBuiltinDbImageForDialect(dbDialect);
      const dataDir = path.resolve(storagePath, 'db', 'mysql');
      const dbUser = String(params.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER;
      const dbDatabase = String(params.dbDatabase ?? defaultDbDatabase).trim() || defaultDbDatabase;
      const dbPassword = String(params.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD;
      const args = [
        'run',
        '-d',
        '--name',
        containerName,
        '--network',
        networkName,
        '-e',
        `MYSQL_USER=${dbUser}`,
        '-e',
        `MYSQL_DATABASE=${dbDatabase}`,
        '-e',
        `MYSQL_PASSWORD=${dbPassword}`,
        '-e',
        `MYSQL_ROOT_PASSWORD=${dbPassword}`,
        '-v',
        `${dataDir}:/var/lib/mysql`,
      ];

      if (Install.shouldPublishBuiltinDbPort(params.source)) {
        args.push('-p', `${dbPort}:3306`);
      }

      args.push(image);

      return {
        source: String(params.source ?? '').trim() || undefined,
        dbDialect,
        dbHost,
        dbPort,
        dbDatabase,
        dbUser,
        dbPassword,
        networkName,
        containerName,
        dataDir,
        builtinDbImage: image,
        image,
        args,
      };
    }

    if (dbDialect === 'mariadb') {
      const image = String(params.builtinDbImage ?? '').trim() || defaultBuiltinDbImageForDialect(dbDialect);
      const dataDir = path.resolve(storagePath, 'db', 'mariadb');
      const dbUser = String(params.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER;
      const dbDatabase = String(params.dbDatabase ?? defaultDbDatabase).trim() || defaultDbDatabase;
      const dbPassword = String(params.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD;
      const args = [
        'run',
        '-d',
        '--name',
        containerName,
        '--network',
        networkName,
        '-e',
        `MARIADB_USER=${dbUser}`,
        '-e',
        `MARIADB_DATABASE=${dbDatabase}`,
        '-e',
        `MARIADB_PASSWORD=${dbPassword}`,
        '-e',
        `MARIADB_ROOT_PASSWORD=${dbPassword}`,
        '-v',
        `${dataDir}:/var/lib/mysql`,
      ];

      if (Install.shouldPublishBuiltinDbPort(params.source)) {
        args.push('-p', `${dbPort}:3306`);
      }

      args.push(image);

      return {
        source: String(params.source ?? '').trim() || undefined,
        dbDialect,
        dbHost,
        dbPort,
        dbDatabase,
        dbUser,
        dbPassword,
        networkName,
        containerName,
        dataDir,
        builtinDbImage: image,
        image,
        args,
      };
    }

    if (dbDialect === 'kingbase') {
      const image = String(params.builtinDbImage ?? '').trim() || defaultBuiltinDbImageForDialect(dbDialect);
      const dataDir = path.resolve(storagePath, 'db', 'kingbase');
      const dbUser = String(params.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER;
      const dbDatabase = String(params.dbDatabase ?? defaultDbDatabase).trim() || defaultDbDatabase;
      const dbPassword = String(params.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD;
      const args = [
        'run',
        '-d',
        '--name',
        containerName,
        '--network',
        networkName,
        '--platform',
        'linux/amd64',
        '--privileged',
        '-e',
        'ENABLE_CI=no',
        '-e',
        `DB_USER=${dbUser}`,
        '-e',
        `DB_PASSWORD=${dbPassword}`,
        '-e',
        'DB_MODE=pg',
        '-e',
        'NEED_START=yes',
        '-v',
        `${dataDir}:/home/kingbase/userdata`,
      ];

      if (Install.shouldPublishBuiltinDbPort(params.source)) {
        args.push('-p', `${dbPort}:54321`);
      }

      args.push(image, '/usr/sbin/init');

      return {
        source: String(params.source ?? '').trim() || undefined,
        dbDialect,
        dbHost,
        dbPort,
        dbDatabase,
        dbUser,
        dbPassword,
        networkName,
        containerName,
        dataDir,
        builtinDbImage: image,
        image,
        args,
      };
    }

    throw new Error(
      `Built-in database does not support "${dbDialect}" yet. Please choose PostgreSQL, MySQL, MariaDB, or KingbaseES.`,
    );
  }

  private async ensureDockerNetwork(name: string): Promise<void> {
    if (this.ensuredDockerNetworks.has(name)) {
      return;
    }

    await ensureDockerDaemonRunning('prepare Docker resources for this environment');

    printVerbose(`Checking Docker network: ${name}`);
    const exists = await commandSucceeds('docker', ['network', 'inspect', name]);
    if (exists) {
      printVerbose(`Docker network already exists: ${name}`);
      this.ensuredDockerNetworks.add(name);
      return;
    }

    printVerbose(`Creating Docker network: ${name}`);
    try {
      await run('docker', ['network', 'create', name], {
        errorName: 'docker network create',
      });
      printVerbose(`Docker network is ready: ${name}`);
      this.ensuredDockerNetworks.add(name);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (/address pools have been fully subnetted/i.test(message)) {
        throw new Error(
          [
            `Docker could not create network "${name}" because its address pools are exhausted.`,
            'Remove unused Docker networks and try again, for example: docker network prune',
            `Original error: ${message}`,
          ].join('\n'),
        );
      }
      throw error;
    }
  }

  private async dockerContainerExists(name: string): Promise<boolean> {
    return await commandSucceeds('docker', ['container', 'inspect', name]);
  }

  private async removeDockerContainer(name: string): Promise<void> {
    await run('docker', ['rm', '-f', name], {
      errorName: 'docker rm',
      stdio: 'ignore',
    });
  }

  private async removeDockerContainerIfForced(params: {
    containerName: string;
    displayName: string;
    force?: boolean;
  }): Promise<boolean> {
    const exists = await this.dockerContainerExists(params.containerName);
    if (!exists) {
      return false;
    }

    if (!params.force) {
      return true;
    }

    printVerbose(`Removing existing ${params.displayName}: ${params.containerName}`);
    await this.removeDockerContainer(params.containerName);
    return false;
  }

  private async inspectDockerContainerEnv(name: string): Promise<Record<string, string>> {
    const output = await commandOutput('docker', [
      'inspect',
      '--format',
      '{{range .Config.Env}}{{println .}}{{end}}',
      name,
    ]);
    const env: Record<string, string> = {};
    for (const line of output.split(/\r?\n/)) {
      const index = line.indexOf('=');
      if (index <= 0) {
        continue;
      }
      env[line.slice(0, index)] = line.slice(index + 1);
    }
    return env;
  }

  private async ensureBuiltinDbContainer(
    plan: BuiltinDbPlan,
    options?: { stdio?: 'inherit' | 'ignore' },
  ): Promise<void> {
    const exists = await this.dockerContainerExists(plan.containerName);
    if (exists) {
      printVerbose(`Built-in ${plan.dbDialect} container already exists: ${plan.containerName}`);
      return;
    }

    await mkdir(plan.dataDir, { recursive: true });
    await run('docker', plan.args, {
      errorName: 'docker run',
      stdio: options?.stdio ?? 'ignore',
    });
  }

  private async startBuiltinDb(params: {
    envName: string;
    workspaceName?: PromptValue;
    dockerNetworkName?: PromptValue;
    dockerContainerPrefix?: PromptValue;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    force?: boolean;
    commandStdio?: 'inherit' | 'ignore';
  }): Promise<BuiltinDbPlan> {
    const storagePath = resolveConfiguredStoragePathValue(params.appResults, params.envName);
    const plan = Install.buildBuiltinDbPlan({
      envName: params.envName,
      workspaceName: params.workspaceName,
      dockerNetworkName: params.dockerNetworkName,
      dockerContainerPrefix: params.dockerContainerPrefix,
      appPath: params.appResults.appPath,
      storagePath,
      source: params.downloadResults.source,
      dbDialect: params.dbResults.dbDialect,
      dbHost: params.dbResults.dbHost,
      dbPort: params.dbResults.dbPort,
      dbDatabase: params.dbResults.dbDatabase,
      dbUser: params.dbResults.dbUser,
      dbPassword: params.dbResults.dbPassword,
      builtinDbImage: params.dbResults.builtinDbImage,
    });

    this.logStage('Preparing database');
    printInfo(`Using built-in ${plan.dbDialect} database.`);
    await this.ensureDockerNetwork(plan.networkName);
    const existingContainerKept = await this.removeDockerContainerIfForced({
      containerName: plan.containerName,
      displayName: `built-in ${plan.dbDialect} container`,
      force: params.force,
    });

    if (!existingContainerKept && Install.shouldPublishBuiltinDbPort(params.downloadResults.source)) {
      const portError = await validateAvailableTcpPort(plan.dbPort);
      if (portError) {
        throw new Error(`Built-in ${plan.dbDialect} needs host port ${plan.dbPort}, but ${portError}`);
      }
    }

    await this.ensureBuiltinDbContainer(plan, {
      stdio: params.commandStdio ?? 'ignore',
    });
    printInfo(`${upperFirst(plan.dbDialect)} database ready.`);
    printVerbose(`Built-in ${plan.dbDialect} database ready at ${plan.dbHost}:${plan.dbPort}`);

    return plan;
  }

  private static async buildDockerAppPlan(params: {
    envName: string;
    workspaceName?: PromptValue;
    dockerContainerPrefix?: PromptValue;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
    networkName: string;
  }): Promise<DockerAppPlan> {
    const configuredRegistry = await getCliConfigValue('nb-image-registry');
    const configuredVariant =
      normalizeNbImageVariant(await getCliConfigValue('nb-image-variant')) ?? DEFAULT_NB_IMAGE_VARIANT;
    const dockerRegistry =
      String(downloadResultsValue(params.downloadResults, 'dockerRegistry') ?? '').trim() ||
      resolveOfficialDockerRegistry(configuredRegistry);
    const version =
      String(downloadResultsValue(params.downloadResults, 'version') ?? '').trim() || DEFAULT_DOCKER_VERSION;
    const imageRef = resolveDockerImageRef(dockerRegistry, version, {
      defaultRegistry: resolveOfficialDockerRegistry(configuredRegistry),
      defaultVersion: DEFAULT_DOCKER_VERSION,
      variant: inferNbImageRegistryFromRepository(dockerRegistry) ? configuredVariant : undefined,
    });
    const appPort = String(params.appResults.appPort ?? DEFAULT_INSTALL_APP_PORT).trim() || DEFAULT_INSTALL_APP_PORT;
    const configuredStoragePath = resolveConfiguredStoragePathValue(params.appResults, params.envName);
    const storagePath =
      resolveConfiguredEnvPath(configuredStoragePath) ??
      resolveEnvRelativePath(defaultInstallStoragePath(params.envName));
    const dbDialect = String(params.dbResults.dbDialect ?? 'postgres').trim() || 'postgres';
    const dbHost = String(params.dbResults.dbHost ?? DEFAULT_INSTALL_DB_HOST).trim() || DEFAULT_INSTALL_DB_HOST;
    const dbPort =
      String(params.dbResults.dbPort ?? defaultDbPortForDialect(dbDialect)).trim() ||
      defaultDbPortForDialect(dbDialect);
    const dbDatabase =
      String(params.dbResults.dbDatabase ?? DEFAULT_INSTALL_DB_DATABASE).trim() || DEFAULT_INSTALL_DB_DATABASE;
    const dbUser = String(params.dbResults.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER;
    const dbPassword =
      String(params.dbResults.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD;
    const dbSchema = optionalEnvString(params.dbResults.dbSchema);
    const dbTablePrefix = optionalEnvString(params.dbResults.dbTablePrefix);
    const dbUnderscored = optionalEnvBoolean(params.dbResults.dbUnderscored);
    const extractClientAssets = resolveExtractClientAssetsDefaultEnabled(process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS);
    const appKey = Install.resolveManagedAppKey(params.appResults.appKey);
    const appPublicPath = Install.toOptionalPromptString(params.appResults.appPublicPath);
    const timeZone = Install.resolveManagedTimeZone(params.appResults.timeZone);
    const containerName = Install.buildDockerAppContainerName(
      params.envName,
      params.dockerContainerPrefix ?? params.workspaceName,
    );
    const configuredEnvFile = String(params.appResults.envFile ?? '').trim();
    const envFile = await resolveDockerEnvFileArg(
      params.envName,
      configuredEnvFile ? { envFile: configuredEnvFile } : undefined,
    );
    const initEnvVars = Install.buildInitAppEnvVars({
      appResults: params.appResults,
      rootResults: params.rootResults,
    });
    const containerPort = resolveDockerImageContainerPort(imageRef);
    const args = [
      'run',
      '-d',
      '--name',
      containerName,
      '--network',
      params.networkName,
      '-p',
      `${appPort}:${containerPort}`,
    ];

    if (envFile) {
      args.push('--env-file', envFile);
    }

    for (const [key, value] of Object.entries(initEnvVars)) {
      args.push('-e', `${key}=${value}`);
    }

    args.push(
      '-e',
      `APP_KEY=${appKey}`,
      '-e',
      `DB_DIALECT=${dbDialect}`,
      '-e',
      `DB_HOST=${dbHost}`,
      '-e',
      `DB_PORT=${dbPort}`,
      '-e',
      `DB_DATABASE=${dbDatabase}`,
      '-e',
      `DB_USER=${dbUser}`,
      '-e',
      `DB_PASSWORD=${dbPassword}`,
      '-e',
      `TZ=${timeZone}`,
      '-v',
      `${storagePath}:/app/nocobase/storage`,
    );
    pushOptionalEnvArg(args, 'APP_PUBLIC_PATH', appPublicPath);
    pushOptionalEnvArg(args, 'DB_SCHEMA', dbSchema);
    pushOptionalEnvArg(args, 'DB_TABLE_PREFIX', dbTablePrefix);
    pushOptionalEnvArg(args, 'DB_UNDERSCORED', dbUnderscored);
    pushOptionalEnvArg(args, 'NOCOBASE_EXTRACT_CLIENT_ASSETS', extractClientAssets);
    args.push(imageRef);

    return {
      source: 'docker',
      networkName: params.networkName,
      containerName,
      imageRef,
      appPort,
      storagePath,
      envFile,
      appKey,
      timeZone,
      args,
    };
  }

  private async ensureDockerAppContainer(
    plan: DockerAppPlan,
    options?: { stdio?: 'inherit' | 'ignore' },
  ): Promise<'created' | 'existing'> {
    const exists = await this.dockerContainerExists(plan.containerName);
    if (exists) {
      printVerbose(`App container already exists: ${plan.containerName}`);
      return 'existing';
    }

    await mkdir(plan.storagePath, { recursive: true });
    await run('docker', plan.args, {
      errorName: 'docker run',
      stdio: options?.stdio ?? 'ignore',
    });
    return 'created';
  }

  private async installDockerApp(params: {
    envName: string;
    workspaceName?: PromptValue;
    dockerNetworkName?: PromptValue;
    dockerContainerPrefix?: PromptValue;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
    builtinDbPlan?: BuiltinDbPlan;
    force?: boolean;
    commandStdio?: 'inherit' | 'ignore';
  }): Promise<DockerAppPlan> {
    const networkName =
      params.builtinDbPlan?.networkName ??
      Install.buildBuiltinDbNetworkName(params.envName, params.dockerNetworkName ?? params.workspaceName);
    await this.ensureDockerNetwork(networkName);
    const plan = await Install.buildDockerAppPlan({
      envName: params.envName,
      workspaceName: params.workspaceName,
      dockerContainerPrefix: params.dockerContainerPrefix,
      appResults: params.appResults,
      downloadResults: params.downloadResults,
      dbResults: params.dbResults,
      rootResults: params.rootResults,
      networkName,
    });

    printVerbose('Starting NocoBase app (Docker)');
    await this.removeDockerContainerIfForced({
      containerName: plan.containerName,
      displayName: 'app container',
      force: params.force,
    });
    const containerState = await this.ensureDockerAppContainer(plan, {
      stdio: params.commandStdio ?? 'ignore',
    });
    if (containerState === 'existing') {
      const env = await this.inspectDockerContainerEnv(plan.containerName);
      plan.appKey = env.APP_KEY || plan.appKey;
      plan.timeZone = env.TZ || plan.timeZone;
    }
    printVerbose(`NocoBase app is starting at http://127.0.0.1:${plan.appPort}`);

    return plan;
  }

  private static pushDownloadArgIfValue(argv: string[], flag: string, value: PromptValue | undefined): void {
    const text = String(value ?? '').trim();
    if (text) {
      argv.push(flag, text);
    }
  }

  private static buildDownloadArgvFromResults(
    results: Record<string, PromptValue>,
    options?: {
      verbose?: boolean;
      compactLog?: boolean;
    },
  ): string[] {
    const argv = ['-y', '--no-intro'];
    if (options?.compactLog) {
      argv.push('--compact-log');
    }
    const source = String(results.source ?? '').trim();
    if (options?.verbose) {
      argv.push('--verbose');
    }
    Install.pushDownloadArgIfValue(argv, '--source', results.source);
    Install.pushDownloadArgIfValue(argv, '--version', downloadResultsValue(results, 'version'));
    Install.pushDownloadArgIfValue(
      argv,
      '--output-dir',
      source === 'npm' || source === 'git'
        ? resolveConfiguredEnvPath(results.outputDir) ??
            resolveConfiguredEnvPath(String(results.outputDir ?? '').trim() || defaultInstallAppRootPath(results.env))
        : results.outputDir,
    );
    Install.pushDownloadArgIfValue(argv, '--git-url', results.gitUrl);
    Install.pushDownloadArgIfValue(argv, '--docker-registry', results.dockerRegistry);
    Install.pushDownloadArgIfValue(argv, '--docker-platform', results.dockerPlatform);
    Install.pushDownloadArgIfValue(argv, '--npm-registry', results.npmRegistry);

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
    }
    if (results.buildDts) {
      argv.push('--build-dts');
    }
    Install.pushDownloadArgIfValue(argv, '--hook-script', results.hookScript);
    Install.pushDownloadArgIfValue(argv, '--hook-phase', results.hookPhase);
    Install.pushDownloadArgIfValue(argv, '--hook-command', results.hookCommand);
    Install.pushDownloadArgIfValue(argv, '--hook-env-name', results.hookEnvName);
    Install.pushDownloadArgIfValue(argv, '--hook-app-path', results.hookAppPath);
    Install.pushDownloadArgIfValue(argv, '--hook-storage-path', results.hookStoragePath);

    return argv;
  }

  private static resolveLocalProjectRoot(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    downloadCommandResult?: DownloadCommandResult;
  }): string {
    const projectRoot = params.downloadCommandResult?.projectRoot;
    if (projectRoot) {
      return projectRoot;
    }

    const outputDir =
      String(params.downloadResults.outputDir ?? '').trim() ||
      resolveConfiguredSourcePathValue(params.appResults, params.envName);
    return resolveConfiguredEnvPath(outputDir) ?? resolveEnvRelativePath(defaultInstallAppRootPath(params.envName));
  }

  private static resolveLocalProjectConfigPath(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
  }): string {
    return (
      String(params.downloadResults.outputDir ?? '').trim() ||
      resolveConfiguredSourcePathValue(params.appResults, params.envName)
    );
  }

  private static buildSkipDownloadValues(
    envName: string,
    appResults: Record<string, PromptValue>,
  ): PromptInitialValues {
    const appRoot = resolveConfiguredSourcePathValue(appResults, envName);
    return {
      outputDir: appRoot,
      replace: false,
      dockerSave: false,
      devDependencies: false,
      build: false,
      buildDts: false,
    };
  }

  private static resolveAbsoluteAppPath(envName: string, appResults: Record<string, PromptValue>): string {
    const configuredAppPath = resolveConfiguredAppPathValue(appResults) ?? defaultInstallAppPath(envName);
    return resolveConfiguredEnvPath(configuredAppPath) ?? resolveEnvRelativePath(defaultInstallAppPath(envName));
  }

  private static resolveAbsoluteStoragePath(envName: string, appResults: Record<string, PromptValue>): string {
    const configuredStoragePath = resolveConfiguredStoragePathValue(appResults, envName);
    return (
      resolveConfiguredEnvPath(configuredStoragePath) ?? resolveEnvRelativePath(defaultInstallStoragePath(envName))
    );
  }

  private async prepareHookScriptForInstall(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    hookScript?: string;
  }): Promise<void> {
    const appPath = Install.resolveAbsoluteAppPath(params.envName, params.appResults);
    const storagePath = Install.resolveAbsoluteStoragePath(params.envName, params.appResults);
    const inputHookScript = Install.toOptionalPromptString(params.hookScript);

    if (inputHookScript) {
      params.appResults.hookScript = await persistHookScript({
        sourcePath: inputHookScript,
        appPath,
      });
      printInfo(`Saved hook script to ${path.join(appPath, String(params.appResults.hookScript))}.`);
    }

    const savedHookScript = Install.toOptionalPromptString(params.appResults.hookScript);
    const hookScriptPath = resolveHookScriptPath({
      appPath,
      hookScript: savedHookScript,
    });
    if (!hookScriptPath) {
      return;
    }

    params.downloadResults.hookScript = hookScriptPath;
    params.downloadResults.hookPhase = 'init';
    params.downloadResults.hookCommand = 'init';
    params.downloadResults.hookEnvName = params.envName;
    params.downloadResults.hookAppPath = appPath;
    params.downloadResults.hookStoragePath = storagePath;
  }

  private commandStdio(verbose?: boolean): 'inherit' | 'ignore' {
    return verbose ? 'inherit' : 'ignore';
  }

  private async downloadManagedSource(params: {
    downloadResults: Record<string, PromptValue>;
    verbose?: boolean;
  }): Promise<DownloadCommandResult | undefined> {
    const argv = Install.buildDownloadArgvFromResults(params.downloadResults, {
      verbose: params.verbose,
      compactLog: true,
    });
    return (await this.config.runCommand('source:download', argv)) as DownloadCommandResult | undefined;
  }

  private async ensureSkippedDownloadInputsReady(params: {
    source: string;
    envName: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
  }): Promise<void> {
    if (params.source === 'docker') {
      const configuredRegistry = await getCliConfigValue('nb-image-registry');
      const configuredVariant =
        normalizeNbImageVariant(await getCliConfigValue('nb-image-variant')) ?? DEFAULT_NB_IMAGE_VARIANT;
      const dockerRegistry =
        String(downloadResultsValue(params.downloadResults, 'dockerRegistry') ?? '').trim() ||
        resolveOfficialDockerRegistry(configuredRegistry);
      const version =
        String(downloadResultsValue(params.downloadResults, 'version') ?? '').trim() || DEFAULT_DOCKER_VERSION;
      const imageRef = resolveDockerImageRef(dockerRegistry, version, {
        defaultRegistry: resolveOfficialDockerRegistry(configuredRegistry),
        defaultVersion: DEFAULT_DOCKER_VERSION,
        variant: inferNbImageRegistryFromRepository(dockerRegistry) ? configuredVariant : undefined,
      });
      const imageExists = await commandSucceeds('docker', ['image', 'inspect', imageRef]);
      if (!imageExists) {
        throw new Error(
          translateCli('commands.install.messages.skipDownloadDockerImageMissing', {
            imageRef,
          }),
        );
      }
      return;
    }

    if (params.source === 'npm' || params.source === 'git') {
      const projectRoot = Install.resolveLocalProjectRoot({
        envName: params.envName,
        appResults: params.appResults,
        downloadResults: params.downloadResults,
      });

      try {
        await access(projectRoot);
        await access(path.join(projectRoot, 'package.json'));
      } catch {
        throw new Error(
          translateCli('commands.install.messages.skipDownloadLocalAppMissing', {
            projectRoot,
          }),
        );
      }
    }
  }

  private async downloadLocalApp(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    verbose?: boolean;
  }): Promise<string> {
    const result = await this.downloadManagedSource({
      downloadResults: params.downloadResults,
      verbose: params.verbose,
    });

    const downloadedProjectRoot = Install.resolveLocalProjectRoot({
      envName: params.envName,
      appResults: params.appResults,
      downloadResults: params.downloadResults,
      downloadCommandResult: result,
    });
    params.appResults.appRootPath = Install.resolveLocalProjectConfigPath({
      envName: params.envName,
      appResults: params.appResults,
      downloadResults: params.downloadResults,
    });
    return downloadedProjectRoot;
  }

  private static buildLocalAppEnvVars(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
  }): Record<string, string> {
    const configuredStoragePath = resolveConfiguredStoragePathValue(params.appResults, params.envName);
    const storagePath =
      resolveConfiguredEnvPath(configuredStoragePath) ??
      resolveEnvRelativePath(defaultInstallStoragePath(params.envName));
    const dbDialect = String(params.dbResults.dbDialect ?? 'postgres').trim() || 'postgres';
    const appKey = Install.resolveManagedAppKey(params.appResults.appKey);
    const timeZone = Install.resolveManagedTimeZone(params.appResults.timeZone);
    const lifecycleEnvVars = managedAppLifecycleEnvVars();
    const env: Record<string, string> = {
      ...lifecycleEnvVars,
      STORAGE_PATH: storagePath,
      APP_PORT: String(params.appResults.appPort ?? DEFAULT_INSTALL_APP_PORT).trim() || DEFAULT_INSTALL_APP_PORT,
      APP_KEY: appKey,
      TZ: timeZone,
      DB_DIALECT: dbDialect,
      DB_HOST: String(params.dbResults.dbHost ?? DEFAULT_INSTALL_DB_HOST).trim() || DEFAULT_INSTALL_DB_HOST,
      DB_PORT:
        String(params.dbResults.dbPort ?? defaultDbPortForDialect(dbDialect)).trim() ||
        defaultDbPortForDialect(dbDialect),
      DB_DATABASE:
        String(params.dbResults.dbDatabase ?? DEFAULT_INSTALL_DB_DATABASE).trim() || DEFAULT_INSTALL_DB_DATABASE,
      DB_USER: String(params.dbResults.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER,
      DB_PASSWORD: String(params.dbResults.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD,
      ...Install.buildInitAppEnvVars({
        appResults: params.appResults,
        rootResults: params.rootResults,
      }),
    };
    setOptionalEnvVar(env, 'APP_PUBLIC_PATH', Install.toOptionalPromptString(params.appResults.appPublicPath));
    setOptionalEnvVar(env, 'DB_SCHEMA', optionalEnvString(params.dbResults.dbSchema));
    setOptionalEnvVar(env, 'DB_TABLE_PREFIX', optionalEnvString(params.dbResults.dbTablePrefix));
    setOptionalEnvVar(env, 'DB_UNDERSCORED', optionalEnvBoolean(params.dbResults.dbUnderscored));

    return env;
  }

  private async startLocalApp(params: {
    envName: string;
    source: 'npm' | 'git';
    projectRoot: string;
    appResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
    commandStdio?: 'inherit' | 'ignore';
  }): Promise<LocalAppPlan> {
    const env = Install.buildLocalAppEnvVars({
      envName: params.envName,
      appResults: params.appResults,
      dbResults: params.dbResults,
      rootResults: params.rootResults,
    });
    const args = ['start', '--quickstart', '--daemon'];

    this.logDetail(`Stopping any existing local NocoBase process in ${params.projectRoot}`);
    try {
      await runNocoBaseCommand(['pm2', 'kill'], {
        cwd: params.projectRoot,
        env,
        stdio: params.commandStdio ?? 'ignore',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logDetail(`Skipped local process cleanup before start: ${message}`);
    }

    this.logDetail(`Running local postinstall in ${params.projectRoot}`);
    await runNocoBaseCommand(['postinstall'], {
      cwd: params.projectRoot,
      env,
      stdio: params.commandStdio ?? 'ignore',
    });

    this.logDetail(`Extracting local client assets in ${params.projectRoot}`);
    try {
      await runNocoBaseCommand(['client:extract'], {
        cwd: params.projectRoot,
        env,
        stdio: params.commandStdio ?? 'ignore',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      printWarning(Install.formatLocalClientExtractWarning(params.envName, message));
    }

    this.logDetail(`Starting local NocoBase app from ${params.projectRoot}`);
    await runNocoBaseCommand(args, {
      cwd: params.projectRoot,
      env,
      stdio: params.commandStdio ?? 'ignore',
    });
    this.logDetail(`Local app is starting at http://127.0.0.1:${env.APP_PORT}`);

    return {
      source: params.source,
      projectRoot: params.projectRoot,
      appPort: env.APP_PORT,
      storagePath: env.STORAGE_PATH,
      appKey: env.APP_KEY,
      timeZone: env.TZ,
      env,
      args,
    };
  }

  private static resolveApiBaseUrl(params: {
    appResults: Record<string, PromptValue>;
    envAddResults: Record<string, PromptValue>;
    defaultApiHost?: string;
  }): string {
    return (
      String(params.envAddResults.apiBaseUrl ?? '').trim() ||
      buildInstallApiBaseUrl(params.appResults, params.defaultApiHost)
    );
  }

  private static buildHealthCheckUrl(apiBaseUrl: string): string {
    return `${apiBaseUrl.replace(/\/+$/, '')}/__health_check`;
  }

  private static async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static formatHealthCheckMessage(message: string, maxLength = 120): string {
    const text = message.replace(/\s+/g, ' ').trim();
    if (!text) {
      return 'No response yet';
    }
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  }

  private static async requestAppHealthCheck(params: {
    healthCheckUrl: string;
    fetchImpl: typeof fetch;
    requestTimeoutMs: number;
  }): Promise<{ ok: boolean; message: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, params.requestTimeoutMs);

    try {
      const response = await params.fetchImpl(params.healthCheckUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      const text = await response.text().catch(() => '');
      const body = Install.formatHealthCheckMessage(text);

      return {
        ok: response.ok && text.trim().toLowerCase() === 'ok',
        message: response.ok ? `HTTP ${response.status}: ${body}` : `HTTP ${response.status}: ${body}`,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          ok: false,
          message: `No response within ${Math.ceil(params.requestTimeoutMs / 1000)}s`,
        };
      }

      return {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async waitForAppHealthCheck(
    apiBaseUrl: string,
    options?: {
      timeoutMs?: number;
      intervalMs?: number;
      requestTimeoutMs?: number;
      fetchImpl?: typeof fetch;
      containerName?: string;
      verbose?: boolean;
    },
  ): Promise<void> {
    const healthCheckUrl = Install.buildHealthCheckUrl(apiBaseUrl);
    const timeoutMs = options?.timeoutMs ?? APP_HEALTH_CHECK_TIMEOUT_MS;
    const intervalMs = options?.intervalMs ?? APP_HEALTH_CHECK_INTERVAL_MS;
    const requestTimeoutMs = options?.requestTimeoutMs ?? APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS;
    const fetchImpl = options?.fetchImpl ?? fetch;
    const startedAt = Date.now();
    let lastMessage = 'No response yet';
    let lastLoggedStatus = '';

    printInfo('Waiting for NocoBase to become ready...');
    const dockerLogFollower =
      options?.verbose && options.containerName ? startDockerLogFollower(options.containerName) : undefined;

    try {
      while (Date.now() - startedAt < timeoutMs) {
        const result = await Install.requestAppHealthCheck({
          healthCheckUrl,
          fetchImpl,
          requestTimeoutMs,
        });

        if (result.ok) {
          return;
        }

        lastMessage = result.message;
        const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
        const statusLine = `Waiting for NocoBase to become ready... (${elapsedSeconds}s elapsed, last status: ${Install.formatHealthCheckMessage(
          lastMessage,
        )})`;
        if (statusLine !== lastLoggedStatus) {
          printInfo(statusLine);
          lastLoggedStatus = statusLine;
        }

        const remainingMs = timeoutMs - (Date.now() - startedAt);
        if (remainingMs <= 0) {
          break;
        }
        await Install.sleep(Math.min(intervalMs, remainingMs));
      }

      const logHint = options?.containerName
        ? ` You can inspect startup logs with: docker logs ${options.containerName}`
        : '';
      throw new Error(
        `The application did not become ready in time. Expected \`${healthCheckUrl}\` to respond with \`ok\`, but the last status was: ${Install.formatHealthCheckMessage(
          lastMessage,
        )}.${logHint}`,
      );
    } finally {
      await dockerLogFollower?.stop();
    }
  }

  private async saveInstalledEnv(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
    envAddResults: Record<string, PromptValue>;
  }): Promise<void> {
    const defaultApiHost = await resolveDefaultApiHost();
    await upsertEnv(params.envName, Install.buildSavedEnvConfig(params, { defaultApiHost }), {
      scope: resolveDefaultConfigScope(),
    });
    await setCurrentEnv(params.envName, { scope: resolveDefaultConfigScope() });
  }

  private async syncInstalledEnvConnection(params: {
    envName: string;
    envAddResults: Record<string, PromptValue>;
    appReady: boolean;
    skipAuth?: boolean;
  }): Promise<void> {
    if (!params.appReady) {
      return;
    }

    const authType = String(params.envAddResults.authType ?? 'oauth').trim() || 'oauth';
    if (params.skipAuth) {
      printInfo(formatDeferredAuthMessage(params.envName, authType));
      return;
    }

    if (authType === 'oauth') {
      await this.config.runCommand('env:auth', [params.envName]);
    } else if (authType === 'basic') {
      const authArgv = [params.envName, '--auth-type', 'basic'];
      const username = String(params.envAddResults.username ?? '').trim();
      const password = String(params.envAddResults.password ?? '');
      if (username) {
        authArgv.push('--username', username);
      }
      if (password) {
        authArgv.push('--password', password);
      }
      await this.config.runCommand('env:auth', authArgv);
    }

    await this.config.runCommand('env:update', [params.envName]);
  }

  private buildAppStartArgv(params: { envName: string; verbose?: boolean }): string[] {
    const argv = ['--env', params.envName, '--yes', '--no-sync-licensed-plugins', '--hook-command', 'init'];
    if (params.verbose) {
      argv.push('--verbose');
    }
    return argv;
  }

  private async runInstallHookIfNeeded(params: {
    hookName: HookName;
    envName: string;
    source: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
    envAddResults: Record<string, PromptValue>;
    projectRoot?: string;
    defaultApiHost?: string;
  }): Promise<void> {
    const appPath = Install.resolveAbsoluteAppPath(params.envName, params.appResults);
    const savedHookScript = Install.toOptionalPromptString(params.appResults.hookScript);
    const hookScriptPath = resolveHookScriptPath({
      appPath,
      hookScript: savedHookScript,
    });
    if (!hookScriptPath) {
      return;
    }

    const storagePath = Install.resolveAbsoluteStoragePath(params.envName, params.appResults);
    const sourcePath =
      params.projectRoot ??
      resolveConfiguredEnvPath(resolveConfiguredSourcePathValue(params.appResults, params.envName)) ??
      path.join(appPath, 'source');
    const context = buildHookContext({
      phase: 'init',
      command: 'init',
      envName: params.envName,
      source: params.source,
      version: downloadResultsValue(params.downloadResults, 'version'),
      appPath,
      sourcePath,
      storagePath,
      hookScript: savedHookScript,
      envConfig: Install.buildSavedEnvConfig(params, {
        defaultApiHost: params.defaultApiHost,
      }),
    });
    if (!context) {
      return;
    }

    this.log(`Running hook ${params.hookName}: ${hookScriptPath}`);
    await runHookScriptHook({
      hookScriptPath,
      hookName: params.hookName,
      context,
    });
  }

  private static buildSavedEnvConfig(
    params: {
      envName: string;
      appResults: Record<string, PromptValue>;
      downloadResults: Record<string, PromptValue>;
      dbResults: Record<string, PromptValue>;
      rootResults: Record<string, PromptValue>;
      envAddResults: Record<string, PromptValue>;
    },
    options: {
      defaultApiHost?: string;
    } = {},
  ): StoredEnvConfig {
    const appPath = resolveConfiguredAppPathValue(params.appResults);
    const appRootPath = Install.toOptionalPromptString(params.appResults.appRootPath);
    const storagePath = Install.toOptionalPromptString(params.appResults.storagePath);
    const appPublicPath = Install.toOptionalPromptString(params.appResults.appPublicPath);
    const derivedAppRootPath = appPath ? deriveConfiguredSourcePath(appPath) : undefined;
    const derivedStoragePath = appPath ? deriveConfiguredStoragePath(appPath) : undefined;
    const appPort = String(params.appResults.appPort ?? DEFAULT_INSTALL_APP_PORT).trim() || DEFAULT_INSTALL_APP_PORT;
    const envFile = String(params.appResults.envFile ?? '').trim() || undefined;
    const apiBaseUrl = Install.resolveApiBaseUrl({
      appResults: params.appResults,
      envAddResults: params.envAddResults,
      defaultApiHost: options.defaultApiHost,
    });
    const authType = String(params.envAddResults.authType ?? 'oauth').trim() || 'oauth';
    const authUsername =
      authType === 'basic' ? String(params.envAddResults.username ?? params.rootResults.rootUsername ?? '').trim() : '';
    return buildStoredEnvConfig({
      apiBaseUrl,
      authType,
      ...(authUsername ? { authUsername } : {}),
      accessToken: params.envAddResults.accessToken,
      setupState: params.appResults.setupState,
      source: downloadResultsValue(params.downloadResults, 'source'),
      downloadVersion: downloadResultsValue(params.downloadResults, 'version'),
      dockerRegistry: downloadResultsValue(params.downloadResults, 'dockerRegistry'),
      dockerPlatform: downloadResultsValue(params.downloadResults, 'dockerPlatform'),
      gitUrl: downloadResultsValue(params.downloadResults, 'gitUrl'),
      npmRegistry: downloadResultsValue(params.downloadResults, 'npmRegistry'),
      devDependencies: downloadResultsValue(params.downloadResults, 'devDependencies'),
      build: downloadResultsValue(params.downloadResults, 'build'),
      buildDts: downloadResultsValue(params.downloadResults, 'buildDts'),
      hookScript: params.appResults.hookScript,
      ...(appPath ? { appPath } : {}),
      ...(appRootPath && !areConfiguredPathsEquivalent(appRootPath, derivedAppRootPath) ? { appRootPath } : {}),
      appPort,
      ...(storagePath && !areConfiguredPathsEquivalent(storagePath, derivedStoragePath) ? { storagePath } : {}),
      ...(appPublicPath ? { appPublicPath } : {}),
      ...(envFile ? { envFile } : {}),
      lang: params.appResults.lang,
      appKey: params.appResults.appKey,
      timezone: params.appResults.timeZone,
      builtinDb: params.dbResults.builtinDb,
      dbDialect: params.dbResults.dbDialect,
      builtinDbImage: params.dbResults.builtinDbImage,
      dbHost: params.dbResults.dbHost,
      dbPort: params.dbResults.dbPort,
      dbDatabase: params.dbResults.dbDatabase,
      dbUser: params.dbResults.dbUser,
      dbPassword: params.dbResults.dbPassword,
      dbSchema: params.dbResults.dbSchema,
      dbTablePrefix: params.dbResults.dbTablePrefix,
      dbUnderscored: params.dbResults.dbUnderscored,
      rootUsername: params.rootResults.rootUsername,
      rootEmail: params.rootResults.rootEmail,
      rootPassword: params.rootResults.rootPassword,
      rootNickname: params.rootResults.rootNickname,
    });
  }

  private async collectPromptResults(
    parsed: InstallParsedFlags & DownloadParsedFlags,
    yes: boolean,
  ): Promise<InstallPromptResults> {
    const commandArgv = this.argv ?? process.argv.slice(2);
    const defaultApiHost = await resolveDefaultApiHost();
    const resumePreset = await this.resolveResumePresetValues(parsed, yes);
    const envPreset = {
      ...(resumePreset?.envPreset ?? {}),
      ...Install.buildEnvPresetValuesFromFlags(parsed),
    };
    const envResults = await runPromptCatalog(Install.envPrompts, {
      initialValues: {
        env: DEFAULT_INSTALL_ENV_NAME,
      },
      values: envPreset,
      yes,
    });

    const envName = String(envResults.env ?? '').trim() || DEFAULT_INSTALL_ENV_NAME;

    const appPreset = {
      ...(resumePreset?.appPreset ?? {}),
      ...Install.buildAppPresetValuesFromFlags(parsed, commandArgv),
    };
    const appCatalog = Install.buildAppPromptsCatalog(envName, {
      resume: parsed.resume,
    });
    const appResults = await runPromptCatalog(appCatalog, {
      initialValues: await Install.buildAppPromptInitialValues({
        envName,
        flags: {
          ...parsed,
          'app-path': parsed['app-path'] ?? Install.toOptionalPromptString(appPreset.appPath),
          'app-root-path': parsed['app-root-path'] ?? Install.toOptionalPromptString(appPreset.appRootPath),
          'app-port': parsed['app-port'] ?? Install.toOptionalPromptString(appPreset.appPort),
          'storage-path': parsed['storage-path'] ?? Install.toOptionalPromptString(appPreset.storagePath),
        },
      }),
      values: appPreset,
      yesInitialValues: { resume: parsed.resume },
      yes,
    });
    if (resumePreset?.appPreset?.hookScript !== undefined && appResults.hookScript === undefined) {
      appResults.hookScript = resumePreset.appPreset.hookScript;
    }

    const downloadOpts = await Install.buildDownloadPromptOptionsForInstall(appResults, envName);
    downloadOpts.values = {
      ...(resumePreset?.downloadPreset ?? {}),
      ...downloadOpts.values,
      ...Install.buildDownloadPresetValuesForInstall(parsed, appResults, envName, yes, commandArgv),
      ...(parsed['skip-download'] ? Install.buildSkipDownloadValues(envName, appResults) : {}),
    };
    downloadOpts.yes = yes;
    const downloadResults = await runPromptCatalog(Download.prompts, downloadOpts);
    if (parsed['skip-download']) {
      delete downloadResults.outputDir;
      delete downloadResults.replace;
      delete downloadResults.dockerSave;
      delete downloadResults.devDependencies;
      delete downloadResults.build;
      delete downloadResults.buildDts;
    }

    const dbPreset = {
      ...(resumePreset?.dbPreset ?? {}),
      ...Install.buildDbPresetValuesFromFlags(parsed, commandArgv),
    };
    const promptedDbResults = await runPromptCatalog(
      Install.buildDbPromptsCatalog(envName, downloadResults, {
        resume: parsed.resume,
      }),
      {
        initialValues: {
          ...downloadResults,
          ...(await Install.buildDbPromptInitialValues({
            flags: {
              ...parsed,
              'db-port': parsed['db-port'] ?? Install.toOptionalPromptString(dbPreset.dbPort),
            },
            downloadResults,
            dbPreset,
          })),
        },
        values: dbPreset,
        yes,
      },
    );
    const dbResults = {
      ...pickPresetKeys(dbPreset, ['dbSchema', 'dbTablePrefix', 'dbUnderscored']),
      ...promptedDbResults,
    };

    const rootPreset = Install.buildRootPresetValuesFromFlags(parsed, commandArgv);
    const rootResults = await runPromptCatalog(Install.rootUserPrompts, {
      initialValues: {},
      values: {
        ...(resumePreset?.rootPreset ?? {}),
        ...rootPreset,
      },
      yes,
    });

    const envAddPromptsForInstall = this.buildEnvAddPromptsForInstall(parsed);
    const envAddResumePreset = resumePreset?.envAddPreset ?? {};
    const envAddFlagValues = Install.buildEnvAddPresetValuesFromFlags(parsed, commandArgv);
    const envAddPreset = {
      ...envAddResumePreset,
      ...envAddFlagValues,
    };
    const resolvedEnvAddAuthType = String(envAddPreset.authType ?? '').trim();
    const envAddInitialValues: PromptInitialValues = {
      apiBaseUrl: buildInstallApiBaseUrl(appResults, defaultApiHost),
      ...envAddResumePreset,
      ...(!parsed['skip-auth'] && resolvedEnvAddAuthType === 'basic'
        ? {
            ...(!Object.prototype.hasOwnProperty.call(envAddResumePreset, 'username') &&
            !Object.prototype.hasOwnProperty.call(envAddFlagValues, 'username') &&
            rootResults.rootUsername !== undefined
              ? { username: String(rootResults.rootUsername).trim() }
              : {}),
            ...(!Object.prototype.hasOwnProperty.call(envAddFlagValues, 'password') &&
            rootResults.rootPassword !== undefined
              ? { password: String(rootResults.rootPassword ?? '') }
              : {}),
          }
        : {}),
    };

    const promptedEnvAddResults = await runPromptCatalog(envAddPromptsForInstall, {
      initialValues: envAddInitialValues,
      values: {
        name: envName,
        ...(parsed['skip-auth'] ? { skipAuth: true } : {}),
        ...envAddFlagValues,
      },
      yes,
    });
    const envAddResults = {
      ...pickPresetKeys(envAddInitialValues, ['username', 'password']),
      ...promptedEnvAddResults,
      ...pickPresetKeys(envAddFlagValues, ['username', 'password']),
    };

    return {
      envName,
      envResults,
      appResults,
      downloadResults,
      dbResults,
      rootResults,
      envAddResults,
    };
  }

  public async run(): Promise<void> {
    const parsedResult = await this.parse(Install);
    applyCliLocale((parsedResult.flags as InstallParsedFlags).locale);
    const flags = parsedResult.flags;

    const parsed = {
      ...(flags as unknown as InstallParsedFlags & DownloadParsedFlags),
    } as InstallParsedFlags & DownloadParsedFlags;
    if (parsed['skip-auth'] && (parsed['access-token'] !== undefined || parsed.token !== undefined)) {
      this.error('--skip-auth cannot be used with --access-token or --token.');
    }
    setVerboseMode(Boolean(parsed.verbose));
    const commandStdio = this.commandStdio(parsed.verbose);
    if (!parsed['no-intro']) {
      this.logStage('Set up NocoBase');
    }
    if (parsed.resume) {
      const envLabel = Install.toOptionalPromptString(parsed.env);
      printInfo(
        envLabel
          ? `Resuming setup for env "${envLabel}" from the saved workspace config`
          : 'Resuming setup from the saved workspace config',
      );
    }
    const promptResults = await this.collectPromptResults(parsed, flags.yes);
    const { envName, appResults, downloadResults, dbResults, rootResults, envAddResults } = promptResults;
    await this.ensureManagedAppRuntimeConfig({
      envName,
      appResults,
    });
    appResults.setupState = 'prepared';
    await this.prepareHookScriptForInstall({
      envName,
      appResults,
      downloadResults,
      hookScript: parsed['hook-script'],
    });

    const source = String(downloadResultsValue(downloadResults, 'source') ?? '').trim();
    const usesDockerResources = Boolean(dbResults.builtinDb) || source === 'docker';
    const dockerNetworkName = usesDockerResources
      ? await resolveDockerNetworkName({ scope: resolveDefaultConfigScope() })
      : undefined;
    const dockerContainerPrefix = usesDockerResources
      ? await resolveDockerContainerPrefix({ scope: resolveDefaultConfigScope() })
      : undefined;

    if (parsed['skip-download']) {
      await this.ensureSkippedDownloadInputsReady({
        source,
        envName,
        appResults,
        downloadResults,
      });
    }

    await Install.ensureExternalDbReadyForInstall(dbResults);

    if (!parsed.resume) {
      if (!parsed['skip-save-env-log']) {
        this.logStage('Saving env config');
      }
      await this.saveInstalledEnv({
        envName,
        appResults,
        downloadResults,
        dbResults,
        rootResults,
        envAddResults,
      });
      if (!parsed['skip-save-env-log']) {
        printInfo(`Saved env config for "${envName}".`);
      }
    }

    let builtinDbPlan: BuiltinDbPlan | undefined;
    if (dbResults.builtinDb) {
      builtinDbPlan = await this.startBuiltinDb({
        envName,
        dockerNetworkName,
        dockerContainerPrefix,
        appResults,
        downloadResults,
        dbResults,
        force: parsed.force,
        commandStdio,
      });
      dbResults.dbHost = builtinDbPlan.dbHost;
      dbResults.dbPort = builtinDbPlan.dbPort;
      dbResults.dbDialect = builtinDbPlan.dbDialect;
      dbResults.dbDatabase = builtinDbPlan.dbDatabase;
      dbResults.dbUser = builtinDbPlan.dbUser;
      dbResults.dbPassword = builtinDbPlan.dbPassword;
    }

    let shouldStartApp = false;
    if (source === 'docker' || source === 'npm' || source === 'git') {
      this.logStage('Preparing application');
      if (source === 'docker') {
        if (!parsed['skip-download']) {
          await this.downloadManagedSource({
            downloadResults,
            verbose: parsed.verbose,
          });
          printInfo('Application image ready.');
        }
        if (!parsed['prepare-only']) {
          shouldStartApp = true;
        }
      } else if (source === 'npm' || source === 'git') {
        if (!parsed['skip-download'] && !parsed['prepare-only']) {
          await this.downloadLocalApp({
            envName,
            appResults,
            downloadResults,
            verbose: parsed.verbose,
          });
          printInfo('Application files ready.');
        }
        if (!parsed['prepare-only']) {
          shouldStartApp = true;
        }
      }
    } else {
      this.logDetail('Skipped app download and install.');
    }

    if (shouldStartApp || builtinDbPlan) {
      await this.saveInstalledEnv({
        envName,
        appResults,
        downloadResults,
        dbResults,
        rootResults,
        envAddResults,
      });
    }

    if (shouldStartApp) {
      this.logStage('Starting NocoBase');
      await this.config.runCommand('app:start', this.buildAppStartArgv({ envName, verbose: parsed.verbose }));
    }

    await this.syncInstalledEnvConnection({
      envName,
      envAddResults,
      appReady: shouldStartApp,
      skipAuth: Boolean(parsed['skip-auth']),
    });
    if (!parsed['prepare-only']) {
      await clearEnvRootSetup(envName, { scope: resolveDefaultConfigScope() });
    }

    if (parsed['prepare-only']) {
      printInfo(
        `Preparation complete for "${envName}". Activate the license, then run \`nb app start --env ${envName}\`.`,
      );
    } else if (!shouldStartApp) {
      printInfo(`Install config for "${envName}" has been saved.`);
    }
  }
}

function downloadResultsValue(downloadResults: Record<string, PromptValue>, key: string): PromptValue | undefined {
  if (key === 'version' && String(downloadResults.version ?? '').trim() === 'other') {
    return downloadResults.otherVersion;
  }
  return downloadResults[key];
}
