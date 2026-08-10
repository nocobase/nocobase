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
import { ensurePortalBuildHtmlReadsEnvOnly } from './portal-build-html.js';
import {
  buildPortalConfig,
  buildPortalConfigFromOptions,
  DEFAULT_PORTAL_GIT_PATH,
  type PortalConfig,
} from './portal-config.js';
import { buildPortalCommandEnv } from './portal-command-env.js';
import { canReplacePortalDirectory } from './portal-path-safety.js';
import { updatePortalEnvFiles } from './portal-env-files.js';
import {
  buildPortalBasePath,
  resolvePortalAppContext,
  resolvePortalDeployPath,
  resolvePortalSourcePath,
  resolveSavedPortalSourcePath,
  resolvePortalStoragePath,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';
import { listPortalWorkspaces } from './portal-list.js';
import { findPortalListItem } from './portal-info.js';
import { resolvePnpmInstallCommand, run, runPnpmCommand, runPnpmInstallCommand, type RunCommand } from './run-npm.js';

type ApiRequest = typeof executeApiRequest;
const execFileAsync = promisify(execFile);

type PortalSourceContext = {
  app: string;
  portal: string;
  portalDir: string;
  portalBase: string;
  apiBaseUrl: string;
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
  sourcePath?: string;
  defaultSourcePath?: boolean;
  gitRepo?: string;
  gitBranch?: string;
  gitPath?: string;
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
  installFailed?: boolean;
  sourceRevision?: string;
  noopReason?: string;
};

type GitIdentity = {
  name: string;
  email: string;
};

const NOCOBASE_CLI_GIT_IDENTITY: GitIdentity = {
  name: 'NocoBase CLI',
  email: '314549027+nocobase-cli@users.noreply.github.com',
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

async function replaceExistingPortalDirectory(params: { sourceDir: string; portalDir: string }): Promise<void> {
  if (!(await pathExists(path.join(params.portalDir, '.git')))) {
    await rm(params.portalDir, { recursive: true, force: true });
    await rename(params.sourceDir, params.portalDir);
    return;
  }

  const existingEntries = await readdir(params.portalDir);
  await Promise.all(
    existingEntries
      .filter((entry) => entry !== '.git')
      .map((entry) => rm(path.join(params.portalDir, entry), { recursive: true, force: true })),
  );

  const sourceEntries = await readdir(params.sourceDir);
  await Promise.all(
    sourceEntries.map((entry) => rename(path.join(params.sourceDir, entry), path.join(params.portalDir, entry))),
  );
  await rm(params.sourceDir, { recursive: true, force: true });
}

async function replacePortalSourceFromArchive(params: {
  archivePath: string;
  portalDir: string;
  force?: boolean;
}): Promise<void> {
  const targetExists = await assertPortalDirectoryCanBeReplaced({
    portalDir: params.portalDir,
    force: params.force,
  });

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
      await replaceExistingPortalDirectory({
        sourceDir: tempDir,
        portalDir: params.portalDir,
      });
      return;
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
  const targetExists = await assertPortalDirectoryCanBeReplaced({
    portalDir: params.portalDir,
    force: params.force,
  });

  const parentDir = path.dirname(params.portalDir);
  const tempDir = await mkdtemp(path.join(parentDir, `.${path.basename(params.portalDir)}-pull-`));
  try {
    await cp(params.sourceDir, tempDir, {
      recursive: true,
      filter: (source) => shouldPackPortalSourceEntry(path.relative(params.sourceDir, source)),
    });
    if (targetExists) {
      await replaceExistingPortalDirectory({
        sourceDir: tempDir,
        portalDir: params.portalDir,
      });
      return;
    }
    await rename(tempDir, params.portalDir);
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

async function assertPortalDirectoryCanBeReplaced(params: { portalDir: string; force?: boolean }): Promise<boolean> {
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
  if (targetExists && params.force && !(await canReplacePortalDirectory(params.portalDir))) {
    throw new Error(
      portalSourceText(
        'errors.workspaceNotReplaceable',
        { portalDir: params.portalDir },
        `Refusing to replace a non-portal directory: ${params.portalDir}`,
      ),
    );
  }
  return targetExists;
}

async function runGit(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string }> {
  return await execFileAsync('git', args, {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function isValidGitIdentity(identity: GitIdentity): boolean {
  return (
    !/[\r\n<>]/.test(identity.name) &&
    !/[\r\n<>\s]/.test(identity.email) &&
    identity.email.includes('@')
  );
}

async function resolveLocalGitIdentity(cwd: string): Promise<GitIdentity | undefined> {
  let output: string;
  try {
    output = (await runGit(['var', 'GIT_AUTHOR_IDENT'], cwd)).stdout;
  } catch {
    return undefined;
  }

  const match = /^(.*) <([^<>]+)> -?\d+ [+-]\d{4}$/.exec(trimValue(output));
  if (!match) {
    return undefined;
  }

  const identity = { name: match[1], email: match[2] };
  if (!isValidGitIdentity(identity)) {
    return undefined;
  }
  if (
    identity.name === NOCOBASE_CLI_GIT_IDENTITY.name &&
    identity.email === NOCOBASE_CLI_GIT_IDENTITY.email
  ) {
    return undefined;
  }
  return identity;
}

async function installPortalDependencies(params: {
  portalDir: string;
  installDependencies?: boolean;
  runCommand?: RunCommand;
}): Promise<{ dependenciesInstalled: boolean; installSkipped: boolean; installFailed: boolean }> {
  if (params.installDependencies === false) {
    return {
      dependenciesInstalled: false,
      installSkipped: true,
      installFailed: false,
    };
  }

  if (!(await isFile(path.join(params.portalDir, 'package.json')))) {
    return {
      dependenciesInstalled: false,
      installSkipped: true,
      installFailed: false,
    };
  }

  const runCommand = params.runCommand ?? run;
  const installCommand = await resolvePnpmInstallCommand(params.portalDir);
  try {
    await runPnpmInstallCommand(runCommand, installCommand.args, {
      cwd: params.portalDir,
      env: buildPortalCommandEnv(),
      envMode: 'replace',
      errorName: installCommand.errorName,
    });
  } catch {
    return {
      dependenciesInstalled: false,
      installSkipped: false,
      installFailed: true,
    };
  }

  return {
    dependenciesInstalled: true,
    installSkipped: false,
    installFailed: false,
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
  const mode = options.env.kind;
  const appContext = await resolvePortalAppContext(options);
  const { app, appPublicPath, portalBaseApp } = appContext;
  const portalDeployDir = resolvePortalDeployPath({ storagePath, app, portal });
  const portalDir = options.sourcePath
    ? resolvePortalSourcePath(portal, options.sourcePath)
    : resolveSavedPortalSourcePath(options.env, portal) ??
      (options.defaultSourcePath ? resolvePortalSourcePath(portal) : portalDeployDir);
  const portalBase = buildPortalBasePath({ app: portalBaseApp ?? app, appPublicPath, portal });

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
    appContext,
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
    apiBaseUrl,
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

function getTemporaryGitPortalConfig(options: PortalSourceOptions): PortalConfig | undefined {
  const gitRepo = trimValue(options.gitRepo);
  if (!gitRepo) {
    if (trimValue(options.gitBranch) || trimValue(options.gitPath)) {
      throw new Error(
        portalSourceText(
          'errors.gitRepoRequiredForTemporaryPull',
          undefined,
          [
            '--git-branch and --git-path require --git-repo for a temporary Git pull.',
            'To update the portal configuration, use `nb portal config`.',
          ].join(' '),
        ),
      );
    }
    return undefined;
  }

  return buildPortalConfig({
    portal: options.portal,
    sourceStorage: 'git',
    gitRepo,
    gitBranch: options.gitBranch,
    gitPath: options.gitPath,
  });
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

async function setGitOriginRepository(params: { repoDir: string; repo: string }): Promise<void> {
  try {
    await runGit(['remote', 'get-url', 'origin'], params.repoDir);
    await runGit(['remote', 'set-url', 'origin', params.repo], params.repoDir);
  } catch {
    await runGit(['remote', 'add', 'origin', params.repo], params.repoDir);
  }
}

async function checkoutExistingGitRepository(params: { repoDir: string; repo: string; branch: string }): Promise<void> {
  await setGitOriginRepository({
    repoDir: params.repoDir,
    repo: params.repo,
  });
  try {
    await runGit(['fetch', 'origin', params.branch], params.repoDir);
    await runGit(['checkout', '-f', '-B', params.branch, 'FETCH_HEAD'], params.repoDir);
  } catch (error) {
    await runGit(['fetch', 'origin'], params.repoDir);
    await runGit(['checkout', '-f', '-B', params.branch], params.repoDir);
  }
  await runGit(['clean', '-fdx'], params.repoDir);
}

async function pullGitRepositoryRootPortalSource(params: {
  context: PortalSourceContext;
  repo: string;
  branch: string;
  force?: boolean;
}): Promise<void> {
  const targetExists = await assertPortalDirectoryCanBeReplaced({
    portalDir: params.context.portalDir,
    force: params.force,
  });
  await mkdir(path.dirname(params.context.portalDir), { recursive: true });

  if (targetExists && (await pathExists(path.join(params.context.portalDir, '.git')))) {
    await checkoutExistingGitRepository({
      repoDir: params.context.portalDir,
      repo: params.repo,
      branch: params.branch,
    });
    return;
  }

  if (targetExists) {
    await rm(params.context.portalDir, { recursive: true, force: true });
  }

  const tempDir = await mkdtemp(path.join(path.dirname(params.context.portalDir), `.${path.basename(params.context.portalDir)}-git-pull-`));
  try {
    const repoDir = await cloneGitSource({
      repo: params.repo,
      branch: params.branch,
      cwd: tempDir,
      createBranch: true,
    });
    await rename(repoDir, params.context.portalDir);
  } catch (error) {
    await rm(params.context.portalDir, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function pullGitPortalSource(params: {
  context: PortalSourceContext;
  force?: boolean;
}): Promise<void> {
  const git = assertGitSourceConfig(params.context);
  if (isGitRepositoryRootPath(git.gitPath)) {
    await pullGitRepositoryRootPortalSource({
      context: params.context,
      repo: git.repo,
      branch: git.branch,
      force: params.force,
    });
    return;
  }

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
  const localIdentity = await resolveLocalGitIdentity(params.context.portalDir);
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
    const commitIdentity = localIdentity ?? NOCOBASE_CLI_GIT_IDENTITY;
    const commitArgs = [
      '-c',
      `user.name=${commitIdentity.name}`,
      '-c',
      `user.email=${commitIdentity.email}`,
      'commit',
      '-m',
      trimValue(params.message) || `chore(portal): update ${params.context.portal}`,
    ];
    if (localIdentity) {
      commitArgs.push(
        '-m',
        `Co-authored-by: ${NOCOBASE_CLI_GIT_IDENTITY.name} <${NOCOBASE_CLI_GIT_IDENTITY.email}>`,
      );
    }
    await runGit(commitArgs, repoDir);
    await runGit(['push', 'origin', git.branch], repoDir);
    const revision = await runGit(['rev-parse', 'HEAD'], repoDir);
    return revision.stdout.trim();
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function pullPortalSource(options: PortalSourceOptions): Promise<PortalSourceResult> {
  const context = await resolvePortalSourceContext({
    ...options,
    defaultSourcePath: true,
  });
  const portalConfig = getTemporaryGitPortalConfig(options) ?? buildPortalConfigFromContext(context);
  const sourceContext = applyPortalConfigToContext(context, portalConfig);
  if (sourceContext.sourceStorage === 'git') {
    await pullGitPortalSource({
      context: sourceContext,
      force: options.force,
    });
    await ensurePortalBuildHtmlReadsEnvOnly(sourceContext.portalDir);
    await updatePortalEnvFiles({
      portalDir: sourceContext.portalDir,
      portal: sourceContext.portal,
      apiBaseUrl: sourceContext.apiBaseUrl,
    });
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
    await ensurePortalBuildHtmlReadsEnvOnly(sourceContext.portalDir);
    await updatePortalEnvFiles({
      portalDir: sourceContext.portalDir,
      portal: sourceContext.portal,
      apiBaseUrl: sourceContext.apiBaseUrl,
    });
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
  const context = await resolvePortalSourceContext({
    ...options,
    defaultSourcePath: true,
  });
  if (!(await pathExists(context.portalDir))) {
    throw new Error(
      portalSourceText(
        'errors.workspaceMissing',
        { portalDir: context.portalDir, portal: context.portal },
        `Portal does not exist: ${context.portalDir}\nRun \`nb portal create ${context.portal}\` first.`,
      ),
    );
  }
  const portalConfig = buildPortalConfigFromContext(context);
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
