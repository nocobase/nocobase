/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createReadStream } from 'node:fs';
import { cp, mkdir, mkdtemp, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import * as tar from 'tar';
import { appendAppPublicPath, resolveAppPublicPath } from './app-public-path.js';
import { executeApiRequest, type RequestOperation } from './api-client.js';
import type { Env } from './auth-store.js';
import { resolveEnvRelativePath } from './cli-home.js';
import { translateCli } from './cli-locale.js';
import { ensurePortalBuildHtmlReadsEnvOnly } from './portal-build-html.js';
import { buildPortalCommandEnv } from './portal-command-env.js';
import {
  buildPortalConfig,
  mergePortalConfigIntoOptions,
  writePortalConfig,
  type PortalConfig,
  type PortalSourceStorage,
} from './portal-config.js';
import { resolvePnpmInstallCommand, run, runPnpmInstallCommand, type RunCommand } from './run-npm.js';

const DEFAULT_PORTAL_TEMPLATE = '@nocobase/portal-template-default';
const DEFAULT_PORTAL_APP_NAME = 'main';
const TEMPLATE_COPY_EXCLUDED_NAMES = new Set(['.git', 'node_modules', '.DS_Store']);
const NPM_PACK_TIMEOUT_MS = 30_000;

type TemplateSourceType = 'local' | 'package';

type ApiRequest = typeof executeApiRequest;
const portalCreateText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalCreate.${key}`, values, { fallback });

export type PortalCreateEnvLike = Pick<Env, 'apiBaseUrl' | 'kind' | 'storagePath' | 'name'> & {
  config: Pick<Env['config'], 'apiBaseUrl' | 'appPublicPath' | 'storagePath' | 'npmRegistry'>;
};

export type PortalCreateOptions = {
  portal: string;
  title?: string;
  template?: string;
  env: PortalCreateEnvLike;
  envName?: string;
  cliVersion?: string;
  force?: boolean;
  sourceStorage?: PortalSourceStorage;
  gitRepo?: string;
  gitBranch?: string;
  gitPath?: string;
  runCommand?: RunCommand;
  apiRequest?: ApiRequest;
  onSkipInstall?: (message: string) => void;
};

export type ResolvedPortalApp = {
  app: string;
  appPublicPath: string;
};

export type PortalAppContextOptions = {
  env: PortalCreateEnvLike;
  envName?: string;
  cliVersion?: string;
  apiRequest?: ApiRequest;
};

export type ResolvedPortalTemplate = {
  dir: string;
  source: string;
  type: TemplateSourceType;
  cleanup?: () => Promise<void>;
};

export type PortalCreateResult = {
  portalDir: string;
  app: string;
  portal: string;
  title: string;
  apiBaseUrl: string;
  portalBase: string;
  template: ResolvedPortalTemplate;
  installSkipped: boolean;
  dependenciesInstalled: boolean;
  installFailed: boolean;
  sourceStorage: PortalSourceStorage;
};

const FIRST_OR_CREATE_PORTAL_OPERATION: RequestOperation = {
  method: 'POST',
  pathTemplate: '/multiPortals:firstOrCreate',
  hasBody: true,
  bodyRequired: true,
  parameters: [
    {
      name: 'filterKeys[]',
      flagName: 'filterKeys',
      in: 'query',
      required: true,
      isArray: true,
    },
  ],
};

const APP_INFO_OPERATION: RequestOperation = {
  method: 'GET',
  pathTemplate: '/app:getInfo',
  parameters: [],
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

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeUrlPathname(pathname: string): string {
  const normalized = pathname.replace(/\/+/g, '/');
  return normalized === '/' ? normalized : normalized.replace(/\/+$/, '');
}

function resolveApiBaseUrlPathname(apiBaseUrl: string): string {
  const normalizedApiBaseUrl = trimValue(apiBaseUrl);
  try {
    return normalizeUrlPathname(new URL(normalizedApiBaseUrl).pathname);
  } catch {
    const [pathname] = normalizedApiBaseUrl.split(/[?#]/, 1);
    const withLeadingSlash = pathname?.startsWith('/') ? pathname : `/${pathname || 'api'}`;
    return normalizeUrlPathname(withLeadingSlash);
  }
}

export function resolvePortalEnvApiUrl(apiBaseUrl: string): string {
  return resolveApiBaseUrlPathname(apiBaseUrl);
}

function decodeAppSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeTempPrefix(parentDir: string, portal: string): string {
  return path.join(parentDir, `.${portal}-create-`);
}

function assertPortalDirIsInsideParent(parentDir: string, portalDir: string): void {
  const relative = path.relative(parentDir, portalDir);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      portalCreateText(
        'errors.outsideParent',
        { parentDir, portalDir },
        `Refusing to modify a portal outside ${parentDir}: ${portalDir}`,
      ),
    );
  }
}

function shouldCopyTemplateEntry(templateDir: string, source: string): boolean {
  const relative = path.relative(templateDir, source);
  if (!relative) {
    return true;
  }

  return !relative.split(path.sep).some((segment) => TEMPLATE_COPY_EXCLUDED_NAMES.has(segment));
}

async function copyTemplate(sourceDir: string, targetDir: string): Promise<void> {
  await cp(sourceDir, targetDir, {
    recursive: true,
    filter: (source) => shouldCopyTemplateEntry(sourceDir, source),
  });
}

function looksLikeLocalTemplateSource(source: string): boolean {
  return path.isAbsolute(source) || source.startsWith('./') || source.startsWith('../') || source.startsWith('file://');
}

function normalizeNpmRegistry(value?: string): string | undefined {
  const text = trimValue(value);
  return text ? text.replace(/\/+$/, '') : undefined;
}

async function resolvePackedTemplateTarball(packRoot: string, sourceLabel: string): Promise<string> {
  const entries = await readdir(packRoot, { withFileTypes: true });
  const tarballs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tgz'))
    .map((entry) => path.join(packRoot, entry.name))
    .sort();

  if (tarballs.length === 1) {
    return tarballs[0];
  }

  if (tarballs.length === 0) {
    throw new Error(
      portalCreateText(
        'errors.npmPackNoTarball',
        { source: sourceLabel },
        `npm pack did not produce a local tarball for ${sourceLabel}.`,
      ),
    );
  }

  throw new Error(
    portalCreateText(
      'errors.npmPackMultipleTarballs',
      { source: sourceLabel },
      `npm pack produced multiple tarballs for ${sourceLabel}.`,
    ),
  );
}

async function downloadNpmTemplatePackage(params: {
  source: string;
  npmRegistry?: string;
  runCommand: RunCommand;
}): Promise<ResolvedPortalTemplate> {
  const packRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-portal-template-pack-'));
  const extractRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-portal-template-extract-'));
  const args = ['pack', '--silent'];
  const registry = normalizeNpmRegistry(params.npmRegistry);
  let shouldCleanupPackRoot = true;
  let shouldCleanupExtractRoot = true;
  let stdout = '';
  let stderr = '';

  if (registry) {
    args.push(`--registry=${registry}`);
  }
  args.push(params.source);

  try {
    await params.runCommand('npm', args, {
      cwd: packRoot,
      stdio: 'pipe',
      errorName: 'npm pack',
      timeoutMs: NPM_PACK_TIMEOUT_MS,
      onStdout: (chunk) => {
        stdout += chunk;
      },
      onStderr: (chunk) => {
        stderr += chunk;
      },
    });

    const tarballPath = await resolvePackedTemplateTarball(packRoot, params.source);
    try {
      await pipeline(createReadStream(tarballPath), createGunzip(), tar.extract({ cwd: extractRoot, strip: 1 }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        portalCreateText(
          'errors.templateExtractFailed',
          { source: params.source, details: message },
          `Failed to extract portal template "${params.source}": ${message}`,
        ),
      );
    }

    if (!(await pathExists(path.join(extractRoot, 'package.json')))) {
      throw new Error(
        portalCreateText(
          'errors.templateMissingPackageJson',
          { source: params.source },
          `Portal template "${params.source}" is invalid: package.json is missing.`,
        ),
      );
    }

    shouldCleanupPackRoot = false;
    shouldCleanupExtractRoot = false;
    return {
      dir: extractRoot,
      source: params.source,
      type: 'package',
      cleanup: async () => {
        await rm(packRoot, { recursive: true, force: true });
        await rm(extractRoot, { recursive: true, force: true });
      },
    };
  } catch (error) {
    const details = trimValue(stderr) || trimValue(stdout) || (error instanceof Error ? error.message : String(error));
    throw new Error(
      portalCreateText(
        'errors.templateDownloadFailed',
        { source: params.source, details },
        `Failed to download portal template "${params.source}" with npm pack. ${details}`,
      ),
    );
  } finally {
    if (shouldCleanupPackRoot) {
      await rm(packRoot, { recursive: true, force: true });
    }
    if (shouldCleanupExtractRoot) {
      await rm(extractRoot, { recursive: true, force: true });
    }
  }
}

async function resolveLocalTemplateDir(source: string): Promise<string | undefined> {
  if (source.startsWith('file://')) {
    const filePath = fileURLToPath(source);
    if (!(await isDirectory(filePath))) {
      throw new Error(
        portalCreateText('errors.templateInvalidDirectory', { source }, `Portal template "${source}" is invalid: expected a directory.`),
      );
    }
    return filePath;
  }

  const candidate = path.isAbsolute(source) ? source : path.resolve(process.cwd(), source);
  if (!(await pathExists(candidate))) {
    return undefined;
  }
  if (!(await isDirectory(candidate))) {
    throw new Error(
      portalCreateText('errors.templateInvalidDirectory', { source }, `Portal template "${source}" is invalid: expected a directory.`),
    );
  }
  return candidate;
}

export async function resolvePortalTemplate(
  source = DEFAULT_PORTAL_TEMPLATE,
  options: { npmRegistry?: string; runCommand?: RunCommand } = {},
): Promise<ResolvedPortalTemplate> {
  const normalizedSource = trimValue(source) || DEFAULT_PORTAL_TEMPLATE;
  const localTemplateDir = await resolveLocalTemplateDir(normalizedSource);
  if (localTemplateDir) {
    return {
      dir: localTemplateDir,
      source: normalizedSource,
      type: 'local',
    };
  }
  if (looksLikeLocalTemplateSource(normalizedSource)) {
    throw new Error(
      portalCreateText(
        'errors.localTemplateMissing',
        { source: normalizedSource },
        `Portal template directory does not exist: ${normalizedSource}`,
      ),
    );
  }

  try {
    const require = createRequire(import.meta.url);
    const packageJsonPath = require.resolve(path.join(normalizedSource, 'package.json'), {
      paths: [process.cwd()],
    });
    return {
      dir: path.dirname(packageJsonPath),
      source: normalizedSource,
      type: 'package',
    };
  } catch (error) {
    return await downloadNpmTemplatePackage({
      source: normalizedSource,
      npmRegistry: options.npmRegistry,
      runCommand: options.runCommand ?? run,
    });
  }
}

export function validatePortalSlug(value: string): string {
  const portal = trimValue(value);
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(portal)) {
    throw new Error(
      portalCreateText(
        'errors.invalidPortalName',
        { value },
        `Invalid portal name "${value}". Use lowercase letters, numbers, underscores, or hyphens, ` +
          'and start with a lowercase letter or number.',
      ),
    );
  }
  return portal;
}

async function syncMultiPortalRecord(params: {
  portal: string;
  title: string;
  config: PortalConfig;
  envName?: string;
  cliVersion?: string;
  apiRequest?: ApiRequest;
}): Promise<void> {
  const apiRequest = params.apiRequest ?? executeApiRequest;
  const response = await apiRequest({
    cliVersion: params.cliVersion ?? '',
    envName: params.envName,
    flags: {
      filterKeys: ['portalName'],
      body: JSON.stringify({
        uid: params.portal,
        title: params.title,
        portalType: 'ai',
        portalName: params.portal,
        routePath: `/${params.portal}`,
        authCheck: true,
        enabled: true,
        uiLayoutUid: 'admin-layout-model',
        skipCreatePortalDirectory: true,
        options: mergePortalConfigIntoOptions(params.config),
      }),
    },
    operation: FIRST_OR_CREATE_PORTAL_OPERATION,
  });

  if (!response.ok) {
    throw new Error(
      portalCreateText(
        'errors.recordSyncFailed',
        { status: response.status, details: JSON.stringify(response.data, null, 2) },
        `Portal record sync failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
      ),
    );
  }
}

function validatePortalAppName(value: string): string {
  const app = trimValue(value);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(app)) {
    throw new Error(
      portalCreateText(
        'errors.invalidPortalAppName',
        { value },
        `Invalid portal app name "${value}" from apiBaseUrl. Use letters, numbers, underscores, or hyphens, ` +
          'and start with a letter or number.',
      ),
    );
  }
  return app;
}

export function titleFromPortalSlug(portal: string): string {
  return portal
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function resolvePortalAppFromApiBaseUrl(apiBaseUrl: string, appPublicPath?: string): ResolvedPortalApp {
  const normalizedApiBaseUrl = trimValue(apiBaseUrl);
  if (!normalizedApiBaseUrl) {
    throw new Error(
      portalCreateText(
        'errors.missingApiBaseUrl',
        undefined,
        'Cannot create a portal because the selected env has no apiBaseUrl.',
      ),
    );
  }

  const configuredPublicPath = trimValue(appPublicPath);
  let inferredPublicPath = '/';
  let app = DEFAULT_PORTAL_APP_NAME;

  const pathname = resolveApiBaseUrlPathname(normalizedApiBaseUrl);
  const subappMatch = pathname.match(/^(.*)\/api\/__app\/([^/]+)$/);
  if (subappMatch) {
    inferredPublicPath = ensureTrailingSlash(subappMatch[1] || '/');
    app = validatePortalAppName(
      decodeAppSegment(subappMatch[2] ?? DEFAULT_PORTAL_APP_NAME) || DEFAULT_PORTAL_APP_NAME,
    );
  } else {
    const mainAppMatch = pathname.match(/^(.*)\/api$/);
    if (mainAppMatch) {
      inferredPublicPath = ensureTrailingSlash(mainAppMatch[1] || '/');
    }
  }

  return {
    app,
    appPublicPath: resolveAppPublicPath(configuredPublicPath || inferredPublicPath),
  };
}

function readAppNameFromInfo(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }
  const direct = (data as { name?: unknown }).name;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }
  return readAppNameFromInfo((data as { data?: unknown }).data);
}

function isValidPortalAppName(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value);
}

async function resolvePortalAppFromServer(options: PortalAppContextOptions): Promise<string | undefined> {
  const apiRequest = options.apiRequest ?? executeApiRequest;
  try {
    const response = await apiRequest({
      cliVersion: options.cliVersion ?? '',
      envName: options.envName,
      flags: {},
      operation: APP_INFO_OPERATION,
    });
    if (!response.ok) {
      return undefined;
    }
    const appName = readAppNameFromInfo(response.data);
    return appName && isValidPortalAppName(appName) ? appName : undefined;
  } catch {
    return undefined;
  }
}

export async function resolvePortalAppContext(options: PortalAppContextOptions): Promise<ResolvedPortalApp> {
  const apiBaseUrl = trimValue(options.env.apiBaseUrl);
  const resolvedApp = resolvePortalAppFromApiBaseUrl(apiBaseUrl, options.env.config.appPublicPath);
  if (options.env.kind !== 'http') {
    return resolvedApp;
  }

  const serverApp = await resolvePortalAppFromServer(options);
  return {
    app: serverApp ?? resolvedApp.app,
    appPublicPath: resolvedApp.appPublicPath,
  };
}

export function buildPortalBasePath(params: { app: string; appPublicPath: string; portal: string }): string {
  const segment =
    params.app === DEFAULT_PORTAL_APP_NAME
      ? `x/${params.portal}`
      : `x/apps/${params.app}/${params.portal}`;
  return appendAppPublicPath(params.appPublicPath, segment, { trailingSlash: true });
}

export function resolvePortalStoragePath(env: PortalCreateEnvLike): string {
  if (env.kind === 'ssh') {
    throw new Error(
      portalCreateText('errors.sshUnsupported', undefined, 'Cannot create a portal for ssh envs in the first version.'),
    );
  }

  if (env.kind === 'http' && !trimValue(env.config.storagePath)) {
    const envName = trimValue(env.name);
    if (envName) {
      return path.join(resolveEnvRelativePath(envName), 'source', 'storage');
    }

    const envStoragePath = trimValue(process.env.STORAGE_PATH);
    if (envStoragePath) {
      return path.isAbsolute(envStoragePath) ? envStoragePath : path.resolve(process.cwd(), envStoragePath);
    }
    return path.resolve(process.cwd(), 'storage');
  }

  const storagePath = trimValue(env.storagePath);
  if (storagePath) {
    return storagePath;
  }

  const envStoragePath = trimValue(process.env.STORAGE_PATH);
  if (envStoragePath) {
    return path.isAbsolute(envStoragePath) ? envStoragePath : path.resolve(process.cwd(), envStoragePath);
  }

  return path.resolve(process.cwd(), 'storage');
}

export async function createPortalWorkspace(options: PortalCreateOptions): Promise<PortalCreateResult> {
  const portal = validatePortalSlug(options.portal);
  const title = trimValue(options.title) || titleFromPortalSlug(portal);
  const portalConfig = buildPortalConfig({
    portal,
    sourceStorage: options.sourceStorage,
    gitRepo: options.gitRepo,
    gitBranch: options.gitBranch,
    gitPath: options.gitPath,
  });
  const apiBaseUrl = trimValue(options.env.apiBaseUrl);
  const envApiUrl = resolvePortalEnvApiUrl(apiBaseUrl);
  const storagePath = resolvePortalStoragePath(options.env);
  const { app, appPublicPath } = await resolvePortalAppContext(options);
  const portalBase = buildPortalBasePath({ app, appPublicPath, portal });
  const portalParentDir = path.join(storagePath, 'portals', app);
  const portalDir = path.join(portalParentDir, portal);

  assertPortalDirIsInsideParent(portalParentDir, portalDir);
  const targetExists = await pathExists(portalDir);
  if (targetExists && !options.force) {
    throw new Error(
      portalCreateText(
        'errors.workspaceExists',
        { portalDir },
        `Portal already exists: ${portalDir}\nPass --force to delete it and create a new portal.`,
      ),
    );
  }

  const template = await resolvePortalTemplate(options.template, {
    npmRegistry: trimValue(options.env.config.npmRegistry),
    runCommand: options.runCommand,
  });
  await mkdir(portalParentDir, { recursive: true });
  const tempDir = await mkdtemp(safeTempPrefix(portalParentDir, portal));
  let shouldCleanupTempDir = true;

  try {
    await copyTemplate(template.dir, tempDir);
    await ensurePortalBuildHtmlReadsEnvOnly(tempDir);
    await writeFile(
      path.join(tempDir, '.env'),
      [`NOCOBASE_API_URL=${envApiUrl}`, `NOCOBASE_PORTAL_BASE=${portalBase}`].join('\n') + '\n',
      'utf-8',
    );
    await writeFile(
      path.join(tempDir, '.env.local'),
      [`NOCOBASE_API_URL=${apiBaseUrl}`, `NOCOBASE_PORTAL_BASE=${portalBase}`].join('\n') + '\n',
      'utf-8',
    );
    await writePortalConfig(tempDir, portalConfig);

    if (targetExists) {
      await rm(portalDir, { recursive: true, force: true });
    }

    await rename(tempDir, portalDir);
    shouldCleanupTempDir = false;

    const hasPackageJson = await pathExists(path.join(portalDir, 'package.json'));
    let dependenciesInstalled = false;
    let installFailed = false;
    if (hasPackageJson) {
      const runCommand = options.runCommand ?? run;
      const installCommand = await resolvePnpmInstallCommand(portalDir);
      try {
        await runPnpmInstallCommand(runCommand, installCommand.args, {
          cwd: portalDir,
          env: buildPortalCommandEnv(),
          envMode: 'replace',
          errorName: installCommand.errorName,
        });
        dependenciesInstalled = true;
      } catch {
        installFailed = true;
      }
    } else {
      options.onSkipInstall?.(
        portalCreateText(
          'messages.skipInstall',
          { portalDir },
          `Skipped pnpm install because package.json was not found in ${portalDir}.`,
        ),
      );
    }

    if (options.apiRequest || options.cliVersion !== undefined || options.envName !== undefined) {
      await syncMultiPortalRecord({
        portal,
        title,
        config: portalConfig,
        envName: options.envName,
        cliVersion: options.cliVersion,
        apiRequest: options.apiRequest,
      });
    }

    return {
      portalDir,
      app,
      portal,
      title,
      apiBaseUrl,
      portalBase,
      template,
      installSkipped: !hasPackageJson,
      dependenciesInstalled,
      installFailed,
      sourceStorage: portalConfig.sourceStorage,
    };
  } finally {
    if (shouldCleanupTempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
    await template.cleanup?.();
  }
}
