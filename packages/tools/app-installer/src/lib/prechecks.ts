import { readdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { EXIT_INVALID, InstallerError } from './errors.ts';
import type { Pm2 } from './pm2.ts';
import { runCommand, type RunCommand } from './run-command.ts';
import { compareVersions } from './version.ts';

export const MINIMUM_NODE_MAJOR = 24;
export const MINIMUM_PNPM_MAJOR = 11;
/**
 * pm2 recognises `ecosystem.config.cjs` as a configuration from 4.3 on; an older one runs the file as the application
 * instead, which exits at once and looks like an application that cannot start.
 */
export const MINIMUM_PM2_VERSION = '4.3.0';

export function majorOf(version: string): number {
  const match = version.trim().match(/^v?(\d+)/u);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

export function currentNodeMajor(): number {
  return majorOf(process.versions.node);
}

export function checkPlatform(
  platform: NodeJS.Platform = process.platform,
): void {
  if (platform === 'win32') {
    throw new InstallerError(
      'PLATFORM_UNSUPPORTED',
      'app-installer does not run on Windows: the release switch relies on symbolic links and atomic renames.',
      {
        exitCode: EXIT_INVALID,
        suggestions: [{ message: 'Run it inside WSL instead.' }],
      },
    );
  }
}

export async function checkPnpm(run: RunCommand = runCommand): Promise<string> {
  let version: string;
  try {
    version = (await run('pnpm', ['--version'])).stdout.trim();
  } catch {
    throw new InstallerError('PNPM_MISSING', 'pnpm was not found on PATH.', {
      exitCode: EXIT_INVALID,
      suggestions: [
        {
          message: `Install pnpm ${MINIMUM_PNPM_MAJOR}, then open a new shell:`,
          run: `corepack enable && corepack prepare pnpm@${MINIMUM_PNPM_MAJOR} --activate`,
        },
      ],
    });
  }
  if (!(majorOf(version) >= MINIMUM_PNPM_MAJOR)) {
    throw new InstallerError(
      'PNPM_UNSUPPORTED',
      `pnpm ${MINIMUM_PNPM_MAJOR} or later is required; found ${version}.`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message: `Install pnpm ${MINIMUM_PNPM_MAJOR}, then open a new shell:`,
            run: `corepack enable && corepack prepare pnpm@${MINIMUM_PNPM_MAJOR} --activate`,
          },
        ],
      },
    );
  }
  return version;
}

/** The C library Node runs on, which a Linux build's native modules are compiled against. */
export function currentLibc(): 'glibc' | 'musl' | undefined {
  if (process.platform !== 'linux') return undefined;
  const report = process.report.getReport() as {
    header?: { glibcVersionRuntime?: string };
  };
  return report.header?.glibcVersionRuntime ? 'glibc' : 'musl';
}

/**
 * This machine as `pnpm build --target` names a platform, such as `linux-x64` or `linux-arm64-musl`, so a suggestion
 * to rebuild for it runs as printed.
 */
export function machineBuildTarget(): string {
  return `${process.platform}-${process.arch}${currentLibc() === 'musl' ? '-musl' : ''}`;
}

/**
 * The build command that produces an archive this machine runs, run in the application project. A current build is not
 * tied to a mount path, so the command names none.
 */
export function rebuildCommand(): string {
  return `pnpm build --target ${machineBuildTarget()} --node-version ${currentNodeMajor()} --tar`;
}

/**
 * pm2 must be installed globally: `pm2 startup` writes a boot service that names pm2's own path, so a copy fetched
 * through `npx` into a cache would vanish from under it.
 */
export async function checkPm2(pm2: Pm2): Promise<string> {
  let version: string;
  try {
    version = await pm2.version();
  } catch {
    throw new InstallerError('PM2_MISSING', 'pm2 was not found on PATH.', {
      exitCode: EXIT_INVALID,
      suggestions: [
        { message: 'Install pm2 globally:', run: 'npm install -g pm2' },
        {
          message:
            'Or install without starting the application, with --no-start.',
        },
      ],
    });
  }
  const comparison = compareVersions(version, MINIMUM_PM2_VERSION);
  if (comparison === undefined || comparison < 0) {
    throw new InstallerError(
      'PM2_UNSUPPORTED',
      comparison === undefined
        ? `pm2 ${MINIMUM_PM2_VERSION} or later is required, and \`pm2 --version\` printed "${version}", which is not a version.`
        : `pm2 ${MINIMUM_PM2_VERSION} or later is required; found ${version}.`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message:
              'Update pm2 globally; `pm2 update` then swaps the running daemon for the new version:',
            run: 'npm install -g pm2@latest && pm2 update',
          },
        ],
      },
    );
  }
  return version;
}

/**
 * The pm2 process name must be free. `pm2 start` on a name that is already registered does not start a second process:
 * it restarts the existing one — its own script and arguments — with the new environment, so another application on this
 * machine would come back serving this one's configuration and database.
 */
export async function checkPm2NameFree(pm2: Pm2, name: string): Promise<void> {
  const existing = await pm2.describe(name);
  if (existing) {
    throw new InstallerError(
      'PM2_NAME_IN_USE',
      `pm2 already runs a process named ${name}${existing.cwd ? ` from ${existing.cwd}` : ''}.`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message: `Give this installation its own process name with --name, such as --name ${name}-2.`,
          },
        ],
      },
    );
  }
}

function tryListen(
  host: string,
  port: number,
): Promise<NodeJS.ErrnoException | undefined> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', (error: NodeJS.ErrnoException) => resolve(error));
    server.listen(port, host, () => server.close(() => resolve(undefined)));
  });
}

/** The first port above `after` that can be listened on right now, for a suggestion; `undefined` if none is near. */
export async function nextFreePort(
  host: string,
  after: number,
  attempts: number = 50,
): Promise<number | undefined> {
  for (
    let port = after + 1;
    port <= Math.min(after + attempts, 65535);
    port += 1
  ) {
    if (!(await tryListen(host, port))) return port;
  }
  return undefined;
}

/**
 * The application's port must be free. Otherwise whatever already listens there answers the health check, and the
 * install reports success while its own process crash-loops on EADDRINUSE. With `suggestPort`, as for an install that
 * chooses its port, the error names a free one; each installation on a machine needs its own.
 */
export async function checkPortFree(
  host: string,
  port: number,
  options: { suggestPort?: boolean } = {},
): Promise<void> {
  const error = await tryListen(host, port);
  if (!error) return;
  const free =
    options.suggestPort && error.code === 'EADDRINUSE'
      ? await nextFreePort(host, port)
      : undefined;
  throw new InstallerError(
    'PORT_IN_USE',
    error.code === 'EADDRINUSE'
      ? `${host}:${port} is already in use.`
      : `Cannot listen on ${host}:${port}: ${error.message}`,
    {
      exitCode: EXIT_INVALID,
      details: free === undefined ? undefined : { freePort: free },
      suggestions: [
        options.suggestPort
          ? {
              message:
                free === undefined
                  ? 'Choose another port with --port.'
                  : `Port ${free} is free: pass --port ${free}, and point the reverse proxy at it.`,
            }
          : { message: 'Stop what holds the port, then run this again.' },
      ],
    },
  );
}

/** `--set-from-env` names variables; a typo should fail here, not after the build. */
export function checkEnvVariables(
  variables: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): void {
  const missing = variables.filter((name) => env[name] === undefined);
  if (missing.length > 0) {
    throw new InstallerError(
      'ENV_MISSING',
      `--set-from-env names ${missing.length === 1 ? 'a variable that is' : 'variables that are'} not set: ${missing.join(', ')}.`,
      { exitCode: EXIT_INVALID },
    );
  }
}

/** The target must be new or empty; the installer never overwrites files it did not write. */
export async function checkTargetEmpty(root: string): Promise<boolean> {
  let entries: string[];
  try {
    entries = await readdir(root);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return false;
    if (code === 'ENOTDIR') {
      throw new InstallerError('TARGET_NOT_EMPTY', `${root} is a file.`, {
        exitCode: EXIT_INVALID,
        suggestions: [{ message: 'Install into a new or empty directory.' }],
      });
    }
    throw error;
  }
  if (entries.length > 0) {
    throw new InstallerError('TARGET_NOT_EMPTY', `${root} is not empty.`, {
      exitCode: EXIT_INVALID,
      suggestions: [
        { message: 'Install into a new or empty directory.' },
        {
          message:
            'To manage an application this installer already set up there, use status, upgrade or rollback instead.',
        },
      ],
    });
  }
  return true;
}
