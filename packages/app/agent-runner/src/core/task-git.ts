// Host-side Git must never execute configuration or hooks supplied by an agent's writable checkout.
import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

import { CheckoutError, git } from './git.ts';
import { isInside } from '../lib/paths.ts';
import { GIT_LOW_SPEED_CONFIG } from './git-retry.ts';

export interface TaskGitContext {
  readonly dir: string;
  readonly cache: string;
  readonly url: string;
}

// Keep this list narrow: new Git configuration can introduce new ways to execute code or redirect credentials.
// Overrides below neutralize the explicitly listed executable settings. Multi-valued URL rewrites and includes
// cannot reliably be erased with -c; reject those (and unknown settings) before invoking Git in the checkout.
const SAFE_KEYS = [
  /^core\.(repositoryformatversion|filemode|bare|logallrefupdates|ignorecase|precomposeunicode|symlinks|autocrlf|safecrlf|eol|hooksPath|fsmonitor|sshCommand|sparsecheckout|sparsecheckoutcone)$/iu,
  /^user\.(name|email)$/iu,
  /^remote\.[^.]+\.(url|pushurl|fetch)$/iu,
  /^branch\..+\.(remote|merge|rebase|vscode-merge-base)$/iu,
  /^submodule\..+\.(url|active|update|branch|ignore|fetchrecursesubmodules)$/iu,
  /^submodule\.active$/iu,
  /^pull\.rebase$/iu,
  /^push\.(default|autosetupremote)$/iu,
  /^rerere\.enabled$/iu,
  /^commit\.gpgsign$/iu,
  /^credential\.helper$/iu,
  /^extensions\.objectformat$/iu,
  /^gc\.(auto|pruneexpire)$/iu,
  /^maintenance\.auto$/iu,
];

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

async function checkConfig(
  config: string,
  context: TaskGitContext,
): Promise<void> {
  if (!(await regularFile(config))) return;
  // --file + --no-includes, in the protected cache: parsing never loads checkout includes or executes its settings.
  const entries = await git(
    ['config', '--file', config, '--no-includes', '--null', '--list'],
    context.cache,
  );
  for (const entry of entries.split('\0')) {
    if (entry === '') continue;
    const key = entry.split('\n', 1)[0] ?? '';
    if (
      key.toLowerCase() === 'core.worktree' &&
      config !== path.join(context.dir, '.git', 'config')
    ) {
      const target = path.resolve(
        path.dirname(config),
        entry.slice(key.length + 1),
      );
      if (isInside(context.dir, target)) continue;
    }
    // Git copies standard update policies from .gitmodules during initialization; custom commands remain unsafe.
    const customSubmoduleUpdate =
      /^submodule\..+\.update$/iu.test(key) &&
      entry
        .slice(key.length + 1)
        .trimStart()
        .startsWith('!');
    if (
      customSubmoduleUpdate ||
      !SAFE_KEYS.some((pattern) => pattern.test(key))
    )
      throw new CheckoutError(
        `${config}: unsafe or unsupported Git configuration ${key}; remove it before resuming or pushing`,
      );
  }
}

/** Checks existing submodule configs too: submodule update launches child Git processes. */
async function checkMetadata(
  dir: string,
  context: TaskGitContext,
): Promise<void> {
  await checkConfig(path.join(dir, 'config'), context);
  if (await regularFile(path.join(dir, 'config.worktree')))
    throw new CheckoutError(
      `${dir}: per-worktree Git configuration is unsupported`,
    );
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
      if (entry.name === 'config') await checkConfig(file, context);
      else if (entry.name === 'config.worktree' || entry.name === 'commondir')
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
      if (
        !/^submodule\..+\.(path|url|branch|ignore|shallow|update|fetchrecursesubmodules)$/u.test(
          key,
        )
      )
        throw new CheckoutError(
          `${manifest}: unsupported submodule configuration ${key}`,
        );
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
): Promise<string> {
  const gitDir = await taskGitDir(context);
  await checkMetadata(gitDir, context);
  // The cache is runner-owned. Retain its host credential helper, never one supplied by the task's config.
  // --get-urlmatch returns only the last matching helper if the host config contains several.
  const trustedHelpers = await git(
    ['config', '--get-urlmatch', 'credential.helper', context.url],
    context.cache,
  ).catch(() => '');
  const fileTransport = await git(
    ['config', '--get', 'protocol.file.allow'],
    context.cache,
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
  return git(
    settings
      .flatMap((value) => ['-c', value])
      .concat(GIT_LOW_SPEED_CONFIG, helperArgs, args),
    context.dir,
    { ...env, ...helperEnv },
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
