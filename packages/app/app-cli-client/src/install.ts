// Where an application's CLI is installed when it came from the application's install script
// (`/api/agents/dist/installScript`), and how a newer version replaces it:
//
//   <prefix>/versions/<version>/    one unpacked standalone tarball per version (bin/<bin>, bin/node, dist/, …)
//   <prefix>/current -> versions/<version>
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
import { existsSync, readFileSync } from 'node:fs';
import {
  mkdir,
  readdir,
  readlink,
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
  DIST_ROUTES,
  DistArtifactSchema,
  routePath,
  type DistArtifact,
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
  const versionsDir = path.dirname(root);
  if (path.basename(versionsDir) !== 'versions') return undefined;
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
    versionDir: root,
    version: path.basename(root),
    current,
    ...(binLink === undefined ? {} : { binLink }),
    mode,
  };
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

/** What to update to: a version, where its tarball is, and its checksum. */
export interface UpdateTarget {
  version: string;
  url: string;
  sha256: string;
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

export function isNewer(candidate: string, running: string): boolean {
  return compareVersions(candidate, running) > 0;
}

export interface ApplyUpdateOptions {
  installation: Pick<Installation, 'prefix' | 'current'>;
  /** The command the tarball carries, `bin/<bin>`; also how the log names it. */
  bin: string;
  client: ArtifactDownloader;
  update: UpdateTarget;
  log?: (message: string) => void;
}

/** What `applyUpdate` replaced: the version `current` pointed at, and the versions it removed. */
export interface AppliedUpdate {
  previous: string | undefined;
  removed: string[];
}

/**
 * Installs `update` beside the running version and makes it current; the previous version stays until the next
 * update, so a bad one can be switched back by hand. The process has to restart to run it.
 */
export async function applyUpdate(
  options: ApplyUpdateOptions,
): Promise<AppliedUpdate> {
  const { installation, client, update, bin } = options;
  if (!/^[0-9A-Za-z.+-]+$/u.test(update.version))
    throw new Error(`Not a version: ${update.version}`);
  const previous = await currentVersion(installation);
  const dest = path.join(installation.prefix, 'versions', update.version);
  if (!existsSync(path.join(dest, 'bin', bin))) {
    options.log?.(`update: downloading ${bin} ${update.version}`);
    const bytes = await client.download(update.url);
    await unpackTarball(bytes, update.sha256, dest);
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
