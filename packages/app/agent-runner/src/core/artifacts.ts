// Regenerable build artifacts in working directories that sit unused.
//
// A working directory whose work goes on stays, but what an install or a build regenerates (`node_modules`, `.next`,
// `.turbo` by default, `RunnerSettings.artifactPatterns`) is removed from it once no run has used it for
// `RunnerSettings.artifactTtlMs` (12 hours by default; 0 turns it off). The checkout itself, its commits and changes,
// stay. Every directory with one of those names anywhere inside it goes, without following symbolic links: a link is
// never entered nor removed. A directory a run holds is never touched: the pass takes the directory's lock, and a run
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

export interface ArtifactOptions {
  readonly paths: RunnerPaths;
  /** How long unused before the artifacts go; 0 for never. */
  readonly ttlMs: number;
  readonly patterns: readonly string[];
  readonly now?: number;
  readonly log?: (message: string) => void;
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
  if (options.ttlMs <= 0 || options.patterns.length === 0) return [];
  const now = options.now ?? Date.now();
  const cleaned: string[] = [];
  for (const entry of entries) {
    if (entry.inUse) continue;
    const usedAt = Date.parse(entry.lastUsedAt);
    if (!Number.isFinite(usedAt) || now - usedAt < options.ttlMs) continue;
    let lock: Lock;
    try {
      lock = await acquireLock(`${entry.workDir}.lock`, { timeoutMs: 0 });
    } catch {
      continue;
    }
    try {
      const meta = await readWorkspaceMeta(options.paths, entry.workDir);
      // A run used it since it was read, or it was cleaned since it was last used.
      if (
        meta === undefined ||
        meta.lastUsedAt !== entry.lastUsedAt ||
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
      for (const dir of found) await rm(dir, { recursive: true, force: true });
      await writeWorkspaceMeta(options.paths, entry.workDir, {
        ...meta,
        artifactsCleanedAt: new Date(now).toISOString(),
      });
      if (found.length > 0) {
        cleaned.push(entry.workDir);
        options.log?.(
          `workspaces: removed ${found.length} regenerable ${found.length === 1 ? 'directory' : 'directories'} from ${entry.workDir}, unused since ${entry.lastUsedAt}`,
        );
      }
    } finally {
      await lock.release();
    }
  }
  return cleaned;
}
