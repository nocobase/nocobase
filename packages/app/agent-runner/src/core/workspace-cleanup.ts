// The workspace lock is held throughout. A durable intent survives every interrupted deletion phase.
import { lstat, readdir, readFile, rm, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { safeName, type RunnerPaths } from '../lib/home.ts';
import { isInside } from '../lib/paths.ts';
import {
  CheckoutError,
  git,
  lockCache,
  writeWorkspaceMeta,
  workspaceRecordPath,
  type WorkspaceMeta,
} from './checkout.ts';
import { runBranch, updateContinuationState } from './run-worktrees.ts';

/** Only the complete historical layout is reserved; explicit writable identity takes precedence. */
export function legacyReadOnlyKey(
  paths: RunnerPaths,
  workDir: string,
): string | undefined {
  const relative = path.relative(paths.workRoot, workDir).split(path.sep);
  if (relative.length !== 2 || relative.some((part) => part.startsWith('.')))
    return undefined;
  const match =
    /^(.+)\.readonly-(?:runner-(?:codex|claude|opencode|pi)-[a-f0-9]{20}|[0-9]{15,20})$/u.exec(
      relative[1],
    );
  return match?.[1];
}

export function isReadOnlyWorkspace(
  paths: RunnerPaths,
  workDir: string,
  meta: WorkspaceMeta,
): boolean {
  if (meta.readOnly !== undefined) return meta.readOnly;
  const key = legacyReadOnlyKey(paths, workDir);
  return (
    key !== undefined &&
    (meta.subjectKey === key || meta.subjectKey === path.basename(workDir)) &&
    (meta.appKey === undefined ||
      safeName(meta.appKey) === path.basename(path.dirname(workDir)))
  );
}

export function cleanupRegistrationPath(
  cache: string,
  workDir: string,
  name: string,
): string {
  return path.join(
    cache,
    'runner-workspace-cleanup',
    createHash('sha256').update(path.resolve(workDir)).digest('hex'),
    name,
  );
}

/** Remove only metadata with a backlink to this checkout; never globally prune a shared cache. */
export async function unregisterCheckout(
  cache: string,
  dir: string,
): Promise<void> {
  const entries = await readdir(path.join(cache, 'worktrees'), {
    withFileTypes: true,
  }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const registration = path.join(cache, 'worktrees', entry.name);
    const backlink = await readFile(
      path.join(registration, 'gitdir'),
      'utf8',
    ).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return '';
      throw error;
    });
    if (path.resolve(backlink.trim()) === path.join(path.resolve(dir), '.git'))
      await rm(registration, { recursive: true, force: true });
  }
}

/** Caller has confirmed writers stopped and, for writable worktrees, saved every head. */
export async function cleanupWorkspace(
  paths: RunnerPaths,
  workDir: string,
  meta: WorkspaceMeta,
  log?: (message: string) => void,
  options: { preserveRoot?: boolean } = {},
): Promise<void> {
  if (
    !isInside(paths.workRoot, workDir) ||
    path.relative(paths.workRoot, workDir).split(path.sep).length !== 2
  )
    throw new CheckoutError('Invalid workspace cleanup path');
  const info = await lstat(workDir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (info?.isSymbolicLink())
    throw new CheckoutError('Workspace cleanup refuses symbolic links');
  const parent = await lstat(path.dirname(workDir)).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    },
  );
  if (parent?.isSymbolicLink())
    throw new CheckoutError(
      'Workspace cleanup refuses symbolic application directories',
    );
  for (const repo of meta.repos) {
    if (
      !isInside(workDir, path.resolve(workDir, repo.path)) ||
      path.resolve(workDir, repo.path) === path.resolve(workDir) ||
      (repo.localBranch !== undefined &&
        repo.localBranch !== runBranch(workDir, repo.path))
    )
      throw new CheckoutError(
        'Workspace cleanup ownership does not match its record',
      );
  }
  const pending: WorkspaceMeta = {
    ...meta,
    cleanupPending: true,
    writersStopped: true,
  };
  await writeWorkspaceMeta(paths, workDir, pending);
  const phase = async (stage: NonNullable<WorkspaceMeta['cleanupStage']>) => {
    pending.cleanupStage = stage;
    await writeWorkspaceMeta(paths, workDir, pending);
    log?.(`workspace cleanup: ${workDir}: ${stage}`);
  };
  try {
    const caches = new Set([
      ...pending.repos.map((repo) => repo.cache),
      ...(pending.cleanupRegistrations ?? []).map((record) => record.cache),
    ]);
    if (
      legacyReadOnlyKey(paths, workDir) !== undefined &&
      pending.repos.length === 0
    )
      for (const name of await readdir(paths.reposDir).catch(
        () => [] as string[],
      ))
        if (/^[a-f0-9]{40}\.git$/u.test(name))
          caches.add(path.join(paths.reposDir, name));
    for (const cache of caches) {
      const lock = await lockCache(cache);
      try {
        const names = new Set(
          pending.cleanupRegistrations?.find((record) => record.cache === cache)
            ?.names ?? [],
        );
        for (const entry of await readdir(path.join(cache, 'worktrees'), {
          withFileTypes: true,
        }).catch((error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return [];
          throw error;
        })) {
          if (!entry.isDirectory()) continue;
          const backlink = await readFile(
            path.join(cache, 'worktrees', entry.name, 'gitdir'),
            'utf8',
          ).catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return '';
            throw error;
          });
          if (
            backlink !== '' &&
            isInside(workDir, path.resolve(backlink.trim()))
          )
            names.add(entry.name);
        }
        pending.cleanupRegistrations = [
          ...(pending.cleanupRegistrations ?? []).filter(
            (record) => record.cache !== cache,
          ),
          { cache, names: [...names] },
        ];
        await writeWorkspaceMeta(paths, workDir, pending);
        for (const repo of pending.repos.filter(
          (repo) => repo.cache === cache,
        )) {
          await phase('files');
          const dir = path.resolve(workDir, repo.path);
          if (!isInside(workDir, dir) || dir === path.resolve(workDir))
            throw new CheckoutError('Invalid checkout cleanup path');
          for (
            let parent = path.dirname(dir);
            parent !== path.dirname(workDir);
            parent = path.dirname(parent)
          ) {
            const info = await lstat(parent).catch(
              (error: NodeJS.ErrnoException) => {
                if (error.code === 'ENOENT') return undefined;
                throw error;
              },
            );
            if (info?.isSymbolicLink())
              throw new CheckoutError(
                'Checkout cleanup refuses symbolic parents',
              );
          }
          await rm(dir, { recursive: true, force: true });
          if (repo.localBranch !== undefined && existsSync(repo.cache)) {
            if (repo.localBranch !== runBranch(workDir, repo.path))
              throw new CheckoutError('Run branch cleanup identity mismatch');
            await git(
              ['update-ref', '-d', `refs/heads/${repo.localBranch}`],
              repo.cache,
            );
          }
        }
        await phase('registration');
        for (const name of names) {
          const source = path.join(cache, 'worktrees', name);
          const quarantine = cleanupRegistrationPath(cache, workDir, name);
          const backlink = await readFile(
            path.join(source, 'gitdir'),
            'utf8',
          ).catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return '';
            throw error;
          });
          // Git can reuse the old registration name after a restart. Only the original backlink may be moved.
          if (
            backlink !== '' &&
            isInside(workDir, path.resolve(backlink.trim()))
          ) {
            await mkdir(path.dirname(quarantine), {
              recursive: true,
              mode: 0o700,
            });
            await rename(source, quarantine);
          }
          await rm(quarantine, {
            recursive: true,
            force: true,
          });
        }
        if (names.size > 0)
          await rm(
            path.dirname(
              cleanupRegistrationPath(cache, workDir, [...names][0]),
            ),
            { recursive: true, force: true },
          );
      } finally {
        await lock.release();
      }
    }
    await phase('files');
    if (options.preserveRoot !== true)
      await rm(workDir, { recursive: true, force: true });
    // Cache locks have all been released before acquiring the continuation directory lock.
    await phase('continuation');
    if (
      options.preserveRoot !== true &&
      (pending.runAttempt === true || pending.runWorktrees === true) &&
      pending.appKey !== undefined
    )
      await updateContinuationState(
        paths,
        pending.appKey,
        pending.subjectKey,
        (state) => ({
          ...state,
          activeWorkDirs: (state.activeWorkDirs ?? []).filter(
            (dir) => dir !== workDir,
          ),
        }),
      );
    await phase('record');
    await rm(workspaceRecordPath(paths, workDir), { force: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    pending.cleanupError = reason;
    await writeWorkspaceMeta(paths, workDir, pending).catch(() => undefined);
    log?.(
      `workspace cleanup pending: ${workDir}: ${pending.cleanupStage ?? 'intent'}: ${reason}`,
    );
    throw error;
  }
}
