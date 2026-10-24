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
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import { findProgram } from './programs.js';
import { startupDetail } from './startup-detail.js';

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
  /** Stops npm when its owning bridge shuts down. */
  readonly signal?: AbortSignal | undefined;
}

/** Long enough for npm to download an adapter with a cold cache over a slow connection: about a minute on a fast one. */
const INSTALL_TIMEOUT_MS = 300_000;
/** A temporary directory this old is left over from an install that did not finish. */
const STALE_MS = 60 * 60_000;
const BATCH_FILE = /\.(?:cmd|bat)$/iu;

const installs = new Map<string, Promise<string>>();
const INVENTORY = 'bridge-files.json';
type InstalledFile = { readonly path: string; readonly link: boolean };

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
    if (!(await stat(file)).isFile()) return undefined;
    const files = JSON.parse(
      await readFile(path.join(root, INVENTORY), 'utf8'),
    ) as InstalledFile[];
    if (!Array.isArray(files) || files.length === 0) return undefined;
    // Bound filesystem concurrency without loading package contents on every scan.
    for (let offset = 0; offset < files.length; offset += 32) {
      const valid = await Promise.all(
        files.slice(offset, offset + 32).map(async (entry) => {
          if (
            typeof entry.path !== 'string' ||
            path.isAbsolute(entry.path) ||
            entry.path.split(/[\\/]/u).includes('..')
          )
            return false;
          const full = path.join(root, entry.path);
          const info = await lstat(full);
          return entry.link
            ? info.isSymbolicLink() && (await stat(full)).isFile()
            : info.isFile();
        }),
      );
      if (valid.includes(false)) return undefined;
    }
    return file;
  } catch {
    return undefined;
  }
}

/**
 * Installs `pkg` under `options.dir` unless it is there already, and answers its program's file. An install already
 * running is joined. Failures reject with the install command and stderr; the next scan can try again.
 */
export function installAdapter(
  pkg: AdapterPackage,
  options: AdapterInstallOptions,
): Promise<string> {
  const target = adapterDir(options.dir, pkg);
  const running = installs.get(target);
  if (running) return running;
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
): Promise<string> {
  const label = `${pkg.name}@${pkg.version}`;
  let temp: string | undefined;
  let npm = 'npm';
  let args = ['install', '--prefix', target, label];
  try {
    const existing = await installedAdapter(target, pkg);
    if (existing) return existing;
    const program = await findProgram('npm', [], options.env, options.platform);
    if (!program) throw new Error('npm was not found on PATH');
    npm = program;
    const parent = path.dirname(target);
    await mkdir(parent, { recursive: true });
    await removeStale(parent, `.${path.basename(target)}-`);
    temp = await mkdtemp(path.join(parent, `.${path.basename(target)}-`));
    const started = Date.now();
    options.log?.(`Installing the ACP adapter ${label} into ${target}.`);
    args = [
      'install',
      '--prefix',
      temp,
      '--omit=optional',
      '--no-audit',
      '--no-fund',
      '--no-save',
      '--ignore-scripts',
      '--cache',
      path.join(options.dir, 'npm-cache'),
      '--prefer-offline',
      '--loglevel=error',
      label,
    ];
    await run(npm, args, options);
    await writeFile(
      path.join(temp, INVENTORY),
      JSON.stringify(await inventory(temp)),
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
    throw new Error(
      startupDetail(
        npm,
        args,
        `Could not install the ACP adapter ${label}: ${error instanceof Error ? error.message : String(error)}`,
      ),
      { cause: error },
    );
  } finally {
    if (temp) await rm(temp, { recursive: true, force: true }).catch(() => {});
  }
}

/** Records the files npm actually installed, including dependency files and bin link targets. */
async function inventory(root: string): Promise<InstalledFile[]> {
  const files: InstalledFile[] = [];
  const visit = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile() || entry.isSymbolicLink())
        files.push({
          path: path.relative(root, full),
          link: entry.isSymbolicLink(),
        });
    }
  };
  await visit(path.join(root, 'node_modules'));
  return files;
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
        signal: options.signal,
        windowsHide: true,
        maxBuffer: 16 * 1024 * 1024,
      },
      (error, _stdout, stderr) => {
        if (!error) return resolve();
        const output = String(stderr).trim().slice(-1000);
        reject(
          new Error(
            error.killed
              ? `npm did not finish within ${(options.timeoutMs ?? INSTALL_TIMEOUT_MS) / 1000}s${output ? `\n${output}` : ''}`
              : output || error.message,
          ),
        );
      },
    );
  });
}
