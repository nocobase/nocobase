// The pnpm store every run on this machine shares: `<workRoot>/.pnpm-store`.
//
// Without it each tool found its own: Claude Code reached the person's store through the agent home's links, while
// Codex's sandbox lets the agent write only its working directories, so an agent there installed with
// `--store-dir .pnpm-store` and every working directory carried a full copy of its dependencies. The runner now hands
// every tool the same store through the environment (`pnpmStoreEnv`), and a tool that sandboxes itself lets the agent
// write it (`AdapterSession.writableRoots`).
//
// It sits in the work root rather than the runner's own directory for two reasons: pnpm clones a package into
// `node_modules` only when the store is on the same file system as the project, so a store beside the working
// directories is what makes a second install nearly free on a file system that clones; and the runner's directory holds
// its keys, which no agent's sandbox should be opened onto.
//
// Sharing is safe for the content: the store is addressed by content, each file named after its hash, written to a
// temporary file and renamed into place, so two installs writing the same package write the same bytes and never a
// half-written file, and pnpm checks a stored file against its recorded integrity before importing it again
// (`verify-store-integrity`, on by default).
//
// Runs import packages with `clone-or-copy`, never with hard links (pnpm's default falls back to them): a hard link is
// the store's own file, so an agent editing a file under `node_modules` in place would change it for every task on the
// machine, other applications' included, already installed or not. A clone (APFS, Btrfs, XFS with reflink, ZFS with
// block cloning) is a copy on write and costs no space until it is written; elsewhere, such as on ext4, each working
// directory gets a full copy of its dependencies, which is what a working directory held before the store was shared;
// the store still saves the download.
//
// The store grows with every version anything installed. `prunePnpmStore` removes what no project links anymore; the
// daemon runs it in its garbage collection, after working directories were removed, and only while no run is active,
// since a file an install has just added and not linked yet looks unreferenced too.
//
// The store is a directory agents write, so the runner never runs pnpm in it: pnpm reads settings from its working
// directory and every directory above it — a `pnpm-workspace.yaml` that moves the store, a `packageManager` that makes it
// download and run another pnpm. Every pnpm the runner runs itself starts in its own empty directory
// (`RunnerPaths.toolCwd`), names the store on its command line and gets an environment built from nothing
// (`runnerPnpmEnv`).
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

import type { RunnerPaths } from '../lib/home.ts';

/** How a run's pnpm imports a package from the store into `node_modules`: never as a hard link. */
export const PNPM_IMPORT_METHOD = 'clone-or-copy';

/**
 * The variables the runner sets for every pnpm a run starts, which a run cannot override: the store, and how packages
 * are imported from it. pnpm 11 reads its settings from `pnpm_config_*`, earlier versions from `npm_config_*`.
 */
export const PNPM_STORE_ENV: readonly string[] = [
  'pnpm_config_store_dir',
  'npm_config_store_dir',
  'pnpm_config_package_import_method',
  'npm_config_package_import_method',
];

/** The environment that points a run's pnpm at `storeDir` and imports packages from it without hard links. */
export function pnpmStoreEnv(storeDir: string): Record<string, string> {
  return {
    pnpm_config_store_dir: storeDir,
    npm_config_store_dir: storeDir,
    pnpm_config_package_import_method: PNPM_IMPORT_METHOD,
    npm_config_package_import_method: PNPM_IMPORT_METHOD,
  };
}

/** Creates the shared store, so a sandbox can be opened onto it before pnpm first writes there. */
export async function ensurePnpmStore(paths: RunnerPaths): Promise<string> {
  await mkdir(paths.pnpmStoreDir, { recursive: true, mode: 0o700 });
  return paths.pnpmStoreDir;
}

/** The empty directory the runner's own tools start in, created private. */
export async function ensureToolCwd(paths: RunnerPaths): Promise<string> {
  await mkdir(paths.toolCwd, { recursive: true, mode: 0o700 });
  return paths.toolCwd;
}

/**
 * The environment of a pnpm the runner runs itself, built from nothing: PATH, HOME and LANG from the runner's own, and
 * nothing else it inherited (`npm_config_*`, `pnpm_config_*`, `PNPM_*`, `COREPACK_*`). pnpm never switches to another
 * version: neither `packageManager` (`pm-on-fail`, pnpm 11) nor `manage-package-manager-versions` (pnpm 9 and 10) may
 * make it download one.
 */
export function runnerPnpmEnv(
  source: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of ['PATH', 'HOME', 'LANG']) {
    const value = source[name];
    if (value !== undefined) env[name] = value;
  }
  return {
    ...env,
    pnpm_config_pm_on_fail: 'ignore',
    pnpm_config_manage_package_manager_versions: 'false',
    npm_config_manage_package_manager_versions: 'false',
  };
}

/** A pnpm command the runner runs: what, where and with which environment. */
export interface RunnerPnpmCommand {
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: Record<string, string>;
}

/** `pnpm store prune` on the shared store, named on the command line, from the runner's own empty directory. */
export function pruneCommand(
  paths: RunnerPaths,
  source: NodeJS.ProcessEnv = process.env,
): RunnerPnpmCommand {
  return {
    args: ['store', 'prune', '--store-dir', paths.pnpmStoreDir],
    cwd: paths.toolCwd,
    env: runnerPnpmEnv(source),
  };
}

export interface PruneOptions {
  paths: RunnerPaths;
  /** The runner's environment, for PATH and HOME. */
  source?: NodeJS.ProcessEnv;
  log?: (message: string) => void;
}

/**
 * Runs `pnpm store prune` on the shared store. Returns whether it ran: not without a store, or without pnpm on the
 * runner's PATH. Never throws; a failure is logged.
 */
export async function prunePnpmStore(options: PruneOptions): Promise<boolean> {
  const { paths, log } = options;
  if (!existsSync(paths.pnpmStoreDir)) return false;
  await ensureToolCwd(paths);
  const command = pruneCommand(paths, options.source ?? process.env);
  return new Promise((resolve) => {
    execFile(
      'pnpm',
      [...command.args],
      { cwd: command.cwd, env: command.env, timeout: 30 * 60_000 },
      (error, _stdout, stderr) => {
        if (error === null) {
          log?.(`gc: pruned the shared pnpm store ${paths.pnpmStoreDir}`);
          resolve(true);
          return;
        }
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          log?.('gc: pnpm is not on the runner PATH; the pnpm store is kept');
          resolve(false);
          return;
        }
        log?.(
          `gc: pruning the pnpm store failed: ${stderr.trim() || error.message}`,
        );
        resolve(false);
      },
    );
  });
}
