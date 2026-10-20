import { workspaceInUse } from './workspace-use.ts';
import { invalidatePreparation } from './preparation.ts';
// Regenerable build artifacts in working directories that sit unused.
//
// A working directory whose work goes on stays, but what an install or a build regenerates (`node_modules`, `.next`,
// `.turbo` by default, `RunnerSettings.artifactPatterns`) is removed from it once no run has used it for
// `RunnerSettings.artifactTtlMs` (24 hours by default; 0 turns it off). The checkout itself, its commits and changes,
// stay. Every directory with one of those names anywhere inside it goes, without following symbolic links: a link is
// never entered nor removed. A directory a run holds is never touched: the pass checks live usage registrations, and a run
// that used it since it was read keeps it as it is. Once cleaned, a directory is not walked again until a run uses it.
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

import type { RunnerPaths } from '../lib/home.ts';
import {
  acquireLock,
  readWorkspaceMeta,
  writeWorkspaceMeta,
  type Lock,
} from './checkout.ts';
import type { WorkspaceEntry } from './workspaces.ts';
import { taskGit } from './task-git.ts';

export interface ArtifactOptions {
  readonly paths: RunnerPaths;
  /** How long unused before the artifacts go; 0 for never. */
  readonly ttlMs: number;
  readonly patterns: readonly string[];
  readonly now?: number;
  readonly log?: (message: string) => void;
  /** Pressure cleanup ignores TTL, but retains directory locks and Git file protection. */
  readonly pressure?: boolean;
  readonly shouldStop?: () => Promise<boolean>;
}

/** The directories named like a pattern under `root`, not following symbolic links and not looking inside a match. */
export async function findArtifacts(
  root: string,
  patterns: readonly string[],
): Promise<string[]> {
  const names = new Set(patterns);
  const found: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      // A symbolic link is neither a directory here nor followed.
      if (!entry.isDirectory()) continue;
      if (entry.name === '.git' || entry.name === '.nocobase-runner') continue;
      const child = path.join(dir, entry.name);
      if (names.has(entry.name)) found.push(child);
      else await walk(child);
    }
  };
  await walk(root);
  return found;
}

/** Removes the artifacts of the directories unused for the TTL; answers the directories cleaned. */
export async function cleanArtifacts(
  entries: readonly WorkspaceEntry[],
  options: ArtifactOptions,
): Promise<string[]> {
  if (
    (!options.pressure && options.ttlMs <= 0) ||
    options.patterns.length === 0
  )
    return [];
  const now = options.now ?? Date.now();
  const cleaned: string[] = [];
  for (const entry of [...entries].sort(
    (a, b) => Date.parse(a.lastUsedAt) - Date.parse(b.lastUsedAt),
  )) {
    if (await options.shouldStop?.()) break;
    if (entry.inUse || (await workspaceInUse(options.paths, entry.workDir)))
      continue;
    const usedAt = Date.parse(entry.lastUsedAt);
    if (
      !Number.isFinite(usedAt) ||
      (!options.pressure && now - usedAt < options.ttlMs)
    )
      continue;
    let lock: Lock;
    try {
      lock = await acquireLock(`${entry.workDir}.lock`, { timeoutMs: 0 });
    } catch {
      continue;
    }
    try {
      if (await workspaceInUse(options.paths, entry.workDir)) continue;
      const meta = await readWorkspaceMeta(options.paths, entry.workDir);
      // A run used it since it was read, or it was cleaned since it was last used.
      if (
        meta === undefined ||
        meta.lastUsedAt !== entry.lastUsedAt ||
        meta.lastRunId !== entry.lastRunId ||
        meta.runWorktrees === true ||
        meta.recoveryRequired === true ||
        meta.continuationOnly === true
      )
        continue;
      if (
        meta.artifactsCleanedAt !== undefined &&
        Date.parse(meta.artifactsCleanedAt) >= usedAt
      )
        continue;
      const found = await findArtifacts(entry.workDir, options.patterns);
      const tracked: string[] = [];
      try {
        for (const repo of meta.repos) {
          const root = path.join(entry.workDir, repo.path);
          const files = await taskGit(
            { dir: root, cache: repo.cache, url: repo.url },
            ['ls-files', '--recurse-submodules', '-z'],
          );
          tracked.push(
            ...files
              .split('\0')
              .filter(Boolean)
              .map((file) => path.resolve(root, file)),
          );
        }
      } catch {
        // Without Git evidence a custom pattern might remove source files.
        continue;
      }
      const safe = found.filter(
        (dir) =>
          !tracked.some(
            (file) =>
              file === dir ||
              file.startsWith(`${dir}${path.sep}`) ||
              dir.startsWith(`${file}${path.sep}`),
          ),
      );
      let removed = 0;
      for (const dir of safe) {
        if (await options.shouldStop?.()) break;
        try {
          // Invalidate before deletion: partial failures also require initialization next time.
          for (const repo of meta.repos)
            await invalidatePreparation(
              options.paths,
              path.join(entry.workDir, repo.path),
            );
          await rm(dir, { recursive: true, force: true });
          removed += 1;
        } catch (error) {
          options.log?.(
            `workspaces: artifact cleanup failed for ${dir}: ${String(error)}`,
          );
        }
      }
      if (removed === safe.length)
        await writeWorkspaceMeta(options.paths, entry.workDir, {
          ...meta,
          artifactsCleanedAt: new Date(now).toISOString(),
        }).catch((error: unknown) =>
          options.log?.(
            `workspaces: artifact cache write failed for ${entry.workDir}: ${String(error)}`,
          ),
        );
      if (removed > 0) {
        cleaned.push(entry.workDir);
        options.log?.(
          `workspaces: removed ${removed} regenerable ${removed === 1 ? 'directory' : 'directories'} from ${entry.workDir}, unused since ${entry.lastUsedAt}`,
        );
      }
    } catch (error) {
      options.log?.(
        `workspaces: artifact inspection failed; retained ${entry.workDir}: ${String(error)}`,
      );
    } finally {
      await lock.release();
    }
  }
  return cleaned;
}
