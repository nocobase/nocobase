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
import type { Env } from './auth-store.js';
import { resolveEnvRelativePath } from './cli-home.js';
import { translateCli } from './cli-locale.js';
import { buildPortalCommandEnv } from './portal-command-env.js';
import { run } from './run-npm.js';

const DEFAULT_PORTAL_TEMPLATE = '@nocobase/portal-template-default';
const DEFAULT_PORTAL_APP_NAME = 'main';
const TEMPLATE_COPY_EXCLUDED_NAMES = new Set(['.git', 'node_modules', '.DS_Store', 'dist']);
const NPM_PACK_TIMEOUT_MS = 30_000;

type TemplateSourceType = 'local' | 'package';

type RunOptions = {
  cwd?: string;
  env?: Record<string, string>;
  envMode?: 'inherit' | 'replace';
  errorName?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
  timeoutMs?: number;
};

type RunCommand = (name: string, args: string[], options?: RunOptions) => Promise<void>;
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
  force?: boolean;
  runCommand?: RunCommand;
  onSkipInstall?: (message: string) => void;
};

export type ResolvedPortalApp = {
  app: string;
  appPublicPath: string;
};

export type ResolvedPortalTemplate = {
  dir: string;
  source: string;
  type: TemplateSourceType;
  cleanup?: () => Promise<void>;
};

export type PortalConfig = {
  schemaVersion: 1;
  app: string;
  name: string;
  title: string;
  basePath: string;
  apiBaseUrl: string;
  template: {
    type: TemplateSourceType;
    source: string;
  };
  createdBy: 'nb portal create';
  createdAt: string;
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
        `Refusing to modify a Portal workspace outside ${parentDir}: ${portalDir}`,
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
          `Failed to extract Portal template "${params.source}": ${message}`,
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
        `Failed to download Portal template "${params.source}" with npm pack. ${details}`,
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
        `Invalid Portal name "${value}". Use lowercase letters, numbers, underscores, or hyphens, ` +
          'and start with a lowercase letter or number.',
      ),
    );
  }
  return portal;
}

function validatePortalAppName(value: string): string {
  const app = trimValue(value);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(app)) {
    throw new Error(
      portalCreateText(
        'errors.invalidPortalAppName',
        { value },
        `Invalid Portal app name "${value}" from apiBaseUrl. Use letters, numbers, underscores, or hyphens, ` +
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
        'Cannot create a Portal workspace because the selected env has no apiBaseUrl.',
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
      portalCreateText('errors.sshUnsupported', undefined, 'Cannot create a Portal workspace for ssh envs in the first version.'),
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
  const apiBaseUrl = trimValue(options.env.apiBaseUrl);
  const envApiUrl = resolvePortalEnvApiUrl(apiBaseUrl);
  const storagePath = resolvePortalStoragePath(options.env);
  const { app, appPublicPath } = resolvePortalAppFromApiBaseUrl(apiBaseUrl, options.env.config.appPublicPath);
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
        `Portal workspace already exists: ${portalDir}\nPass --force to delete it and create a new workspace.`,
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
    const portalConfig: PortalConfig = {
      schemaVersion: 1,
      app,
      name: portal,
      title,
      basePath: portalBase,
      apiBaseUrl,
      template: {
        type: template.type,
        source: template.source,
      },
      createdBy: 'nb portal create',
      createdAt: new Date().toISOString(),
    };
    await writeFile(path.join(tempDir, 'portal.config.json'), `${JSON.stringify(portalConfig, null, 2)}\n`, 'utf-8');

    if (targetExists) {
      await rm(portalDir, { recursive: true, force: true });
    }

    await rename(tempDir, portalDir);
    shouldCleanupTempDir = false;

    const hasPackageJson = await pathExists(path.join(portalDir, 'package.json'));
    if (hasPackageJson) {
      const runCommand = options.runCommand ?? run;
      await runCommand('pnpm', ['install'], {
        cwd: portalDir,
        env: buildPortalCommandEnv(),
        envMode: 'replace',
        errorName: 'pnpm install',
      });
    } else {
      options.onSkipInstall?.(
        portalCreateText(
          'messages.skipInstall',
          { portalDir },
          `Skipped pnpm install because package.json was not found in ${portalDir}.`,
        ),
      );
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
    };
  } finally {
    if (shouldCleanupTempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
    await template.cleanup?.();
  }
}
