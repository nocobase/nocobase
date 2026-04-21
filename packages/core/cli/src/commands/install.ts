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
import path from 'node:path';
import { stdin as stdinStream, stdout as stdoutStream } from 'node:process';
import { loadAuthConfig, saveAuthConfig, type EnvConfigEntry } from '../lib/auth-store.js';
import { runNocoBaseCommand } from '../lib/run-npm.js';
import type { DownloadCommandResult } from './download.js';

const DEFAULT_INSTALL_ENV_NAME = 'local';
const DEFAULT_INSTALL_LANG = 'en-US';
const CONFIG_SCOPE = 'project' as const;

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
    'fetch-source': Flags.boolean({
      description:
        'Run `nb download` before install. Use `nb download` for distribution choice and all fetch options (`-v`, `--git-url`, docker image flags, etc.). With `-y`, install delegates using `nb download -y --source npm` (`-o` aligns with `--app-root-path` when set).',
      default: false,
    }),
    'start-builtin-db': Flags.boolean({
      description:
        'Run `nb db start` before install (use with `-y` when you rely on the CLI-managed database)',
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip interactive prompts; use flags and defaults only',
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
  };

  private defaultDbPort(dialect: string): string {
    if (dialect === 'mysql' || dialect === 'mariadb') {
      return '3306';
    }
    if (dialect === 'kingbase') {
      return '54321';
    }
    return '5432';
  }

  /** Application root as given (flag / saved / default), without normalizing or resolving. */
  private rawAppRootPath(flagPath: string | undefined, saved?: EnvConfigEntry['appRootPath']): string {
    if (flagPath !== undefined && flagPath !== '') {
      return flagPath;
    }
    if (saved !== undefined && saved !== '') {
      return saved;
    }
    return 'nocobase';
  }

  private async persistCliEnvProfile(
    envName: string,
    data: {
      appRootPath?: string;
      storagePath: string;
      appPort: string;
      dbDialect: string;
      dbHost: string;
      dbPort: string;
      dbDatabase: string;
      dbUser: string;
      dbPassword: string;
    },
  ): Promise<void> {
    const config = await loadAuthConfig({ scope: CONFIG_SCOPE });
    const prev = config.envs[envName] ?? {};
    config.envs[envName] = {
      ...prev,
      ...(data.appRootPath !== undefined ? { appRootPath: data.appRootPath } : {}),
      storagePath: data.storagePath,
      appPort: data.appPort,
      dbDialect: data.dbDialect,
      dbHost: data.dbHost,
      dbPort: data.dbPort,
      dbDatabase: data.dbDatabase,
      dbUser: data.dbUser,
      dbPassword: data.dbPassword,
      baseUrl: undefined,
      auth: undefined,
      runtime: undefined,
    };
    config.currentEnv = envName;
    await saveAuthConfig(config, { scope: CONFIG_SCOPE });
  }

  /**
   * Optionally run `nb download`; otherwise prompt for or resolve app root only.
   */
  private async resolveAppRootWithOptionalDownload(options: {
    interactive: boolean;
    hasSavedEnv: boolean;
    appRootPathFlag: string | undefined;
    savedEnv?: EnvConfigEntry;
    fetchSourceFlag: boolean;
  }): Promise<{ appRoot: string }> {
    const { interactive, hasSavedEnv, savedEnv, fetchSourceFlag } = options;
    let appRootPathFlag = options.appRootPathFlag;

    let runDownload: boolean;
    if (!interactive) {
      runDownload = fetchSourceFlag;
    } else if (hasSavedEnv) {
      runDownload = fetchSourceFlag;
    } else if (fetchSourceFlag) {
      runDownload = true;
    } else {
      const fetchAns = await p.confirm({
        message: 'Run nb download first?',
        initialValue: true,
      });
      if (p.isCancel(fetchAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      runDownload = fetchAns;
    }

    if (!runDownload) {
      const appRoot = this.rawAppRootPath(appRootPathFlag, savedEnv?.appRootPath);
      return { appRoot };
    }

    const downloadArgv: string[] = [];
    if (!interactive) {
      downloadArgv.push('-y', '--source', 'npm');
      const outputDir = appRootPathFlag || this.rawAppRootPath(undefined, savedEnv?.appRootPath);
      downloadArgv.push('-o', outputDir);
    } else if (appRootPathFlag) {
      downloadArgv.push('-o', appRootPathFlag);
    }

    if (interactive) {
      p.log.step('Running nb download');
    } else {
      this.log('Running nb download');
    }
    const dl = await this.config.runCommand<DownloadCommandResult>('download', downloadArgv);

    const appRoot = dl.projectRoot ?? this.rawAppRootPath(appRootPathFlag, savedEnv?.appRootPath);

    return { appRoot };
  }

  /**
   * After a successful `nocobase-v1 install`, refresh or create the CLI env via oclif (`nb env update` / `nb env add`).
   * Failures are logged but do not fail the overall install (artifacts are already on disk).
   */
  private async runPostInstallEnvCommand(options: {
    /** True when this env already had an API base URL (e.g. from a prior `nb env add`), not only install metadata. */
    hadApiEnvBeforeInstall: boolean;
    envName: string;
    interactive: boolean;
    appPort: string;
  }): Promise<'ok' | 'failed'> {
    const { hadApiEnvBeforeInstall, envName, interactive, appPort } = options;
    const apiBaseUrl = `http://127.0.0.1:${appPort}/api`;
    const envAddArgv = [
      envName,
      '--scope',
      CONFIG_SCOPE,
      '--default-api-base-url',
      apiBaseUrl,
    ];
    try {
      const label = hadApiEnvBeforeInstall ? 'Running nb env update' : 'Running nb env add';
      if (interactive) {
        p.log.step(label);
      } else {
        this.log(label);
      }
      await this.config.runCommand('env:add', envAddArgv);
      return 'ok';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (interactive) {
        p.log.warn(`Post-install env command failed: ${message}`);
      } else {
        this.warn(`Post-install env command failed: ${message}`);
      }
      return 'failed';
    }
  }

  /**
   * Interactive prompts for `nocobase-v1 install` options; CLI flags win when already set.
   * When `skipForceConfirm` is true, `--force` was already resolved after loading saved env config.
   */
  private async promptNocoBaseInstallOptions(
    interactive: boolean,
    flags: {
      force: boolean;
      lang?: string;
      rootUserName?: string;
      rootEmail?: string;
      rootPassword?: string;
      rootNickname?: string;
      skipForceConfirm?: boolean;
    },
  ): Promise<
    Pick<
      NocoBaseInstallArgvFlags,
      'force' | 'lang' | 'rootUserName' | 'rootEmail' | 'rootPassword' | 'rootNickname'
    >
  > {
    let force = flags.force;
    let lang = flags.lang;
    let rootUserName = flags.rootUserName;
    let rootEmail = flags.rootEmail;
    let rootPassword = flags.rootPassword;
    let rootNickname = flags.rootNickname;

    if (!interactive) {
      return { force, lang, rootUserName, rootEmail, rootPassword, rootNickname };
    }

    if (!flags.skipForceConfirm && !flags.force) {
      const reinstall = await p.confirm({
        message: 'Reinstall and clear the database? (--force)',
        initialValue: false,
      });
      if (p.isCancel(reinstall)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      force = reinstall;
    }

    if (rootUserName === undefined) {
      const userAns = await p.text({
        message: 'Root username (--root-username)',
        placeholder: 'nocobase',
        initialValue: 'nocobase',
      });
      if (p.isCancel(userAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      const t = userAns.trim();
      rootUserName = t || undefined;
    }

    if (rootEmail === undefined) {
      const emailAns = await p.text({
        message: 'Root user email (--root-email)',
        placeholder: 'admin@nocobase.com',
        initialValue: 'admin@nocobase.com',
      });
      if (p.isCancel(emailAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      const t = emailAns.trim();
      rootEmail = t || undefined;
    }

    if (rootPassword === undefined) {
      const passAns = await p.password({
        message: 'Root user password (--root-password)',
      });
      if (p.isCancel(passAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      rootPassword = typeof passAns === 'string' && passAns.length > 0 ? passAns : undefined;
    }

    if (rootNickname === undefined) {
      const nickAns = await p.text({
        message: 'Root user nickname (--root-nickname)',
        placeholder: 'Super Admin',
        initialValue: 'Super Admin',
      });

      if (p.isCancel(nickAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      const t = nickAns.trim();
      rootNickname = t || undefined;
    }

    return { force, lang, rootUserName, rootEmail, rootPassword, rootNickname };
  }

  private buildNocoBaseInstallArgs(flags: NocoBaseInstallArgvFlags): string[] {
    const npmArgs = ['install'];
    if (flags.force) {
      npmArgs.push('--force');
    }
    if (flags.lang !== undefined) {
      npmArgs.push('--lang', flags.lang);
    }
    if (flags.rootUserName !== undefined) {
      npmArgs.push('--root-username', flags.rootUserName);
    }
    if (flags.rootEmail !== undefined) {
      npmArgs.push('--root-email', flags.rootEmail);
    }
    if (flags.rootPassword !== undefined) {
      npmArgs.push('--root-password', flags.rootPassword);
    }
    if (flags.rootNickname !== undefined) {
      npmArgs.push('--root-nickname', flags.rootNickname);
    }

    return npmArgs;
  }

  private buildInstallProcessEnv(options: {
    storagePath: string;
    appPort: string;
    dbDialect: string;
    dbHost: string;
    dbPort: string;
    dbDatabase: string;
    dbUser: string;
    dbPassword: string;
    rootUserName?: string;
    rootEmail?: string;
    rootPassword?: string;
    rootNickname?: string;
  }): Record<string, string> {
    const {
      storagePath,
      appPort,
      dbDialect,
      dbHost,
      dbPort,
      dbDatabase,
      dbUser,
      dbPassword,
      rootUserName,
      rootEmail,
      rootPassword,
      rootNickname,
    } = options;

    const env: Record<string, string> = {
      APP_PORT: appPort,
      STORAGE_PATH: storagePath,
      DB_DIALECT: dbDialect,
      DB_HOST: dbHost,
      DB_PORT: dbPort,
      DB_DATABASE: dbDatabase,
      DB_USER: dbUser,
      DB_PASSWORD: dbPassword,
    };

    if (rootUserName !== undefined) {
      env.INIT_ROOT_USERNAME = rootUserName;
    }
    if (rootEmail !== undefined) {
      env.INIT_ROOT_EMAIL = rootEmail;
    }
    if (rootPassword !== undefined) {
      env.INIT_ROOT_PASSWORD = rootPassword;
    }
    if (rootNickname !== undefined) {
      env.INIT_ROOT_NICKNAME = rootNickname;
    }

    return env;
  }

  private async runNocoBaseInstall(
    appRoot: string,
    procEnv: Record<string, string>,
    flags: NocoBaseInstallArgvFlags,
    interactive: boolean,
    envName: string,
  ): Promise<void> {
    const rel = path.relative(process.cwd(), appRoot);
    const where =
      rel === '' || rel === '.'
        ? 'this folder'
        : rel.startsWith('..')
          ? appRoot
          : `./${rel.split(path.sep).join('/')}`;
    const label = `Installing NocoBase in ${where} — this may take a few minutes.`;
    if (interactive) {
      p.log.step(label);
    } else {
      this.log(label);
    }
    const npmArgs = this.buildNocoBaseInstallArgs(flags);
    try {
      await this.config.runCommand('stop', ['-e', envName, '-s', CONFIG_SCOPE]);
    } catch {
      /* Best-effort: env may be missing, remote-only, or nothing was running. */
    }
    await runNocoBaseCommand(npmArgs, { cwd: appRoot, env: procEnv });
  }

  private async runNocoBaseStart(appPort: string, interactive: boolean, envName: string): Promise<void> {
    const label = `Starting NocoBase (env "${envName}", port ${appPort})`;
    if (interactive) {
      p.log.step(label);
    } else {
      this.log(label);
    }
    await this.config.runCommand('start', ['-e', envName, '-s', CONFIG_SCOPE, '-p', appPort, '-d']);
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Install);

    const interactive = Boolean(stdinStream.isTTY && stdoutStream.isTTY && !flags.yes);

    if (interactive) {
      p.intro('nb install');
    }

    let envName = flags.env?.trim();
    if (envName === '') {
      envName = undefined;
    }
    if (interactive && !envName) {
      const envAnswer = await p.text({
        message: 'Application name (--env)',
        placeholder: DEFAULT_INSTALL_ENV_NAME,
        validate: (value) => (value.trim() ? undefined : 'Application name is required'),
      });
      if (p.isCancel(envAnswer)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      envName = (envAnswer as string).trim();
    } else if (!envName) {
      this.error('Application name is required (pass -e or --env).');
    }

    const auth = await loadAuthConfig({ scope: CONFIG_SCOPE });
    const savedEnv = auth.envs[envName];
    const hasSavedEnv = savedEnv !== undefined;
    const hadApiEnvBeforeInstall = Boolean(savedEnv?.baseUrl?.trim());

    let installForce = flags.force;
    let skipForceConfirm = false;

    if (hasSavedEnv) {
      if (interactive) {
        p.log.info(
          `Loaded CLI env config for ${pc.cyan(`"${envName}"`)} (${pc.dim('nb env')}). Flags override saved values where set.`,
        );
        if (flags.force) {
          installForce = true;
          skipForceConfirm = true;
        } else {
          const reinstall = await p.confirm({
            message: 'Reinstall NocoBase (clear database and run install again)? (--force)',
            initialValue: false,
          });
          if (p.isCancel(reinstall)) {
            p.cancel('Install cancelled.');
            this.exit(0);
          }
          installForce = Boolean(reinstall);
          skipForceConfirm = true;
        }
      } else {
        installForce = flags.force;
      }
    }

    let installLang = flags.lang?.trim() || undefined;
    if (interactive && installLang === undefined) {
      const langAns = await p.text({
        message: 'Install language (--lang, e.g. en-US or zh-CN)',
        placeholder: DEFAULT_INSTALL_LANG,
        initialValue: DEFAULT_INSTALL_LANG,
      });
      if (p.isCancel(langAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      const t = (langAns as string).trim();
      installLang = t || DEFAULT_INSTALL_LANG;
    }
    if (!installLang) {
      installLang = DEFAULT_INSTALL_LANG;
    }

    let hasExistingDb = false;
    if (interactive) {
      const dbMode = await p.select<'builtin' | 'own'>({
        message: 'Use the built-in database, or connect to one you already have?',
        options: [
          { value: 'builtin', label: 'Use built-in database' },
          { value: 'own', label: 'I already have a database' },
        ],
        initialValue: savedEnv?.dbHost || savedEnv?.dbDatabase ? 'own' : 'builtin',
      });
      if (p.isCancel(dbMode)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      hasExistingDb = dbMode === 'own';
    }

    let dbDialect =
      flags['db-dialect'] ?? savedEnv?.dbDialect ?? 'postgres';
    let dbHost = flags['db-host'] ?? savedEnv?.dbHost ?? 'localhost';
    let dbPort =
      flags['db-port'] ?? (savedEnv?.dbPort !== undefined ? String(savedEnv.dbPort) : undefined);
    let dbDatabase = flags['db-database'] ?? savedEnv?.dbDatabase ?? 'nocobase';
    let dbUser = flags['db-user'] ?? savedEnv?.dbUser ?? 'nocobase';
    let dbPassword = flags['db-password'] ?? savedEnv?.dbPassword ?? 'nocobase';

    if (!dbPort) {
      dbPort = this.defaultDbPort(dbDialect);
    }

    if (interactive) {
      const dialectAns = await p.select({
        message: 'Database dialect',
        options: [
          { value: 'postgres', label: 'PostgreSQL' },
          { value: 'mysql', label: 'MySQL' },
          { value: 'mariadb', label: 'MariaDB' },
          { value: 'kingbase', label: 'Kingbase' },
        ],
        initialValue: dbDialect as 'postgres' | 'mysql' | 'mariadb' | 'kingbase',
      });
      if (p.isCancel(dialectAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      dbDialect = dialectAns;

      const hostAns = await p.text({
        message: 'Database host',
        initialValue: dbHost,
      });
      if (p.isCancel(hostAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      dbHost = hostAns.trim() || dbHost;

      const dbPortAns = await p.text({
        message: 'Database port',
        initialValue: dbPort,
      });
      if (p.isCancel(dbPortAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      dbPort = dbPortAns.trim() || dbPort;

      const dbNameAns = await p.text({
        message: 'Database name',
        initialValue: dbDatabase,
      });
      if (p.isCancel(dbNameAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      dbDatabase = dbNameAns.trim() || dbDatabase;

      const userAns = await p.text({
        message: 'Database user',
        initialValue: dbUser,
      });
      if (p.isCancel(userAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      dbUser = userAns.trim() || dbUser;

      const passAns = await p.password({
        message: 'Database password',
      });
      if (p.isCancel(passAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      dbPassword =
        typeof passAns === 'string' && passAns.length > 0 ? passAns : dbPassword;
    }

    let appRootPathFlag: string | undefined = flags['app-root-path'];
    const hasAppRootFlag = appRootPathFlag !== undefined && appRootPathFlag !== '';
    const hasSavedAppRoot =
      savedEnv?.appRootPath !== undefined && savedEnv.appRootPath !== '';
    if (interactive && !hasAppRootFlag && !hasSavedAppRoot) {
      const rootAns = await p.text({
        message: 'Application root directory (--app-root-path, relative to cwd)',
        placeholder: 'nocobase',
        initialValue: 'nocobase',
        validate: (value) => (value.trim() ? undefined : 'Application root is required'),
      });
      if (p.isCancel(rootAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      appRootPathFlag = (rootAns as string).trim();
    }

    let storagePath: string;
    if (flags['storage-path'] !== undefined && flags['storage-path'] !== '') {
      storagePath = flags['storage-path'];
    } else if (savedEnv?.storagePath !== undefined && savedEnv.storagePath !== '') {
      storagePath = savedEnv.storagePath;
    } else if (interactive) {
      const defaultStorage = `storage/${envName}`;
      const sp = await p.text({
        message: 'Storage directory (--storage-path, relative to cwd)',
        initialValue: defaultStorage,
        validate: (value) => (value.trim() ? undefined : 'Storage path is required'),
      });
      if (p.isCancel(sp)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      storagePath = (sp as string).trim();
    } else {
      storagePath = `storage/${envName}`;
    }

    let appPort = String(savedEnv?.appPort ?? flags['app-port'] ?? '13000');

    if (interactive) {
      const portAns = await p.text({
        message: 'Application port (APP_PORT)',
        initialValue: appPort,
      });
      if (p.isCancel(portAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      appPort = portAns.trim() || appPort;
    }

    try {
      await this.persistCliEnvProfile(envName, {
        appRootPath: appRootPathFlag,
        storagePath,
        appPort,
        dbDialect,
        dbHost,
        dbPort,
        dbDatabase,
        dbUser,
        dbPassword,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (interactive) {
        p.log.warn(`Could not save CLI env profile: ${message}`);
      } else {
        this.warn(`Could not save CLI env profile: ${message}`);
      }
    }

    const { appRoot } = await this.resolveAppRootWithOptionalDownload({
      interactive,
      hasSavedEnv,
      appRootPathFlag,
      savedEnv,
      fetchSourceFlag: Boolean(flags['fetch-source']),
    });

    const runDbStart = interactive ? !hasExistingDb : Boolean(flags['start-builtin-db']);
    if (runDbStart) {
      try {
        if (interactive) {
          p.log.step('Running nb db start');
        } else {
          this.log('Running nb db start');
        }
        await this.config.runCommand('db:start', []);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (interactive) {
          p.outro(pc.red(message));
        }
        this.error(message);
      }
    }

    const installOpts = await this.promptNocoBaseInstallOptions(interactive, {
      force: installForce,
      skipForceConfirm,
      lang: installLang,
      rootUserName: flags['root-username'],
      rootEmail: flags['root-email'],
      rootPassword: flags['root-password'],
      rootNickname: flags['root-nickname'],
    });
    const argvFlags: NocoBaseInstallArgvFlags = {
      ...installOpts,
    };

    const procEnv = this.buildInstallProcessEnv({
      storagePath,
      appPort,
      dbDialect,
      dbHost,
      dbPort,
      dbDatabase,
      dbUser,
      dbPassword,
      rootUserName: argvFlags.rootUserName,
      rootEmail: argvFlags.rootEmail,
      rootPassword: argvFlags.rootPassword,
      rootNickname: argvFlags.rootNickname,
    });

    try {
      await this.runNocoBaseInstall(appRoot, procEnv, argvFlags, interactive, envName);
      await this.runNocoBaseStart(appPort, interactive, envName);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (interactive) {
        p.outro(pc.red(message));
      }
      this.error(message);
    }

    await this.runPostInstallEnvCommand({
      hadApiEnvBeforeInstall,
      envName,
      interactive,
      appPort,
    });

    if (interactive) {
      p.outro(pc.green('Install finished.'));
    } else {
      this.log('Install finished.');
    }
  }
}
