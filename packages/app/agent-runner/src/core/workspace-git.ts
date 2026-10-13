// Fresh remote evidence for every saved local ref. Tracking refs and previous reports are never deletion permits.
import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import type {
  WorkspaceMeta,
  WorkspaceRepo,
  RepoAuthSource,
  WorkspaceGitCheck,
} from './checkout.ts';
import { withRepoAuth } from './checkout.ts';
import { git, gitAuthEnv } from './git.ts';
import { taskGit, taskGitDir } from './task-git.ts';
import { GIT_LOW_SPEED_CONFIG } from './git-retry.ts';

export interface SavedRef {
  readonly ref: string;
  readonly sha: string;
}

export interface GitState {
  readonly head: string;
  readonly refs: readonly SavedRef[];
  readonly status: string;
  readonly fingerprint: string;
}

/** This also validates metadata and configuration, without executing writable hooks. */
export async function readGitState(
  repo: WorkspaceRepo,
  dir: string,
  child?: string,
): Promise<GitState> {
  const context = { ...repo, dir };
  const prefix = child === undefined ? [] : ['-C', child];
  const run = (args: string[]) => taskGit(context, [...prefix, ...args]);
  await run(['fsck', '--connectivity-only', '--no-reflogs']);
  const index = await run(['ls-files', '-v', '-z']);
  if (index.split('\0').some((entry) => /^[a-zS] /u.test(entry)))
    throw new Error('Index flags may hide local work');
  if ((await run(['rev-parse', '--is-shallow-repository'])) !== 'false')
    throw new Error('Incomplete local history');
  const worktrees = await run(['worktree', 'list', '--porcelain']);
  if (
    worktrees
      .split('\n\n')
      .filter(
        (item) =>
          item.includes('worktree ') && !item.split('\n').includes('bare'),
      ).length !== 1
  )
    throw new Error('Additional worktrees need preservation');
  const status = await run([
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
    '--ignore-submodules=none',
  ]);
  const raw = await run([
    'for-each-ref',
    '--format=%(refname) %(objectname)',
    'refs/',
  ]);
  const refs = raw
    .split('\n')
    .filter(Boolean)
    .flatMap((line): SavedRef[] => {
      const [ref, sha] = line.split(' ');
      // Tracking refs are agent-writable. Local tags, stash and other saved refs are work too.
      return ref && sha && !ref.startsWith('refs/remotes/')
        ? [{ ref, sha }]
        : [];
    });
  const symbolic = await run(['symbolic-ref', '--quiet', 'HEAD']).catch(
    () => '',
  );
  let head: string;
  try {
    head = await run(['rev-parse', '--verify', 'HEAD']);
  } catch (error) {
    // An unborn symbolic branch with no refs is a valid empty repository. Other read failures are not.
    if (refs.length > 0 || !symbolic.startsWith('refs/heads/')) throw error;
    head = '';
  }
  if (head) refs.push({ ref: 'HEAD', sha: head });
  return {
    head: symbolic || head,
    refs,
    status,
    fingerprint: createHash('sha256')
      .update(JSON.stringify({ raw, head, symbolic, status, worktrees }))
      .digest('hex'),
  };
}

/** Fetch into a new runner-owned bare repository, with no host credential fallback or writable tracking refs. */
export async function provenRefs(
  repo: WorkspaceRepo,
  dir: string,
  state: GitState,
  auth?: RepoAuthSource,
  child?: { path: string; url: string },
): Promise<ReadonlySet<string>> {
  const url = child?.url ?? repo.url;
  if (!/^(https?:\/\/|file:\/\/|\/)/u.test(url))
    throw new Error('Remote evidence needs authorized access');
  await mkdir(path.dirname(repo.cache), { recursive: true, mode: 0o700 });
  const evidence = await mkdtemp(
    path.join(path.dirname(repo.cache), 'evidence-'),
  );
  try {
    await git(['init', '--bare', '--quiet', evidence]);
    // Borrow protected objects, never cache refs as evidence. Submodules have a separate remote identity.
    if (
      child === undefined &&
      (await lstat(path.join(repo.cache, 'objects')).catch(() => undefined))
    )
      await writeFile(
        path.join(evidence, 'objects/info/alternates'),
        `${path.join(repo.cache, 'objects')}\n`,
      );
    await withRepoAuth(auth, url, (credential) =>
      git(
        [
          '-c',
          'credential.helper=',
          '-c',
          'core.hooksPath=/dev/null',
          ...GIT_LOW_SPEED_CONFIG,
          'fetch',
          '--quiet',
          '--prune',
          '--no-tags',
          '--',
          url,
          '+refs/heads/*:refs/remotes/evidence/*',
        ],
        evidence,
        {
          GIT_CONFIG_NOSYSTEM: '1',
          GIT_CONFIG_GLOBAL: '/dev/null',
          GIT_CONFIG_COUNT: '1',
          GIT_CONFIG_KEY_0: 'credential.helper',
          GIT_CONFIG_VALUE_0: '',
          ...gitAuthEnv(credential, url),
        },
      ),
    );
    if (
      (await git(['rev-parse', '--is-shallow-repository'], evidence)) !==
      'false'
    )
      throw new Error('Incomplete remote history');
    const candidates = (
      await git(
        ['for-each-ref', '--format=%(objectname)', 'refs/remotes/evidence/'],
        evidence,
      )
    )
      .split('\n')
      .filter(Boolean);
    const context = { ...repo, dir };
    const source = await taskGit(context, [
      ...(child ? ['-C', child.path] : []),
      'rev-parse',
      '--absolute-git-dir',
    ]);
    const tips = [...new Set(state.refs.map((ref) => ref.sha))];
    if (tips.length > 0)
      await git(
        [
          '-c',
          'protocol.file.allow=always',
          '-c',
          'core.hooksPath=/dev/null',
          'fetch',
          '--quiet',
          '--no-tags',
          '--',
          source,
          ...tips.map((sha, index) => `${sha}:refs/local/${index}`),
        ],
        evidence,
        { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' },
      );
    await git(['fsck', '--full', '--no-reflogs'], evidence);
    const proven = new Set<string>();
    for (const tip of tips) {
      // An annotated tag or blob holds content beyond the peeled commit. Remote branch history cannot prove it saved.
      if ((await git(['cat-file', '-t', tip], evidence)) !== 'commit') continue;
      for (const candidate of candidates) {
        // rev-list fails for missing/corrupt objects; an empty difference proves reachability in remote history.
        if (
          (await git(
            ['rev-list', '--max-count=1', tip, '--not', candidate],
            evidence,
          )) === ''
        ) {
          proven.add(tip);
          break;
        }
      }
    }
    return proven;
  } finally {
    await rm(evidence, { recursive: true, force: true });
  }
}

/** Unknown Git directories anywhere inside the workspace cannot disappear with its parent. */
async function checkLayout(
  workDir: string,
  meta: Pick<WorkspaceMeta, 'repos'>,
): Promise<void> {
  const expected = new Set(
    meta.repos.flatMap((repo) => [
      path.resolve(workDir, repo.path),
      ...(repo.submodules ?? []).map((child) =>
        path.resolve(workDir, repo.path, child.path),
      ),
    ]),
  );
  const seen = new Set<string>();
  for (const repo of meta.repos) {
    const dir = path.resolve(workDir, repo.path);
    const gitDir = await taskGitDir({ ...repo, dir });
    const known = new Set<string>();
    for (const child of repo.submodules ?? []) {
      const childDir = path.resolve(dir, child.path);
      const pointer = await readFile(path.join(childDir, '.git'), 'utf8');
      const target = /^gitdir: (.+)\s*$/u.exec(pointer)?.[1]?.trim();
      if (!target) throw new Error('Invalid saved submodule pointer');
      known.add(path.resolve(childDir, target));
    }
    const modules = path.join(gitDir, 'modules');
    const walkModules = async (current: string): Promise<void> => {
      if (await lstat(path.join(current, 'HEAD')).catch(() => undefined)) {
        if (!known.has(current))
          throw new Error('Unknown saved submodule repository');
      }
      for (const item of await readdir(current, { withFileTypes: true })) {
        if (item.isSymbolicLink())
          throw new Error('Redirected submodule metadata');
        if (
          item.isDirectory() &&
          !['objects', 'refs', 'logs', 'hooks'].includes(item.name)
        )
          await walkModules(path.join(current, item.name));
      }
    };
    if (await lstat(modules).catch(() => undefined)) await walkModules(modules);
  }
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.name === '.git') {
        if (!expected.has(dir) || entry.isSymbolicLink())
          throw new Error(`Unknown Git workspace: ${dir}`);
        seen.add(dir);
      } else if (entry.isDirectory()) await walk(file);
    }
  };
  await walk(workDir);
  for (const repo of meta.repos)
    if (!seen.has(path.resolve(workDir, repo.path)))
      throw new Error(`Missing Git workspace: ${repo.path}`);
}

export async function inspectWorkspaceGit(
  workDir: string,
  meta: Pick<WorkspaceMeta, 'repos'>,
  log?: (message: string) => void,
  auth?: RepoAuthSource,
): Promise<WorkspaceGitCheck> {
  const states: {
    repo: WorkspaceRepo;
    dir: string;
    state: GitState;
    child?: { path: string; url: string };
  }[] = [];
  const result = (
    reason: WorkspaceGitCheck['reason'],
    discardsUntracked = false,
  ): WorkspaceGitCheck => ({ reason, discardsUntracked });
  try {
    await checkLayout(workDir, meta);
    for (const repo of meta.repos) {
      const dir = path.resolve(workDir, repo.path);
      const info = await lstat(dir);
      if (!info.isDirectory() || info.isSymbolicLink())
        throw new Error('Redirected workspace');
      states.push({ repo, dir, state: await readGitState(repo, dir) });
      for (const child of repo.submodules ?? []) {
        const childDir = path.resolve(dir, child.path);
        if (!(await lstat(path.join(childDir, '.git')).catch(() => undefined)))
          throw new Error('Saved submodule metadata needs preservation');
        states.push({
          repo,
          dir,
          state: await readGitState(repo, dir, childDir),
          child: { path: childDir, url: child.url },
        });
      }
    }
    for (const item of states) {
      if (item.state.status)
        return result(
          'trackedChanges',
          item.state.status.split('\n').some((line) => line.startsWith('??')),
        );
      const proven = await provenRefs(
        item.repo,
        item.dir,
        item.state,
        auth,
        item.child,
      );
      if (item.state.refs.some((ref) => !proven.has(ref.sha)))
        return result('unpushed');
    }
    // The workspace lock coordinates runners, not external Git writers. Re-enumerate before destructive action.
    await checkLayout(workDir, meta);
    for (const item of states)
      if (
        (await readGitState(item.repo, item.dir, item.child?.path))
          .fingerprint !== item.state.fingerprint
      )
        return result('changed');
    return result('allowed');
  } catch (error) {
    log?.(
      `workspaces: kept ${workDir}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return result('missingEvidence');
  }
}
