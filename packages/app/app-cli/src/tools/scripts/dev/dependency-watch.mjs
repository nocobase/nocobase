import path from 'node:path';

import { findWorkspaceRoot } from '../utils/workspace-packages.mjs';

/**
 * How long the dependency files have to stay unchanged before the server
 * restarts.
 *
 * An install writes `package.json` early and then keeps writing — the
 * lockfile, the store state — for as long as fetching and linking take, so
 * restarting on the first write lands in the middle of it: the server comes
 * back up against a half-installed `node_modules`, and the next write arrives
 * while it is still shutting down, which is where tsx escalates SIGTERM to
 * SIGKILL. Waiting for quiet costs a few seconds after an install and avoids
 * both.
 */
export const DEPENDENCY_SETTLE_MS = 3000;

/**
 * `package.json` plus what a package manager writes while installing. Any of
 * them changing restarts the server, and any of them changing again resets the
 * wait, so one install produces one restart.
 */
export function resolveDependencyWatch(rootDir) {
  const workspaceRoot = findWorkspaceRoot(rootDir);
  const roots = [...new Set([rootDir, workspaceRoot].filter(Boolean))];
  return roots.flatMap((directory) => [
    {
      directory,
      filenames: new Set([
        'package.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'package-lock.json',
        'yarn.lock',
      ]),
    },
    {
      // Written when linking finishes, which is the last thing an install does.
      directory: path.join(directory, 'node_modules'),
      filenames: new Set(['.modules.yaml', '.package-lock.json']),
    },
  ]);
}
