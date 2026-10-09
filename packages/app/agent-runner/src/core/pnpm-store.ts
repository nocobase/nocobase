// The pnpm store every run on this machine shares: `<workRoot>/.pnpm-store`.
//
// Without it each tool found its own: Claude Code reached the person's store through the agent home's links, while
// Codex's sandbox lets the agent write only its working directories, so an agent there installed with
// `--store-dir .pnpm-store` and every working directory carried a full copy of its dependencies. The runner now hands
// every tool the same store through the environment (`pnpmStoreEnv`), and a tool that sandboxes itself lets the agent
// write it (`AdapterSession.writableRoots`).
//
// It sits in the work root rather than the runner's own directory for two reasons: pnpm links a package into
// `node_modules` with a reflink or a hard link only when the store is on the same file system as the project, and
// copies it otherwise, so a store beside the working directories is what makes a second install nearly free; and the
// runner's directory holds its keys, which no agent's sandbox should be opened onto.
//
// Sharing is safe for the content: the store is addressed by content, each file named after its hash, written to a
// temporary file and renamed into place, so two installs writing the same package write the same bytes and never a
// half-written file, and pnpm checks a stored file against its recorded integrity before linking it again
// (`verify-store-integrity`, on by default). What a hard link cannot prevent is an edit made in place to a file under
// `node_modules`, which changes the store's copy and so every other project linked to it; the agent is told not to
// (`workspaceNotes`), a reflink (APFS, Btrfs, XFS) is a copy on write and is not affected, and pnpm notices the change
// at the next install and fetches the package again.
//
// The store grows with every version anything installed. `prunePnpmStore` removes what no project links anymore; the
// daemon runs it in its garbage collection, after working directories were removed, and only while no run is active,
// since a file an install has just added and not linked yet looks unreferenced too.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

import type { RunnerPaths } from '../lib/home.ts';

/**
 * The variables naming the store: pnpm 11 reads its settings from `pnpm_config_*`, earlier versions from
 * `npm_config_*`.
 */
export const PNPM_STORE_ENV: readonly string[] = [
  'pnpm_config_store_dir',
  'npm_config_store_dir',
];

/** The environment that points pnpm at `storeDir`. */
export function pnpmStoreEnv(storeDir: string): Record<string, string> {
  return Object.fromEntries(PNPM_STORE_ENV.map((name) => [name, storeDir]));
}

/** Creates the shared store, so a sandbox can be opened onto it before pnpm first writes there. */
export async function ensurePnpmStore(paths: RunnerPaths): Promise<string> {
  await mkdir(paths.pnpmStoreDir, { recursive: true, mode: 0o700 });
  return paths.pnpmStoreDir;
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
  const source = options.source ?? process.env;
  if (!existsSync(paths.pnpmStoreDir)) return false;
  const env: Record<string, string> = {
    ...pnpmStoreEnv(paths.pnpmStoreDir),
  };
  for (const name of ['PATH', 'HOME', 'LANG']) {
    const value = source[name];
    if (value !== undefined) env[name] = value;
  }
  return new Promise((resolve) => {
    execFile(
      'pnpm',
      ['store', 'prune'],
      // The store's own directory: no package.json, so no project's settings or `packageManager` apply.
      { cwd: paths.pnpmStoreDir, env, timeout: 30 * 60_000 },
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
