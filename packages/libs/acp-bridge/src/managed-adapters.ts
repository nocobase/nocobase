/**
 * ACP adapters the bridge installs for itself from npm, once for each pinned version, so that a session runs one with
 * the bridge's own Node.js instead of fetching it with npx every time. Each version is installed into a directory of
 * its own (`<dir>/<package>@<version>/`): npm installs it into a temporary sibling, which is then renamed into place,
 * so a directory that exists is complete. Two installs at once, in this process or another, both finish and the first
 * rename wins. Optional dependencies are left out, which skips the agents' platform binaries: the adapter runs the
 * agent installed on the computer, named to it in an environment variable.
 */
import { execFile } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
} from 'node:fs/promises';
import path from 'node:path';

import { findProgram } from './programs.js';

/** An adapter on npm, at the version the bridge pins, and the program of its package the bridge runs. */
export interface AdapterPackage {
  readonly name: string;
  readonly version: string;
  readonly bin: string;
}

export interface AdapterInstallOptions {
  /** The directory holding every managed adapter. */
  readonly dir: string;
  /** The environment npm runs with, PATH included: npm is found there. */
  readonly env: NodeJS.ProcessEnv;
  readonly platform: NodeJS.Platform;
  readonly log?: ((message: string) => void) | undefined;
  /** How long npm may take; five minutes by default. */
  readonly timeoutMs?: number;
}

/** Long enough for npm to download an adapter with a cold cache over a slow connection: about a minute on a fast one. */
const INSTALL_TIMEOUT_MS = 300_000;
/** After a failed install, how long the bridge starts the agent another way before trying again. */
const RETRY_MS = 10 * 60_000;
/** A temporary directory this old is left over from an install that did not finish. */
const STALE_MS = 60 * 60_000;
const BATCH_FILE = /\.(?:cmd|bat)$/iu;

const installs = new Map<string, Promise<string | undefined>>();
const failures = new Map<string, number>();
const reported = new Set<string>();

/** The directory `pkg` is installed in, under `dir`. */
export function adapterDir(dir: string, pkg: AdapterPackage): string {
  return path.join(dir, `${pkg.name}@${pkg.version}`);
}

/** The file of `pkg`'s program in the installation at `root`, or undefined when it is not installed there. */
export async function installedAdapter(
  root: string,
  pkg: AdapterPackage,
): Promise<string | undefined> {
  const packageDir = path.join(root, 'node_modules', ...pkg.name.split('/'));
  try {
    const manifest = JSON.parse(
      await readFile(path.join(packageDir, 'package.json'), 'utf8'),
    ) as { version?: unknown; bin?: unknown };
    if (manifest.version !== pkg.version) return undefined;
    const bin =
      typeof manifest.bin === 'string'
        ? manifest.bin
        : (manifest.bin as Record<string, unknown> | undefined)?.[pkg.bin];
    if (typeof bin !== 'string') return undefined;
    const file = path.join(packageDir, bin);
    return (await stat(file)).isFile() ? file : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Installs `pkg` under `options.dir` unless it is there already, and answers its program's file; undefined when it
 * cannot be installed, which is said once. An install already running is joined, and one that failed is not tried
 * again for ten minutes. It never rejects.
 */
export function installAdapter(
  pkg: AdapterPackage,
  options: AdapterInstallOptions,
): Promise<string | undefined> {
  const target = adapterDir(options.dir, pkg);
  const running = installs.get(target);
  if (running) return running;
  const failed = failures.get(target);
  if (failed !== undefined && Date.now() - failed < RETRY_MS)
    return Promise.resolve(undefined);
  const install = runInstall(pkg, target, options).finally(() => {
    installs.delete(target);
  });
  installs.set(target, install);
  return install;
}

async function runInstall(
  pkg: AdapterPackage,
  target: string,
  options: AdapterInstallOptions,
): Promise<string | undefined> {
  const label = `${pkg.name}@${pkg.version}`;
  let temp: string | undefined;
  try {
    const existing = await installedAdapter(target, pkg);
    if (existing) return existing;
    const npm = await findProgram('npm', [], options.env, options.platform);
    if (!npm) throw new Error('npm was not found on PATH');
    const parent = path.dirname(target);
    await mkdir(parent, { recursive: true });
    await removeStale(parent, `.${path.basename(target)}-`);
    temp = await mkdtemp(path.join(parent, `.${path.basename(target)}-`));
    const started = Date.now();
    options.log?.(`Installing the ACP adapter ${label} into ${target}.`);
    await run(
      npm,
      [
        'install',
        '--prefix',
        temp,
        '--omit=optional',
        '--no-audit',
        '--no-fund',
        '--no-save',
        '--ignore-scripts',
        '--loglevel=error',
        label,
      ],
      options,
    );
    if (!(await installedAdapter(temp, pkg)))
      throw new Error(`npm did not install its ${pkg.bin} program`);
    try {
      await rename(temp, target);
    } catch {
      // Another install finished first: its directory is used and this one discarded.
      const theirs = await installedAdapter(target, pkg);
      if (theirs) return theirs;
      // What is there is not an installation this made, such as one partly deleted: this one replaces it.
      await rm(target, { recursive: true, force: true });
      await rename(temp, target);
    }
    const installed = await installedAdapter(target, pkg);
    if (!installed) throw new Error(`${target} holds no ${pkg.bin} program`);
    options.log?.(
      `Installed the ACP adapter ${label} in ${((Date.now() - started) / 1000).toFixed(1)}s.`,
    );
    return installed;
  } catch (error) {
    failures.set(target, Date.now());
    if (!reported.has(target)) {
      reported.add(target);
      options.log?.(
        `Could not install the ACP adapter ${label} (${error instanceof Error ? error.message : String(error)}); the agent starts another way until it can be installed.`,
      );
    }
    return undefined;
  } finally {
    if (temp) await rm(temp, { recursive: true, force: true }).catch(() => {});
  }
}

/** Removes the temporary directories starting with `prefix` in `dir` that installs left behind. */
async function removeStale(dir: string, prefix: string): Promise<void> {
  for (const name of await readdir(dir)) {
    if (!name.startsWith(prefix)) continue;
    const full = path.join(dir, name);
    try {
      if (Date.now() - (await stat(full)).mtimeMs > STALE_MS)
        await rm(full, { recursive: true, force: true });
    } catch {
      // Another install removed it, or still uses it.
    }
  }
}

/** Runs npm, a batch file on Windows (`npm.cmd`), which only cmd.exe runs, so every argument is quoted for it. */
function run(
  npm: string,
  args: readonly string[],
  options: AdapterInstallOptions,
): Promise<void> {
  const batch = options.platform === 'win32' && BATCH_FILE.test(npm);
  return new Promise((resolve, reject) => {
    execFile(
      batch ? `"${npm}"` : npm,
      batch ? args.map((arg) => `"${arg}"`) : [...args],
      {
        env: { ...options.env, npm_config_update_notifier: 'false' },
        shell: batch,
        timeout: options.timeoutMs ?? INSTALL_TIMEOUT_MS,
        windowsHide: true,
        maxBuffer: 16 * 1024 * 1024,
      },
      (error, _stdout, stderr) => {
        if (!error) return resolve();
        const output = String(stderr).trim().slice(-1000);
        reject(
          new Error(
            error.killed
              ? `npm did not finish within ${(options.timeoutMs ?? INSTALL_TIMEOUT_MS) / 1000}s`
              : output || error.message,
          ),
        );
      },
    );
  });
}
