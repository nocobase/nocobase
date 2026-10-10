import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Args, Flags } from '@oclif/core';
import { runAppCli } from '../lib/app-cli.ts';
import { switchCurrent } from '../lib/current-link.ts';
import { buildEcosystemConfig, buildLauncher } from '../lib/ecosystem.ts';
import { quoteForShell } from '@nocobase/cli-envelope';
import {
  buildAppEnv,
  endpointsOf,
  healthUrl,
  mountPathOf,
  readAppEnv,
} from '../lib/env-file.ts';
import { EXIT_INVALID, InstallerError } from '../lib/errors.ts';
import { pm2StartFailed, waitForHealthy } from '../lib/health.ts';
import { readInitialAdmin, type InitialAdmin } from '../lib/initial-admin.ts';
import { layoutOf, releaseLinkTarget } from '../lib/layout.ts';
import { acquireLock } from '../lib/lock.ts';
import { assertFixedMountPath, parseBasePathFlag } from '../lib/mount-path.ts';
import type { Reporter } from '../lib/output.ts';
import {
  checkEnvVariables,
  checkPlatform,
  checkPm2,
  checkPm2NameFree,
  checkPortFree,
  checkTargetEmpty,
} from '../lib/prechecks.ts';
import type { Pm2 } from '../lib/pm2.ts';
import {
  defaultRegistry,
  normalizeRegistry,
  type FetchLike,
} from '../lib/registry.ts';
import {
  DIALECTS,
  assertStorageOutsideRelease,
  checkArchiveDriver,
  unpackRelease,
  type Dialect,
} from '../lib/release.ts';
import { runCommand, type RunCommand } from '../lib/run-command.ts';
import {
  errorLogCommandLine,
  errorLogTail,
  startAdvice,
} from '../lib/service.ts';
import { resolveArchivePath } from '../lib/source.ts';
import { writeState, type InstallerState } from '../lib/state.ts';

export const INSTALL_ARGS = {
  directory: Args.string({
    description:
      'Directory to install into. Must be new or empty. --dir names it too.',
  }),
};

export const INSTALL_FLAGS = {
  dir: Flags.string({
    description:
      'Directory to install into, as the other commands name it; the same as the DIRECTORY argument.',
  }),
  archive: Flags.string({
    description:
      'Deployment archive to install, as `pnpm build --tar` writes it to storage/exports/dist.tar.gz. Build it for this machine with --target and --node-version.',
  }),
  origin: Flags.string({
    description:
      'Public origin the application is reached at, without its base path, e.g. https://apps.example.com. Defaults to http://HOST:PORT.',
  }),
  'base-path': Flags.string({
    description:
      "Path the application is mounted at, e.g. /crm, or / for the origin root. Written to app.env as APP_BASE_PATH; without it the server's default applies. An archive from before relocatable builds runs only at the path it was built for.",
  }),
  host: Flags.string({
    default: '127.0.0.1',
    description:
      'Address the application listens on. Keep the loopback default behind a reverse proxy.',
  }),
  port: Flags.integer({
    default: 13000,
    min: 1,
    max: 65535,
    description:
      'Port the application listens on. It must be free; give each installation on a machine its own.',
  }),
  dialect: Flags.string({
    default: 'sqlite',
    options: [...DIALECTS],
    description:
      'Database. Anything but SQLite needs --set for its connection; an archive must carry its driver.',
  }),
  set: Flags.string({
    multiple: true,
    description:
      'A config.yml setting as key=value, applied with `nocobase config set`, e.g. database.connections.main.host=db.internal. Values are YAML scalars: quote text that looks like a number or boolean, as in key=\'"0123"\'.',
  }),
  'set-from-env': Flags.string({
    multiple: true,
    description:
      'A setting read from an environment variable, as key=VARIABLE, e.g. database.connections.main.password=DB_PASSWORD.',
  }),
  registry: Flags.string({
    description: 'npm registry for the installer commands suggested later.',
  }),
  name: Flags.string({
    description:
      'pm2 process name. Defaults to nocobase- followed by the directory name, so each installation on a machine has its own.',
  }),
  start: Flags.boolean({
    allowNo: true,
    default: true,
    description: 'Start the application with pm2 once it is installed.',
  }),
  'health-timeout': Flags.integer({
    default: 180,
    min: 1,
    description:
      'Seconds to wait for the application to answer its health check.',
  }),
  json: Flags.boolean({
    default: false,
    description: 'Print one JSON result on stdout; progress stays on stderr.',
  }),
};

export interface InstallInput {
  directory?: string;
  flags: {
    dir?: string;
    archive?: string;
    origin?: string;
    'base-path'?: string;
    host: string;
    port: number;
    dialect: string;
    set?: string[];
    'set-from-env'?: string[];
    registry?: string;
    name?: string;
    start: boolean;
    'health-timeout': number;
    json: boolean;
  };
}

export interface CommandDeps {
  reporter: Reporter;
  pm2: Pm2;
  fetchImpl?: FetchLike;
  cwd?: string;
  /** Runs every child process the command starts; replaced in tests. */
  run?: RunCommand;
}

export interface CommandOutcome {
  status: 'success' | 'success-noop';
  result: Record<string, unknown>;
  /** Lines for a person, printed on stdout when not in JSON mode. */
  summary: string[];
}

function parsePairs(
  values: readonly string[] | undefined,
  flag: string,
): [string, string][] {
  return (values ?? []).map((value) => {
    const index = value.indexOf('=');
    if (index <= 0 || index === value.length - 1) {
      throw new InstallerError(
        'INVALID_USAGE',
        `--${flag} expects key=value, got "${value}".`,
        { exitCode: EXIT_INVALID },
      );
    }
    return [value.slice(0, index), value.slice(index + 1)];
  });
}

/** The sign-in line of the summary: who, and where the password is, never the password itself. */
function describeInitialAdmin(admin: InitialAdmin): string {
  const who =
    [admin.username, admin.email && `(${admin.email})`]
      .filter(Boolean)
      .join(' ') || 'the account';
  const password =
    admin.defaultPassword === true
      ? `the default password from config.example.yml; change it after signing in`
      : 'the password set there';
  return `${who} under ${admin.key} in config.yml, with ${password}`;
}

/**
 * Removes what a failed install wrote. The target was new or empty when the install began, so everything in it now
 * came from this run. `created` is the topmost directory the install created, which may be a parent of the root.
 */
async function cleanUp(
  root: string,
  created: string | undefined,
): Promise<void> {
  if (created) {
    await rm(created, { recursive: true, force: true });
    return;
  }
  for (const entry of await readdir(root).catch(() => [] as string[])) {
    await rm(path.join(root, entry), { recursive: true, force: true });
  }
}

export async function install(
  input: InstallInput,
  deps: CommandDeps,
): Promise<CommandOutcome> {
  const { flags } = input;
  const { reporter, pm2 } = deps;
  const run = deps.run ?? runCommand;
  const cwd = deps.cwd ?? process.cwd();
  const directory = input.directory ?? flags.dir;
  if (directory === undefined) {
    throw new InstallerError(
      'INVALID_USAGE',
      'Name the directory to install into, as an argument or with --dir.',
      { exitCode: EXIT_INVALID },
    );
  }
  if (
    input.directory !== undefined &&
    flags.dir !== undefined &&
    path.resolve(cwd, input.directory) !== path.resolve(cwd, flags.dir)
  ) {
    throw new InstallerError(
      'INVALID_USAGE',
      `The DIRECTORY argument (${input.directory}) and --dir (${flags.dir}) name different directories; give one of them.`,
      { exitCode: EXIT_INVALID },
    );
  }
  if (flags.archive === undefined) {
    throw new InstallerError(
      'INVALID_USAGE',
      'Name what to install: --archive with a deployment archive built by `pnpm build --tar`.',
      { exitCode: EXIT_INVALID },
    );
  }
  const requestedBasePath = parseBasePathFlag(flags['base-path']);
  const root = path.resolve(cwd, directory);
  const layout = layoutOf(root);
  const name = flags.name ?? `nocobase-${path.basename(root)}`;
  const dialect = flags.dialect as Dialect;
  const registry = normalizeRegistry(flags.registry ?? defaultRegistry());
  const origin = (flags.origin ?? `http://${flags.host}:${flags.port}`).replace(
    /\/+$/u,
    '',
  );
  const sets = parsePairs(flags.set, 'set');
  const setsFromEnv = parsePairs(flags['set-from-env'], 'set-from-env');

  if (!/^https?:\/\/[^/]+$/u.test(origin)) {
    throw new InstallerError(
      'INVALID_USAGE',
      `--origin must be a protocol and host without a path, such as https://apps.example.com; got "${origin}".`,
      { exitCode: EXIT_INVALID },
    );
  }

  // Everything that can be checked is checked before the first write, so a failed precheck leaves nothing behind.
  checkPlatform();
  await checkTargetEmpty(root);
  checkEnvVariables(setsFromEnv.map(([, variable]) => variable));
  const archive = resolveArchivePath(cwd, flags.archive);
  if (flags.start) {
    await checkPm2(pm2);
    await checkPm2NameFree(pm2, name);
  }
  await checkPortFree(flags.host, flags.port, { suggestPort: true });
  if (!flags.origin) {
    reporter.warn(
      `No --origin given; the application will build links for ${origin}. Pass --origin with the public address before exposing it.`,
    );
  }

  // `mkdir` returns the first directory it created, so a failure can remove parents the install made as well.
  const created = await mkdir(root, { recursive: true });
  let releaseLock: () => Promise<void>;
  try {
    releaseLock = await acquireLock(layout.lockFile);
  } catch (error) {
    if (created) await rm(created, { recursive: true, force: true });
    throw error;
  }
  let switched = false;
  try {
    reporter.progress(`Unpacking ${archive} into ${root}`);
    const prepared = await unpackRelease({ layout, archive });
    checkArchiveDriver(prepared.dir, dialect);
    reporter.progress(
      `Installing ${prepared.appName} ${prepared.version} (${prepared.id})`,
    );

    // A relocatable release is mounted where the installation says, or at the server's default. An earlier release
    // runs only at the path its client was compiled for.
    let mountPath: string | undefined;
    if (prepared.relocatable) {
      mountPath = requestedBasePath;
    } else {
      mountPath = prepared.basePath!;
      if (requestedBasePath !== undefined) {
        assertFixedMountPath(
          `${prepared.appName} ${prepared.version}`,
          mountPath,
          requestedBasePath,
        );
      }
    }
    await writeFile(
      layout.appEnv,
      buildAppEnv(layout, {
        origin,
        host: flags.host,
        port: flags.port,
        basePath: mountPath,
      }),
    );
    const env = await readAppEnv(layout);
    const cli = { releaseDir: prepared.dir, cwd: root, env, run };

    reporter.progress('Writing config.yml');
    await runAppCli(
      ['config', 'init', '--config', layout.configFile, '--dialect', dialect],
      cli,
    );
    if (sets.length > 0) {
      await runAppCli(
        ['config', 'set', ...sets.map(([key, value]) => `${key}=${value}`)],
        cli,
      );
    }
    for (const [key, variable] of setsFromEnv) {
      await runAppCli(
        ['config', 'set', '--from-env', `${key}=${variable}`],
        cli,
      );
    }
    await runAppCli(['config', 'check'], cli);

    reporter.progress('Applying database migrations');
    await runAppCli(['db', 'apply'], cli);
    assertStorageOutsideRelease(prepared.dir);

    // Everything else the root needs is written first: the switch is the last write before starting, so a failure
    // anywhere up to it leaves nothing half-installed for status and install to disagree about.
    await mkdir(layout.logsDir, { recursive: true });
    await writeFile(
      layout.ecosystemFile,
      buildEcosystemConfig({ name, nodePath: process.execPath }),
    );
    await writeFile(layout.launcherFile, buildLauncher());
    const at = new Date().toISOString();
    const state: InstallerState = {
      schemaVersion: 1,
      appName: prepared.appName,
      basePath: mountPathOf(env) || '/',
      source: { kind: 'archive' },
      name,
      registry,
      dialect,
      current: prepared.id,
      releases: [
        {
          id: prepared.id,
          version: prepared.version,
          builtAt: prepared.builtAt,
          installedAt: at,
          buildTarget: prepared.buildTarget,
          ...(prepared.relocatable
            ? { relocatable: true as const }
            : { basePath: prepared.basePath! }),
        },
      ],
      history: [{ action: 'install', to: prepared.id, at }],
    };
    await writeState(layout, state);
    await switchCurrent(layout, releaseLinkTarget(prepared.id));
    switched = true;

    const url = healthUrl(env);
    if (flags.start) {
      reporter.progress('Starting the application with pm2');
      await pm2.start(layout.ecosystemFile, root);
      const healthy = await waitForHealthy(url, {
        timeoutMs: flags['health-timeout'] * 1000,
        fetchImpl: deps.fetchImpl,
        failed: pm2StartFailed(pm2, name),
      });
      if (!healthy) {
        // The name was free before this install, so the process under it is the one just started.
        await pm2.remove(name).catch(() => undefined);
        throw new InstallerError(
          'START_FAILED',
          `The application did not become healthy at ${url} (waited up to ${flags['health-timeout']}s). It is installed but not running.`,
          {
            details: { log: await errorLogTail(layout) },
            suggestions: [
              {
                message: 'Read the error log:',
                run: errorLogCommandLine(layout),
              },
              ...startAdvice(layout, 'Start it again once fixed:'),
            ],
          },
        );
      }
      await pm2.save();
    }

    const endpoints = endpointsOf(env);
    const initialAdmin = await readInitialAdmin(
      layout.configFile,
      path.join(prepared.dir, 'config.example.yml'),
    );
    // `nextCommands` are lines for a shell, as the application CLI's are, so one may chain two commands.
    const startCommand = `pm2 start ${quoteForShell(layout.ecosystemFile)} && pm2 save`;
    const nextCommands = [
      ...(flags.start ? [] : [startCommand]),
      'pm2 startup',
    ];
    return {
      status: 'success',
      result: {
        directory: root,
        version: prepared.version,
        releaseId: prepared.id,
        builtAt: prepared.builtAt,
        release: prepared.dir,
        appName: prepared.appName,
        basePath: mountPathOf(env) || '/',
        dialect,
        url: endpoints.url,
        endpoints,
        healthUrl: url,
        name,
        started: flags.start,
        configFile: layout.configFile,
        storageDir: layout.storageDir,
        initialAdmin,
        nextCommands,
      },
      summary: [
        `${prepared.appName} ${prepared.version} is installed at ${root}${flags.start ? ' and running' : ''}.`,
        `  URL       ${endpoints.url}`,
        `  Release   ${prepared.id}`,
        `  Sign in   ${describeInitialAdmin(initialAdmin)}`,
        `  Logs      pm2 logs ${name}`,
        'Next steps',
        ...(flags.start ? [] : [`  Start it: ${startCommand}`]),
        '  Start pm2 at boot: run `pm2 startup` and execute the command it prints (needs sudo).',
        `  Proxy ${origin} to http://${flags.host}:${flags.port} with location /.`,
      ],
    };
  } catch (error) {
    // Before the switch nothing is in use yet, so a retry should find the target as empty as it was.
    // After it, the release, configuration and data are real and stay.
    if (!switched) {
      await releaseLock();
      await cleanUp(root, created);
    }
    throw error;
  } finally {
    await releaseLock();
  }
}
