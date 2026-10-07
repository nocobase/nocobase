// The run's mounts (`RunPayload.mounts`, the `mounts` feature): directories of files the application places beside the
// agent. The runner does not know what they hold; each mount names its target inside the subject's work directory and
// a note for the agent.
//
// Each bundle is fetched once per content hash from the application (`RUNNER_ROUTES.mount`, with the runner's key)
// into `~/.nocobase-runner/mounts/<app>/<name>/<hash>/`, then copied, every run afresh, to its target: whatever the agent
// changed there in an earlier run is replaced by what the application sends now.
import { existsSync } from 'node:fs';
import { cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ApiClient } from '../lib/http.ts';
import { safeName, type RunnerPaths } from '../lib/home.ts';
import {
  MountBundleSchema,
  type MountBundle,
  type RunMount,
} from '../protocol/index.ts';
import { isInside } from '../core/command-policy.ts';

export class MountsError extends Error {
  override name = 'MountsError';
}

const COMPLETE = '.complete';

/** A mount as placed for the run. */
export interface PlacedMount {
  readonly name: string;
  /** Absolute. */
  readonly dir: string;
  readonly note?: string;
  readonly files: number;
}

export function mountCacheDir(
  paths: RunnerPaths,
  appKey: string,
  mount: Pick<RunMount, 'name' | 'hash'>,
): string {
  return path.join(
    paths.mountsDir,
    safeName(appKey),
    safeName(mount.name),
    safeName(mount.hash),
  );
}

/** Writes a bundle's files under `dir`, refusing any path that would leave it. */
async function writeBundle(dir: string, bundle: MountBundle): Promise<void> {
  for (const file of bundle.files) {
    const target = path.resolve(dir, file.path);
    if (target === dir || !isInside(dir, target))
      throw new MountsError(
        `Mount ${bundle.name} has a file outside its directory: ${file.path}`,
      );
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, file.content, { mode: 0o600 });
  }
}

/** The cached copy of `mount`, fetched when the cache lacks it. */
async function ensureCached(options: {
  paths: RunnerPaths;
  appKey: string;
  mount: RunMount;
  client: ApiClient;
  log?: (message: string) => void;
}): Promise<{ dir: string; fetched: boolean; files: number }> {
  const { mount, client } = options;
  const dir = mountCacheDir(options.paths, options.appKey, mount);
  if (existsSync(path.join(dir, COMPLETE)))
    return { dir, fetched: false, files: -1 };
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(mount.bundleUrl)) {
    // The runner key goes only to the application it belongs to.
    if (new URL(mount.bundleUrl).origin !== new URL(client.server).origin)
      throw new MountsError(
        `Mount ${mount.name} is served from another origin: ${mount.bundleUrl}`,
      );
  }
  options.log?.(`mounts: fetching ${mount.name} ${mount.hash}`);
  const bundle = await client.get(mount.bundleUrl, MountBundleSchema);
  if (bundle.name !== mount.name || bundle.hash !== mount.hash)
    throw new MountsError(
      `Asked for mount ${mount.name} ${mount.hash}, received ${bundle.name} ${bundle.hash}.`,
    );
  const temporary = `${dir}.${process.pid}.${Date.now()}.tmp`;
  await rm(temporary, { recursive: true, force: true });
  await mkdir(temporary, { recursive: true, mode: 0o700 });
  try {
    await writeBundle(temporary, bundle);
    await writeFile(path.join(temporary, COMPLETE), '');
    await rm(dir, { recursive: true, force: true });
    await mkdir(path.dirname(dir), { recursive: true, mode: 0o700 });
    await rename(temporary, dir);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return { dir, fetched: true, files: bundle.files.length };
}

export interface PlaceMountsOptions {
  paths: RunnerPaths;
  appKey: string;
  workDir: string;
  mounts: readonly RunMount[];
  client: ApiClient;
  log?: (message: string) => void;
}

export interface PlacedMounts {
  placed: PlacedMount[];
  /** The names fetched from the application this time (the others came from the cache). */
  fetched: string[];
}

/** The target of `mount`, inside `workDir` and not the work directory itself. */
export function mountTarget(workDir: string, mount: RunMount): string {
  const target = path.resolve(workDir, mount.target);
  if (target === workDir || !isInside(workDir, target))
    throw new MountsError(
      `Mount ${mount.name} targets a directory outside the work directory: ${mount.target}`,
    );
  return target;
}

/** Empties each mount's target and copies its files there. */
export async function placeMounts(
  options: PlaceMountsOptions,
): Promise<PlacedMounts> {
  const placed: PlacedMount[] = [];
  const fetched: string[] = [];
  const seen = new Set<string>();
  for (const mount of options.mounts) {
    if (seen.has(mount.name)) continue;
    seen.add(mount.name);
    const target = mountTarget(options.workDir, mount);
    const cached = await ensureCached({ ...options, mount });
    if (cached.fetched) fetched.push(mount.name);
    await rm(target, { recursive: true, force: true });
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await cp(cached.dir, target, {
      recursive: true,
      filter: (source) => path.basename(source) !== COMPLETE,
    });
    placed.push({
      name: mount.name,
      dir: target,
      ...(mount.note === undefined ? {} : { note: mount.note }),
      files: cached.files,
    });
  }
  return { placed, fetched };
}
