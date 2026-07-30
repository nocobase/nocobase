/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdir, mkdtemp, readdir, rename, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as tar from 'tar';
import { executeApiRequest, type RequestOperation } from './api-client.js';
import { translateCli } from './cli-locale.js';
import {
  buildPortalConfig,
  buildPortalConfigFromOptions,
  DEFAULT_PORTAL_GIT_PATH,
  readPortalConfig,
  syncPortalConfigToRemote,
  writePortalConfig,
  type PortalConfig,
} from './portal-config.js';
import { buildPortalCommandEnv } from './portal-command-env.js';
import {
  buildPortalBasePath,
  resolvePortalAppFromApiBaseUrl,
  resolvePortalStoragePath,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';
import { listPortalWorkspaces } from './portal-list.js';
import { findPortalListItem } from './portal-info.js';
import { run, runPnpmCommand, type RunCommand } from './run-npm.js';

type ApiRequest = typeof executeApiRequest;
const execFileAsync = promisify(execFile);

type PortalSourceContext = {
  app: string;
  portal: string;
  portalDir: string;
  portalBase: string;
  mode: 'local' | 'docker' | 'http';
  sourceStorage: string;
  gitRepo: string;
  gitBranch: string;
  gitPath: string;
  options: Record<string, unknown>;
};

export type PortalSourceEnvLike = PortalCreateEnvLike;

export type PortalSourceOptions = {
  portal: string;
  env: PortalSourceEnvLike;
  envName?: string;
  cliVersion?: string;
  force?: boolean;
  message?: string;
  installDependencies?: boolean;
  runCommand?: RunCommand;
  apiRequest?: ApiRequest;
};

export type PortalSourceResult = {
  app: string;
  portal: string;
  portalDir: string;
  mode: 'local' | 'docker' | 'http';
  sourceStorage: string;
  changed: boolean;
  installSkipped?: boolean;
  dependenciesInstalled?: boolean;
  sourceRevision?: string;
  noopReason?: string;
};

const portalSourceText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalSource.${key}`, values, { fallback });

const PULL_SOURCE_OPERATION: RequestOperation = {
  method: 'POST',
  pathTemplate: '/multiPortals:pullSource',
  hasBody: true,
  bodyRequired: true,
  responseType: 'binary',
  parameters: [
    {
      name: 'app',
      flagName: 'app',
      in: 'body',
      required: true,
    },
    {
      name: 'portal',
      flagName: 'portal',
      in: 'body',
      required: true,
    },
  ],
};

const PUSH_SOURCE_OPERATION: RequestOperation = {
  method: 'POST',
  pathTemplate: '/multiPortals:pushSource',
  requestContentType: 'multipart/form-data',
  hasBody: true,
  bodyRequired: true,
  parameters: [
    {
      name: 'file',
      flagName: 'file',
      in: 'body',
      required: true,
      isFile: true,
    },
    {
      name: 'app',
      flagName: 'app',
      in: 'body',
      required: true,
    },
    {
      name: 'portal',
      flagName: 'portal',
      in: 'body',
      required: true,
    },
    {
      name: 'message',
      flagName: 'message',
      in: 'body',
    },
  ],
};

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function isFile(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
}

function shouldPackPortalSourceEntry(entryName: string): boolean {
  return !entryName
    .split('/')
    .some((segment) => segment.startsWith('._') || ['.git', 'node_modules', 'dist', '.DS_Store'].includes(segment));
}

function validatePortalSourceTarEntry(entryPath: string, entry: unknown): boolean {
  if (path.isAbsolute(entryPath) || entryPath.split(/[\\/]+/).includes('..')) {
    return false;
  }
  const tarEntry = entry as { type?: unknown; linkpath?: unknown };
  if (tarEntry.type === 'SymbolicLink' || tarEntry.type === 'Link' || typeof tarEntry.linkpath === 'string') {
    return false;
  }
  return shouldPackPortalSourceEntry(entryPath);
}

async function packPortalSource(portalDir: string): Promise<{ archivePath: string; cleanup: () => Promise<void> }> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-portal-source-'));
  const archivePath = path.join(tempDir, 'source.tar.gz');
  const entries = (await readdir(portalDir)).filter(shouldPackPortalSourceEntry);
  await tar.create(
    {
      cwd: portalDir,
      file: archivePath,
      gzip: true,
      filter: (entryPath, entry) => validatePortalSourceTarEntry(entryPath, entry),
    },
    entries,
  );
  return {
    archivePath,
    cleanup: async () => {
      await rm(tempDir, { recursive: true, force: true });
    },
  };
}

async function replacePortalSourceFromArchive(params: {
  archivePath: string;
  portalDir: string;
  force?: boolean;
}): Promise<void> {
  const targetExists = await pathExists(params.portalDir);
  if (targetExists && !params.force) {
    throw new Error(
      portalSourceText(
        'errors.workspaceExists',
        { portalDir: params.portalDir },
        `Portal already exists: ${params.portalDir}\nPass --force to delete it and pull again.`,
      ),
    );
  }

  const parentDir = path.dirname(params.portalDir);
  const tempDir = await mkdtemp(path.join(parentDir, `.${path.basename(params.portalDir)}-pull-`));
  try {
    await tar.extract({
      file: params.archivePath,
      cwd: tempDir,
      strict: true,
      filter: validatePortalSourceTarEntry,
    });
    if (targetExists) {
      await rm(params.portalDir, { recursive: true, force: true });
    }
    await rename(tempDir, params.portalDir);
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

async function replacePortalSourceFromDirectory(params: {
  sourceDir: string;
  portalDir: string;
  force?: boolean;
}): Promise<void> {
  const targetExists = await pathExists(params.portalDir);
  if (targetExists && !params.force) {
    throw new Error(
      portalSourceText(
        'errors.workspaceExists',
        { portalDir: params.portalDir },
        `Portal already exists: ${params.portalDir}\nPass --force to delete it and pull again.`,
      ),
    );
  }

  const parentDir = path.dirname(params.portalDir);
  const tempDir = await mkdtemp(path.join(parentDir, `.${path.basename(params.portalDir)}-pull-`));
  try {
    await cp(params.sourceDir, tempDir, {
      recursive: true,
      filter: (source) => shouldPackPortalSourceEntry(path.relative(params.sourceDir, source)),
    });
    if (targetExists) {
      await rm(params.portalDir, { recursive: true, force: true });
    }
    await rename(tempDir, params.portalDir);
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

async function runGit(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string }> {
  return await execFileAsync('git', args, {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function installPortalDependencies(params: {
  portalDir: string;
  installDependencies?: boolean;
  runCommand?: RunCommand;
}): Promise<{ dependenciesInstalled: boolean; installSkipped: boolean }> {
  if (params.installDependencies === false) {
    return {
      dependenciesInstalled: false,
      installSkipped: true,
    };
  }

  if (!(await isFile(path.join(params.portalDir, 'package.json')))) {
    return {
      dependenciesInstalled: false,
      installSkipped: true,
    };
  }

  const runCommand = params.runCommand ?? run;
  await runPnpmCommand(runCommand, ['install'], {
    cwd: params.portalDir,
    env: buildPortalCommandEnv(),
    envMode: 'replace',
    errorName: 'pnpm install',
  });

  return {
    dependenciesInstalled: true,
    installSkipped: false,
  };
}

function readSourceRevision(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }
  const direct = (data as { sourceRevision?: unknown }).sourceRevision;
  if (typeof direct === 'string' && direct.trim()) {
    return direct;
  }
  return readSourceRevision((data as { data?: unknown }).data);
}

async function resolvePortalSourceContext(options: PortalSourceOptions): Promise<PortalSourceContext> {
  const portal = validatePortalSlug(options.portal);
  const apiBaseUrl = trimValue(options.env.apiBaseUrl);
  const storagePath = resolvePortalStoragePath(options.env);
  const { app, appPublicPath } = resolvePortalAppFromApiBaseUrl(apiBaseUrl, options.env.config.appPublicPath);
  const portalDir = path.join(storagePath, 'portals', app, portal);
  const portalBase = buildPortalBasePath({ app, appPublicPath, portal });
  const mode = options.env.kind;

  if (mode !== 'local' && mode !== 'docker' && mode !== 'http') {
    throw new Error(
      portalSourceText(
        'errors.unsupportedEnvKind',
        { kind: mode },
        `Cannot sync portal source for ${mode} envs in the first version.`,
      ),
    );
  }

  const list = await listPortalWorkspaces({
    env: options.env,
    envName: options.envName,
    cliVersion: options.cliVersion,
    apiRequest: options.apiRequest,
  });
  const item = findPortalListItem(list.items, portal);
  if (!item) {
    throw new Error(
      portalSourceText(
        'errors.notFound',
        { portal },
        `Portal "${portal}" was not found. Run \`nb portal list\` to see available portals.`,
      ),
    );
  }

  return {
    app,
    portal,
    portalDir,
    portalBase,
    mode,
    sourceStorage: item.sourceStorage || 'nocobase',
    gitRepo: item.gitRepo,
    gitBranch: item.gitBranch || 'main',
    gitPath: item.gitPath || DEFAULT_PORTAL_GIT_PATH,
    options: item.options,
  };
}

function buildPortalConfigFromContext(context: PortalSourceContext): PortalConfig {
  if (Object.keys(context.options).length > 0) {
    return buildPortalConfigFromOptions(context.options, context.portal);
  }
  const sourceStorage = context.sourceStorage || 'nocobase';
  return buildPortalConfig({
    portal: context.portal,
    sourceStorage,
    gitRepo: sourceStorage === 'git' ? context.gitRepo : undefined,
    gitBranch: sourceStorage === 'git' ? context.gitBranch : undefined,
    gitPath: sourceStorage === 'git' ? context.gitPath : undefined,
  });
}

function applyPortalConfigToContext(context: PortalSourceContext, config: PortalConfig): PortalSourceContext {
  return {
    ...context,
    sourceStorage: config.sourceStorage,
    gitRepo: config.git?.repo ?? '',
    gitBranch: config.git?.branch ?? 'main',
    gitPath: config.git?.path ?? DEFAULT_PORTAL_GIT_PATH,
  };
}

function assertGitSourceConfig(context: PortalSourceContext): {
  repo: string;
  branch: string;
  gitPath: string;
} {
  if (!context.gitRepo) {
    throw new Error(
      portalSourceText(
        'errors.gitRepoMissing',
        { portal: context.portal },
        `Portal "${context.portal}" uses Git source storage, but gitRepo is missing.`,
      ),
    );
  }
  return {
    repo: context.gitRepo,
    branch: context.gitBranch || 'main',
    gitPath: context.gitPath || DEFAULT_PORTAL_GIT_PATH,
  };
}

function isGitRepositoryRootPath(gitPath: string): boolean {
  return gitPath === DEFAULT_PORTAL_GIT_PATH;
}

async function copyPortalSourceToGitPath(params: {
  portalDir: string;
  repoDir: string;
  gitPath: string;
}): Promise<void> {
  if (isGitRepositoryRootPath(params.gitPath)) {
    const existingEntries = await readdir(params.repoDir);
    await Promise.all(
      existingEntries
        .filter((entry) => entry !== '.git')
        .map((entry) => rm(path.join(params.repoDir, entry), { recursive: true, force: true })),
    );
    const sourceEntries = (await readdir(params.portalDir)).filter(shouldPackPortalSourceEntry);
    await Promise.all(
      sourceEntries.map((entry) =>
        cp(path.join(params.portalDir, entry), path.join(params.repoDir, entry), {
          recursive: true,
          filter: (source) => shouldPackPortalSourceEntry(path.relative(params.portalDir, source)),
        }),
      ),
    );
    return;
  }

  const targetDir = path.join(params.repoDir, params.gitPath);
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(path.dirname(targetDir), { recursive: true });
  await cp(params.portalDir, targetDir, {
    recursive: true,
    filter: (source) => shouldPackPortalSourceEntry(path.relative(params.portalDir, source)),
  });
}

async function cloneGitSource(params: { repo: string; branch: string; cwd: string; createBranch?: boolean }): Promise<string> {
  const repoDir = path.join(params.cwd, 'repo');
  try {
    await runGit(['clone', '--branch', params.branch, params.repo, repoDir]);
  } catch (error) {
    if (!params.createBranch) {
      throw error;
    }
    await runGit(['clone', params.repo, repoDir]);
    await runGit(['checkout', '-B', params.branch], repoDir);
  }
  return repoDir;
}

async function pullGitPortalSource(params: {
  context: PortalSourceContext;
  force?: boolean;
}): Promise<void> {
  const git = assertGitSourceConfig(params.context);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-portal-git-pull-'));
  try {
    const repoDir = await cloneGitSource({
      repo: git.repo,
      branch: git.branch,
      cwd: tempDir,
      createBranch: true,
    });
    const sourceDir = path.join(repoDir, git.gitPath);
    if (!(await pathExists(sourceDir))) {
      throw new Error(
        portalSourceText(
          'errors.gitPathMissing',
          { gitPath: git.gitPath },
          `Git path does not exist in the configured repository: ${git.gitPath}`,
        ),
      );
    }
    await mkdir(path.dirname(params.context.portalDir), { recursive: true });
    await replacePortalSourceFromDirectory({
      sourceDir,
      portalDir: params.context.portalDir,
      force: params.force,
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function pushGitPortalSource(params: {
  context: PortalSourceContext;
  message?: string;
}): Promise<string | undefined> {
  const git = assertGitSourceConfig(params.context);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-portal-git-push-'));
  try {
    const repoDir = await cloneGitSource({
      repo: git.repo,
      branch: git.branch,
      cwd: tempDir,
      createBranch: true,
    });
    await copyPortalSourceToGitPath({
      portalDir: params.context.portalDir,
      repoDir,
      gitPath: git.gitPath,
    });
    await runGit(['add', git.gitPath], repoDir);
    const status = await runGit(['status', '--porcelain', '--', git.gitPath], repoDir);
    if (!status.stdout.trim()) {
      return undefined;
    }
    await runGit(
      [
        '-c',
        'user.name=NocoBase CLI',
        '-c',
        'user.email=nocobase-cli@localhost',
        'commit',
        '-m',
        trimValue(params.message) || `chore(portal): update ${params.context.portal}`,
      ],
      repoDir,
    );
    await runGit(['push', 'origin', git.branch], repoDir);
    const revision = await runGit(['rev-parse', 'HEAD'], repoDir);
    return revision.stdout.trim();
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function pullPortalSource(options: PortalSourceOptions): Promise<PortalSourceResult> {
  const context = await resolvePortalSourceContext(options);
  const portalConfig = buildPortalConfigFromContext(context);
  const sourceContext = applyPortalConfigToContext(context, portalConfig);
  if (sourceContext.sourceStorage === 'git') {
    await pullGitPortalSource({
      context: sourceContext,
      force: options.force,
    });
    await writePortalConfig(sourceContext.portalDir, portalConfig);
    const installResult = await installPortalDependencies({
      portalDir: sourceContext.portalDir,
      installDependencies: options.installDependencies,
      runCommand: options.runCommand,
    });
    return {
      ...sourceContext,
      changed: true,
      ...installResult,
    };
  }

  if (sourceContext.sourceStorage !== 'nocobase') {
    throw new Error(
      portalSourceText(
        'errors.unsupportedSourceStorage',
        { sourceStorage: sourceContext.sourceStorage },
        `Unsupported portal source storage: ${sourceContext.sourceStorage}`,
      ),
    );
  }

  if (sourceContext.mode === 'local' || sourceContext.mode === 'docker') {
    return {
      ...sourceContext,
      changed: false,
      noopReason:
        sourceContext.mode === 'local'
          ? portalSourceText('messages.localPullNoop', undefined, 'Portal source is already local.')
          : portalSourceText('messages.dockerPullNoop', undefined, 'Portal source is already available through the Docker volume.'),
    };
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-portal-pull-'));
  const archivePath = path.join(tempDir, 'source.tar.gz');
  const apiRequest = options.apiRequest ?? executeApiRequest;
  try {
    const response = await apiRequest({
      cliVersion: options.cliVersion ?? '',
      envName: options.envName,
      flags: {
        app: sourceContext.app,
        portal: sourceContext.portal,
        output: archivePath,
      },
      operation: PULL_SOURCE_OPERATION,
    });
    if (!response.ok) {
      throw new Error(
        portalSourceText(
          'errors.pullFailed',
          { status: response.status, details: JSON.stringify(response.data, null, 2) },
          `Portal source pull failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
        ),
      );
    }

    await mkdir(path.dirname(sourceContext.portalDir), { recursive: true });
    await replacePortalSourceFromArchive({
      archivePath,
      portalDir: sourceContext.portalDir,
      force: options.force,
    });
    await writePortalConfig(sourceContext.portalDir, portalConfig);
    const installResult = await installPortalDependencies({
      portalDir: sourceContext.portalDir,
      installDependencies: options.installDependencies,
      runCommand: options.runCommand,
    });

    return {
      ...sourceContext,
      changed: true,
      ...installResult,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function pushPortalSource(options: PortalSourceOptions): Promise<PortalSourceResult> {
  const context = await resolvePortalSourceContext(options);
  if (!(await pathExists(context.portalDir))) {
    throw new Error(
      portalSourceText(
        'errors.workspaceMissing',
        { portalDir: context.portalDir, portal: context.portal },
        `Portal does not exist: ${context.portalDir}\nRun \`nb portal create ${context.portal}\` first.`,
      ),
    );
  }
  const portalConfig = await readPortalConfig(context.portalDir);
  await syncPortalConfigToRemote({
    portal: context.portal,
    config: portalConfig,
    currentOptions: context.options,
    envName: options.envName,
    cliVersion: options.cliVersion,
    apiRequest: options.apiRequest,
  });
  const sourceContext = applyPortalConfigToContext(context, portalConfig);

  if (sourceContext.sourceStorage === 'git') {
    const revision = await pushGitPortalSource({
      context: sourceContext,
      message: options.message,
    });
    return {
      ...sourceContext,
      changed: Boolean(revision),
      sourceRevision: revision,
      noopReason: revision
        ? undefined
        : portalSourceText('messages.gitPushNoop', undefined, 'No local source changes to push.'),
    };
  }

  if (sourceContext.sourceStorage !== 'nocobase') {
    throw new Error(
      portalSourceText(
        'errors.unsupportedSourceStorage',
        { sourceStorage: sourceContext.sourceStorage },
        `Unsupported portal source storage: ${sourceContext.sourceStorage}`,
      ),
    );
  }

  if (sourceContext.mode === 'local' || sourceContext.mode === 'docker') {
    return {
      ...sourceContext,
      changed: false,
      noopReason:
        sourceContext.mode === 'local'
          ? portalSourceText('messages.localPushNoop', undefined, 'Portal source is already local.')
          : portalSourceText('messages.dockerPushNoop', undefined, 'Portal source is already available through the Docker volume.'),
    };
  }

  const archive = await packPortalSource(sourceContext.portalDir);
  const apiRequest = options.apiRequest ?? executeApiRequest;
  try {
    const response = await apiRequest({
      cliVersion: options.cliVersion ?? '',
      envName: options.envName,
      flags: {
        file: archive.archivePath,
        app: sourceContext.app,
        portal: sourceContext.portal,
        message: options.message,
      },
      operation: PUSH_SOURCE_OPERATION,
    });
    if (!response.ok) {
      throw new Error(
        portalSourceText(
          'errors.pushFailed',
          { status: response.status, details: JSON.stringify(response.data, null, 2) },
          `Portal source push failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
        ),
      );
    }

    return {
      ...sourceContext,
      changed: true,
      sourceRevision: readSourceRevision(response.data),
    };
  } finally {
    await archive.cleanup();
  }
}
