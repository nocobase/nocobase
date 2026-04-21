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
import pc from 'picocolors';
import path from 'node:path';
import { exit, stdin as stdinStream, stdout as stdoutStream } from 'node:process';
import { loadAuthConfig, saveAuthConfig, type EnvConfigEntry } from '../lib/auth-store.js';
import {
  type PromptInitialValues,
  type PromptsCatalog,
  type PromptValue,
  type RunPromptCatalogOptions,
  runPromptCatalog,
} from '../lib/prompt-catalog.ts';
import { runNocoBaseCommand } from '../lib/run-npm.js';
import Download, { DownloadParsedFlags, type DownloadCommandResult } from './download.js';
import EnvAdd from './env/add.ts';

const DEFAULT_INSTALL_ENV_NAME = 'local';
const DEFAULT_INSTALL_LANG = 'en-US';
const CONFIG_SCOPE = 'project' as const;

const INSTALL_DB_DIALECTS = ['postgres', 'mysql', 'mariadb', 'kingbase'] as const;

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((t) => argv.includes(t));
}

function isInstallDbDialect(value: string): value is (typeof INSTALL_DB_DIALECTS)[number] {
  return (INSTALL_DB_DIALECTS as readonly string[]).includes(value);
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

/** Parsed `nb install` flags (oclif output shape). */
type InstallParsedFlags = {
  yes: boolean;
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
  'start-builtin-db': boolean;
  'db-dialect'?: string;
  'db-host'?: string;
  'db-port'?: string;
  'db-database'?: string;
  'db-user'?: string;
  'db-password'?: string;
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

export default class Install extends Command {
  static override description =
    'Install NocoBase: database, storage, admin user, and `nocobase-v1 install`. Optionally run `nb download` first; distribution and image details are configured on `nb download`, not here.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -f',
    '<%= config.bin %> <%= command.id %> -l zh-CN',
    '<%= config.bin %> <%= command.id %> -u nocobase -m admin@nocobase.com -p admin123',
    '<%= config.bin %> <%= command.id %> -n "Super Admin"',
    '<%= config.bin %> <%= command.id %> --app-root-path=./nocobase --storage-path=./storage/myenv -e myenv',
    '<%= config.bin %> <%= command.id %> -y --env dev --app-root-path=./nocobase',
    '<%= config.bin %> <%= command.id %> -y --env dev --fetch-source --app-root-path=./nocobase',
  ];
  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip interactive prompts; use flags and defaults only',
      default: false,
    }),
    env: Flags.string({
      char: 'e',
      description:
        'Application name (CLI env key). Required. Storage defaults to ./storage/<name> unless --storage-path is set',
    }),
    lang: Flags.string({ description: 'Language during installation', char: 'l', required: false }),
    force: Flags.boolean({
      description: 'Reinstall the application by clearing the database',
      char: 'f',
      required: false,
    }),
    'app-root-path': Flags.string({
      description: 'Application root directory for install (relative to cwd; default: ./nocobase)',
    }),
    'app-port': Flags.string({
      description: 'Application HTTP port (APP_PORT; default: 13000)',
    }),
    'storage-path': Flags.string({
      description:
        'Storage directory (relative to cwd; default: ./storage/<env> when --env is set, else ./storage/default)',
    }),
    'root-username': Flags.string({
      char: 'u',
      description: 'Root username (sets INIT_ROOT_USERNAME for install; forwarded as --root-username)',
      required: false,
    }),
    'root-email': Flags.string({
      char: 'm',
      description: 'Root user email (sets INIT_ROOT_EMAIL for install; forwarded as --root-email)',
      required: false,
    }),
    'root-password': Flags.string({
      char: 'p',
      description: 'Root user password (forwarded as --root-password)',
      required: false,
    }),
    'root-nickname': Flags.string({
      char: 'n',
      description: 'Root user nickname (forwarded as --root-nickname)',
      required: false,
    }),
    'builtin-db': Flags.boolean({
      description:
        'Run `nb db start` before install (use with `-y` when you rely on the CLI-managed database)',
      default: false,
    }),
    'db-dialect': Flags.string({
      description: 'Database dialect (e.g. postgres, mysql)',
      options: ['postgres', 'mysql', 'mariadb', 'kingbase'],
    }),
    'db-host': Flags.string({
      description: 'Database host',
    }),
    'db-port': Flags.string({
      description: 'Database port',
    }),
    'db-database': Flags.string({
      description: 'Database name',
    }),
    'db-user': Flags.string({
      description: 'Database user',
    }),
    'db-password': Flags.string({
      description: 'Database password',
    }),
    'fetch-source': Flags.boolean({
      description:
        'Run `nb download` before install. Use `nb download` for distribution choice and all fetch options (`-v`, `--git-url`, docker image flags, etc.). With `-y`, install delegates using `nb download -y --source npm` (`-o` aligns with `--app-root-path` when set).',
      default: false,
    }),
    ..._.omit(Download.flags, ['yes']),
  };

  /** Environment name only: run before {@link Install.prompts} (see `run`). */
  static envPrompts: PromptsCatalog = {
    intro: {
      type: 'intro',
      title: 'nb install',
    },
    env: {
      type: 'text',
      message: 'Application name (CLI env key) (-e / --env)',
      placeholder: DEFAULT_INSTALL_ENV_NAME,
      initialValue: DEFAULT_INSTALL_ENV_NAME,
      yesInitialValue: DEFAULT_INSTALL_ENV_NAME,
      required: true,
    },
  };

  static appPrompts: PromptsCatalog = {
    lang: {
      type: 'text',
      message: 'Language during installation (-l / --lang)',
      placeholder: DEFAULT_INSTALL_LANG,
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
      message: 'Application root directory for install, relative to cwd (--app-root-path)',
      placeholder: './nocobase',
      initialValue: './nocobase',
      yesInitialValue: './nocobase',
    },
    appPort: {
      type: 'text',
      message: 'Application HTTP port (APP_PORT) (--app-port)',
      placeholder: '13000',
      initialValue: '13000',
      yesInitialValue: '13000',
    },
    storagePath: {
      type: 'text',
      message:
        'Storage directory, relative to cwd (--storage-path; default: ./storage/<env> when env is set)',
      placeholder: './storage/<env>',
      initialValue: (values) => {
        const name =
          String(values.env ?? DEFAULT_INSTALL_ENV_NAME).trim() || DEFAULT_INSTALL_ENV_NAME;
        return `./storage/${name}`;
      },
    },
    fetchSource: {
      type: 'boolean',
      message:
        'Run `nb download` before install? (--fetch-source; use `nb download` for source and version)',
      initialValue: false,
      yesInitialValue: false,
    },
  };

  static dbPrompts: PromptsCatalog = {
    startBuiltinDb: {
      type: 'boolean',
      message: 'Run `nb db start` before install? (--start-builtin-db)',
      initialValue: false,
      yesInitialValue: false,
    },
    dbDialect: {
      type: 'select',
      message: 'Database dialect (--db-dialect)',
      options: ['postgres', 'mysql', 'mariadb', 'kingbase'],
      initialValue: 'postgres',
      yesInitialValue: 'postgres',
    },
    dbHost: {
      type: 'text',
      message: 'Database host (--db-host)',
      placeholder: '127.0.0.1',
    },
    dbPort: {
      type: 'text',
      message: 'Database port (--db-port)',
      placeholder: '5432',
    },
    dbDatabase: {
      type: 'text',
      message: 'Database name (--db-database)',
    },
    dbUser: {
      type: 'text',
      message: 'Database user (--db-user)',
    },
    dbPassword: {
      type: 'password',
      message: 'Database password (--db-password)',
    },
  };

  static rootUserPrompts: PromptsCatalog = {
    rootUsername: {
      type: 'text',
      message: 'Root username (INIT_ROOT_USERNAME; --root-username / -u)',
      placeholder: 'nocobase',
    },
    rootEmail: {
      type: 'text',
      message: 'Root user email (INIT_ROOT_EMAIL; --root-email / -m)',
      placeholder: 'admin@example.com',
    },
    rootPassword: {
      type: 'password',
      message: 'Root user password (--root-password / -p)',
    },
    rootNickname: {
      type: 'text',
      message: 'Root user nickname (--root-nickname / -n)',
      placeholder: 'Super Admin',
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

    if (argvHasToken(argv, ['--start-builtin-db'])) {
      preset.startBuiltinDb = flags['start-builtin-db'];
    }

    if (flags['db-dialect'] !== undefined) {
      const t = String(flags['db-dialect']).trim();
      if (t && isInstallDbDialect(t)) {
        preset.dbDialect = t;
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
      'startBuiltinDb',
      'dbDialect',
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

  /**
   * When install runs {@link Download.prompts} after app prompts, align output dir with
   * `appRootPath` and, under `-y`, preset npm + latest like `nb download -y --source npm`.
   */
  private static buildDownloadPromptOptionsForInstall(
    appResults: Record<string, PromptValue>,
    yes: boolean,
  ): RunPromptCatalogOptions {
    const appRoot = String(appResults.appRootPath ?? '').trim() || './nocobase';
    const initialValues: PromptInitialValues = {
      outputDir: appRoot,
    };

    const values: PromptInitialValues = {};
    if (yes) {
      values.source = 'npm';
      values.version = 'latest';
      values.outputDir = appRoot;
    }

    return {
      initialValues,
      values,
      yes,
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

  public async run(): Promise<void> {
    const { flags } = await this.parse(Install);
    const parsed = flags as unknown as InstallParsedFlags & DownloadParsedFlags;

    // 1. env prompts
    const envPreset = Install.buildEnvPresetValuesFromFlags(parsed);
    const envResults = await runPromptCatalog(Install.envPrompts, {
      initialValues: {},
      values: envPreset,
      yes: flags.yes,
    });

    const envName =
      String(envResults.env ?? '').trim() || DEFAULT_INSTALL_ENV_NAME;

    // 2. app prompts (storagePath needs `env` in `out` via seedEnv)
    const appPreset = Install.buildAppPresetValuesFromFlags(parsed);
    const appCatalog = Install.buildAppPromptsCatalog(envName);
    const appResults = await runPromptCatalog(appCatalog, {
      initialValues: {},
      values: appPreset,
      yes: flags.yes,
    });

    // 3–4. optional download (same catalog as `nb download`)
    let downloadResults: Record<string, PromptValue> = {};
    if (Boolean(appResults.fetchSource)) {
      const downloadOpts = Install.buildDownloadPromptOptionsForInstall(appResults, flags.yes);
      downloadResults = await runPromptCatalog(Download.prompts, downloadOpts);
    }

    // 5. db prompts
    const dbPreset = Install.buildDbPresetValuesFromFlags(parsed);
    const dbResults = await runPromptCatalog(Install.dbPrompts, {
      initialValues: {},
      values: dbPreset,
      yes: flags.yes,
    });

    // 6. root user prompts
    const rootPreset = Install.buildRootPresetValuesFromFlags(parsed);
    const rootResults = await runPromptCatalog(Install.rootUserPrompts, {
      initialValues: {},
      values: rootPreset,
      yes: flags.yes,
    });

    // 7. env add prompts
    const envAddResults = await runPromptCatalog(EnvAdd.prompts, {
      initialValues: {
        apiBaseUrl: `http://127.0.0.1:${appResults.appPort ?? '13000'}/api`,
      },
      values: {
        name: envName,
        scope: 'project',
      },
      yes: flags.yes,
    });

    const results = {
      envResults,
      appResults,
      downloadResults,
      dbResults,
      rootResults,
      envAddResults,
    };
    console.log(results);

  }
}
