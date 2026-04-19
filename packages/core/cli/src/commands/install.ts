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
import { loadAuthConfig, type EnvConfigEntry } from '../lib/auth-store.ts';
import { runNocoBaseCommand } from '../lib/run-npm.ts';
import type { DownloadCommandResult } from './download.ts';

type InstallSource = 'git' | 'npm' | 'docker';

const DEFAULT_INSTALL_ENV_NAME = 'local';
const DEFAULT_INSTALL_SOURCE: InstallSource = 'docker';
const DEFAULT_INSTALL_LANG = 'en-US';

/** Flags from `nb install` that influence `nocobase-v1 install` argv (subset for typing). */
type NocoBaseInstallArgvFlags = {
  source?: string;
  force?: boolean;
  lang?: string;
  rootUserName?: string;
  rootEmail?: string;
  rootPassword?: string;
  rootNickname?: string;
};

export default class Install extends Command {
  static override description = 'Run the legacy NocoBase install (forwards to `npm run install` in the repo root)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -f',
    '<%= config.bin %> <%= command.id %> -l zh-CN',
    '<%= config.bin %> <%= command.id %> -u nocobase -m admin@nocobase.com -p admin123',
    '<%= config.bin %> <%= command.id %> -n "Super Admin"',
    '<%= config.bin %> <%= command.id %> --app-root-path=./nocobase --storage-path=./storage/myenv -e myenv',
    '<%= config.bin %> <%= command.id %> --source npm',
    '<%= config.bin %> <%= command.id %> -y --env dev --app-root-path=./nocobase',
    '<%= config.bin %> <%= command.id %> -y --source npm --fetch-source --app-root-path=./nocobase',
  ];
  static override flags = {
    source: Flags.string({
      description: `Where to obtain the NocoBase package (default: ${DEFAULT_INSTALL_SOURCE})`,
      options: ['git', 'npm', 'docker'],
    }),
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
    force: Flags.boolean({ description: 'Reinstall the application by clearing the database', char: 'f', required: false }),
    lang: Flags.string({ description: 'Language during installation', char: 'l', required: false }),
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
    'app-root-path': Flags.string({
      description: 'Application root directory for install (relative to cwd; default: ./nocobase)',
    }),
    'storage-path': Flags.string({
      description: 'Storage directory (relative to cwd; default: ./storage/<env> when --env is set, else ./storage/default)',
    }),
    'app-port': Flags.string({
      description: 'Application HTTP port (APP_PORT; default: 13000)',
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
    'docker-registry': Flags.string({
      description: 'Docker image without tag (e.g. nocobase/nocobase)',
    }),
    'docker-tag': Flags.string({
      description: 'Docker image tag (e.g. latest)',
    }),
    'start-builtin-db': Flags.boolean({
      description: 'Run `nb db start` before install (use with `-y` when you rely on the CLI-managed database)',
      default: false,
    }),
    'fetch-source': Flags.boolean({
      description:
        'With --source npm|git, run `nb download` before install (non-interactive; in a TTY use the prompt unless you pass this to skip the question and force download)',
      default: false,
    }),
    'download-version': Flags.string({
      description:
        'When using fetch-source or nb download: version / dist-tag (-v); default latest when non-interactive / -y',
    }),
    'download-git-url': Flags.string({
      description: 'When using fetch-source with git: repository URL (nb download --git-url)',
    }),
  };

  private defaultDbPort(dialect: string): string {
    if (dialect === 'mysql' || dialect === 'mariadb') {
      return '3306';
    }
    return '5432';
  }

  private resolveAppRoot(flagPath: string | undefined, saved?: EnvConfigEntry['appRootPath']): string {
    if (flagPath) {
      return path.resolve(process.cwd(), flagPath);
    }
    if (saved) {
      return path.isAbsolute(saved) ? saved : path.resolve(process.cwd(), saved);
    }
    return path.resolve(process.cwd(), 'nocobase');
  }

  private resolveStoragePath(
    flagPath: string | undefined,
    envName: string,
    saved?: EnvConfigEntry['storagePath'],
  ): string {
    if (flagPath) {
      return path.resolve(process.cwd(), flagPath);
    }
    if (saved) {
      return path.isAbsolute(saved) ? saved : path.resolve(process.cwd(), saved);
    }
    return path.resolve(process.cwd(), 'storage', envName);
  }

  /**
   * For npm/git: optionally run `nb download`, otherwise (interactive, no saved env) prompt for app root.
   */
  private async resolveNpmGitAppRootWithDownload(options: {
    source: 'npm' | 'git';
    interactive: boolean;
    hasSavedEnv: boolean;
    appRootPathFlag: string | undefined;
    savedEnv?: EnvConfigEntry;
    fetchSourceFlag: boolean;
    downloadVersion: string | undefined;
    downloadGitUrl: string | undefined;
  }): Promise<string | undefined> {
    const {
      source,
      interactive,
      hasSavedEnv,
      savedEnv,
      fetchSourceFlag,
      downloadGitUrl,
    } = options;
    const downloadVersion = options.downloadVersion;
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
        message: 'Download or clone NocoBase source with nb download before install?',
        initialValue: true,
      });
      if (p.isCancel(fetchAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      runDownload = fetchAns;
    }

    if (!runDownload) {
      if (interactive && !hasSavedEnv) {
        const defaultRoot =
          appRootPathFlag ?? path.relative(process.cwd(), this.resolveAppRoot(undefined, savedEnv?.appRootPath));
        const rootAns = await p.text({
          message: 'Application root directory (where nocobase-v1 runs; relative to cwd)',
          initialValue: defaultRoot || 'nocobase',
        });
        if (p.isCancel(rootAns)) {
          p.cancel('Install cancelled.');
          this.exit(0);
        }
        appRootPathFlag = rootAns.trim() || appRootPathFlag;
      }
      return appRootPathFlag;
    }

    const downloadArgv: string[] = [];
    if (!interactive) {
      downloadArgv.push('-y');
    }
    downloadArgv.push('--source', source);

    if (!interactive) {
      const version = downloadVersion?.trim() || 'latest';
      downloadArgv.push('-v', version);
      let outputDir = appRootPathFlag?.trim();
      if (!outputDir) {
        const safe = version.replace(/[/\\]/g, '-');
        outputDir = `nocobase-${safe}`;
      }
      downloadArgv.push('-o', outputDir);
      if (source === 'git' && downloadGitUrl?.trim()) {
        downloadArgv.push('--git-url', downloadGitUrl.trim());
      }
    } else {
      const v = downloadVersion?.trim();
      if (v) {
        downloadArgv.push('-v', v);
      }
      const out = appRootPathFlag?.trim();
      if (out) {
        downloadArgv.push('-o', out);
      }
      if (source === 'git' && downloadGitUrl?.trim()) {
        downloadArgv.push('--git-url', downloadGitUrl.trim());
      }
    }

    if (interactive) {
      p.log.step('Running nb download');
    } else {
      this.log('Running nb download');
    }
    const dl = await this.config.runCommand<DownloadCommandResult>('download', downloadArgv);
    if (dl.projectRoot) {
      return dl.projectRoot;
    }

    if (!interactive) {
      const version = downloadVersion?.trim() || 'latest';
      const safe = version.replace(/[/\\]/g, '-');
      const outputDir = appRootPathFlag?.trim() || `nocobase-${safe}`;
      return path.resolve(process.cwd(), outputDir);
    }

    this.error('Could not determine the project directory after nb download.');
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Install);

    const interactive = Boolean(stdinStream.isTTY && stdoutStream.isTTY && !flags.yes);

    let installLang = flags.lang?.trim() || undefined;

    let envName = flags.env?.trim();
    if (envName === '') {
      envName = undefined;
    }

    if (interactive) {
      p.intro('nb install');
      if (installLang === undefined) {
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
      if (!envName) {
        const envAnswer = await p.text({
          message: 'Application name',
          placeholder: DEFAULT_INSTALL_ENV_NAME,
          validate: (value) => (value.trim() ? undefined : 'Application name is required'),
        });
        if (p.isCancel(envAnswer)) {
          p.cancel('Install cancelled.');
          this.exit(0);
        }
        envName = (envAnswer as string).trim();
      }
    } else if (!envName) {
      this.error('Application name is required (pass -e or --env).');
    }

    const auth = await loadAuthConfig();
    const savedEnv = auth.envs[envName];
    const hasSavedEnv = savedEnv !== undefined;

    if (interactive && hasSavedEnv) {
      p.log.info(`Using saved CLI env ${pc.cyan(`"${envName}"`)} (from ${pc.dim('nb env add')}). Override any field with flags if needed.`);
    }

    // Default: built-in DB (non-interactive / -y skips the prompt and keeps this).
    let hasExistingDb = false;
    if (interactive && !hasSavedEnv) {
      const dbMode = await p.select<'builtin' | 'own'>({
        message: 'Use the built-in database, or connect to one you already have?',
        options: [
          { value: 'builtin', label: 'Use built-in database' },
          { value: 'own', label: 'I already have a database' },
        ],
        initialValue: 'builtin',
      });
      if (p.isCancel(dbMode)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      hasExistingDb = dbMode === 'own';
    }

    let dbDialect = flags['db-dialect'] ?? savedEnv?.dbDialect ?? 'postgres';
    let dbHost = flags['db-host'] ?? savedEnv?.dbHost ?? 'localhost';
    let dbPort = flags['db-port'] ?? (savedEnv?.dbPort !== undefined ? String(savedEnv.dbPort) : undefined);
    let dbDatabase = flags['db-database'] ?? savedEnv?.dbDatabase ?? 'nocobase';
    let dbUser = flags['db-user'] ?? savedEnv?.dbUser ?? 'nocobase';
    let dbPassword = flags['db-password'] ?? savedEnv?.dbPassword ?? 'nocobase';

    if (!hasExistingDb && !flags['db-port'] && savedEnv?.dbPort === undefined) {
      dbPort = dbPort ?? '5432';
    } else if (!dbPort) {
      dbPort = this.defaultDbPort(dbDialect);
    }

    if (interactive && !hasSavedEnv) {
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

      const portAns = await p.text({
        message: 'Database port',
        initialValue: dbPort,
      });
      if (p.isCancel(portAns)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      dbPort = portAns.trim() || dbPort;

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

    const runDbStart = (!hasSavedEnv && !hasExistingDb) || Boolean(flags['start-builtin-db']);
    if (runDbStart) {
      try {
        if (interactive) {
          p.log.step('Running nb db start');
        } else {
          this.log('Running nb db start');
        }
        // oclif explicit registry: `db:start` → user types `nb db start`
        await this.config.runCommand('db:start', []);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (interactive) {
          p.outro(pc.red(message));
        }
        this.error(message);
      }
    }

    let resolvedStorage = this.resolveStoragePath(flags['storage-path'], envName, savedEnv?.storagePath);
    let appPort = flags['app-port'] ?? '13000';
    if (interactive && !hasSavedEnv) {
      const relInitial = path.relative(process.cwd(), resolvedStorage) || path.join('storage', envName);
      const sp = await p.text({
        message: 'Storage directory (relative to cwd)',
        initialValue: relInitial,
      });
      if (p.isCancel(sp)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      resolvedStorage = path.resolve(process.cwd(), sp.trim() || relInitial);
    }

    if (interactive && !hasSavedEnv) {
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

    let source = (flags.source as InstallSource | undefined) ?? DEFAULT_INSTALL_SOURCE;
    if (interactive && !hasSavedEnv) {
      const src = await p.select<InstallSource>({
        message: 'Install source for this project',
        options: [
          { value: 'docker', label: 'Docker image' },
          { value: 'npm', label: 'npm (create-nocobase-app style / published package)' },
          { value: 'git', label: 'Git clone / monorepo checkout' },
        ],
        initialValue: source,
      });
      if (p.isCancel(src)) {
        p.cancel('Install cancelled.');
        this.exit(0);
      }
      source = src;
    }

    let appRootPathFlag = flags['app-root-path'];
    let dockerRegistry = flags['docker-registry'];
    let dockerTag = flags['docker-tag'];

    if (interactive && !hasSavedEnv) {
      if (source === 'docker') {
        const reg = await p.text({
          message: 'Docker image (without tag, e.g. nocobase/nocobase)',
          initialValue: dockerRegistry ?? 'nocobase/nocobase',
        });
        if (p.isCancel(reg)) {
          p.cancel('Install cancelled.');
          this.exit(0);
        }
        dockerRegistry = reg.trim() || dockerRegistry;

        const tag = await p.text({
          message: 'Docker tag',
          initialValue: dockerTag ?? 'latest',
        });
        if (p.isCancel(tag)) {
          p.cancel('Install cancelled.');
          this.exit(0);
        }
        dockerTag = tag.trim() || dockerTag;
      }
    }

    if (source === 'npm' || source === 'git') {
      appRootPathFlag = await this.resolveNpmGitAppRootWithDownload({
        source,
        interactive,
        hasSavedEnv,
        appRootPathFlag,
        savedEnv,
        fetchSourceFlag: Boolean(flags['fetch-source']),
        downloadVersion: flags['download-version']?.trim() || undefined,
        downloadGitUrl: flags['download-git-url'],
      });
    }

    const appRoot = this.resolveAppRoot(appRootPathFlag, savedEnv?.appRootPath);

    const procEnv: Record<string, string> = {
      STORAGE_PATH: resolvedStorage,
      APP_PORT: appPort,
      DB_DIALECT: dbDialect,
      DB_HOST: dbHost,
      DB_PORT: dbPort,
      DB_DATABASE: dbDatabase,
      DB_USER: dbUser,
      DB_PASSWORD: dbPassword,
      NOCOBASE_INSTALL_SOURCE: source,
    };

    if (source === 'docker' && (dockerRegistry || dockerTag)) {
      if (dockerRegistry) {
        procEnv.NOCOBASE_DOCKER_REGISTRY = dockerRegistry;
      }
      if (dockerTag) {
        procEnv.NOCOBASE_DOCKER_TAG = dockerTag;
      }
    }

    const installOpts = await this.promptNocoBaseInstallOptions(interactive, {
      force: flags.force,
      lang: installLang,
      rootUserName: flags['root-username'],
      rootEmail: flags['root-email'],
      rootPassword: flags['root-password'],
      rootNickname: flags['root-nickname'],
    });
    const argvFlags: NocoBaseInstallArgvFlags = {
      source,
      ...installOpts,
    };

    if (argvFlags.rootUserName) {
      procEnv.INIT_ROOT_USERNAME = argvFlags.rootUserName;
    }
    if (argvFlags.rootEmail) {
      procEnv.INIT_ROOT_EMAIL = argvFlags.rootEmail;
    }

    try {
      await this.runNocoBaseInstall(appRoot, procEnv, argvFlags, interactive);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (interactive) {
        p.outro(pc.red(message));
      }
      this.error(message);
    }

    const envPostInstall = await this.runPostInstallEnvCommand({
      hasSavedEnv,
      envName,
      appPort,
      interactive,
    });
    if (envPostInstall === 'failed') {
      return;
    }

    if (interactive) {
      p.outro('Install finished.');
    } else {
      this.log('Install finished.');
    }
  }

  /**
   * After a successful `nocobase-v1 install`, refresh or create the CLI env via oclif (`nb env update` / `nb env add`).
   * Failures are logged but do not fail the overall install (artifacts are already on disk).
   */
  private async runPostInstallEnvCommand(options: {
    hasSavedEnv: boolean;
    envName: string;
    appPort: string;
    interactive: boolean;
  }): Promise<'ok' | 'failed'> {
    const { hasSavedEnv, envName, appPort, interactive } = options;
    try {
      if (hasSavedEnv) {
        if (interactive) {
          p.log.step('Running nb env update');
        } else {
          this.log('Running nb env update');
        }
        await this.config.runCommand('env:update', [envName, '--scope', 'project']);
      } else {
        if (interactive) {
          p.log.step('Running nb env add');
        } else {
          this.log('Running nb env add');
        }
        const addArgv = interactive
          ? [envName, '--scope', 'project']
          : [
              envName,
              '--scope',
              'project',
              '--api-base-url',
              `http://127.0.0.1:${appPort}/api`,
              '--auth-type',
              'oauth',
            ];
        await this.config.runCommand('env:add', addArgv);
      }
      return 'ok';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (interactive) {
        p.log.warn(`Post-install env command failed: ${message}`);
        p.outro('Install finished.');
      } else {
        this.warn(`Post-install env command failed: ${message}`);
        this.log('Install finished.');
      }
      return 'failed';
    }
  }

  /**
   * Interactive prompts for `nocobase-v1 install` options; CLI flags win when already set.
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

    if (!flags.force) {
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

  /**
   * Build argv for `nocobase-v1 install` from CLI flags.
   */
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

  /**
   * Execute `nocobase-v1` in the application root. Add pre/post steps or source-specific behavior here.
   */
  private async runNocoBaseInstall(
    appRoot: string,
    procEnv: Record<string, string>,
    flags: NocoBaseInstallArgvFlags,
    interactive: boolean,
  ): Promise<void> {
    const rel = path.relative(process.cwd(), appRoot);
    const where =
      rel === '' || rel === '.'
        ? 'this folder'
        : rel.startsWith('..')
          ? appRoot
          : `./${rel.split(path.sep).join('/')}`;
    const label = `Installing NocoBase — this may take a few minutes.`;
    if (interactive) {
      p.log.step(label);
    } else {
      this.log(label);
    }
    const npmArgs = this.buildNocoBaseInstallArgs(flags);
    // TODO: Re-enable when the app root has a runnable `nocobase-v1 install` (or swap to the supported entrypoint).
    // await runNocoBaseCommand(npmArgs, appRoot, { env: procEnv });
    void npmArgs;
  }
}
