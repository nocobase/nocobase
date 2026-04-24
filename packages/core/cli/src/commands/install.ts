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
import _ from 'lodash';
import { spawn } from 'node:child_process';
import pc from 'picocolors';
import crypto from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { exit, stdin as stdinStream, stdout as stdoutStream } from 'node:process';
import {
  type PromptCatalogValues,
  type PromptInitialValues,
  type PromptsCatalog,
  type PromptValue,
  type RunPromptCatalogOptions,
  runPromptCatalog,
} from '../lib/prompt-catalog.ts';
import {
  applyCliLocale,
  localeText,
  translateCli,
} from '../lib/cli-locale.ts';
import {
  findAvailableTcpPort,
  validateAvailableTcpPort,
  validateTcpPort,
  validateEnvKey,
} from '../lib/prompt-validators.ts';
import { formatMissingManagedAppEnvMessage } from '../lib/app-runtime.js';
import { run, runNocoBaseCommand } from '../lib/run-npm.js';
import { startTask, stopTask, updateTask } from '../lib/ui.js';
import { ensureWorkspaceName, getEnv, type Env } from '../lib/auth-store.js';
import Download, {
  DownloadParsedFlags,
  defaultDockerRegistryForLang,
  type DownloadCommandResult,
} from './download.js';
import EnvAdd from './env/add.ts';

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
const DEFAULT_INSTALL_BUILTIN_DB_IMAGES = {
  postgres: 'postgres:16',
  mysql: 'mysql:8',
  mariadb: 'mariadb:11',
  kingbase: 'registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86',
} as const;
const DEFAULT_INSTALL_DB_DATABASE = 'nocobase';
const DEFAULT_INSTALL_DB_USER = 'nocobase';
const DEFAULT_INSTALL_DB_PASSWORD = 'nocobase';
const DEFAULT_INSTALL_ROOT_USERNAME = 'nocobase';
const DEFAULT_INSTALL_ROOT_EMAIL = 'admin@nocobase.com';
const DEFAULT_INSTALL_ROOT_PASSWORD = 'admin123';
const DEFAULT_INSTALL_ROOT_NICKNAME = 'Super Admin';
const CONFIG_SCOPE = 'project' as const;
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

const installText = (key: string, values?: Record<string, unknown>) =>
  localeText(`commands.install.${key}`, values);

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((t) => argv.includes(t));
}

function isInstallDbDialect(value: string): value is (typeof INSTALL_DB_DIALECTS)[number] {
  return (INSTALL_DB_DIALECTS as readonly string[]).includes(value);
}

function supportsBuiltinDbDialect(
  value: PromptValue | undefined,
): value is keyof typeof DEFAULT_INSTALL_BUILTIN_DB_IMAGES {
  const dialect = String(value ?? '').trim();
  return Object.prototype.hasOwnProperty.call(DEFAULT_INSTALL_BUILTIN_DB_IMAGES, dialect);
}

export function defaultDbPortForDialect(value: PromptValue | undefined): string {
  const dialect = String(value ?? 'postgres').trim();
  return DEFAULT_INSTALL_DB_PORTS[
    isInstallDbDialect(dialect) ? dialect : 'postgres'
  ];
}

function defaultBuiltinDbImageForDialect(value: PromptValue | undefined): string {
  const dialect = String(value ?? 'postgres').trim();
  return supportsBuiltinDbDialect(dialect)
    ? DEFAULT_INSTALL_BUILTIN_DB_IMAGES[dialect]
    : DEFAULT_INSTALL_BUILTIN_DB_IMAGES.postgres;
}

function defaultDbDatabaseForDialect(value: PromptValue | undefined): string {
  return String(value ?? '').trim() === 'kingbase'
    ? 'kingbase'
    : DEFAULT_INSTALL_DB_DATABASE;
}

function defaultDbHostForBuiltinDb(values: PromptCatalogValues): string {
  return Boolean(values.builtinDb)
    ? DEFAULT_INSTALL_BUILTIN_DB_HOST
    : DEFAULT_INSTALL_DB_HOST;
}

function validateBuiltinDbEnabled(
  value: PromptValue,
  values: PromptCatalogValues,
): string | undefined {
  if (!Boolean(value)) {
    return undefined;
  }

  const dialect = String(values.dbDialect ?? 'postgres').trim() || 'postgres';
  if (supportsBuiltinDbDialect(dialect)) {
    return undefined;
  }

  return translateCli('commands.install.validation.builtinDbUnsupported', { dialect });
}

function defaultInstallAppRootPath(envName: PromptValue | undefined): string {
  const name = String(envName ?? DEFAULT_INSTALL_ENV_NAME).trim() || DEFAULT_INSTALL_ENV_NAME;
  return `./${name}/source/`;
}

function defaultInstallStoragePath(envName: PromptValue | undefined): string {
  const name = String(envName ?? DEFAULT_INSTALL_ENV_NAME).trim() || DEFAULT_INSTALL_ENV_NAME;
  return `./${name}/storage/`;
}

function pickPresetKeys(
  source: PromptInitialValues,
  keys: readonly string[],
): PromptInitialValues {
  const out: PromptInitialValues = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(source, k)) {
      out[k] = source[k];
    }
  }
  return out;
}

async function commandSucceeds(
  command: string,
  args: string[],
  options?: { cwd?: string; env?: Record<string, string> },
): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      env: {
        ...process.env,
        ...options?.env,
      },
      stdio: 'ignore',
    });

    child.once('error', () => resolve(false));
    child.once('close', (code) => resolve(code === 0));
  });
}

async function commandOutput(
  command: string,
  args: string[],
  options?: { cwd?: string; env?: Record<string, string> },
): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      env: {
        ...process.env,
        ...options?.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      if (signal) {
        reject(new Error(`${command} exited due to signal ${signal}`));
        return;
      }
      reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

/** Parsed `nb install` flags (oclif output shape). */
type InstallParsedFlags = {
  yes: boolean;
  resume: boolean;
  locale?: string;
  env?: string;
  lang?: string;
  force: boolean;
  'app-root-path'?: string;
  'app-port'?: string;
  'storage-path'?: string;
  'root-username'?: string;
  'root-email'?: string;
  'root-password'?: string;
  'root-nickname'?: string;
  'fetch-source': boolean;
  'builtin-db': boolean;
  'db-dialect'?: string;
  'builtin-db-image'?: string;
  'db-host'?: string;
  'db-port'?: string;
  'db-database'?: string;
  'db-user'?: string;
  'db-password'?: string;
  'no-intro'?: boolean;
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

type BuiltinDbPlan = {
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
  envAddPreset: PromptInitialValues;
};

export default class Install extends Command {
  static override description =
    'Install NocoBase: database, storage, admin user, and `nocobase-v1 install`. Optionally run `nb download` first; distribution and image details are configured on `nb download`, not here. Use `--resume` to continue an interrupted setup from the saved workspace env config.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --resume',
    '<%= config.bin %> <%= command.id %> --env app1 -f',
    '<%= config.bin %> <%= command.id %> --env app1 -l zh-CN',
    '<%= config.bin %> <%= command.id %> --env app1 --root-username nocobase --root-email admin@nocobase.com --root-password admin123',
    '<%= config.bin %> <%= command.id %> --env app1 --root-nickname "Super Admin"',
    '<%= config.bin %> <%= command.id %> --env myenv --app-root-path=./myenv/source/ --storage-path=./myenv/storage/',
    '<%= config.bin %> <%= command.id %> --env dev -y --app-root-path=./dev/source/',
    '<%= config.bin %> <%= command.id %> --env dev -y --fetch-source --app-root-path=./dev/source/',
  ];
  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip interactive prompts; use flags and defaults only',
      default: false,
    }),
    resume: Flags.boolean({
      description:
        'Resume a previous unfinished setup for this env using the saved workspace env config',
      default: false,
    }),
    env: Flags.string({
      char: 'e',
      description:
        'App/env name to create or update. Defaults app paths to ./<envName>/source/ and ./<envName>/storage/.',
    }),
    lang: Flags.string({ description: 'Language for the installed NocoBase app', char: 'l', required: false }),
    force: Flags.boolean({
      description: 'Reconfigure an existing env and replace conflicting runtime resources when needed',
      char: 'f',
      required: false,
    }),
    'app-root-path': Flags.string({
      description: 'Source directory for a local npm/git app (default: ./<envName>/source/)',
    }),
    'app-port': Flags.string({
      description: 'HTTP port for the local app (default: 13000, or an available port with --yes)',
    }),
    'storage-path': Flags.string({
      description:
        'Storage directory for uploads and managed database data (default: ./<envName>/storage/)',
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
      description:
        'Create and connect a CLI-managed built-in database for the app',
      default: false,
    }),
    'db-dialect': Flags.string({
      description: 'Database dialect for the app',
      options: ['postgres', 'mysql', 'mariadb', 'kingbase'],
    }),
    'builtin-db-image': Flags.string({
      description:
        'Docker image for the built-in database container (default follows the selected database)',
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
    'fetch-source': Flags.boolean({
      description:
        'Download NocoBase app files or pull a Docker image before installing',
      default: false,
    }),
    ..._.omit(Download.flags, ['yes']),
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

  static appPrompts: PromptsCatalog = {
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
    appRootPath: {
      type: 'text',
      message: installText('prompts.appRootPath.message'),
      placeholder: installText('prompts.appRootPath.placeholder'),
      initialValue: (values) => defaultInstallAppRootPath(values.env ?? values.appName),
    },
    appPort: {
      type: 'text',
      message: installText('prompts.appPort.message'),
      placeholder: installText('prompts.appPort.placeholder'),
      validate: validateAvailableTcpPort,
    },
    storagePath: {
      type: 'text',
      message: installText('prompts.storagePath.message'),
      placeholder: installText('prompts.storagePath.placeholder'),
      initialValue: (values) => defaultInstallStoragePath(values.env ?? values.appName),
    },
    fetchSource: {
      type: 'boolean',
      message: installText('prompts.fetchSource.message'),
      initialValue: true,
      yesInitialValue: true,
    },
  };

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
      initialValue: (values) => defaultBuiltinDbImageForDialect(values.dbDialect),
      hidden: (values) =>
        !Boolean(values.builtinDb)
        || !supportsBuiltinDbDialect(values.dbDialect),
      required: true,
    },
    dbHost: {
      type: 'text',
      message: installText('prompts.dbHost.message'),
      placeholder: installText('prompts.dbHost.placeholder'),
      initialValue: (values) => defaultDbHostForBuiltinDb(values),
      yesInitialValue: DEFAULT_INSTALL_BUILTIN_DB_HOST,
      required: true,
      hidden: (values) => Boolean(values.builtinDb),
    },
    dbPort: {
      type: 'text',
      message: installText('prompts.dbPort.message'),
      placeholder: installText('prompts.dbPort.placeholder'),
      initialValue: (values) => defaultDbPortForDialect(values.dbDialect),
      required: true,
      validate: validateTcpPort,
      hidden: (values) =>
        Boolean(values.builtinDb)
        && String(values.source ?? '').trim() === 'docker',
    },
    dbDatabase: {
      type: 'text',
      message: installText('prompts.dbDatabase.message'),
      initialValue: (values) => defaultDbDatabaseForDialect(values.dbDialect),
      required: true,
    },
    dbUser: {
      type: 'text',
      message: installText('prompts.dbUser.message'),
      initialValue: DEFAULT_INSTALL_DB_USER,
      yesInitialValue: DEFAULT_INSTALL_DB_USER,
      required: true,
    },
    dbPassword: {
      type: 'password',
      message: installText('prompts.dbPassword.message'),
      initialValue: DEFAULT_INSTALL_DB_PASSWORD,
      yesInitialValue: DEFAULT_INSTALL_DB_PASSWORD,
      required: true,
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
   * App catalog with `env` seeded into `out` first so `storagePath`’s `initialValue(values)`
   * sees `values.env` (same iteration order as {@link runPromptCatalog}).
   */
  private static buildAppPromptsCatalog(seedEnv: string): PromptsCatalog {
    return {
      seedEnv: {
        type: 'run',
        run: (values) => {
          (values as Record<string, PromptValue>).env = seedEnv;
        },
      },
      ...Install.appPrompts,
    };
  }

  private static buildDbPromptsCatalog(
    downloadResults: Record<string, PromptValue>,
  ): PromptsCatalog {
    const source = String(downloadResults.source ?? '').trim();
    return {
      seedDownloadSource: {
        type: 'run',
        run: (values) => {
          if (source) {
            (values as Record<string, PromptValue>).source = source;
          }
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
  private static buildPresetValuesFromFlags(flags: InstallParsedFlags): PromptInitialValues {
    const preset: PromptInitialValues = {};
    const argv = process.argv.slice(2);

    if (flags.lang !== undefined) {
      const v = String(flags.lang).trim();
      if (v) {
        preset.lang = v;
      }
    }

    if (argvHasToken(argv, ['--force', '-f'])) {
      preset.force = flags.force;
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

    if (argvHasToken(argv, ['--fetch-source'])) {
      preset.fetchSource = flags['fetch-source'];
    }

    if (argvHasToken(argv, ['--builtin-db'])) {
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

    return preset;
  }

  private static buildAppPresetValuesFromFlags(flags: InstallParsedFlags): PromptInitialValues {
    return pickPresetKeys(Install.buildPresetValuesFromFlags(flags), [
      'lang',
      'force',
      'appRootPath',
      'appPort',
      'storagePath',
      'fetchSource',
    ]);
  }

  private static buildDbPresetValuesFromFlags(flags: InstallParsedFlags): PromptInitialValues {
    return pickPresetKeys(Install.buildPresetValuesFromFlags(flags), [
      'builtinDb',
      'dbDialect',
      'builtinDbImage',
      'dbHost',
      'dbPort',
      'dbDatabase',
      'dbUser',
      'dbPassword',
    ]);
  }

  private static buildRootPresetValuesFromFlags(flags: InstallParsedFlags): PromptInitialValues {
    return pickPresetKeys(Install.buildPresetValuesFromFlags(flags), [
      'rootUsername',
      'rootEmail',
      'rootPassword',
      'rootNickname',
    ]);
  }

  private static toOptionalPromptString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    const text = String(value).trim();
    return text || undefined;
  }

  private static buildResumePresetValues(
    env: Pick<Env, 'name' | 'config'>,
  ): ResumePresetValues {
    const envName = String(env.name ?? '').trim();
    const config = env.config ?? {};
    const source = Install.toOptionalPromptString(config.source);
    const appRootPath = Install.toOptionalPromptString(config.appRootPath);
    const appPort = Install.toOptionalPromptString(config.appPort);
    const storagePath = Install.toOptionalPromptString(config.storagePath);
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
    const builtinDbImage = Install.toOptionalPromptString(config.builtinDbImage);
    const auth = config.auth as { type?: string; accessToken?: string } | undefined;

    const appPreset: PromptInitialValues = {
      ...(appRootPath ? { appRootPath } : {}),
      ...(appPort ? { appPort } : {}),
      ...(storagePath ? { storagePath } : {}),
      ...(
        source
          ? { fetchSource: true }
          : appRootPath
            ? { fetchSource: false }
            : {}
      ),
    };

    const downloadPreset: PromptInitialValues = {
      ...(source ? { source } : {}),
      ...(downloadVersion ? { version: downloadVersion } : {}),
      ...(dockerRegistry ? { dockerRegistry } : {}),
      ...(dockerPlatform ? { dockerPlatform } : {}),
      ...(gitUrl ? { gitUrl } : {}),
      ...(npmRegistry ? { npmRegistry } : {}),
      ...(typeof config.devDependencies === 'boolean'
        ? { devDependencies: config.devDependencies }
        : {}),
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
    };

    const envAddPreset: PromptInitialValues = {};
    if (auth?.type === 'token') {
      envAddPreset.authType = 'token';
      if (Install.toOptionalPromptString(auth.accessToken)) {
        envAddPreset.accessToken = String(auth.accessToken);
      }
    } else if (auth?.type === 'oauth') {
      envAddPreset.authType = 'oauth';
    }

    return {
      envPreset: {
        ...(envName ? { env: envName } : {}),
      },
      appPreset,
      downloadPreset,
      dbPreset,
      envAddPreset,
    };
  }

  private static buildResumeMissingYesFlags(flags: InstallParsedFlags): string[] {
    const missing: string[] = [];
    if (!Install.toOptionalPromptString(flags.lang)) {
      missing.push('--lang');
    }
    if (!Install.toOptionalPromptString(flags['root-username'])) {
      missing.push('--root-username');
    }
    if (!Install.toOptionalPromptString(flags['root-email'])) {
      missing.push('--root-email');
    }
    if (!Install.toOptionalPromptString(flags['root-password'])) {
      missing.push('--root-password');
    }
    if (!Install.toOptionalPromptString(flags['root-nickname'])) {
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

    const env = await getEnv(parsed.env, { scope: CONFIG_SCOPE });
    if (!env) {
      throw new Error(formatMissingManagedAppEnvMessage(parsed.env));
    }

    if (yes) {
      const missingFlags = Install.buildResumeMissingYesFlags(parsed);
      if (missingFlags.length > 0) {
        throw new Error(
          [
            `Cannot continue setup for "${env.name}" in non-interactive resume mode yet.`,
            `These setup-only flags are not saved in the env config: ${missingFlags.join(', ')}`,
            `Run \`nb install --env ${env.name} --resume\` without \`--yes\`, or pass those flags again.`,
          ].join('\n'),
        );
      }
    }

    return Install.buildResumePresetValues(env);
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
      p.log.warn(
        `${options.label ?? 'Default port'} ${normalized} is already in use. Using available port ${nextPort} for this setup.`,
      );
    }

    return nextPort;
  }

  static async buildAppPromptInitialValues(params: {
    envName?: string;
    flags: Pick<InstallParsedFlags, 'app-port' | 'app-root-path' | 'storage-path'>;
  }): Promise<PromptInitialValues> {
    const initialValues: PromptInitialValues = {};
    const envName = params.envName ?? DEFAULT_INSTALL_ENV_NAME;

    if (params.flags['app-root-path'] === undefined) {
      initialValues.appRootPath = defaultInstallAppRootPath(envName);
    }

    if (params.flags['storage-path'] === undefined) {
      initialValues.storagePath = defaultInstallStoragePath(envName);
    }

    if (params.flags['app-port'] === undefined) {
      initialValues.appPort = await Install.resolveAvailableDefaultPort(
        DEFAULT_INSTALL_APP_PORT,
        {
          label: 'Default app port',
          warn: true,
        },
      );
    }

    return initialValues;
  }

  private static shouldPublishBuiltinDbPortForValues(values: Record<string, PromptValue>): boolean {
    const builtinDb =
      values.builtinDb === undefined ? true : Boolean(values.builtinDb);
    return builtinDb
      && Install.shouldPublishBuiltinDbPort(values.source);
  }

  static async buildDbPromptInitialValues(params: {
    flags: Pick<InstallParsedFlags, 'db-port'>;
    downloadResults: Record<string, PromptValue>;
    dbPreset: PromptInitialValues;
  }): Promise<PromptInitialValues> {
    if (params.flags['db-port'] !== undefined) {
      return {};
    }

    const values = {
      ...params.downloadResults,
      ...params.dbPreset,
    } as Record<string, PromptValue>;
    if (!Install.shouldPublishBuiltinDbPortForValues(values)) {
      return {};
    }

    const dialect = String(values.dbDialect ?? 'postgres').trim() || 'postgres';
    const defaultPort = defaultDbPortForDialect(dialect);
    return {
      dbPort: await Install.resolveAvailableDefaultPort(
        defaultPort,
        {
          label: `Default ${dialect} port`,
          warn: true,
        },
      ),
    };
  }

  /**
   * When install runs {@link Download.prompts} after app prompts, align language and
   * output directory defaults with the app settings collected earlier in the flow.
   */
  private static buildDownloadPromptOptionsForInstall(
    appResults: Record<string, PromptValue>,
    envName: string,
  ): RunPromptCatalogOptions {
    const appRoot = String(appResults.appRootPath ?? '').trim() || defaultInstallAppRootPath(envName);
    const lang = String(appResults.lang ?? DEFAULT_INSTALL_LANG).trim() || DEFAULT_INSTALL_LANG;
    const initialValues: PromptInitialValues = {
      lang,
      dockerRegistry: defaultDockerRegistryForLang(lang),
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
          p.cancel('Download cancelled.');
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
    flags: DownloadParsedFlags,
    appResults: Record<string, PromptValue>,
    envName: string,
    yes: boolean,
  ): PromptInitialValues {
    const preset: PromptInitialValues = {};
    const argv = process.argv.slice(2);
    const appRoot = String(appResults.appRootPath ?? '').trim() || defaultInstallAppRootPath(envName);
    const lang = String(appResults.lang ?? DEFAULT_INSTALL_LANG).trim() || DEFAULT_INSTALL_LANG;

    preset.lang = lang;

    if (flags.source !== undefined && String(flags.source).trim() !== '') {
      preset.source = String(flags.source).trim();
    }

    if (flags.version !== undefined) {
      preset.version = String(flags.version).trim() || 'latest';
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
      preset.npmRegistry =
        typeof flags['npm-registry'] === 'string' ? flags['npm-registry'] : '';
    }

    if (argvHasToken(argv, ['--replace', '-r'])) {
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

    if (yes) {
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

  private static defaultWorkspaceName(): string {
    return Install.sanitizeDockerResourceName(`nb-${path.basename(process.cwd())}`);
  }

  private static buildBuiltinDbResourcePrefix(
    envName: string,
    workspaceName?: PromptValue,
  ): string {
    void envName;
    const storedName = String(workspaceName ?? '').trim();
    return storedName
      ? Install.sanitizeDockerResourceName(storedName)
      : Install.defaultWorkspaceName();
  }

  private static async ensureWorkspaceName(): Promise<string> {
    return await ensureWorkspaceName(
      Install.defaultWorkspaceName(),
      { scope: CONFIG_SCOPE },
    );
  }

  private static buildBuiltinDbNetworkName(
    envName: string,
    workspaceName?: PromptValue,
  ): string {
    return Install.buildBuiltinDbResourcePrefix(envName, workspaceName);
  }

  private static buildBuiltinDbContainerName(
    envName: string,
    dbDialect: string,
    workspaceName?: PromptValue,
  ): string {
    return Install.sanitizeDockerResourceName(
      `${Install.buildBuiltinDbResourcePrefix(envName, workspaceName)}-${envName}-${dbDialect}`,
    );
  }

  private static buildDockerAppContainerName(
    envName: string,
    workspaceName?: PromptValue,
  ): string {
    return Install.sanitizeDockerResourceName(
      `${Install.buildBuiltinDbResourcePrefix(envName, workspaceName)}-${envName}-app`,
    );
  }

  private static buildInitAppEnvVars(params: {
    appResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
  }): Record<string, string> {
    const out: Record<string, string> = {};
    const put = (key: string, value: PromptValue | undefined) => {
      const text = String(value ?? '').trim();
      if (!text) {
        return;
      }
      out[key] = text;
    };

    put('INIT_APP_LANG', params.appResults.lang);
    put('INIT_ROOT_USERNAME', params.rootResults.rootUsername);
    put('INIT_ROOT_EMAIL', params.rootResults.rootEmail);
    put('INIT_ROOT_PASSWORD', params.rootResults.rootPassword);
    put('INIT_ROOT_NICKNAME', params.rootResults.rootNickname);

    return out;
  }

  private static shouldPublishBuiltinDbPort(source: PromptValue | undefined): boolean {
    return String(source ?? '').trim() !== 'docker';
  }

  private static buildBuiltinDbPlan(params: {
    envName: string;
    workspaceName?: PromptValue;
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
    const dbPort = String(params.dbPort ?? defaultDbPortForDialect(dbDialect)).trim()
      || defaultDbPortForDialect(dbDialect);
    const defaultDbDatabase = defaultDbDatabaseForDialect(dbDialect);
    const networkName = Install.buildBuiltinDbNetworkName(
      params.envName,
      params.workspaceName,
    );
    const containerName = Install.buildBuiltinDbContainerName(
      params.envName,
      dbDialect,
      params.workspaceName,
    );
    const dbHostInput = String(params.dbHost ?? '').trim();
    const dbHost = Install.shouldPublishBuiltinDbPort(params.source)
      ? (
          dbHostInput
          && dbHostInput !== DEFAULT_INSTALL_BUILTIN_DB_HOST
          && dbHostInput !== containerName
            ? dbHostInput
            : DEFAULT_INSTALL_DB_HOST
        )
      : (
          dbHostInput
          && dbHostInput !== DEFAULT_INSTALL_DB_HOST
          && dbHostInput !== 'localhost'
            ? dbHostInput
            : containerName
        );

    if (dbDialect === 'postgres') {
      const image = String(params.builtinDbImage ?? '').trim() || DEFAULT_INSTALL_BUILTIN_DB_IMAGES.postgres;
      const dataDir = path.resolve(params.storagePath, 'db', 'postgres');
      const args = [
        'run',
        '-d',
        '--name',
        containerName,
        '--restart',
        'always',
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
        dbDatabase:
          String(params.dbDatabase ?? defaultDbDatabase).trim()
          || defaultDbDatabase,
        dbUser:
          String(params.dbUser ?? DEFAULT_INSTALL_DB_USER).trim()
          || DEFAULT_INSTALL_DB_USER,
        dbPassword:
          String(params.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD)
          || DEFAULT_INSTALL_DB_PASSWORD,
        networkName,
        containerName,
        dataDir,
        builtinDbImage: image,
        image,
        args,
      };
    }

    if (dbDialect === 'mysql') {
      const image = String(params.builtinDbImage ?? '').trim() || DEFAULT_INSTALL_BUILTIN_DB_IMAGES.mysql;
      const dataDir = path.resolve(params.storagePath, 'db', 'mysql');
      const dbUser = String(params.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER;
      const dbDatabase = String(params.dbDatabase ?? defaultDbDatabase).trim() || defaultDbDatabase;
      const dbPassword = String(params.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD;
      const args = [
        'run',
        '-d',
        '--name',
        containerName,
        '--restart',
        'always',
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
      const image = String(params.builtinDbImage ?? '').trim() || DEFAULT_INSTALL_BUILTIN_DB_IMAGES.mariadb;
      const dataDir = path.resolve(params.storagePath, 'db', 'mariadb');
      const dbUser = String(params.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER;
      const dbDatabase = String(params.dbDatabase ?? defaultDbDatabase).trim() || defaultDbDatabase;
      const dbPassword = String(params.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD;
      const args = [
        'run',
        '-d',
        '--name',
        containerName,
        '--restart',
        'always',
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
      const image = String(params.builtinDbImage ?? '').trim() || DEFAULT_INSTALL_BUILTIN_DB_IMAGES.kingbase;
      const dataDir = path.resolve(params.storagePath, 'db', 'kingbase');
      const dbUser = String(params.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER;
      const dbDatabase = String(params.dbDatabase ?? defaultDbDatabase).trim() || defaultDbDatabase;
      const dbPassword = String(params.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD;
      const args = [
        'run',
        '-d',
        '--name',
        containerName,
        '--restart',
        'always',
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
    p.log.step(`Checking Docker network: ${name}`);
    const exists = await commandSucceeds('docker', ['network', 'inspect', name]);
    if (exists) {
      p.log.info(`Docker network already exists: ${name}`);
      return;
    }

    p.log.step(`Creating Docker network: ${name}`);
    try {
      await run('docker', ['network', 'create', name], {
        errorName: 'docker network create',
      });
      p.log.info(`Docker network is ready: ${name}`);
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
    return await commandSucceeds('docker', [
      'container',
      'inspect',
      name,
    ]);
  }

  private async removeDockerContainer(name: string): Promise<void> {
    await run('docker', ['rm', '-f', name], {
      errorName: 'docker rm',
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

    p.log.info(
      `Removing existing ${params.displayName}: ${params.containerName}`,
    );
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

  private async ensureBuiltinDbContainer(plan: BuiltinDbPlan): Promise<void> {
    const exists = await this.dockerContainerExists(plan.containerName);
    if (exists) {
      p.log.info(
        `Built-in ${plan.dbDialect} container already exists: ${plan.containerName}`,
      );
      return;
    }

    await mkdir(plan.dataDir, { recursive: true });
    await run('docker', plan.args, {
      errorName: 'docker run',
    });
  }

  private async startBuiltinDb(params: {
    envName: string;
    workspaceName?: PromptValue;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    force?: boolean;
  }): Promise<BuiltinDbPlan> {
    const storagePath =
      String(params.appResults.storagePath ?? '').trim()
      || defaultInstallStoragePath(params.envName);
    const plan = Install.buildBuiltinDbPlan({
      envName: params.envName,
      workspaceName: params.workspaceName,
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

    p.log.step(`Preparing built-in ${plan.dbDialect} database`);
    await this.ensureDockerNetwork(plan.networkName);
    await this.removeDockerContainerIfForced({
      containerName: plan.containerName,
      displayName: `built-in ${plan.dbDialect} container`,
      force: params.force,
    });

    if (Install.shouldPublishBuiltinDbPort(params.downloadResults.source)) {
      const portError = await validateAvailableTcpPort(plan.dbPort);
      if (portError) {
        throw new Error(
          `Built-in ${plan.dbDialect} needs host port ${plan.dbPort}, but ${portError}`,
        );
      }
    }

    await this.ensureBuiltinDbContainer(plan);
    p.log.info(
      `Built-in ${plan.dbDialect} database is ready at ${plan.dbHost}:${plan.dbPort}`,
    );

    return plan;
  }

  private static buildDockerAppPlan(params: {
    envName: string;
    workspaceName?: PromptValue;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
    networkName: string;
  }): DockerAppPlan {
    const dockerRegistry =
      String(downloadResultsValue(params.downloadResults, 'dockerRegistry') ?? '').trim()
      || defaultDockerRegistryForLang(params.appResults.lang);
    const version = String(downloadResultsValue(params.downloadResults, 'version') ?? '').trim() || 'latest';
    const appPort = String(params.appResults.appPort ?? DEFAULT_INSTALL_APP_PORT).trim() || DEFAULT_INSTALL_APP_PORT;
    const storagePath =
      path.resolve(
        String(params.appResults.storagePath ?? '').trim()
        || defaultInstallStoragePath(params.envName),
      );
    const dbDialect = String(params.dbResults.dbDialect ?? 'postgres').trim() || 'postgres';
    const dbHost = String(params.dbResults.dbHost ?? DEFAULT_INSTALL_DB_HOST).trim() || DEFAULT_INSTALL_DB_HOST;
    const dbPort = String(params.dbResults.dbPort ?? defaultDbPortForDialect(dbDialect)).trim()
      || defaultDbPortForDialect(dbDialect);
    const dbDatabase = String(params.dbResults.dbDatabase ?? DEFAULT_INSTALL_DB_DATABASE).trim()
      || DEFAULT_INSTALL_DB_DATABASE;
    const dbUser = String(params.dbResults.dbUser ?? DEFAULT_INSTALL_DB_USER).trim() || DEFAULT_INSTALL_DB_USER;
    const dbPassword = String(params.dbResults.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD) || DEFAULT_INSTALL_DB_PASSWORD;
    const appKey = crypto.randomBytes(32).toString('hex');
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const containerName = Install.buildDockerAppContainerName(
      params.envName,
      params.workspaceName,
    );
    const initEnvVars = Install.buildInitAppEnvVars({
      appResults: params.appResults,
      rootResults: params.rootResults,
    });
    const args = [
      'run',
      '-d',
      '--name',
      containerName,
      '--restart',
      'always',
      '--network',
      params.networkName,
      '-p',
      `${appPort}:80`,
    ];

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
      `${dockerRegistry}:${version}`,
    );

    return {
      source: 'docker',
      networkName: params.networkName,
      containerName,
      imageRef: `${dockerRegistry}:${version}`,
      appPort,
      storagePath,
      appKey,
      timeZone,
      args,
    };
  }

  private async ensureDockerAppContainer(plan: DockerAppPlan): Promise<'created' | 'existing'> {
    const exists = await this.dockerContainerExists(plan.containerName);
    if (exists) {
      p.log.info(`App container already exists: ${plan.containerName}`);
      return 'existing';
    }

    await mkdir(plan.storagePath, { recursive: true });
    await run('docker', plan.args, {
      errorName: 'docker run',
    });
    return 'created';
  }

  private async installDockerApp(params: {
    envName: string;
    workspaceName?: PromptValue;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
    builtinDbPlan?: BuiltinDbPlan;
    force?: boolean;
  }): Promise<DockerAppPlan> {
    const networkName =
      params.builtinDbPlan?.networkName
      ?? Install.buildBuiltinDbNetworkName(
        params.envName,
        params.workspaceName,
      );
    await this.ensureDockerNetwork(networkName);
    const plan = Install.buildDockerAppPlan({
      envName: params.envName,
      workspaceName: params.workspaceName,
      appResults: params.appResults,
      downloadResults: params.downloadResults,
      dbResults: params.dbResults,
      rootResults: params.rootResults,
      networkName,
    });

    p.log.step(`Starting Docker app ${plan.imageRef}`);
    await this.removeDockerContainerIfForced({
      containerName: plan.containerName,
      displayName: 'app container',
      force: params.force,
    });
    const containerState = await this.ensureDockerAppContainer(plan);
    if (containerState === 'existing') {
      const env = await this.inspectDockerContainerEnv(plan.containerName);
      plan.appKey = env.APP_KEY || plan.appKey;
      plan.timeZone = env.TZ || plan.timeZone;
    }
    p.log.info(`App container is ready at http://127.0.0.1:${plan.appPort}`);

    return plan;
  }

  private static pushDownloadArgIfValue(
    argv: string[],
    flag: string,
    value: PromptValue | undefined,
  ): void {
    const text = String(value ?? '').trim();
    if (text) {
      argv.push(flag, text);
    }
  }

  private static buildDownloadArgvFromResults(
    results: Record<string, PromptValue>,
  ): string[] {
    const argv = ['-y', '--no-intro'];
    Install.pushDownloadArgIfValue(argv, '--source', results.source);
    Install.pushDownloadArgIfValue(argv, '--version', results.version);
    Install.pushDownloadArgIfValue(argv, '--output-dir', results.outputDir);
    Install.pushDownloadArgIfValue(argv, '--git-url', results.gitUrl);
    Install.pushDownloadArgIfValue(argv, '--docker-registry', results.dockerRegistry);
    Install.pushDownloadArgIfValue(argv, '--docker-platform', results.dockerPlatform);
    Install.pushDownloadArgIfValue(argv, '--npm-registry', results.npmRegistry);

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
    }
    if (Boolean(results.buildDts)) {
      argv.push('--build-dts');
    }

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
      String(params.downloadResults.outputDir ?? '').trim()
      || String(params.appResults.appRootPath ?? '').trim()
      || defaultInstallAppRootPath(params.envName);
    return path.resolve(process.cwd(), outputDir);
  }

  private async downloadLocalApp(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
  }): Promise<string> {
    const argv = Install.buildDownloadArgvFromResults(params.downloadResults);
    p.log.step('Downloading local NocoBase app files');
    const result = await this.config.runCommand(
      'download',
      argv,
    ) as DownloadCommandResult | undefined;

    const projectRoot = Install.resolveLocalProjectRoot({
      envName: params.envName,
      appResults: params.appResults,
      downloadResults: params.downloadResults,
      downloadCommandResult: result,
    });
    params.appResults.appRootPath = projectRoot;
    return projectRoot;
  }

  private static buildLocalAppEnvVars(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
  }): Record<string, string> {
    const storagePath = path.resolve(
      String(params.appResults.storagePath ?? '').trim()
      || defaultInstallStoragePath(params.envName),
    );
    const dbDialect =
      String(params.dbResults.dbDialect ?? 'postgres').trim()
      || 'postgres';
    const appKey = crypto.randomBytes(32).toString('hex');
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const env: Record<string, string> = {
      STORAGE_PATH: storagePath,
      APP_PORT:
        String(params.appResults.appPort ?? DEFAULT_INSTALL_APP_PORT).trim()
        || DEFAULT_INSTALL_APP_PORT,
      APP_KEY: appKey,
      TZ: timeZone,
      DB_DIALECT: dbDialect,
      DB_HOST:
        String(params.dbResults.dbHost ?? DEFAULT_INSTALL_DB_HOST).trim()
        || DEFAULT_INSTALL_DB_HOST,
      DB_PORT:
        String(params.dbResults.dbPort ?? defaultDbPortForDialect(dbDialect)).trim()
        || defaultDbPortForDialect(dbDialect),
      DB_DATABASE:
        String(params.dbResults.dbDatabase ?? DEFAULT_INSTALL_DB_DATABASE).trim()
        || DEFAULT_INSTALL_DB_DATABASE,
      DB_USER:
        String(params.dbResults.dbUser ?? DEFAULT_INSTALL_DB_USER).trim()
        || DEFAULT_INSTALL_DB_USER,
      DB_PASSWORD:
        String(params.dbResults.dbPassword ?? DEFAULT_INSTALL_DB_PASSWORD)
        || DEFAULT_INSTALL_DB_PASSWORD,
      ...Install.buildInitAppEnvVars({
        appResults: params.appResults,
        rootResults: params.rootResults,
      }),
    };

    return env;
  }

  private async startLocalApp(params: {
    envName: string;
    source: 'npm' | 'git';
    projectRoot: string;
    appResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    rootResults: Record<string, PromptValue>;
  }): Promise<LocalAppPlan> {
    const env = Install.buildLocalAppEnvVars({
      envName: params.envName,
      appResults: params.appResults,
      dbResults: params.dbResults,
      rootResults: params.rootResults,
    });
    const args = ['start', '--quickstart', '--daemon'];

    p.log.step(`Stopping any existing local NocoBase process in ${params.projectRoot}`);
    try {
      await runNocoBaseCommand(['pm2', 'kill'], {
        cwd: params.projectRoot,
        env,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      p.log.info(
        `Skipped local process cleanup before start: ${message}`,
      );
    }

    p.log.step(`Starting local NocoBase app from ${params.projectRoot}`);
    await runNocoBaseCommand(args, {
      cwd: params.projectRoot,
      env,
    });
    p.log.info(`Local app is starting at http://127.0.0.1:${env.APP_PORT}`);

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
  }): string {
    const appPort =
      String(params.appResults.appPort ?? DEFAULT_INSTALL_APP_PORT).trim()
      || DEFAULT_INSTALL_APP_PORT;

    return (
      String(params.envAddResults.apiBaseUrl ?? '').trim()
      || `http://127.0.0.1:${appPort}/api`
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
        message: response.ok
          ? `HTTP ${response.status}: ${body}`
          : `HTTP ${response.status}: ${body}`,
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
    },
  ): Promise<void> {
    const healthCheckUrl = Install.buildHealthCheckUrl(apiBaseUrl);
    const timeoutMs = options?.timeoutMs ?? APP_HEALTH_CHECK_TIMEOUT_MS;
    const intervalMs = options?.intervalMs ?? APP_HEALTH_CHECK_INTERVAL_MS;
    const requestTimeoutMs =
      options?.requestTimeoutMs ?? APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS;
    const fetchImpl = options?.fetchImpl ?? fetch;
    const startedAt = Date.now();
    let lastMessage = 'No response yet';
    let taskActive = true;

    startTask(
      `Waiting for application health check: ${healthCheckUrl}. NocoBase has started and is still booting...`,
    );

    try {
      while (Date.now() - startedAt < timeoutMs) {
        const result = await Install.requestAppHealthCheck({
          healthCheckUrl,
          fetchImpl,
          requestTimeoutMs,
        });

        if (result.ok) {
          stopTask();
          taskActive = false;
          p.log.info(`Application health check passed: ${healthCheckUrl}`);
          return;
        }

        lastMessage = result.message;
        const elapsedSeconds = Math.max(
          1,
          Math.floor((Date.now() - startedAt) / 1000),
        );
        updateTask(
          `Waiting for application health check: ${healthCheckUrl}. Still starting... (${elapsedSeconds}s elapsed, last status: ${Install.formatHealthCheckMessage(lastMessage)})`,
        );

        const remainingMs = timeoutMs - (Date.now() - startedAt);
        if (remainingMs <= 0) {
          break;
        }
        await Install.sleep(Math.min(intervalMs, remainingMs));
      }
    } finally {
      if (taskActive) {
        stopTask();
      }
    }

    const logHint = options?.containerName
      ? ` You can inspect startup logs with: docker logs ${options.containerName}`
      : '';
    throw new Error(
      `The application did not become ready in time. Expected \`${healthCheckUrl}\` to respond with \`ok\`, but the last status was: ${Install.formatHealthCheckMessage(lastMessage)}.${logHint}`,
    );
  }

  private async saveInstalledEnv(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    envAddResults: Record<string, PromptValue>;
  }): Promise<void> {
    await this.config.runCommand(
      'env:add',
      Install.buildEnvAddArgv(params),
    );
  }

  private static pushArgIfValue(argv: string[], flag: string, value: PromptValue | undefined): void {
    const text = String(value ?? '').trim();
    if (text) {
      argv.push(flag, text);
    }
  }

  private static pushBooleanArgIfSet(argv: string[], flag: string, value: PromptValue | undefined): void {
    if (value === undefined) {
      return;
    }
    argv.push(Boolean(value) ? flag : `--no-${flag.replace(/^--/, '')}`);
  }

  private static buildEnvAddArgv(params: {
    envName: string;
    appResults: Record<string, PromptValue>;
    downloadResults: Record<string, PromptValue>;
    dbResults: Record<string, PromptValue>;
    envAddResults: Record<string, PromptValue>;
  }): string[] {
    const appPort =
      String(params.appResults.appPort ?? DEFAULT_INSTALL_APP_PORT).trim()
      || DEFAULT_INSTALL_APP_PORT;
    const storagePath =
      String(params.appResults.storagePath ?? '').trim()
      || defaultInstallStoragePath(params.envName);
    const apiBaseUrl = Install.resolveApiBaseUrl({
      appResults: params.appResults,
      envAddResults: params.envAddResults,
    });
    const authType =
      String(params.envAddResults.authType ?? 'oauth').trim()
      || 'oauth';
    const argv = [
      params.envName,
      '--no-intro',
      '--scope',
      CONFIG_SCOPE,
      '--api-base-url',
      apiBaseUrl,
      '--auth-type',
      authType,
      '--app-port',
      appPort,
      '--storage-path',
      storagePath,
    ];

    Install.pushArgIfValue(
      argv,
      '--source',
      downloadResultsValue(params.downloadResults, 'source'),
    );
    Install.pushArgIfValue(
      argv,
      '--download-version',
      downloadResultsValue(params.downloadResults, 'version'),
    );
    Install.pushArgIfValue(
      argv,
      '--docker-registry',
      downloadResultsValue(params.downloadResults, 'dockerRegistry'),
    );
    Install.pushArgIfValue(
      argv,
      '--docker-platform',
      downloadResultsValue(params.downloadResults, 'dockerPlatform'),
    );
    Install.pushArgIfValue(
      argv,
      '--git-url',
      downloadResultsValue(params.downloadResults, 'gitUrl'),
    );
    Install.pushArgIfValue(
      argv,
      '--npm-registry',
      downloadResultsValue(params.downloadResults, 'npmRegistry'),
    );
    Install.pushBooleanArgIfSet(
      argv,
      '--dev-dependencies',
      downloadResultsValue(params.downloadResults, 'devDependencies'),
    );
    Install.pushBooleanArgIfSet(
      argv,
      '--build',
      downloadResultsValue(params.downloadResults, 'build'),
    );
    Install.pushBooleanArgIfSet(
      argv,
      '--build-dts',
      downloadResultsValue(params.downloadResults, 'buildDts'),
    );
    Install.pushArgIfValue(argv, '--app-root-path', params.appResults.appRootPath);
    Install.pushArgIfValue(argv, '--app-key', params.appResults.appKey);
    Install.pushArgIfValue(argv, '--timezone', params.appResults.timeZone);
    Install.pushBooleanArgIfSet(argv, '--builtin-db', params.dbResults.builtinDb);
    Install.pushArgIfValue(argv, '--db-dialect', params.dbResults.dbDialect);
    Install.pushArgIfValue(argv, '--builtin-db-image', params.dbResults.builtinDbImage);
    Install.pushArgIfValue(argv, '--db-host', params.dbResults.dbHost);
    Install.pushArgIfValue(argv, '--db-port', params.dbResults.dbPort);
    Install.pushArgIfValue(argv, '--db-database', params.dbResults.dbDatabase);
    Install.pushArgIfValue(argv, '--db-user', params.dbResults.dbUser);
    Install.pushArgIfValue(argv, '--db-password', params.dbResults.dbPassword);

    if (authType === 'token') {
      argv.push('--access-token', String(params.envAddResults.accessToken ?? ''));
    }

    return argv;
  }

  private async collectPromptResults(
    parsed: InstallParsedFlags & DownloadParsedFlags,
    yes: boolean,
  ): Promise<InstallPromptResults> {
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

    const envName =
      String(envResults.env ?? '').trim() || DEFAULT_INSTALL_ENV_NAME;

    const appPreset = {
      ...(resumePreset?.appPreset ?? {}),
      ...Install.buildAppPresetValuesFromFlags(parsed),
    };
    const appCatalog = Install.buildAppPromptsCatalog(envName);
    const appResults = await runPromptCatalog(appCatalog, {
      initialValues: await Install.buildAppPromptInitialValues({
        envName,
        flags: {
          ...parsed,
          'app-root-path':
            parsed['app-root-path']
            ?? Install.toOptionalPromptString(appPreset.appRootPath),
          'app-port':
            parsed['app-port']
            ?? Install.toOptionalPromptString(appPreset.appPort),
          'storage-path':
            parsed['storage-path']
            ?? Install.toOptionalPromptString(appPreset.storagePath),
        },
      }),
      values: appPreset,
      yes,
    });

    let downloadResults: Record<string, PromptValue> = {};
    if (Boolean(appResults.fetchSource)) {
      const downloadOpts = Install.buildDownloadPromptOptionsForInstall(appResults, envName);
      downloadOpts.values = {
        ...(resumePreset?.downloadPreset ?? {}),
        ...downloadOpts.values,
        ...Install.buildDownloadPresetValuesForInstall(parsed, appResults, envName, yes),
      };
      downloadOpts.yes = yes;
      downloadResults = await runPromptCatalog(Download.prompts, downloadOpts);
    }

    const dbPreset = {
      ...(resumePreset?.dbPreset ?? {}),
      ...Install.buildDbPresetValuesFromFlags(parsed),
    };
    const dbResults = await runPromptCatalog(Install.buildDbPromptsCatalog(downloadResults), {
      initialValues: {
        ...downloadResults,
        ...await Install.buildDbPromptInitialValues({
          flags: {
            ...parsed,
            'db-port':
              parsed['db-port']
              ?? Install.toOptionalPromptString(dbPreset.dbPort),
          },
          downloadResults,
          dbPreset,
        }),
      },
      values: dbPreset,
      yes,
    });

    const rootPreset = Install.buildRootPresetValuesFromFlags(parsed);
    const rootResults = await runPromptCatalog(Install.rootUserPrompts, {
      initialValues: {},
      values: rootPreset,
      yes,
    });

    const envAddResults = await runPromptCatalog(EnvAdd.prompts, {
      initialValues: {
        apiBaseUrl: `http://127.0.0.1:${appResults.appPort ?? DEFAULT_INSTALL_APP_PORT}/api`,
      },
      values: {
        name: envName,
        scope: 'project',
        ...(resumePreset?.envAddPreset ?? {}),
      },
      yes,
    });

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
    if (!parsed['no-intro']) {
      p.intro('Set Up NocoBase');
    }
    if (parsed.resume) {
      const envLabel = Install.toOptionalPromptString(parsed.env);
      p.log.step(
        envLabel
          ? `Resuming setup for env "${envLabel}" from the saved workspace config`
          : 'Resuming setup from the saved workspace config',
      );
    }
    const promptResults = await this.collectPromptResults(parsed, flags.yes);
    const {
      envName,
      appResults,
      downloadResults,
      dbResults,
      rootResults,
      envAddResults,
    } = promptResults;

    const source = String(downloadResultsValue(downloadResults, 'source') ?? '').trim();
    const usesDockerResources =
      Boolean(dbResults.builtinDb)
      || (Boolean(appResults.fetchSource) && source === 'docker');
    const workspaceName = usesDockerResources
      ? await Install.ensureWorkspaceName()
      : undefined;

    let builtinDbPlan: BuiltinDbPlan | undefined;
    if (Boolean(dbResults.builtinDb)) {
      builtinDbPlan = await this.startBuiltinDb({
        envName,
        workspaceName,
        appResults,
        downloadResults,
        dbResults,
        force: parsed.force,
      });
      dbResults.dbHost = builtinDbPlan.dbHost;
      dbResults.dbPort = builtinDbPlan.dbPort;
      dbResults.dbDialect = builtinDbPlan.dbDialect;
      dbResults.dbDatabase = builtinDbPlan.dbDatabase;
      dbResults.dbUser = builtinDbPlan.dbUser;
      dbResults.dbPassword = builtinDbPlan.dbPassword;
    }

    let dockerAppPlan: DockerAppPlan | undefined;
    let localAppPlan: LocalAppPlan | undefined;
    if (Boolean(appResults.fetchSource)) {
      if (source === 'docker') {
        dockerAppPlan = await this.installDockerApp({
          envName,
          workspaceName,
          appResults,
          downloadResults,
          dbResults,
          rootResults,
          builtinDbPlan,
          force: parsed.force,
        });
        appResults.appKey = dockerAppPlan.appKey;
        appResults.timeZone = dockerAppPlan.timeZone;
      } else if (source === 'npm' || source === 'git') {
        const projectRoot = await this.downloadLocalApp({
          envName,
          appResults,
          downloadResults,
        });
        localAppPlan = await this.startLocalApp({
          envName,
          source,
          projectRoot,
          appResults,
          dbResults,
          rootResults,
        });
        appResults.appKey = localAppPlan.appKey;
        appResults.timeZone = localAppPlan.timeZone;
      }
    } else {
      p.log.info('Skipped app download and install.');
    }

    if (dockerAppPlan || localAppPlan) {
      await this.waitForAppHealthCheck(
        Install.resolveApiBaseUrl({
          appResults,
          envAddResults,
        }),
        {
          containerName: dockerAppPlan?.containerName,
        },
      );
    }

    await this.saveInstalledEnv({
      envName,
      appResults,
      downloadResults,
      dbResults,
      envAddResults,
    });

    p.outro(
      dockerAppPlan || localAppPlan
        ? `NocoBase is ready at http://127.0.0.1:${dockerAppPlan?.appPort ?? localAppPlan?.appPort}`
        : `Install config for "${envName}" has been saved.`,
    );
  }
}

function downloadResultsValue(
  downloadResults: Record<string, PromptValue>,
  key: string,
): PromptValue | undefined {
  return downloadResults[key];
}
