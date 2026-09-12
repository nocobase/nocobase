/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { commandOutput, resolveProjectCwd, run, runNocoBaseCommand } from './run-npm.js';
import { DEFAULT_SOURCE_REGISTRY_PORT, parseSourceRegistryUrl, resolveSourceRegistryInfo } from './source-registry.js';

export type SourcePublishResult = {
  version: string;
  npmRegistry: string;
  gitSha: string;
  projectRoot: string;
};

type SourcePublishStash = {
  commit: string;
};

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function sanitizeEnvSegment(value: string): string {
  return trimValue(value).replace(/[^A-Za-z0-9]+/g, '').slice(0, 16);
}

function normalizeSnapshotBaseVersion(baseVersion: string): string {
  return trimValue(baseVersion).replace(/(?:-snapshot\.\d{8}\.[A-Za-z0-9]+)+$/, '');
}

export async function resolveSourcePublishRegistry(explicitRegistry?: string): Promise<string> {
  const normalized = trimValue(explicitRegistry);
  if (normalized) {
    return normalized;
  }

  const info = await resolveSourceRegistryInfo();
  if (info.status === 'running') {
    return info.url;
  }

  throw new Error(
    [
      'No npm registry was provided for source publish.',
      'Start the local source registry with `nb source registry start`, or pass `--npm-registry <url>` explicitly.',
    ].join('\n'),
  );
}

export async function resolveGitSha(cwd?: string): Promise<string> {
  return await commandOutput('git', ['rev-parse', '--short', 'HEAD'], {
    cwd,
    errorName: 'git rev-parse',
  });
}

export async function readRootVersion(cwd?: string): Promise<string> {
  const root = resolveProjectCwd(cwd);
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(path.join(root, 'lerna.json'), 'utf8');
  const parsed = JSON.parse(content) as { version?: string };
  const version = trimValue(parsed.version);
  if (!version) {
    throw new Error(`Couldn't read a version from ${path.join(root, 'lerna.json')}.`);
  }
  return version;
}

export function buildSnapshotVersion(baseVersion: string, gitSha: string, now = new Date()): string {
  const yyyy = String(now.getFullYear()).padStart(4, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${normalizeSnapshotBaseVersion(baseVersion)}-snapshot.${yyyy}${mm}${dd}.${gitSha}`;
}

export async function resolveGitBranch(cwd?: string): Promise<string> {
  const branch = trimValue(await commandOutput('git', ['branch', '--show-current'], {
    cwd,
    errorName: 'git branch --show-current',
  }));
  if (!branch) {
    throw new Error('`nb source publish --snapshot` requires a named Git branch. Detached HEAD is not supported.');
  }
  const branchRef = `refs/heads/${branch}`;
  try {
    await commandOutput('git', ['rev-parse', '--verify', branchRef], {
      cwd,
      errorName: `git rev-parse --verify ${branchRef}`,
    });
  } catch (error) {
    throw new Error(
      [
        `The current Git branch reference is invalid: ${branch}.`,
        'This usually means a previous source publish cleanup left HEAD pointing at a missing temporary branch.',
        'Switch to a real local branch, then run `nb source publish --snapshot` again.',
      ].join('\n'),
      { cause: error },
    );
  }
  return branch;
}

export async function hasLocalGitChanges(cwd?: string): Promise<boolean> {
  const output = await commandOutput('git', ['status', '--short', '--untracked-files=all'], {
    cwd,
    errorName: 'git status',
  });
  return trimValue(output).length > 0;
}

export function buildSourcePublishBranchName(gitSha: string, now = new Date()): string {
  const yyyy = String(now.getFullYear()).padStart(4, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `nb/source-publish-${yyyy}${mm}${dd}${hh}${mi}${ss}-${gitSha}`;
}

async function runGit(
  args: string[],
  options?: { cwd?: string; stdio?: 'inherit' | 'pipe' | 'ignore'; env?: Record<string, string>; errorName?: string },
): Promise<void> {
  await run('git', args, {
    cwd: options?.cwd,
    stdio: options?.stdio,
    env: options?.env,
    errorName: options?.errorName ?? `git ${args.join(' ')}`,
  });
}

async function commitSourceSnapshotVersion(params: {
  cwd: string;
  version: string;
  stdio: 'inherit' | 'ignore';
}): Promise<void> {
  await runGit(['add', '-A'], {
    cwd: params.cwd,
    stdio: params.stdio,
    errorName: 'git add',
  });
  await runGit(['commit', '--no-verify', '-m', `chore(source-publish): ${params.version}`], {
    cwd: params.cwd,
    stdio: params.stdio,
    errorName: 'git commit',
  });
}

async function buildSourceSnapshot(params: {
  cwd: string;
  buildDts: boolean;
  stdio: 'inherit' | 'ignore';
}): Promise<void> {
  const args = ['build'];
  if (!params.buildDts) {
    args.push('--no-dts');
  }

  await runNocoBaseCommand(args, {
    cwd: params.cwd,
    stdio: params.stdio,
  });
}

async function createSourcePublishStash(params: {
  cwd: string;
  label: string;
  stdio: 'inherit' | 'ignore';
}): Promise<SourcePublishStash | undefined> {
  if (!(await hasLocalGitChanges(params.cwd))) {
    return undefined;
  }

  await runGit(['stash', 'push', '-u', '-m', params.label], {
    cwd: params.cwd,
    stdio: params.stdio,
    errorName: 'git stash push',
  });
  return {
    commit: trimValue(await commandOutput('git', ['rev-parse', '--verify', 'refs/stash'], {
      cwd: params.cwd,
      errorName: 'git rev-parse refs/stash',
    })),
  };
}

async function resolveSourcePublishStashReference(params: {
  cwd: string;
  stash: SourcePublishStash;
}): Promise<string> {
  const output = trimValue(await commandOutput('git', ['stash', 'list', '--format=%gd%x00%H'], {
    cwd: params.cwd,
    errorName: 'git stash list',
  }));
  for (const line of output.split('\n')) {
    const [reference, commit] = line.split('\x00');
    if (trimValue(commit) === params.stash.commit) {
      return trimValue(reference);
    }
  }

  throw new Error(`Couldn't locate the saved stash for source publish: ${params.stash.commit}`);
}

function buildSourcePublishRecoveryError(params: {
  originalError: unknown;
  cleanupError: unknown;
  stash?: SourcePublishStash;
  temporaryBranch: string;
  projectRoot: string;
}): Error {
  const originalMessage = params.originalError instanceof Error
    ? params.originalError.message
    : String(params.originalError);
  const cleanupMessage = params.cleanupError instanceof Error
    ? params.cleanupError.message
    : String(params.cleanupError);
  const recoveryHints = [
    `Project root: ${params.projectRoot}`,
    `Temporary branch: ${params.temporaryBranch}`,
  ];
  if (params.stash) {
    recoveryHints.push(`Saved stash commit: ${params.stash.commit}`);
  }
  return new Error([
    originalMessage,
    '',
    'Cleanup also failed after the publish attempt.',
    `Cleanup error: ${cleanupMessage}`,
    ...recoveryHints,
  ].join('\n'));
}

export async function publishSourceSnapshot(params: {
  cwd?: string;
  npmRegistry?: string;
  build?: boolean;
  buildDts?: boolean;
  verbose?: boolean;
  now?: Date;
}): Promise<SourcePublishResult> {
  const projectRoot = resolveProjectCwd(params.cwd);
  const npmRegistry = await resolveSourcePublishRegistry(params.npmRegistry);
  const originalBranch = await resolveGitBranch(projectRoot);
  const gitSha = trimValue(await resolveGitSha(projectRoot));
  const baseVersion = await readRootVersion(projectRoot);
  const version = buildSnapshotVersion(baseVersion, gitSha, params.now);
  const temporaryBranch = buildSourcePublishBranchName(gitSha, params.now);
  const stdio = params.verbose ? 'inherit' : 'ignore';
  const shouldBuild = params.build !== false;
  const shouldBuildDts = params.buildDts !== false;
  let stash: SourcePublishStash | undefined;
  let onTemporaryBranch = false;
  let branchCreated = false;
  let publishError: unknown;
  let result: SourcePublishResult | undefined;

  try {
    stash = await createSourcePublishStash({
      cwd: projectRoot,
      label: temporaryBranch,
      stdio,
    });
    await runGit(['switch', '-c', temporaryBranch], {
      cwd: projectRoot,
      stdio,
      errorName: 'git switch',
    });
    branchCreated = true;
    onTemporaryBranch = true;
    if (stash) {
      await runGit(['stash', 'apply', '--index', await resolveSourcePublishStashReference({
        cwd: projectRoot,
        stash,
      })], {
        cwd: projectRoot,
        stdio,
        errorName: 'git stash apply',
      });
    }
    if (shouldBuild) {
      await buildSourceSnapshot({
        cwd: projectRoot,
        buildDts: shouldBuildDts,
        stdio,
      });
    }
    await run('yarn', ['lerna', 'version', version, '--force-publish=*', '--no-git-tag-version', '-y'], {
      cwd: projectRoot,
      errorName: 'lerna version',
      stdio,
    });
    await commitSourceSnapshotVersion({
      cwd: projectRoot,
      version,
      stdio,
    });
    await run('yarn', ['lerna', 'publish', 'from-package', '--registry', npmRegistry, '--dist-tag', 'local', '--yes', '--no-verify-access', '--no-git-reset', '--git-head', gitSha], {
      cwd: projectRoot,
      errorName: 'lerna publish',
      stdio,
      env: {
        npm_config_registry: npmRegistry,
      },
    });
    result = {
      version,
      npmRegistry,
      gitSha,
      projectRoot,
    };
  } catch (error) {
    publishError = error;
  }

  try {
    if (onTemporaryBranch) {
      await runGit(['reset', '--hard', 'HEAD'], {
        cwd: projectRoot,
        stdio,
        errorName: 'git reset --hard',
      });
      await runGit(['clean', '-fd'], {
        cwd: projectRoot,
        stdio,
        errorName: 'git clean -fd',
      });
      await runGit(['switch', originalBranch], {
        cwd: projectRoot,
        stdio,
        errorName: 'git switch',
      });
      onTemporaryBranch = false;
    }

    if (stash) {
      await runGit(['stash', 'pop', '--index', await resolveSourcePublishStashReference({
        cwd: projectRoot,
        stash,
      })], {
        cwd: projectRoot,
        stdio,
        errorName: 'git stash pop',
      });
      stash = undefined;
    }

    if (branchCreated) {
      await runGit(['branch', '-D', temporaryBranch], {
        cwd: projectRoot,
        stdio,
        errorName: 'git branch -D',
      });
    }
  } catch (cleanupError) {
    if (publishError) {
      throw buildSourcePublishRecoveryError({
        originalError: publishError,
        cleanupError,
        stash,
        temporaryBranch,
        projectRoot,
      });
    }
    throw new Error([
      'The source snapshot was published, but local Git cleanup failed afterwards.',
      `Cleanup error: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
      `Project root: ${projectRoot}`,
      `Temporary branch: ${temporaryBranch}`,
      ...(stash ? [`Saved stash commit: ${stash.commit}`] : []),
    ].join('\n'));
  }

  if (publishError) {
    throw publishError;
  }

  if (!result) {
    throw new Error('Source snapshot publishing finished without a result.');
  }

  return result;
}

export function buildSuggestedInitCommand(result: Pick<SourcePublishResult, 'version' | 'npmRegistry' | 'gitSha'>): string {
  const { host, port } = parseSourceRegistryUrl(result.npmRegistry);
  const normalizedRegistry = result.npmRegistry || `http://${host}:${port || DEFAULT_SOURCE_REGISTRY_PORT}`;
  const suggestedEnv = ['snapshot', sanitizeEnvSegment(result.gitSha)].filter(Boolean).join('');
  return [
    `nb init --env ${suggestedEnv} --yes --source npm`,
    `--version ${result.version}`,
    `--npm-registry=${normalizedRegistry}`,
  ].join(' ');
}
