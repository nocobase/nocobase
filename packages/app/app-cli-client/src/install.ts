// Where an application's CLI is installed when it came from the application's install script
// (`/api/agents/dist/installScript`), and how a newer version replaces it:
//
//   <prefix>/versions/<version>/    one unpacked tarball per version (bin/<bin>, dist/, …, and bin/node when it
//                                   bundles its Node), or one npm install of the package the application names
//                                   (node_modules/<package>, and bin/<bin>, a launcher of node_modules/.bin/<bin>
//                                   that finds Node as a universal tarball's does: `npmLauncherScript`)
//   <prefix>/current -> versions/<version>
//   <prefix>/node                   the Node a universal tarball (one without bin/node) runs on: a link the install
//                                   script makes to the node it checked, or what an update leaves (`pinNode`)
//   <prefix>/install.json           what the script set up: the command link (`binLink`), and `mode`, `cli` for the
//                                   CLI alone or `runner` once the script ran with `--runner` (absent: `runner`)
//   <bin-dir>/<bin> -> <prefix>/current/bin/<bin>
//
// A service runs `<prefix>/current/bin/<bin>`, so switching `current` and restarting is an update. A CLI started from
// a source checkout, or installed any other way, has no installation: it neither updates nor uninstalls itself.
//
// This module reads no CLI configuration, so the CLI's `update` and a runner carried by the CLI share it.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants, existsSync, readFileSync } from 'node:fs';
import {
  access,
  copyFile,
  chmod,
  mkdir,
  readdir,
  readFile,
  readlink,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import type { z } from 'zod';

import {
  compareVersions,
  currentTarget,
  DIST_ACCEPT_NPM,
  DIST_ROUTES,
  DistArtifactSchema,
  DistResolutionSchema,
  EXACT_VERSION_PATTERN,
  isDistNpmPackage,
  NPM_PACKAGE_PATTERN,
  routePath,
  type DistArtifact,
  type DistResolution,
} from '@nocobase/agent-protocol';

const execFileAsync = promisify(execFile);

export interface Installation {
  prefix: string;
  /** This version's directory, `<prefix>/versions/<version>`. */
  versionDir: string;
  version: string;
  /** `<prefix>/current`. */
  current: string;
  /** The command link the install script made, if it recorded one. */
  binLink?: string;
  /**
   * What the install script set up: the CLI alone (`<bin> update` updates it), or a runtime (the runner updates
   * itself). Installations from before the CLI could be installed alone are runtimes.
   */
  mode: 'cli' | 'runner';
}

/** The installation whose version directory is `root`, the root of the installed package; undefined for any other. */
export function detectInstallation(root: string): Installation | undefined {
  const versionDir = versionDirOf(root);
  if (versionDir === undefined) return undefined;
  const versionsDir = path.dirname(versionDir);
  const prefix = path.dirname(versionsDir);
  const current = path.join(prefix, 'current');
  if (!existsSync(current)) return undefined;
  let binLink: string | undefined;
  let mode: Installation['mode'] = 'runner';
  try {
    const info = JSON.parse(
      readFileSync(path.join(prefix, 'install.json'), 'utf8'),
    ) as { binLink?: unknown; mode?: unknown };
    if (typeof info.binLink === 'string' && info.binLink !== '')
      binLink = info.binLink;
    if (info.mode === 'cli') mode = 'cli';
  } catch {
    binLink = undefined;
  }
  return {
    prefix,
    versionDir,
    version: path.basename(versionDir),
    current,
    ...(binLink === undefined ? {} : { binLink }),
    mode,
  };
}

/**
 * The version directory `root` belongs to: `root` itself when it is `…/versions/<version>` (an unpacked tarball), or the
 * one holding the `node_modules` it sits in (`…/versions/<version>/node_modules/<package>`, an npm install).
 */
function versionDirOf(root: string): string | undefined {
  const marker = `${path.sep}node_modules${path.sep}`;
  const index = root.indexOf(marker);
  const dir = index === -1 ? root : root.slice(0, index);
  return path.basename(path.dirname(dir)) === 'versions' ? dir : undefined;
}

/** The command that starts whichever version is current. */
export function launcherOf(
  installation: Pick<Installation, 'current'>,
  bin: string,
): string {
  return path.join(installation.current, 'bin', bin);
}

export class ChecksumError extends Error {
  override name = 'ChecksumError';
}

export function sha256Of(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Checks `bytes` against `sha256` and unpacks the standalone tarball into `dest` (its top directory stripped), through
 * a sibling `.partial` directory so `dest` is either complete or absent.
 */
export async function unpackTarball(
  bytes: Uint8Array,
  sha256: string,
  dest: string,
): Promise<void> {
  const actual = sha256Of(bytes);
  if (actual !== sha256)
    throw new ChecksumError(
      `The download does not match its SHA-256 (expected ${sha256}, got ${actual}).`,
    );
  const partial = `${dest}.partial`;
  await rm(partial, { recursive: true, force: true });
  await mkdir(partial, { recursive: true, mode: 0o755 });
  const archive = `${partial}.tar.gz`;
  try {
    await writeFile(archive, bytes, { mode: 0o600 });
    await execFileAsync('tar', [
      '-xzf',
      archive,
      '-C',
      partial,
      '--strip-components=1',
    ]);
    await rm(dest, { recursive: true, force: true });
    await rename(partial, dest);
  } finally {
    await rm(archive, { force: true });
    await rm(partial, { recursive: true, force: true });
  }
}

/** Points `<prefix>/current` at `version`, replacing the link in one rename. */
export async function activateVersion(
  installation: Pick<Installation, 'prefix' | 'current'>,
  version: string,
): Promise<void> {
  const temporary = path.join(
    installation.prefix,
    `.current-${process.pid}-${Date.now()}`,
  );
  await symlink(path.join('versions', version), temporary);
  await rename(temporary, installation.current);
}

/** The version `current` points at. */
export async function currentVersion(
  installation: Pick<Installation, 'current'>,
): Promise<string | undefined> {
  try {
    return path.basename(await readlink(installation.current));
  } catch {
    return undefined;
  }
}

/** Removes every version but `keep`. */
export async function pruneVersions(
  installation: Pick<Installation, 'prefix'>,
  keep: readonly string[],
): Promise<string[]> {
  const versionsDir = path.join(installation.prefix, 'versions');
  const removed: string[] = [];
  for (const entry of await readdir(versionsDir).catch(() => [])) {
    if (keep.includes(entry)) continue;
    await rm(path.join(versionsDir, entry), { recursive: true, force: true });
    removed.push(entry);
  }
  return removed;
}

async function isExecutable(file: string): Promise<boolean> {
  try {
    await access(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Makes sure `<prefix>/node` is a Node a universal version (one without `bin/node`) can start on, as its launcher looks
 * there before PATH: a user service (launchd, systemd) usually runs without the PATH that finds the shell's `node`.
 * Nothing changes when it is one already. Otherwise it becomes `node`, the Node this process runs on: copied when it is
 * one an installed version bundles, since that version is removed by a later update, and linked when it is the
 * machine's own. Returns what it did.
 */
export async function pinNode(
  installation: Pick<Installation, 'prefix'>,
  node: string = process.execPath,
): Promise<'kept' | 'copied' | 'linked'> {
  const pinned = path.join(installation.prefix, 'node');
  if (await isExecutable(pinned)) return 'kept';
  const temporary = path.join(
    installation.prefix,
    `.node-${process.pid}-${Date.now()}`,
  );
  const inside = path.relative(
    path.join(installation.prefix, 'versions'),
    node,
  );
  const bundled = !inside.startsWith('..') && !path.isAbsolute(inside);
  try {
    if (bundled) {
      await copyFile(node, temporary);
      await chmod(temporary, 0o755);
    } else await symlink(node, temporary);
    await rename(temporary, pinned);
  } finally {
    await rm(temporary, { force: true });
  }
  return bundled ? 'copied' : 'linked';
}

/** A version served as a tarball: where it is, and its checksum. */
export interface ArtifactUpdateTarget {
  kind?: 'artifact';
  version: string;
  url: string;
  sha256: string;
}

/** A version to install from the npm registry: `<package>@<version>`, an exact version. */
export interface NpmUpdateTarget {
  kind: 'npm';
  version: string;
  package: string;
}

/** What to update to. */
export type UpdateTarget = ArtifactUpdateTarget | NpmUpdateTarget;

/** The update a resolve answer names. */
export function updateTargetOf(resolution: DistResolution): UpdateTarget {
  if (isDistNpmPackage(resolution))
    return {
      kind: 'npm',
      version: resolution.version,
      package: resolution.package,
    };
  return {
    version: resolution.version,
    url: resolution.url,
    sha256: resolution.sha256,
  };
}

/** Reads a `{ data }` answer of the application, as a JSON client with the caller's credential does. */
export interface ArtifactReader {
  get<T>(route: string, schema: z.ZodType<T>): Promise<T>;
}

/** Downloads a file of the application, with the caller's credential. */
export interface ArtifactDownloader {
  download(route: string): Promise<Uint8Array>;
}

/** The newest version of `product` the application serves for `target`. */
export async function latestArtifact(
  client: ArtifactReader,
  product: string,
  target: string = currentTarget(),
): Promise<DistArtifact> {
  return client.get(
    routePath(DIST_ROUTES.resolve, { product, target }),
    DistArtifactSchema,
  );
}

/**
 * The newest version of `product` the application offers for `target`: its tarball, or, from an application that has
 * none and names the package on npm, that package (`DIST_ACCEPT_NPM`). An application from before npm answers ignores
 * the parameter and answers with the tarball, or 404.
 */
export async function latestResolution(
  client: ArtifactReader,
  product: string,
  target: string = currentTarget(),
): Promise<DistResolution> {
  return client.get(
    `${routePath(DIST_ROUTES.resolve, { product, target })}?accept=${DIST_ACCEPT_NPM}`,
    DistResolutionSchema,
  );
}

export function isNewer(candidate: string, running: string): boolean {
  return compareVersions(candidate, running) > 0;
}

/**
 * The launcher an npm install puts at `<prefix>/versions/<version>/bin/<bin>`, so `current`, the command link and a
 * runner's service start it as they start an unpacked tarball: `node_modules/.bin/<bin>` under the first Node.js 24
 * or newer of `NOCOBASE_NODE`, `<prefix>/node`, `node` on PATH, and a Node an older version of the installation still
 * bundles, the order the universal tarball's launcher follows. It takes `<bin>` from its own name, so one text serves
 * every product; the install script writes the same one.
 */
export function npmLauncherScript(): string {
  return [
    '#!/bin/sh',
    '# Starts the command of this name that npm installed, with a Node.js 24 or newer of this machine.',
    'self="$0"',
    'while [ -h "$self" ]; do',
    '  link="$(readlink "$self")"',
    '  case "$link" in',
    '    /*) self="$link" ;;',
    '    *) self="$(dirname "$self")/$link" ;;',
    '  esac',
    'done',
    'bin="$(basename "$self")"',
    'root="$(cd "$(dirname "$self")/.." && pwd -P)"',
    'entry="$root/node_modules/.bin/$bin"',
    'prefix=""',
    'case "$(dirname "$root")" in',
    '  */versions) prefix="$(dirname "$(dirname "$root")")" ;;',
    'esac',
    'usable() {',
    `  [ -n "$1" ] && [ -x "$1" ] && "$1" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)' >/dev/null 2>&1`,
    '}',
    'for node in "${NOCOBASE_NODE:-}" "${prefix:+$prefix/node}" "$(command -v node 2>/dev/null || true)"; do',
    '  if usable "$node"; then exec "$node" "$entry" "$@"; fi',
    'done',
    'if [ -n "$prefix" ]; then',
    '  for node in "$prefix"/versions/*/bin/node; do',
    '    if usable "$node"; then exec "$node" "$entry" "$@"; fi',
    '  done',
    'fi',
    `echo "$bin needs Node.js 24 or newer, and found none. Install it (https://nodejs.org/en/download), make sure node is on PATH, or set NOCOBASE_NODE to its path." >&2`,
    'exit 1',
    '',
  ].join('\n');
}

export class NpmUnavailableError extends Error {
  override name = 'NpmUnavailableError';
}

/**
 * The npm to install with: `NOCOBASE_NPM`, `npm` on `PATH`, or the npm beside one of `nodes` (the Node an
 * installation runs on), where Node.js installs it.
 */
export async function findNpm(
  nodes: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | undefined> {
  const candidates: string[] = [];
  if (env.NOCOBASE_NPM) candidates.push(env.NOCOBASE_NPM);
  for (const dir of (env.PATH ?? '').split(path.delimiter))
    if (dir !== '') candidates.push(path.join(dir, 'npm'));
  for (const node of nodes) {
    candidates.push(path.join(path.dirname(node), 'npm'));
    try {
      candidates.push(path.join(path.dirname(await realpath(node)), 'npm'));
    } catch {
      // A Node that is not there has no npm beside it.
    }
  }
  for (const candidate of candidates)
    if (await isExecutable(candidate)) return candidate;
  return undefined;
}

export interface InstallNpmVersionOptions {
  installation: Pick<Installation, 'prefix'>;
  /** The command the package provides (`bin` in its package.json), which the launcher starts. */
  bin: string;
  package: string;
  version: string;
  /** The Node.js 24 or newer npm runs on: put first on npm's PATH, for its `#!/usr/bin/env node`. */
  node: string;
  /** The npm to run; `findNpm` by default. */
  npm?: string;
  env?: NodeJS.ProcessEnv;
  log?: (message: string) => void;
}

/**
 * Installs `<package>@<version>` from the registry the machine's npm is configured with into
 * `<prefix>/versions/<version>`, through a sibling `.partial` directory so the version directory is either complete
 * or absent: `npm install --prefix <dir> --no-save --no-audit --no-fund --omit=optional`, then the launcher
 * (`npmLauncherScript`) at `bin/<bin>`. Optional dependencies are left out: the coding tools' SDKs list one package per
 * platform, each carrying a binary the runner never starts.
 */
export async function installNpmVersion(
  options: InstallNpmVersionOptions,
): Promise<void> {
  const { installation, bin, version } = options;
  if (!NPM_PACKAGE_PATTERN.test(options.package))
    throw new Error(`Not an npm package name: ${options.package}`);
  if (!EXACT_VERSION_PATTERN.test(version))
    throw new Error(`Not an exact version: ${version}`);
  const env = options.env ?? process.env;
  const npm = options.npm ?? (await findNpm([options.node], env));
  if (npm === undefined)
    throw new NpmUnavailableError(
      `${bin} ${version} is installed with npm, and none was found on PATH or beside ${options.node}. npm comes ` +
        'with Node.js (https://nodejs.org/en/download); put it on PATH, or set NOCOBASE_NPM to its path.',
    );
  const dest = path.join(installation.prefix, 'versions', version);
  const partial = `${dest}.partial`;
  await rm(partial, { recursive: true, force: true });
  await mkdir(partial, { recursive: true, mode: 0o755 });
  try {
    options.log?.(`update: installing ${options.package}@${version} with npm`);
    try {
      await execFileAsync(
        npm,
        [
          'install',
          '--prefix',
          partial,
          '--no-save',
          '--no-audit',
          '--no-fund',
          '--omit=optional',
          `${options.package}@${version}`,
        ],
        {
          cwd: partial,
          env: {
            ...env,
            PATH: [path.dirname(options.node), env.PATH ?? '']
              .filter((entry) => entry !== '')
              .join(path.delimiter),
          },
          maxBuffer: 16 * 1024 * 1024,
        },
      );
    } catch (error) {
      const stderr = (error as { stderr?: unknown }).stderr;
      const detail =
        typeof stderr === 'string' && stderr.trim() !== ''
          ? stderr.trim().split('\n').slice(-5).join('\n')
          : error instanceof Error
            ? error.message
            : String(error);
      throw new Error(
        `npm could not install ${options.package}@${version}: ${detail}`,
        { cause: error },
      );
    }
    const installed = JSON.parse(
      await readFile(
        path.join(partial, 'node_modules', options.package, 'package.json'),
        'utf8',
      ),
    ) as { version?: unknown };
    if (installed.version !== version)
      throw new Error(
        `npm installed ${options.package}@${String(installed.version)}, not ${version}.`,
      );
    if (!existsSync(path.join(partial, 'node_modules', '.bin', bin)))
      throw new Error(
        `${options.package}@${version} provides no ${bin} command.`,
      );
    await mkdir(path.join(partial, 'bin'), { recursive: true, mode: 0o755 });
    await writeFile(path.join(partial, 'bin', bin), npmLauncherScript(), {
      mode: 0o755,
    });
    await rm(dest, { recursive: true, force: true });
    await rename(partial, dest);
  } finally {
    await rm(partial, { recursive: true, force: true });
  }
}

export interface ApplyUpdateOptions {
  installation: Pick<Installation, 'prefix' | 'current'>;
  /** The command the version carries, `bin/<bin>`; also how the log names it. */
  bin: string;
  /** Downloads a tarball; an npm update does not use it. */
  client: ArtifactDownloader;
  update: UpdateTarget;
  /** The npm an npm update runs; `findNpm` by default. */
  npm?: string;
  env?: NodeJS.ProcessEnv;
  log?: (message: string) => void;
}

/** What `applyUpdate` replaced: the version `current` pointed at, and the versions it removed. */
export interface AppliedUpdate {
  previous: string | undefined;
  removed: string[];
}

/**
 * Installs `update` beside the running version and makes it current; the previous version stays until the next
 * update, so a bad one can be switched back by hand. The process has to restart to run it. A tarball is downloaded,
 * checked and unpacked; an npm package is installed with npm (`installNpmVersion`). A version without its own Node (a
 * universal tarball, every npm install) gets a Node to run on first (`pinNode`): the one this process runs on, which
 * keeps a runner whose service has no `node` on its PATH starting when it moves from a version that bundles Node to
 * one that does not.
 */
export async function applyUpdate(
  options: ApplyUpdateOptions,
): Promise<AppliedUpdate> {
  const { installation, client, update, bin } = options;
  if (!/^[0-9A-Za-z.+-]+$/u.test(update.version))
    throw new Error(`Not a version: ${update.version}`);
  const previous = await currentVersion(installation);
  const dest = path.join(installation.prefix, 'versions', update.version);
  const pin = async (): Promise<void> => {
    const pinned = await pinNode(installation);
    if (pinned !== 'kept')
      options.log?.(
        `update: ${bin} ${update.version} runs on ${path.join(installation.prefix, 'node')} (${pinned} from ${process.execPath})`,
      );
  };
  if (update.kind === 'npm') {
    // npm runs on the Node the new version will run on, so that one is pinned first.
    await pin();
    if (!existsSync(path.join(dest, 'bin', bin)))
      await installNpmVersion({
        installation,
        bin,
        package: update.package,
        version: update.version,
        node: path.join(installation.prefix, 'node'),
        ...(options.npm === undefined ? {} : { npm: options.npm }),
        ...(options.env === undefined ? {} : { env: options.env }),
        ...(options.log === undefined ? {} : { log: options.log }),
      });
  } else {
    if (!existsSync(path.join(dest, 'bin', bin))) {
      options.log?.(`update: downloading ${bin} ${update.version}`);
      const bytes = await client.download(update.url);
      await unpackTarball(bytes, update.sha256, dest);
    }
    if (!existsSync(path.join(dest, 'bin', 'node'))) await pin();
  }
  await activateVersion(installation, update.version);
  options.log?.(
    `update: ${bin} ${update.version} is current (was ${previous ?? 'none'})`,
  );
  const removed = await pruneVersions(installation, [
    update.version,
    ...(previous === undefined ? [] : [previous]),
  ]);
  return { previous, removed };
}
