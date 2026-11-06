// Host-side Git in an agent's checkout. The checkout's configuration is the agent's and applies; every call here
// overrides the settings below (hooks, fsmonitor, credentials, remote URL, protocols), and only redirected metadata,
// which would make host Git read another repository, is refused.
import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

import {
  CheckoutError,
  git,
  gitAuthEnv,
  type GitAuth,
  type GitInvocationOptions,
} from './git.ts';
import { isInside } from '../lib/paths.ts';
import { GIT_LOW_SPEED_CONFIG } from './git-retry.ts';

export interface TaskGitContext {
  readonly dir: string;
  readonly cache: string;
  readonly url: string;
}

export interface TaskGitOptions extends GitInvocationOptions {
  /** Run credentials replace every host helper; rejection must not fall back to machine credentials. */
  readonly auth?: GitAuth;
}

/** Git in the runner's cache, with the same overrides as `taskGit`. */
export async function cacheGit(
  cache: string,
  url: string,
  args: string[],
  env: Record<string, string> = {},
  options: GitInvocationOptions = {},
): Promise<string> {
  const helper =
    Object.keys(env).length === 0
      ? await git(
          ['config', '--global', '--get-urlmatch', 'credential.helper', url],
          path.dirname(cache),
        ).catch(() => '')
      : '';
  return git(
    [
      '-c',
      `core.hooksPath=${path.join(cache, 'hooks')}`,
      '-c',
      'core.fsmonitor=false',
      '-c',
      'core.sshCommand=ssh',
      '-c',
      'credential.helper=',
      ...(helper
        ? ['--config-env=credential.helper=NOCOBASE_RUNNER_CACHE_HELPER']
        : []),
      ...args,
    ],
    cache,
    { ...env, NOCOBASE_RUNNER_CACHE_HELPER: helper },
    options,
  );
}

async function regularFile(file: string): Promise<boolean> {
  const info = await lstat(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (info === undefined) return false;
  if (!info.isFile())
    throw new CheckoutError(`${file}: expected a regular Git metadata file`);
  return true;
}

/** Locate metadata without consulting agent-controlled Git configuration. */
export async function taskGitDir(context: TaskGitContext): Promise<string> {
  const dotGit = path.join(context.dir, '.git');
  const info = await lstat(dotGit);
  if (info.isDirectory()) {
    if ((await realpath(dotGit)) !== dotGit)
      throw new CheckoutError(`${dotGit}: redirected Git directory`);
    if (await lstat(path.join(dotGit, 'commondir')).catch(() => undefined))
      throw new CheckoutError(`${dotGit}: unexpected common Git directory`);
    return dotGit;
  }
  if (!info.isFile())
    throw new CheckoutError(`${dotGit}: invalid Git directory`);
  const match = /^gitdir: (.+)\s*$/u.exec(await readFile(dotGit, 'utf8'));
  const gitDir = path.resolve(context.dir, match?.[1]?.trim() ?? '');
  if (
    !isInside(path.join(context.cache, 'worktrees'), gitDir) ||
    (await realpath(gitDir)) !== gitDir
  )
    throw new CheckoutError(
      `${dotGit}: Git directory is outside the task's cache`,
    );
  const common = (
    await readFile(path.join(gitDir, 'commondir'), 'utf8')
  ).trim();
  if (path.resolve(gitDir, common) !== context.cache)
    throw new CheckoutError(`${dotGit}: redirected common Git directory`);
  const backlink = (await readFile(path.join(gitDir, 'gitdir'), 'utf8')).trim();
  if (path.resolve(gitDir, backlink) !== dotGit)
    throw new CheckoutError(
      `${dotGit}: Git metadata belongs to another checkout`,
    );
  return gitDir;
}

/** Refuses redirected submodule metadata: submodule commands launch child Git processes in it. */
async function checkMetadata(
  dir: string,
  context: TaskGitContext,
): Promise<void> {
  // core.worktree is the one setting that moves host Git to another directory.
  // A linked worktree's plain `git config` writes the cache's common config, so it is read too.
  for (const config of [
    ...(dir === path.join(context.dir, '.git')
      ? []
      : [path.join(context.cache, 'config')]),
    path.join(dir, 'config'),
    path.join(dir, 'config.worktree'),
  ]) {
    if (!(await regularFile(config))) continue;
    const worktree = await git(
      ['config', '--file', config, '--no-includes', '--get', 'core.worktree'],
      context.cache,
    ).catch(() => '');
    if (
      worktree !== '' &&
      !isInside(context.dir, path.resolve(path.dirname(config), worktree))
    )
      throw new CheckoutError(`${config}: redirected Git worktree`);
  }
  const modules = path.join(dir, 'modules');
  const walk = async (current: string): Promise<void> => {
    const info = await lstat(current).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (info === undefined) return;
    if (!info.isDirectory())
      throw new CheckoutError(`${current}: redirected submodule metadata`);
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.name === 'commondir')
        throw new CheckoutError(`${file}: redirected submodule configuration`);
      else if (
        !['objects', 'refs', 'logs', 'hooks'].includes(entry.name) &&
        entry.isDirectory()
      )
        await walk(file);
      else if (entry.isSymbolicLink())
        throw new CheckoutError(`${file}: redirected submodule metadata`);
    }
  };
  await walk(modules);
  // An agent can also replace a submodule's .git pointer, bypassing the modules/ directory checked above.
  const checkWorktree = async (worktree: string): Promise<void> => {
    const manifest = path.join(worktree, '.gitmodules');
    if (!(await regularFile(manifest))) return;
    const entries = await git(
      ['config', '--file', manifest, '--no-includes', '--null', '--list'],
      context.cache,
    );
    for (const entry of entries.split('\0')) {
      const [key] = entry.split('\n', 1);
      if (key === undefined || key === '') continue;
      if (!/^submodule\..+\.path$/u.test(key)) continue;
      const child = path.resolve(worktree, entry.slice(key.length + 1));
      if (child === worktree || !isInside(worktree, child))
        throw new CheckoutError(
          `${manifest}: submodule path is outside its worktree`,
        );
      const info = await lstat(child).catch(() => undefined);
      if (info === undefined) continue;
      if (!info.isDirectory() || (await realpath(child)) !== child)
        throw new CheckoutError(`${child}: redirected submodule worktree`);
      const pointer = path.join(child, '.git');
      if (!(await regularFile(pointer))) continue;
      const match = /^gitdir: (.+)\s*$/u.exec(await readFile(pointer, 'utf8'));
      const target = path.resolve(child, match?.[1]?.trim() ?? '');
      if (!isInside(modules, target) || (await realpath(target)) !== target)
        throw new CheckoutError(
          `${pointer}: redirected submodule Git directory`,
        );
      await checkWorktree(child);
    }
  };
  await checkWorktree(context.dir);
}

/** Every host-side command in a task checkout uses this boundary, including non-network commands and resume. */
export async function taskGit(
  context: TaskGitContext,
  args: string[],
  env: Record<string, string> = {},
  options: TaskGitOptions = {},
): Promise<string> {
  const gitDir = await taskGitDir(context);
  await checkMetadata(gitDir, context);
  // The cache is runner-owned. Retain its host helper only when this invocation has no run credential.
  // --get-urlmatch returns only the last matching helper if the host config contains several.
  const trustedHelpers =
    options.auth === undefined
      ? await git(
          [
            'config',
            '--global',
            '--get-urlmatch',
            'credential.helper',
            context.url,
          ],
          path.dirname(context.cache),
        ).catch(() => '')
      : '';
  const fileTransport = await git(
    ['config', '--global', '--get', 'protocol.file.allow'],
    path.dirname(context.cache),
  ).catch(() => 'user');
  const settings = [
    `core.hooksPath=${path.join(context.cache, 'hooks')}`,
    'core.fsmonitor=false',
    'core.sshCommand=ssh',
    'credential.helper=',
    // Submodule children have their own origin; do not replace it with the superproject's URL.
    ...(args[0] === 'submodule' ? [] : [`remote.origin.url=${context.url}`]),
    `remote.origin.pushurl=${context.url}`,
    'submodule.recurse=false',
    'protocol.allow=never',
    'protocol.https.allow=always',
    'protocol.http.allow=always',
    'protocol.ssh.allow=always',
    'protocol.git.allow=always',
    `protocol.file.allow=${fileTransport}`,
    'protocol.ext.allow=never',
    'gc.auto=0',
    'maintenance.auto=false',
  ];
  const helperEnv: Record<string, string> = {};
  const helperArgs = trustedHelpers
    .split('\n')
    .filter((helper) => helper !== '')
    .map((helper, index) => {
      // A host helper can itself contain sensitive arguments; never copy its value onto the command line or logs.
      const name = `NOCOBASE_RUNNER_HOST_GIT_HELPER_${index}`;
      helperEnv[name] = helper;
      return `--config-env=credential.helper=${name}`;
    });
  // Shared workspaces may have an Agent committing: host status must not refresh or lock the index.
  return git(
    settings
      .flatMap((value) => ['-c', value])
      .concat(['--no-optional-locks'], GIT_LOW_SPEED_CONFIG, helperArgs, args),
    context.dir,
    {
      ...env,
      ...gitAuthEnv(options.auth, context.url),
      ...helperEnv,
    },
    options,
  );
}

export async function taskGitOk(
  context: TaskGitContext,
  args: string[],
): Promise<boolean> {
  // Do not turn a rejected configuration into "branch does not exist" and then modify the checkout.
  const gitDir = await taskGitDir(context);
  await checkMetadata(gitDir, context);
  try {
    await taskGit(context, args);
    return true;
  } catch (error) {
    if (!(error instanceof CheckoutError) || !error.message.startsWith('git '))
      throw error;
    return false;
  }
}
