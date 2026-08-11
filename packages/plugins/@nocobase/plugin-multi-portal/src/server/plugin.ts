/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor, Plugin, PortalHostSupervisor, appendToBuiltInPlugins } from '@nocobase/server';
import type { ResourcerContext } from '@nocobase/resourcer';
import {
  Op,
  Repository,
  UniqueConstraintError,
  type CreateOptions,
  type Database,
  type FirstOrCreateOptions,
  type Model,
  type Transaction,
  type UpdateOptions,
} from '@nocobase/database';
import { koaMulter as multer, storagePathJoin } from '@nocobase/utils';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';
import { createGunzip } from 'zlib';
import {
  applyDefaultRoleMultiPortalAccess,
  ensureDefaultRoleMultiPortalAccess,
} from './ensureDefaultRoleMultiPortalAccess';
import {
  ADMIN_UI_LAYOUT_UID,
  DEFAULT_ADMIN_MULTI_PORTAL_UID,
  DEFAULT_MOBILE_MULTI_PORTAL_UID,
  NAMESPACE,
  MOBILE_UI_LAYOUT_UID,
  MULTI_PORTAL_UI_LAYOUT_UIDS,
  getMultiPortalLayoutType,
  isDefaultLayoutMultiPortalUid,
  isMultiPortalUiLayoutUid,
  type MultiPortalLayoutType,
  type MultiPortalUiLayoutUid,
} from '../constants';

const MULTI_PORTAL_RUNTIME_FIELDS = [
  'uid',
  'title',
  'portalType',
  'portalName',
  'routePath',
  'authCheck',
  'enabled',
  'uiLayoutUid',
] as const;
const MULTI_PORTAL_ACCESSIBLE_FIELDS = [
  'uid',
  'title',
  'icon',
  'portalType',
  'portalName',
  'routePath',
  'authCheck',
  'enabled',
  'uiLayoutUid',
] as const;
const DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS = ['id', 'title', 'hidden', 'parentId', 'options'] as const;
const UI_LAYOUT_DESKTOP_ROUTE_WRITE_LAYOUT_HANDLER_TAG = 'plugin-ui-layout:desktop-route-write-layout';
const MAIN_APP_NAME = 'main';
const UNION_ROLE_KEY = '__union__';
const MULTI_PORTAL_MANIFEST_NAMESPACE = 'multi-portal';
const MULTI_PORTAL_MANIFEST_SYNC_MESSAGE_TYPE = 'multi-portal:app-manifest-changed';
const DEFAULT_INIT_PORTAL_TEMPLATE = '@nocobase/portal-template-default';
const PORTAL_CLIENT_PREFIX = 'x';
const PORTAL_DEPLOY_UPLOAD_LIMIT = 200 * 1024 * 1024;
const PORTAL_DEPLOY_UPLOAD_DIR_PREFIX = 'nocobase-portal-dist-upload-';
const PORTAL_DIST_DIR = 'dist';
const PORTAL_CLIENT_DIST_DIR = path.join(PORTAL_DIST_DIR, 'client');
const PORTAL_RAW_INDEX_HTML = 'index.raw.html';
const PORTAL_PUBLIC_DIR_MODE = 0o755;
const PORTAL_PUBLIC_FILE_MODE = 0o644;
const PORTAL_TEMPLATE_NPM_PACK_TIMEOUT_MS = 30_000;
const DEFAULT_MULTI_PORTAL_UID = '__default_portal__';
const MULTI_PORTAL_SLUG_PATTERN = /^[a-z0-9_-]+$/;
const PORTAL_ACCESS_DENIED_CODE = 'PORTAL_ACCESS_DENIED';
const PORTAL_CONTEXT_INVALID_CODE = 'PORTAL_CONTEXT_INVALID';
const PORTAL_NOT_FOUND_CODE = 'PORTAL_NOT_FOUND';
const MULTI_PORTAL_MANAGEMENT_ACTIONS = [
  'multiPortals:list',
  'multiPortals:get',
  'multiPortals:getLog',
  'multiPortals:create',
  'multiPortals:update',
  'multiPortals:firstOrCreate',
  'multiPortals:setDefault',
  'multiPortals:destroy',
  'multiPortals:deploy',
  'multiPortals:pullSource',
  'multiPortals:pushSource',
  'desktopRoutes:list',
  'desktopRoutes:get',
  'desktopRoutes:create',
  'desktopRoutes:update',
  'desktopRoutes:move',
  'desktopRoutes:destroy',
  'desktopRoutes:updateOrCreate',
  'registry:list',
  'registry:get',
];

type PortalDeployTarEntry = {
  type?: unknown;
  linkpath?: unknown;
};
const ROLE_MULTI_PORTAL_PERMISSION_ACTIONS = [
  'roles.multiPortals:*',
  'rolesMultiPortalDesktopRoutes:*',
  'rolesMultiPortalRoutePolicies:*',
];

type MultiPortalRuntimeField = (typeof MULTI_PORTAL_RUNTIME_FIELDS)[number];
type MultiPortalAccessibleField = (typeof MULTI_PORTAL_ACCESSIBLE_FIELDS)[number];
type DesktopRouteRolePermissionTargetField = (typeof DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS)[number];
type DesktopRouteCreateValue = Record<string, unknown> & {
  children?: unknown;
  multiPortals?: unknown;
  uiLayouts?: unknown;
};
type DesktopRouteId = string | number;
type DesktopRouteOwnerRelation = 'multiPortals' | 'uiLayouts';
type DesktopRouteOwnerScope = {
  filter: Record<string, string>;
  relation: DesktopRouteOwnerRelation;
  uid: string;
};
type DesktopRouteMutationSelector = {
  filter?: unknown;
  filterByTk?: unknown;
  values?: unknown;
};
interface MultiPortalAccessContext extends DesktopRouteOwnerScope {
  portalUid: string;
  uiLayoutUid: MultiPortalUiLayoutUid;
}
interface MultiPortalRequestResult {
  portal?: Model;
  requested: boolean;
  scope?: MultiPortalAccessContext;
}
type DatabaseHookOptions = {
  transaction?: Transaction;
  context?: ResourcerContext;
};
type GrantDefaultAccessOptions = {
  includeDefaultLayoutMultiPortal?: boolean;
};
const MULTI_PORTAL_SEED_TYPES = ['no-code', 'ai'] as const;
type MultiPortalSeedType = (typeof MULTI_PORTAL_SEED_TYPES)[number];
const MULTI_PORTAL_SEED_TYPE_SET = new Set<string>(MULTI_PORTAL_SEED_TYPES);

function isMultiPortalSeedType(value: unknown): value is MultiPortalSeedType {
  return typeof value === 'string' && MULTI_PORTAL_SEED_TYPE_SET.has(value);
}

type DefaultMultiPortalRecord = {
  uid: string;
  title: string;
  icon: string;
  portalType: MultiPortalSeedType;
  portalName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
  isDefault?: true;
  uiLayoutUid: MultiPortalUiLayoutUid;
};
type AppPortalManifestItem = {
  uid: string;
  title: string;
  icon?: string | null;
  portalType?: string | null;
  routePath: string;
  layout: MultiPortalLayoutType;
};
type AppPortalManifestSyncMessage = {
  type: typeof MULTI_PORTAL_MANIFEST_SYNC_MESSAGE_TYPE;
  appName: string;
  namespace: typeof MULTI_PORTAL_MANIFEST_NAMESPACE;
  itemKey?: string;
  action: 'set' | 'remove' | 'clear';
};
type MultiPortalStorageItem = {
  appName: string;
  portalName: string;
  enabled: boolean;
};
type UploadedFile = {
  path?: string;
  size?: number;
  originalname?: string;
};
type ModelWithPrevious = Model & {
  previous?: (field: string) => unknown;
};
type PortalStorageCommandOptions = {
  cwd: string;
  env: NodeJS.ProcessEnv;
  logPath: string;
  timeoutMs?: number;
};
type PortalStorageCommandError = Error & {
  code?: string | number | null;
  signal?: NodeJS.Signals | null;
  cmd?: string;
};
const SKIP_CREATE_PORTAL_DIRECTORY = Symbol('skipCreatePortalDirectory');
type MultiPortalResourcerContext = ResourcerContext & {
  [SKIP_CREATE_PORTAL_DIRECTORY]?: boolean;
};
type MultiPortalDeployContext = ResourcerContext & {
  request: ResourcerContext['request'] & {
    file?: UploadedFile;
    body?: Record<string, unknown>;
  };
};
type ResolvedPortalTemplate = {
  dir: string;
  includeDist?: boolean;
  cleanup?: () => Promise<void>;
};
type NormalizeLegacyPortalClientDistOptions = {
  overwriteClient?: boolean;
};

function getRecordField(record: unknown, field: string) {
  if (!record || typeof record !== 'object') {
    return;
  }

  const maybeModel = record as {
    get?: (field: string) => unknown;
  };
  if (typeof maybeModel.get === 'function') {
    return maybeModel.get(field);
  }

  return (record as Record<string, unknown>)[field];
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function trimString(value: unknown) {
  return String(value ?? '').trim();
}

function getInitPortalTemplate() {
  return trimString(process.env.INIT_PORTAL_TEMPLATE) || DEFAULT_INIT_PORTAL_TEMPLATE;
}

function hasDeprecatedInitPortalEnv() {
  return Boolean(trimString(process.env.INIT_PORTAL_TYPE) || trimString(process.env.INIT_PORTAL_NAME));
}

function getDefaultAiMultiPortalRecord(options: { isDefault?: true } = {}): DefaultMultiPortalRecord {
  return {
    uid: DEFAULT_MULTI_PORTAL_UID,
    title: 'Main',
    icon: 'DesktopOutlined',
    portalType: 'ai',
    portalName: 'main',
    routePath: '/main',
    authCheck: true,
    enabled: true,
    ...(options.isDefault ? { isDefault: true } : {}),
    uiLayoutUid: ADMIN_UI_LAYOUT_UID,
  };
}

function getFreshMultiPortalRecords(): DefaultMultiPortalRecord[] {
  return [getDefaultAiMultiPortalRecord({ isDefault: true }), ...getFixedLayoutMultiPortalRecords()];
}

function getFixedLayoutMultiPortalRecords(): DefaultMultiPortalRecord[] {
  return [
    {
      uid: DEFAULT_ADMIN_MULTI_PORTAL_UID,
      title: 'Desktop layout',
      icon: 'DesktopOutlined',
      portalType: 'no-code',
      portalName: 'admin',
      routePath: '/admin',
      authCheck: true,
      enabled: true,
      uiLayoutUid: ADMIN_UI_LAYOUT_UID,
    },
    {
      uid: DEFAULT_MOBILE_MULTI_PORTAL_UID,
      title: 'Mobile layout',
      icon: 'MobileOutlined',
      portalType: 'no-code',
      portalName: 'mobile',
      routePath: '/mobile',
      authCheck: true,
      enabled: true,
      uiLayoutUid: MOBILE_UI_LAYOUT_UID,
    },
  ];
}

function getFixedLayoutMultiPortalRecord(uid: unknown) {
  return getFixedLayoutMultiPortalRecords().find((portal) => portal.uid === uid);
}

function isValidPortalDeploySegment(value: string) {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function normalizePortalStorageName(value: unknown) {
  return trimString(value).replace(/^\/+|\/+$/g, '');
}

function normalizePortalStoragePath(value: unknown, fallbackName: string) {
  const segment = trimString(value).replace(/^\/+|\/+$/g, '');
  return `/${segment || fallbackName}`;
}

function resolvePortalStoragePublicPath(value: unknown) {
  const normalized = trimString(value) || '/';
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function joinPortalStoragePublicPath(publicPath: string, pathname: string) {
  const normalizedPublicPath = resolvePortalStoragePublicPath(publicPath);
  const normalizedPathname = normalizePortalStoragePath(pathname, '').replace(/^\/+/, '');
  return `${normalizedPublicPath.replace(/\/$/, '')}/${normalizedPathname}`.replace(/^\/{2,}/, '/');
}

function isAbsoluteUrl(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) || value.startsWith('//');
}

function normalizePortalStorageUrlPathname(pathname: string) {
  const normalized = pathname.replace(/\/+/g, '/');
  return normalized === '/' ? normalized : normalized.replace(/\/+$/, '');
}

function resolvePortalStorageEnvApiUrl(apiUrl: string) {
  try {
    const parsedUrl = new URL(apiUrl.startsWith('//') ? `http:${apiUrl}` : apiUrl);
    return normalizePortalStorageUrlPathname(parsedUrl.pathname);
  } catch {
    const [pathname] = apiUrl.split(/[?#]/, 1);
    const withLeadingSlash = pathname?.startsWith('/') ? pathname : `/${pathname || 'api'}`;
    return normalizePortalStorageUrlPathname(withLeadingSlash);
  }
}

function appendPortalStorageSubAppApiUrl(apiUrl: string, appName: string) {
  if (appName === MAIN_APP_NAME) {
    return apiUrl;
  }

  const subAppApiPath = `/__app/${encodeURIComponent(appName)}`;
  const subAppApiPathPattern = new RegExp(`/__app/${appName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`);
  if (subAppApiPathPattern.test(apiUrl)) {
    return apiUrl;
  }

  if (isAbsoluteUrl(apiUrl)) {
    const url = new URL(apiUrl.startsWith('//') ? `http:${apiUrl}` : apiUrl);
    if (!subAppApiPathPattern.test(url.pathname)) {
      url.pathname = `${url.pathname.replace(/\/+$/, '')}${subAppApiPath}`;
    }
    const value = url.toString();
    return apiUrl.startsWith('//') ? value.replace(/^http:/, '') : value;
  }

  return `${apiUrl.replace(/\/+$/, '')}${subAppApiPath}`;
}

function getPortalStorageApiUrl(appName: string) {
  const configuredApiUrl = trimString(
    process.env.NOCOBASE_API_URL || process.env.API_BASE_URL || process.env.API_BASE_PATH,
  );
  const apiUrl = configuredApiUrl || '/api';
  if (isAbsoluteUrl(apiUrl)) {
    return appendPortalStorageSubAppApiUrl(apiUrl, appName);
  }

  const normalizedApiPath = normalizePortalStoragePath(apiUrl, 'api');
  const appPublicPath = resolvePortalStoragePublicPath(process.env.APP_PUBLIC_PATH || '/');
  if (appPublicPath === '/' || normalizedApiPath === appPublicPath.slice(0, -1)) {
    return appendPortalStorageSubAppApiUrl(normalizedApiPath, appName);
  }

  if (normalizedApiPath.startsWith(appPublicPath)) {
    return appendPortalStorageSubAppApiUrl(normalizedApiPath, appName);
  }

  return appendPortalStorageSubAppApiUrl(joinPortalStoragePublicPath(appPublicPath, normalizedApiPath), appName);
}

function getPortalDeployBasePath(appName: string, portalName: string) {
  const portalPath =
    appName === MAIN_APP_NAME
      ? `/${PORTAL_CLIENT_PREFIX}/${portalName}/`
      : `/${PORTAL_CLIENT_PREFIX}/apps/${appName}/${portalName}/`;
  return resolvePortalStoragePublicPath(joinPortalStoragePublicPath(process.env.APP_PUBLIC_PATH || '/', portalPath));
}

function getPortalDeployBasePathCandidates(appName: string, portalName: string) {
  const expectedBasePaths = [getPortalDeployBasePath(appName, portalName)];
  if (appName !== MAIN_APP_NAME) {
    expectedBasePaths.push(getPortalDeployBasePath(MAIN_APP_NAME, portalName));
  }
  return expectedBasePaths;
}

function createPortalDeployUploadMiddleware() {
  const storage = multer.diskStorage({
    destination: os.tmpdir(),
    filename: function (_req, _file, cb) {
      const randomName = Date.now().toString() + Math.random().toString().slice(2);
      cb(null, randomName);
    },
  });
  const upload = multer({
    storage,
    limits: {
      fileSize: PORTAL_DEPLOY_UPLOAD_LIMIT,
    },
  }).single('file');

  return async (ctx: ResourcerContext, next: () => Promise<void>) => {
    if (
      ctx.action.resourceName !== 'multiPortals' ||
      (ctx.action.actionName !== 'deploy' && ctx.action.actionName !== 'pushSource')
    ) {
      await next();
      return;
    }
    await upload(ctx, next);
  };
}

function isValidPortalStorageName(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value);
}

function getPortalStorageLogPath(item: Pick<MultiPortalStorageItem, 'appName' | 'portalName'>) {
  return storagePathJoin('logs', 'portals', item.appName, `${item.portalName}.log`);
}

function getPortalStorageLogRelativePath(item: Pick<MultiPortalStorageItem, 'appName' | 'portalName'>) {
  return path.join('logs', 'portals', item.appName, `${item.portalName}.log`);
}

async function ensurePortalStorageLogFile(logPath: string) {
  await fs.promises.mkdir(path.dirname(logPath), { recursive: true });
}

async function appendPortalStorageLog(logPath: string, message: string) {
  await ensurePortalStorageLogFile(logPath);
  await fs.promises.appendFile(logPath, `[${new Date().toISOString()}] ${message}\n`, 'utf-8');
}

function formatPortalStorageCommand(command: string, args: string[]) {
  return [command, ...args].join(' ');
}

function getLocalPortalTemplatePath(templateSource: string): string | null {
  if (templateSource.startsWith('file://')) {
    try {
      return fileURLToPath(templateSource);
    } catch {
      return null;
    }
  }
  if (path.isAbsolute(templateSource) || templateSource.startsWith('./') || templateSource.startsWith('../')) {
    return path.resolve(templateSource);
  }
  return null;
}

async function resolveLocalPortalTemplate(templateSource: string): Promise<ResolvedPortalTemplate | null> {
  const localPath = getLocalPortalTemplatePath(templateSource);
  if (!localPath) {
    return null;
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(localPath);
  } catch {
    throw new Error(`Portal template "${templateSource}" is invalid: local directory does not exist.`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`Portal template "${templateSource}" is invalid: expected a directory.`);
  }
  if (!(await pathExists(path.join(localPath, 'package.json')))) {
    throw new Error(`Portal template "${templateSource}" is invalid: package.json is missing.`);
  }
  return { dir: localPath };
}

function resolveInstalledPortalTemplatePackage(templatePackage: string): ResolvedPortalTemplate | null {
  try {
    return { dir: path.dirname(require.resolve(`${templatePackage}/package.json`)), includeDist: true };
  } catch {
    return null;
  }
}

async function resolvePackedPortalTemplateTarball(packRoot: string, templatePackage: string): Promise<string> {
  const entries = await fs.promises.readdir(packRoot, { withFileTypes: true });
  const tarballs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tgz'))
    .map((entry) => path.join(packRoot, entry.name))
    .sort();

  if (tarballs.length === 1) {
    return tarballs[0];
  }
  if (!tarballs.length) {
    throw new Error(`npm pack did not produce a local tarball for ${templatePackage}.`);
  }
  throw new Error(`npm pack produced multiple tarballs for ${templatePackage}.`);
}

async function downloadPortalTemplatePackage(
  templatePackage: string,
  logPath: string,
): Promise<ResolvedPortalTemplate> {
  const packRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-pack-'));
  const extractRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-extract-'));
  let cleanupPackRoot = true;
  let cleanupExtractRoot = true;

  try {
    await runPortalStorageCommandOnce('npm', ['pack', '--silent', templatePackage], {
      cwd: packRoot,
      env: getPortalStorageCommandEnv(),
      logPath,
      timeoutMs: PORTAL_TEMPLATE_NPM_PACK_TIMEOUT_MS,
    });
    const tarballPath = await resolvePackedPortalTemplateTarball(packRoot, templatePackage);
    await pipeline(fs.createReadStream(tarballPath), createGunzip(), tar.extract({ cwd: extractRoot, strip: 1 }));
    if (!(await pathExists(path.join(extractRoot, 'package.json')))) {
      throw new Error(`Portal template package "${templatePackage}" is invalid: package.json is missing.`);
    }

    cleanupPackRoot = false;
    cleanupExtractRoot = false;
    return {
      dir: extractRoot,
      includeDist: true,
      cleanup: async () => {
        await fs.promises.rm(packRoot, { recursive: true, force: true });
        await fs.promises.rm(extractRoot, { recursive: true, force: true });
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to download portal template package "${templatePackage}" with npm pack. ${message}`);
  } finally {
    if (cleanupPackRoot) {
      await fs.promises.rm(packRoot, { recursive: true, force: true });
    }
    if (cleanupExtractRoot) {
      await fs.promises.rm(extractRoot, { recursive: true, force: true });
    }
  }
}

async function resolvePortalTemplate(templateSource: string, logPath: string): Promise<ResolvedPortalTemplate> {
  const localTemplate = await resolveLocalPortalTemplate(templateSource);
  if (localTemplate) {
    return localTemplate;
  }

  const installedTemplate = resolveInstalledPortalTemplatePackage(templateSource);
  if (installedTemplate) {
    return installedTemplate;
  }

  return downloadPortalTemplatePackage(templateSource, logPath);
}

async function copyPortalTemplate(
  sourceDir: string,
  targetDir: string,
  options?: {
    includeDist?: boolean;
  },
): Promise<void> {
  const ignoredSegments = new Set(['.git', 'node_modules', '.DS_Store', '.env', '.env.local']);
  if (!options?.includeDist) {
    ignoredSegments.add('dist');
  }
  await fs.promises.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.promises.cp(sourceDir, targetDir, {
    recursive: true,
    filter: (source) =>
      !path
        .relative(sourceDir, source)
        .split(path.sep)
        .some((segment) => segment.startsWith('._') || ignoredSegments.has(segment)),
  });
}

async function copyPortalTemplateDist(sourceDir: string, targetDir: string): Promise<boolean> {
  const sourceDistDir = path.join(sourceDir, PORTAL_DIST_DIR);
  if (!(await pathExists(path.join(sourceDistDir, PORTAL_RAW_INDEX_HTML)))) {
    return false;
  }

  await fs.promises.mkdir(path.dirname(path.join(targetDir, PORTAL_DIST_DIR)), { recursive: true });
  await fs.promises.cp(sourceDistDir, path.join(targetDir, PORTAL_DIST_DIR), {
    recursive: true,
    filter: (source) =>
      !path
        .relative(sourceDistDir, source)
        .split(path.sep)
        .some((segment) => segment.startsWith('._') || segment === '.DS_Store'),
  });
  return true;
}

async function restorePortalTemplateDist(portalDir: string, logPath: string): Promise<boolean> {
  if (await pathExists(path.join(portalDir, PORTAL_DIST_DIR, PORTAL_RAW_INDEX_HTML))) {
    return false;
  }

  const template = await resolvePortalTemplate(getInitPortalTemplate(), logPath);
  try {
    if (!template.includeDist) {
      return false;
    }
    const copied = await copyPortalTemplateDist(template.dir, portalDir);
    if (copied) {
      await appendPortalStorageLog(logPath, `Default portal template dist restored from ${template.dir}.`);
    }
    return copied;
  } finally {
    await template.cleanup?.();
  }
}

async function getLegacyPortalClientDistEntries(portalDir: string): Promise<fs.Dirent[]> {
  return getLegacyPortalClientDistRootEntries(path.join(portalDir, PORTAL_DIST_DIR));
}

async function getLegacyPortalClientDistRootEntries(distDir: string): Promise<fs.Dirent[]> {
  const legacyIndexPath = path.join(distDir, 'index.html');

  if (!(await pathExists(legacyIndexPath))) {
    return [];
  }

  const entries = await fs.promises.readdir(distDir, { withFileTypes: true });
  return entries.filter((entry) => entry.name !== 'client' && entry.name !== PORTAL_RAW_INDEX_HTML);
}

async function normalizeLegacyPortalClientDistRoot(distDir: string): Promise<boolean> {
  const clientDir = path.join(distDir, 'client');
  const clientIndexPath = path.join(clientDir, 'index.html');

  if (await pathExists(clientIndexPath)) {
    return false;
  }

  const legacyEntries = await getLegacyPortalClientDistRootEntries(distDir);
  if (!legacyEntries.length) {
    return false;
  }

  await fs.promises.mkdir(clientDir, { recursive: true });

  for (const entry of legacyEntries) {
    const sourcePath = path.join(distDir, entry.name);
    const targetPath = path.join(clientDir, entry.name);
    await fs.promises.rm(targetPath, { recursive: true, force: true });
    await movePortalDeployDir(sourcePath, targetPath);
  }

  return true;
}

async function removeLegacyPortalClientDist(portalDir: string, logPath?: string): Promise<boolean> {
  if (await pathExists(path.join(portalDir, PORTAL_DIST_DIR, PORTAL_RAW_INDEX_HTML))) {
    return false;
  }

  const legacyEntries = await getLegacyPortalClientDistEntries(portalDir);
  if (!legacyEntries.length) {
    return false;
  }

  const distDir = path.join(portalDir, PORTAL_DIST_DIR);
  await Promise.all(
    legacyEntries.map((entry) => fs.promises.rm(path.join(distDir, entry.name), { recursive: true, force: true })),
  );

  if (logPath) {
    await appendPortalStorageLog(logPath, 'Removed stale legacy portal dist/index.html output.');
  }

  return true;
}

async function normalizeLegacyPortalClientDist(
  portalDir: string,
  logPath?: string,
  options?: NormalizeLegacyPortalClientDistOptions,
): Promise<boolean> {
  const clientDir = path.join(portalDir, PORTAL_CLIENT_DIST_DIR);
  const clientIndexPath = path.join(clientDir, 'index.html');

  if (!options?.overwriteClient && (await pathExists(clientIndexPath))) {
    return false;
  }

  const legacyEntries = await getLegacyPortalClientDistEntries(portalDir);
  if (!legacyEntries.length) {
    return false;
  }

  const distDir = path.join(portalDir, PORTAL_DIST_DIR);
  await fs.promises.mkdir(clientDir, { recursive: true });

  for (const entry of legacyEntries) {
    const sourcePath = path.join(distDir, entry.name);
    const targetPath = path.join(clientDir, entry.name);
    await fs.promises.rm(targetPath, { recursive: true, force: true });
    await movePortalDeployDir(sourcePath, targetPath);
  }

  if (logPath) {
    await appendPortalStorageLog(logPath, 'Moved legacy portal dist/index.html output into dist/client/.');
  }

  return true;
}

function sanitizePortalStorageNodeOptions(value: unknown) {
  return trimString(value)
    .split(/\s+/)
    .filter((option) => option !== '--preserve-symlinks' && option !== '--preserve-symlinks-main')
    .join(' ');
}

function getPortalStorageCommandEnv(env: NodeJS.ProcessEnv = {}) {
  const commandEnv = { ...process.env, ...env };
  const nodeOptions = sanitizePortalStorageNodeOptions(commandEnv.NODE_OPTIONS);
  if (nodeOptions) {
    commandEnv.NODE_OPTIONS = nodeOptions;
  } else {
    delete commandEnv.NODE_OPTIONS;
  }
  return commandEnv;
}

async function runPortalStorageCommandOnce(command: string, args: string[], options: PortalStorageCommandOptions) {
  await appendPortalStorageLog(options.logPath, `Running command: ${formatPortalStorageCommand(command, args)}`);
  await ensurePortalStorageLogFile(options.logPath);

  const logStream = fs.createWriteStream(options.logPath, { flags: 'a' });
  const subprocess = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    shell: false,
  });
  let timeout: NodeJS.Timeout | undefined;
  if (options.timeoutMs && options.timeoutMs > 0) {
    timeout = setTimeout(() => {
      subprocess.kill?.('SIGTERM');
    }, options.timeoutMs);
  }

  subprocess.stdout?.pipe(logStream, { end: false });
  subprocess.stderr?.pipe(logStream, { end: false });

  let result: { code: number | null; signal: NodeJS.Signals | null };
  try {
    result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
      subprocess.once('error', reject);
      subprocess.once('close', (code, signal) => {
        if (timeout) {
          clearTimeout(timeout);
        }
        resolve({ code, signal });
      });
    });
    await new Promise<void>((resolve, reject) => {
      const handleError = (error: Error) => {
        reject(error);
      };
      logStream.once('error', handleError);
      logStream.end(() => {
        logStream.off('error', handleError);
        resolve();
      });
    });
  } catch (error) {
    if (timeout) {
      clearTimeout(timeout);
    }
    logStream.end();
    await appendPortalStorageLog(options.logPath, `Command failed to start: ${command}`);
    throw error;
  }

  await appendPortalStorageLog(
    options.logPath,
    `Command finished: ${formatPortalStorageCommand(command, args)} exitCode=${result.code ?? ''} signal=${
      result.signal ?? ''
    }`,
  );

  if (result.signal) {
    const error = new Error(
      `Command failed with signal ${result.signal}: ${formatPortalStorageCommand(command, args)}`,
    ) as PortalStorageCommandError;
    error.code = result.code;
    error.signal = result.signal;
    error.cmd = formatPortalStorageCommand(command, args);
    throw error;
  }

  if (result.code && result.code !== 0) {
    const error = new Error(
      `Command failed with exit code ${result.code}: ${formatPortalStorageCommand(command, args)}`,
    ) as PortalStorageCommandError;
    error.code = result.code;
    error.signal = result.signal;
    error.cmd = formatPortalStorageCommand(command, args);
    throw error;
  }
}

function hasRequestAppHeader(options?: DatabaseHookOptions) {
  return Boolean(trimString(options?.context?.get('X-App')));
}

async function buildPortalStorageItem(
  portalDir: string,
  item: MultiPortalStorageItem,
  options?: DatabaseHookOptions,
): Promise<void> {
  const logPath = getPortalStorageLogPath(item);
  const buildAppName = hasRequestAppHeader(options) ? item.appName : MAIN_APP_NAME;
  const apiUrl = getPortalStorageApiUrl(buildAppName);
  const buildEnv = getPortalStorageCommandEnv({
    NOCOBASE_PORTAL_NAME: item.portalName,
    NOCOBASE_API_PROXY_TARGET: apiUrl,
    NOCOBASE_API_URL: apiUrl,
    NOCOBASE_PORTAL_BASE: getPortalDeployBasePath(buildAppName, item.portalName),
    SKIP_YARN_COREPACK_CHECK: '1',
    COREPACK_ENABLE_STRICT: '0',
    COREPACK_ENABLE_PROJECT_SPEC: '0',
  });
  await appendPortalStorageLog(logPath, `Building portal ${item.appName}/${item.portalName}.`);
  await appendPortalStorageLog(
    logPath,
    `Build environment: NOCOBASE_PORTAL_NAME=${buildEnv.NOCOBASE_PORTAL_NAME || ''} NOCOBASE_API_PROXY_TARGET=${
      buildEnv.NOCOBASE_API_PROXY_TARGET || ''
    } NOCOBASE_API_URL=${buildEnv.NOCOBASE_API_URL || ''} NOCOBASE_PORTAL_BASE=${
      buildEnv.NOCOBASE_PORTAL_BASE || ''
    } APP_PUBLIC_PATH=${buildEnv.APP_PUBLIC_PATH || ''} SKIP_YARN_COREPACK_CHECK=${
      buildEnv.SKIP_YARN_COREPACK_CHECK || ''
    } COREPACK_ENABLE_STRICT=${buildEnv.COREPACK_ENABLE_STRICT || ''} COREPACK_ENABLE_PROJECT_SPEC=${
      buildEnv.COREPACK_ENABLE_PROJECT_SPEC || ''
    }`,
  );
  await restorePortalTemplateDist(portalDir, logPath);
  await removeLegacyPortalClientDist(portalDir, logPath);
  await runPortalStorageCommandOnce('yarn', ['build:html'], {
    cwd: portalDir,
    env: buildEnv,
    logPath,
  });
  await normalizeLegacyPortalClientDist(portalDir, logPath, { overwriteClient: true });
  await appendPortalStorageLog(logPath, `Portal build completed for ${item.appName}/${item.portalName}.`);
}

function validatePortalDeployBasePath(appName: string, portalName: string, basePath: string) {
  const normalizedBasePath = resolvePortalStoragePublicPath(basePath);
  if (normalizedBasePath.includes('..')) {
    throw new Error('basePath cannot contain ".."');
  }

  const expectedBasePaths = getPortalDeployBasePathCandidates(appName, portalName);
  if (!expectedBasePaths.includes(normalizedBasePath)) {
    throw new Error(`basePath must be ${expectedBasePaths.join(' or ')}`);
  }
}

function isPortalDeployTarEntry(entry: unknown): entry is PortalDeployTarEntry {
  return Boolean(entry) && typeof entry === 'object';
}

function normalizePortalDeployTarPath(entryPath: string) {
  return path.posix.normalize(entryPath.replace(/\\/g, '/'));
}

function isPortalDeployTarPathSafe(entryPath: string) {
  const normalizedEntryPath = normalizePortalDeployTarPath(entryPath);
  return (
    !path.posix.isAbsolute(normalizedEntryPath) &&
    !path.win32.isAbsolute(entryPath) &&
    normalizedEntryPath !== '..' &&
    !normalizedEntryPath.startsWith('../') &&
    !normalizedEntryPath.split('/').includes('..')
  );
}

function isPortalDeployTarSymlinkTargetSafe(entryPath: string, linkpath: string) {
  if (path.posix.isAbsolute(linkpath) || path.win32.isAbsolute(linkpath)) {
    return false;
  }
  const normalizedEntryPath = normalizePortalDeployTarPath(entryPath);
  const normalizedLinkPath = normalizePortalDeployTarPath(linkpath);
  const entryParentPath = path.posix.dirname(normalizedEntryPath);
  const resolvedLinkPath = path.posix.normalize(path.posix.join(entryParentPath, normalizedLinkPath));
  return resolvedLinkPath !== '..' && !resolvedLinkPath.startsWith('../');
}

function validatePortalDeployTarEntry(entryPath: string, entry: unknown) {
  if (!isPortalDeployTarPathSafe(entryPath)) {
    throw new Error(`Invalid dist archive entry path: ${entryPath}`);
  }

  const entryType = isPortalDeployTarEntry(entry) ? entry.type : undefined;
  if (entryType === 'Link') {
    throw new Error(`Invalid dist archive link entry: ${entryPath}`);
  }

  const linkpath = isPortalDeployTarEntry(entry) ? entry.linkpath : undefined;
  if (entryType === 'SymbolicLink') {
    if (typeof linkpath !== 'string' || !isPortalDeployTarSymlinkTargetSafe(entryPath, linkpath)) {
      throw new Error(`Invalid dist archive link target: ${entryPath}`);
    }
    return true;
  }

  if (typeof linkpath === 'string') {
    throw new Error(`Invalid dist archive link target: ${entryPath}`);
  }

  return true;
}

function isPortalDeployStorageTempDir(name: string) {
  return name.startsWith('.dist-upload-') || name.startsWith('.dist-backup-');
}

function isNodeFsError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

async function cleanupInterruptedPortalDeployDirs(portalDir: string): Promise<void> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(portalDir, { withFileTypes: true });
  } catch (error) {
    if (isNodeFsError(error) && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && isPortalDeployStorageTempDir(entry.name))
      .map((entry) => fs.promises.rm(path.join(portalDir, entry.name), { recursive: true, force: true })),
  );
}

async function movePortalDeployDir(sourceDir: string, targetDir: string): Promise<void> {
  try {
    await fs.promises.rename(sourceDir, targetDir);
  } catch (error) {
    if (!isNodeFsError(error) || error.code !== 'EXDEV') {
      throw error;
    }
    await fs.promises.cp(sourceDir, targetDir, { recursive: true });
    await fs.promises.rm(sourceDir, { recursive: true, force: true });
  }
}

async function chmodPortalDistTree(targetDir: string): Promise<void> {
  await fs.promises.chmod(targetDir, PORTAL_PUBLIC_DIR_MODE);
  const entries = await fs.promises.readdir(targetDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await chmodPortalDistTree(entryPath);
        return;
      }
      if (entry.isFile()) {
        await fs.promises.chmod(entryPath, PORTAL_PUBLIC_FILE_MODE);
      }
    }),
  );
}

async function ensurePortalDistPublicReadable(portalDir: string, distDir: string): Promise<void> {
  const appDir = path.dirname(portalDir);
  const portalsDir = path.dirname(appDir);
  const distParentDir = path.dirname(distDir);
  await fs.promises.chmod(portalsDir, PORTAL_PUBLIC_DIR_MODE);
  await fs.promises.chmod(appDir, PORTAL_PUBLIC_DIR_MODE);
  await fs.promises.chmod(portalDir, PORTAL_PUBLIC_DIR_MODE);
  await fs.promises.chmod(distParentDir, PORTAL_PUBLIC_DIR_MODE);
  await chmodPortalDistTree(distDir);
}

async function replacePortalDistFromArchive(params: {
  filePath: string;
  appName: string;
  portalName: string;
}): Promise<string> {
  const portalDir = storagePathJoin('portals', params.appName, params.portalName);
  const distDir = path.join(portalDir, PORTAL_DIST_DIR);
  const backupDir = path.join(portalDir, `.dist-backup-${Date.now()}-${Math.random().toString().slice(2)}`);
  const tarPath = path.join(os.tmpdir(), `nocobase-portal-dist-${Date.now()}-${Math.random().toString().slice(2)}.tar`);
  const uploadDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), PORTAL_DEPLOY_UPLOAD_DIR_PREFIX));
  let hasBackup = false;

  await fs.promises.mkdir(portalDir, { recursive: true });
  await cleanupInterruptedPortalDeployDirs(portalDir);
  try {
    await pipeline(fs.createReadStream(params.filePath), createGunzip(), fs.createWriteStream(tarPath));
    await tar.extract({
      file: tarPath,
      cwd: uploadDir,
      strict: true,
      filter: validatePortalDeployTarEntry,
    });
    await normalizeLegacyPortalClientDistRoot(uploadDir);

    const indexPath = path.join(uploadDir, 'client', 'index.html');
    const indexStat = await fs.promises.stat(indexPath).catch(() => null);
    if (!indexStat?.isFile()) {
      throw new Error('Portal dist archive is invalid: client/index.html is missing.');
    }

    if (await pathExists(distDir)) {
      await fs.promises.rename(distDir, backupDir);
      hasBackup = true;
    }
    await fs.promises.mkdir(path.dirname(distDir), { recursive: true });
    await movePortalDeployDir(uploadDir, distDir);
    await ensurePortalDistPublicReadable(portalDir, distDir);
    if (hasBackup) {
      await fs.promises.rm(backupDir, { recursive: true, force: true });
      hasBackup = false;
    }
    return path.relative(storagePathJoin(), distDir);
  } catch (error) {
    await fs.promises.rm(uploadDir, { recursive: true, force: true });
    if (hasBackup) {
      await fs.promises.rm(distDir, { recursive: true, force: true });
      await fs.promises.rename(backupDir, distDir).catch(async () => {
        await fs.promises.rm(backupDir, { recursive: true, force: true });
      });
    }
    throw error;
  } finally {
    await fs.promises.rm(params.filePath, { force: true });
    await fs.promises.rm(uploadDir, { recursive: true, force: true });
    await fs.promises.rm(tarPath, { force: true });
  }
}

function shouldPackPortalSourceEntry(entryName: string) {
  return !entryName
    .split('/')
    .some((segment) => segment.startsWith('._') || ['.git', 'node_modules', 'dist', '.DS_Store'].includes(segment));
}

function validatePortalSourceTarEntry(entryPath: string, entry: unknown) {
  if (path.isAbsolute(entryPath) || entryPath.split(/[\\/]+/).includes('..')) {
    return false;
  }
  const entryType = isPortalDeployTarEntry(entry) ? entry.type : undefined;
  const linkpath = isPortalDeployTarEntry(entry) ? entry.linkpath : undefined;
  if (entryType === 'SymbolicLink' || entryType === 'Link' || typeof linkpath === 'string') {
    return false;
  }
  return shouldPackPortalSourceEntry(entryPath);
}

async function packPortalSource(params: { appName: string; portalName: string }): Promise<string> {
  const portalDir = storagePathJoin('portals', params.appName, params.portalName);
  if (!(await pathExists(portalDir))) {
    throw new Error('Portal source directory does not exist.');
  }

  const archivePath = path.join(
    os.tmpdir(),
    `nocobase-portal-source-${Date.now()}-${Math.random().toString().slice(2)}.tar.gz`,
  );
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'tar',
      [
        '-czf',
        archivePath,
        '--exclude=.git',
        '--exclude=node_modules',
        '--exclude=dist',
        '--exclude=.DS_Store',
        '--exclude=._*',
        '-C',
        portalDir,
        '.',
      ],
      {
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`tar exited with code ${code}${stderr ? `: ${stderr.trim()}` : ''}`));
    });
  });
  return archivePath;
}

async function replacePortalSourceFromArchive(params: {
  filePath: string;
  appName: string;
  portalName: string;
}): Promise<string> {
  const portalDir = storagePathJoin('portals', params.appName, params.portalName);
  const tarPath = path.join(
    os.tmpdir(),
    `nocobase-portal-source-${Date.now()}-${Math.random().toString().slice(2)}.tar`,
  );
  const uploadDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-source-upload-'));

  try {
    await pipeline(fs.createReadStream(params.filePath), createGunzip(), fs.createWriteStream(tarPath));
    await tar.extract({
      file: tarPath,
      cwd: uploadDir,
      strict: true,
      filter: validatePortalSourceTarEntry,
    });

    await fs.promises.mkdir(portalDir, { recursive: true });
    const existingEntries = await fs.promises.readdir(portalDir).catch(() => []);
    await Promise.all(
      existingEntries
        .filter((entry) => shouldPackPortalSourceEntry(entry))
        .map((entry) => fs.promises.rm(path.join(portalDir, entry), { recursive: true, force: true })),
    );

    const sourceEntries = await fs.promises.readdir(uploadDir);
    await Promise.all(
      sourceEntries.map((entry) => fs.promises.rename(path.join(uploadDir, entry), path.join(portalDir, entry))),
    );

    return path.relative(storagePathJoin(), portalDir);
  } finally {
    await fs.promises.rm(params.filePath, { force: true });
    await fs.promises.rm(uploadDir, { recursive: true, force: true });
    await fs.promises.rm(tarPath, { force: true });
  }
}

function uniqueDesktopRouteIds(routeIds: DesktopRouteId[]) {
  const seen = new Set<DesktopRouteId>();
  return routeIds.filter((routeId) => {
    if (seen.has(routeId)) {
      return false;
    }
    seen.add(routeId);
    return true;
  });
}

function collectDesktopRouteIds(record: unknown): DesktopRouteId[] {
  if (Array.isArray(record)) {
    return uniqueDesktopRouteIds(record.flatMap((item) => collectDesktopRouteIds(item)));
  }

  const routeId = getRecordField(record, 'id');
  const children = getRecordField(record, 'children');
  const routeIds: DesktopRouteId[] = [];
  if (typeof routeId === 'string' || typeof routeId === 'number') {
    routeIds.push(routeId);
  }
  if (Array.isArray(children)) {
    routeIds.push(...children.flatMap((child) => collectDesktopRouteIds(child)));
  }

  return uniqueDesktopRouteIds(routeIds);
}

function pickMultiPortalRuntimeFields(record: unknown) {
  const result = {} as Record<MultiPortalRuntimeField, unknown>;
  for (const field of MULTI_PORTAL_RUNTIME_FIELDS) {
    result[field] = getRecordField(record, field);
  }
  return result;
}

function pickMultiPortalAccessibleFields(record: unknown) {
  const result = {} as Record<MultiPortalAccessibleField, unknown>;
  for (const field of MULTI_PORTAL_ACCESSIBLE_FIELDS) {
    result[field] = getRecordField(record, field) ?? null;
  }
  return result;
}

function getExplicitRequestedLayoutUid(layout: unknown) {
  const uid = Array.isArray(layout) ? layout[0] : layout;

  if (typeof uid === 'string' && uid.trim()) {
    return uid;
  }
}

function hasActionParam(params: unknown, key: string) {
  return isRecordLike(params) && Object.prototype.hasOwnProperty.call(params, key);
}

function getRequestedMultiPortalUid(ctx: ResourcerContext) {
  const hasPortalScope = hasActionParam(ctx.action?.params, 'portal');
  const hasLayoutScope = hasActionParam(ctx.action?.params, 'layout');
  const portalUid = getExplicitRequestedLayoutUid(ctx.action?.params.portal);
  if (hasPortalScope && hasLayoutScope) {
    ctx.throw(400, 'layout and portal cannot be used together');
    return;
  }
  if (!hasPortalScope) {
    return;
  }
  if (!portalUid) {
    ctx.throw(400, 'Invalid portal scope');
    return;
  }

  return portalUid;
}

function getCurrentRoles(ctx: ResourcerContext) {
  const currentRole = ctx.state.currentRole;
  if (typeof currentRole === 'string' && currentRole && currentRole !== UNION_ROLE_KEY) {
    return [currentRole];
  }

  const currentRoles = ctx.state.currentRoles;
  if (Array.isArray(currentRoles)) {
    return currentRoles.filter((role): role is string => typeof role === 'string');
  }

  return typeof currentRole === 'string' && currentRole ? [currentRole] : [];
}

function getMultiPortalNameFromValues(ctx: ResourcerContext) {
  const values = ctx.action?.params.values;
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return;
  }

  const portalName = (values as Record<string, unknown>).portalName;
  if (typeof portalName === 'string' && portalName.trim()) {
    return portalName;
  }
}

function getMultiPortalWriteRecords(ctx: ResourcerContext) {
  const values = ctx.action?.params.values;
  const records = Array.isArray(values) ? values : [values];
  return records.filter(
    (record): record is Record<string, unknown> => !!record && typeof record === 'object' && !Array.isArray(record),
  );
}

type MultiPortalWriteTarget = {
  existing?: Model | null;
  values: Record<string, unknown>;
};

async function getMultiPortalWriteTargets(ctx: ResourcerContext, fields: string[]): Promise<MultiPortalWriteTarget[]> {
  const records = getMultiPortalWriteRecords(ctx);
  if (!records.length || ctx.action?.actionName === 'create') {
    return records.map((values) => ({ values }));
  }

  const repository = ctx.db.getRepository('multiPortals');
  const actionName = ctx.action?.actionName;
  const requestedFilterKeys: unknown = ctx.action?.params.filterKeys;
  if (
    (actionName === 'firstOrCreate' || actionName === 'updateOrCreate') &&
    Array.isArray(requestedFilterKeys) &&
    requestedFilterKeys.every((filterKey) => typeof filterKey === 'string')
  ) {
    const targets: MultiPortalWriteTarget[] = [];
    for (const values of records) {
      const existing = await repository.findOne({
        filter: Repository.valuesToFilter(values, requestedFilterKeys),
        fields,
      });
      targets.push({ existing, values });
    }
    return targets;
  }

  if (records.length > 1) {
    const targets: MultiPortalWriteTarget[] = [];
    for (const values of records) {
      const uid = values.uid;
      const existing =
        typeof uid === 'string' && uid
          ? await repository.findOne({
              filterByTk: uid,
              fields,
            })
          : null;
      targets.push({ existing, values });
    }
    return targets;
  }

  const values = records[0];
  const filterByTk = ctx.action?.params.filterByTk;
  if (filterByTk !== undefined && filterByTk !== null) {
    const existingRecords = await repository.find({
      filterByTk,
      fields,
    });
    return existingRecords.length ? existingRecords.map((existing) => ({ existing, values })) : [{ values }];
  }

  const filter = ctx.action?.params.filter;
  if (isRecordLike(filter) && !Array.isArray(filter)) {
    const existingRecords = await repository.find({
      filter,
      fields,
    });
    return existingRecords.length ? existingRecords.map((existing) => ({ existing, values })) : [{ values }];
  }

  const uid = values.uid;
  const existing =
    typeof uid === 'string' && uid
      ? await repository.findOne({
          filterByTk: uid,
          fields,
        })
      : null;
  return [{ existing, values }];
}

function isTruthyActionBoolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

async function captureSkipCreatePortalDirectory(ctx: ResourcerContext, next: () => Promise<void>) {
  const records = getMultiPortalWriteRecords(ctx);
  const recordsWithOption = records.filter((record) =>
    Object.prototype.hasOwnProperty.call(record, 'skipCreatePortalDirectory'),
  );
  if (!recordsWithOption.length) {
    await next();
    return;
  }

  (ctx as MultiPortalResourcerContext)[SKIP_CREATE_PORTAL_DIRECTORY] = recordsWithOption.some((record) =>
    isTruthyActionBoolean(record.skipCreatePortalDirectory),
  );
  for (const record of recordsWithOption) {
    delete record.skipCreatePortalDirectory;
  }
  await next();
}

function shouldSkipCreatePortalDirectory(options?: DatabaseHookOptions) {
  return (options?.context as MultiPortalResourcerContext | undefined)?.[SKIP_CREATE_PORTAL_DIRECTORY] === true;
}

async function normalizeMultiPortalSlugValues(ctx: ResourcerContext, next: () => Promise<void>) {
  for (const values of getMultiPortalWriteRecords(ctx)) {
    const portalName = values.portalName;
    if (portalName === undefined || portalName === null || typeof portalName !== 'string') {
      continue;
    }

    const slug = portalName.trim();
    if (!slug) {
      continue;
    }
    if (!MULTI_PORTAL_SLUG_PATTERN.test(slug)) {
      ctx.throw(400, 'Portal name can only contain lowercase letters, numbers, hyphens, and underscores');
      return;
    }

    values.portalName = slug;
    values.routePath = `/${slug}`;
  }

  const repository = ctx.db.getRepository('multiPortals');
  const pendingPortalNames = new Set<string>();
  const targets = await getMultiPortalWriteTargets(ctx, ['uid']);
  for (const { existing, values } of targets) {
    const portalName = values.portalName;
    if (typeof portalName !== 'string' || !portalName) {
      continue;
    }

    if (pendingPortalNames.has(portalName)) {
      ctx.throw(409, ctx.t('Portal name "{{portalName}}" already exists', { ns: NAMESPACE, portalName }));
      return;
    }
    pendingPortalNames.add(portalName);

    const conflict = await repository.findOne({
      filter: { portalName },
      fields: ['uid'],
    });
    if (conflict && conflict.get('uid') !== existing?.get('uid')) {
      ctx.throw(409, ctx.t('Portal name "{{portalName}}" already exists', { ns: NAMESPACE, portalName }));
      return;
    }
  }

  await next();
}

async function preventDirectDefaultPortalMutation(ctx: ResourcerContext, next: () => Promise<void>) {
  for (const values of getMultiPortalWriteRecords(ctx)) {
    if (Object.prototype.hasOwnProperty.call(values, 'isDefault')) {
      ctx.throw(400, ctx.t('Use multiPortals:setDefault to update the default Portal', { ns: NAMESPACE }));
      return;
    }
  }
  await next();
}

function isUniqueConstraintViolation(error: unknown) {
  return (
    error instanceof UniqueConstraintError || (isRecordLike(error) && error.name === 'SequelizeUniqueConstraintError')
  );
}

async function createDefaultMultiPortalBestEffort(db: Database, portal: DefaultMultiPortalRecord) {
  const repository = db.getRepository('multiPortals');
  const [uidConflict, portalNameConflict] = await Promise.all([
    repository.findOne({
      filterByTk: portal.uid,
      fields: ['uid'],
    }),
    repository.findOne({
      filter: { portalName: portal.portalName },
      fields: ['uid'],
    }),
  ]);
  if (uidConflict || portalNameConflict) {
    return false;
  }

  try {
    await repository.create({ values: portal });
    return true;
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      return false;
    }
    throw error;
  }
}

async function repairFixedLayoutMultiPortalRecords(db: Database) {
  const repository = db.getRepository('multiPortals');
  for (const portal of getFixedLayoutMultiPortalRecords()) {
    const existing = await repository.findOne({
      filterByTk: portal.uid,
      fields: ['uid', 'portalType', 'portalName', 'routePath', 'uiLayoutUid'],
    });
    if (
      existing?.get('portalName') !== portal.portalName ||
      existing.get('routePath') !== portal.routePath ||
      existing.get('uiLayoutUid') !== portal.uiLayoutUid ||
      existing.get('portalType') === portal.portalType
    ) {
      continue;
    }
    await repository.update({
      filterByTk: portal.uid,
      values: {
        portalType: portal.portalType,
      },
    });
  }
}

async function seedFreshMultiPortals(db: Database) {
  for (const portal of getFreshMultiPortalRecords()) {
    await createDefaultMultiPortalBestEffort(db, portal);
  }

  const portals = await db.getRepository('multiPortals').find({
    filter: {
      uid: getFreshMultiPortalRecords().map((portal) => portal.uid),
    },
  });
  for (const portal of portals) {
    await grantDefaultAccessToNewMultiPortal(db, portal, undefined, {
      includeDefaultLayoutMultiPortal: true,
    });
  }
}

async function seedHistoricalMultiPortals(db: Database) {
  await createDefaultMultiPortalBestEffort(db, getDefaultAiMultiPortalRecord());
  for (const portal of getFixedLayoutMultiPortalRecords()) {
    await createDefaultMultiPortalBestEffort(db, portal);
  }
  await repairFixedLayoutMultiPortalRecords(db);
}

async function validateMultiPortalUiLayoutUidWrite(ctx: ResourcerContext, next: () => Promise<void>) {
  const targets = await getMultiPortalWriteTargets(ctx, ['uiLayoutUid']);
  const actionName = ctx.action?.actionName;
  const createsWhenMissing =
    actionName === 'create' || actionName === 'firstOrCreate' || actionName === 'updateOrCreate';
  for (const { existing, values } of targets) {
    const hasUiLayoutUid = Object.prototype.hasOwnProperty.call(values, 'uiLayoutUid');
    if (!existing && createsWhenMissing && !hasUiLayoutUid) {
      ctx.throw(400, `Portal UI layout must be one of: ${MULTI_PORTAL_UI_LAYOUT_UIDS.join(', ')}`);
      return;
    }
    if (!hasUiLayoutUid) {
      continue;
    }
    if (!isMultiPortalUiLayoutUid(values.uiLayoutUid)) {
      ctx.throw(400, `Portal UI layout must be one of: ${MULTI_PORTAL_UI_LAYOUT_UIDS.join(', ')}`);
      return;
    }
    const existingUiLayoutUid = existing?.get('uiLayoutUid');
    if (existing && existingUiLayoutUid !== values.uiLayoutUid) {
      ctx.throw(400, 'Portal UI layout cannot be changed');
      return;
    }
  }
  await next();
}

async function findRequestedMultiPortal(
  ctx: ResourcerContext,
  transaction?: Transaction,
): Promise<MultiPortalRequestResult> {
  const portalUid = getRequestedMultiPortalUid(ctx);
  if (portalUid === undefined) {
    return {
      requested: false,
    };
  }

  const portal = await ctx.db.getRepository('multiPortals').findOne({
    filter: {
      uid: portalUid,
    },
    fields: ['uid', 'portalType', 'uiLayoutUid', 'enabled'],
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    transaction,
  });

  if (!portal || portal.get('enabled') !== true) {
    return { requested: true };
  }
  if (portal.get('portalType') !== 'no-code') {
    ctx.throw(400, `Portal '${portalUid}' does not support desktop routes`);
  }

  const uiLayoutUid = portal.get('uiLayoutUid');
  if (!isMultiPortalUiLayoutUid(uiLayoutUid)) {
    ctx.throw(400, `Portal '${portalUid}' has an unsupported UI layout UID`);
  }

  const usesLayoutPermissions = isDefaultLayoutMultiPortalUid(portalUid);

  return {
    portal,
    requested: true,
    scope: {
      portalUid,
      uiLayoutUid,
      relation: usesLayoutPermissions ? 'uiLayouts' : 'multiPortals',
      uid: usesLayoutPermissions ? uiLayoutUid : portalUid,
      filter: usesLayoutPermissions
        ? {
            'uiLayouts.uid': uiLayoutUid,
          }
        : getDesktopRoutePortalFilter(portalUid),
    },
  };
}

function getDesktopRoutePortalFilter(multiPortalUid: string) {
  return {
    'multiPortals.uid': multiPortalUid,
  };
}

function isDesktopRouteCreateValue(value: unknown): value is DesktopRouteCreateValue {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function withDesktopRouteEffectiveOwner(value: unknown, scope: MultiPortalAccessContext): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => withDesktopRouteEffectiveOwner(item, scope));
  }
  if (!isDesktopRouteCreateValue(value)) {
    return value;
  }

  const { uiLayouts: _uiLayouts, multiPortals: _multiPortals, children, ...route } = value;
  return {
    ...route,
    ...(scope.relation === 'uiLayouts' ? { uiLayouts: [scope.uid] } : { multiPortals: [scope.uid] }),
    ...(Array.isArray(children) ? { children: withDesktopRouteEffectiveOwner(children, scope) } : {}),
  };
}

function collectExplicitDesktopRouteParentIds(value: unknown): DesktopRouteId[] {
  if (Array.isArray(value)) {
    return uniqueDesktopRouteIds(value.flatMap((item) => collectExplicitDesktopRouteParentIds(item)));
  }
  if (!isDesktopRouteCreateValue(value)) {
    return [];
  }

  const parentIds: DesktopRouteId[] = [];
  if (typeof value.parentId === 'string' || typeof value.parentId === 'number') {
    parentIds.push(value.parentId);
  }
  if (Array.isArray(value.children)) {
    parentIds.push(...value.children.flatMap((child) => collectExplicitDesktopRouteParentIds(child)));
  }
  return uniqueDesktopRouteIds(parentIds);
}

async function assertDesktopRouteParentsBelongToScope(
  ctx: ResourcerContext,
  scope: MultiPortalAccessContext,
  values: unknown = ctx.action?.params.values,
  transaction?: Transaction,
) {
  const parentIds = collectExplicitDesktopRouteParentIds(values);
  if (!parentIds.length) {
    return;
  }

  const parents = await ctx.db.getRepository('desktopRoutes').find({
    fields: ['id'],
    filter: {
      id: parentIds,
      ...scope.filter,
    },
    transaction,
  });
  if (new Set(normalizeDesktopRouteTargetIds(parents)).size !== new Set(parentIds.map(String)).size) {
    ctx.throw(400, 'Parent route does not belong to the requested portal scope');
  }
}

function getDesktopRouteUpdateOrCreateFilters(
  ctx: ResourcerContext,
  values: unknown = ctx.action?.params.values,
  requestedFilterKeys: unknown = ctx.action?.params.filterKeys,
) {
  const filterKeys = Array.isArray(requestedFilterKeys)
    ? requestedFilterKeys.filter((key): key is string => typeof key === 'string' && !!key)
    : [];
  if (!filterKeys.length) {
    return [];
  }

  const records = Array.isArray(values) ? values : [values];
  return records.flatMap((value) => {
    if (
      !isDesktopRouteCreateValue(value) ||
      filterKeys.some((key) => !Object.prototype.hasOwnProperty.call(value, key))
    ) {
      return [];
    }
    return [Object.fromEntries(filterKeys.map((key) => [key, value[key]]))];
  });
}

async function assertDesktopRouteUpsertMatchesBelongToScope(
  ctx: ResourcerContext,
  scope: MultiPortalAccessContext,
  values: unknown = ctx.action?.params.values,
  filterKeys: unknown = ctx.action?.params.filterKeys,
  transaction?: Transaction,
) {
  for (const filter of getDesktopRouteUpdateOrCreateFilters(ctx, values, filterKeys)) {
    const allMatches = await ctx.db.getRepository('desktopRoutes').find({
      fields: ['id'],
      filter,
      ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
      transaction,
    });
    const scopedMatches = await ctx.db.getRepository('desktopRoutes').find({
      fields: ['id'],
      filter: {
        ...filter,
        ...scope.filter,
      },
      transaction,
    });
    const allMatchIds = normalizeDesktopRouteTargetIds(allMatches);
    const scopedMatchIds = normalizeDesktopRouteTargetIds(scopedMatches);
    if (allMatchIds.join(',') !== scopedMatchIds.join(',')) {
      ctx.throw(400, 'Desktop route does not belong to the requested portal scope');
    }
  }
}

async function canAccessMultiPortal(ctx: ResourcerContext, multiPortalUid: string) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return true;
  }
  if (!currentRoles.length) {
    return false;
  }

  const access = await ctx.db.getRepository('rolesMultiPortals').findOne({
    fields: ['id'],
    filter: {
      roleName: currentRoles,
      multiPortalUid,
    },
  });
  return access !== null;
}

function throwPortalAccessGateError(ctx: ResourcerContext, status: number, code: string, message: string): never {
  ctx.throw(status, ctx.t(message, { ns: NAMESPACE }), { code });
  throw new Error(message);
}

function getRequestedPortalNameFromHeader(ctx: ResourcerContext) {
  const headers = ctx.request?.headers;
  if (!isRecordLike(headers) || !Object.prototype.hasOwnProperty.call(headers, 'x-portal')) {
    return;
  }

  const rawPortalName = headers['x-portal'];
  if (typeof rawPortalName !== 'string') {
    throwPortalAccessGateError(ctx, 400, PORTAL_CONTEXT_INVALID_CODE, 'Invalid Portal context');
  }

  const portalName = rawPortalName.startsWith('/x/') ? rawPortalName.slice('/x/'.length) : rawPortalName;
  if (!MULTI_PORTAL_SLUG_PATTERN.test(portalName)) {
    throwPortalAccessGateError(ctx, 400, PORTAL_CONTEXT_INVALID_CODE, 'Invalid Portal context');
  }
  return portalName;
}

function pickPortalAccessDeniedData(ctx: ResourcerContext, portalName: string) {
  const roleCheckBody = isRecordLike(ctx.body) ? ctx.body : {};
  return {
    portalName,
    role: typeof roleCheckBody.role === 'string' ? roleCheckBody.role : '',
    roles: Array.isArray(roleCheckBody.roles)
      ? roleCheckBody.roles.filter((role): role is string => typeof role === 'string')
      : [],
    roleMode: typeof roleCheckBody.roleMode === 'string' ? roleCheckBody.roleMode : 'default',
    allowAnonymous: roleCheckBody.allowAnonymous === true,
  };
}

async function checkMultiPortalAccessForRolesCheck(ctx: ResourcerContext, next: () => Promise<void>) {
  const portalName = getRequestedPortalNameFromHeader(ctx);
  if (portalName === undefined) {
    await next();
    return;
  }

  const portal = await ctx.db.getRepository('multiPortals').findOne({
    filter: {
      portalName,
    },
    fields: ['uid', 'portalType', 'enabled', 'uiLayoutUid'],
  });
  if (
    !portal ||
    portal.get('enabled') !== true ||
    !getDefaultMultiPortalType(portal) ||
    !isMultiPortalUiLayoutUid(portal.get('uiLayoutUid'))
  ) {
    throwPortalAccessGateError(ctx, 404, PORTAL_NOT_FOUND_CODE, 'Portal not found');
  }

  const portalUid = String(portal.get('uid'));
  if (isDefaultLayoutMultiPortalUid(portalUid) || (await canAccessMultiPortal(ctx, portalUid))) {
    await next();
    return;
  }

  await next();
  ctx.status = 403;
  ctx.withoutDataWrapping = true;
  ctx.body = {
    errors: [
      {
        code: PORTAL_ACCESS_DENIED_CODE,
        message: ctx.t('You do not have access to this Portal', { ns: NAMESPACE }),
      },
    ],
    data: pickPortalAccessDeniedData(ctx, portalName),
  };
}

async function listCurrentRoleAccessibleMultiPortalUids(ctx: ResourcerContext) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return;
  }
  if (!currentRoles.length) {
    return [];
  }

  const grants = await ctx.db.getRepository('rolesMultiPortals').find({
    fields: ['multiPortalUid'],
    filter: {
      roleName: currentRoles,
    },
  });

  return Array.from(
    new Set(
      grants
        .map((grant) => grant.get('multiPortalUid'))
        .filter((uid): uid is string => typeof uid === 'string' && !!uid),
    ),
  );
}

async function removeRouteIdsWithUnauthorizedAncestors(ctx: ResourcerContext, routeIds: Set<string>) {
  if (routeIds.size === 0) {
    return;
  }

  const parentIdByRouteId = new Map<string, string | undefined>();
  let pendingRouteIds = new Set(routeIds);

  while (pendingRouteIds.size > 0) {
    const routes = await ctx.db.getRepository('desktopRoutes').find({
      fields: ['id', 'parentId'],
      filter: {
        id: Array.from(pendingRouteIds),
      },
    });
    pendingRouteIds = new Set<string>();

    for (const route of routes) {
      const routeId = route.get('id');
      if (routeId === null || routeId === undefined) {
        continue;
      }

      const normalizedRouteId = String(routeId);
      const parentId = route.get('parentId');
      const normalizedParentId = parentId === null || parentId === undefined ? undefined : String(parentId);
      parentIdByRouteId.set(normalizedRouteId, normalizedParentId);

      if (normalizedParentId && !parentIdByRouteId.has(normalizedParentId)) {
        pendingRouteIds.add(normalizedParentId);
      }
    }
  }

  for (const routeId of Array.from(routeIds)) {
    const visitedRouteIds = new Set<string>([routeId]);
    let parentId = parentIdByRouteId.get(routeId);

    while (parentId) {
      if (!routeIds.has(parentId) || visitedRouteIds.has(parentId)) {
        routeIds.delete(routeId);
        break;
      }

      visitedRouteIds.add(parentId);
      parentId = parentIdByRouteId.get(parentId);
    }
  }
}

async function getMultiPortalAccessibleRouteIds(ctx: ResourcerContext, portalContext: MultiPortalAccessContext) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return;
  }
  if (!currentRoles.length) {
    return new Set<string>();
  }

  const routePermissions = await ctx.db
    .getRepository(portalContext.relation === 'uiLayouts' ? 'rolesDesktopRoutes' : 'rolesMultiPortalDesktopRoutes')
    .find({
      fields: ['desktopRouteId'],
      filter: {
        roleName: currentRoles,
        ...(portalContext.relation === 'multiPortals' ? { multiPortalUid: portalContext.portalUid } : {}),
      },
    });
  const routeIds = new Set<string>();

  for (const permission of routePermissions) {
    const routeId = permission.get('desktopRouteId');
    if (routeId !== null && routeId !== undefined) {
      routeIds.add(String(routeId));
    }
  }

  if (routeIds.size === 0) {
    return routeIds;
  }

  const portalRoutes = await ctx.db.getRepository('desktopRoutes').find({
    fields: ['id'],
    filter: {
      ...portalContext.filter,
      id: Array.from(routeIds),
    },
  });
  const portalRouteIds = new Set<string>();

  for (const route of portalRoutes) {
    const routeId = route.get('id');
    if (routeId !== null && routeId !== undefined) {
      portalRouteIds.add(String(routeId));
    }
  }

  await removeRouteIdsWithUnauthorizedAncestors(ctx, portalRouteIds);
  return portalRouteIds;
}

function pickDesktopRouteRolePermissionTargetFields(
  route: unknown,
): Record<DesktopRouteRolePermissionTargetField | 'children', unknown> {
  const result = {} as Record<DesktopRouteRolePermissionTargetField | 'children', unknown>;
  for (const field of DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS) {
    result[field] = getRecordField(route, field) ?? null;
  }

  const children = getRecordField(route, 'children');
  result.children = Array.isArray(children)
    ? children.map((child) => pickDesktopRouteRolePermissionTargetFields(child))
    : [];

  return result;
}

function setDesktopRouteChildren(route: unknown, children: unknown[] | undefined) {
  if (!route || typeof route !== 'object') {
    return;
  }

  const maybeModel = route as {
    _options?: {
      includeNames?: string[];
    };
    children?: unknown[];
    setDataValue?: (field: string, value: unknown) => void;
  };
  if (typeof maybeModel.setDataValue === 'function') {
    maybeModel.setDataValue('children', children);
  } else {
    maybeModel.children = children;
  }

  if (!maybeModel._options) {
    return;
  }
  if (!maybeModel._options.includeNames) {
    maybeModel._options.includeNames = ['children'];
    return;
  }
  if (!maybeModel._options.includeNames.includes('children')) {
    maybeModel._options.includeNames.push('children');
  }
}

function getDesktopRouteId(route: unknown) {
  const id = getRecordField(route, 'id');
  return id === null || id === undefined ? undefined : String(id);
}

function getDesktopRouteParentId(route: unknown) {
  const parentId = getRecordField(route, 'parentId');
  return parentId === null || parentId === undefined ? undefined : String(parentId);
}

function collectDesktopRouteStringIds(routes: unknown[], routeIds: Set<string>) {
  for (const route of routes) {
    const routeId = getDesktopRouteId(route);
    if (routeId) {
      routeIds.add(routeId);
    }
    const children = getRecordField(route, 'children');
    if (Array.isArray(children)) {
      collectDesktopRouteStringIds(children, routeIds);
    }
  }
}

function removeNestedRootDesktopRoutes(routes: unknown): unknown[] {
  if (!Array.isArray(routes)) {
    return [];
  }
  const routeIds = new Set<string>();
  collectDesktopRouteStringIds(routes, routeIds);
  return routes.filter((route) => {
    const parentId = getDesktopRouteParentId(route);
    return !parentId || !routeIds.has(parentId);
  });
}

function buildAccessibleDesktopRouteTreeWithAncestors(routes: unknown[], accessibleRouteIds: Set<string>) {
  const routeById = new Map<string, unknown>();
  const childrenByParentId = new Map<string, unknown[]>();
  const roots: unknown[] = [];

  for (const route of routes) {
    const routeId = getDesktopRouteId(route);
    if (!routeId) {
      continue;
    }
    setDesktopRouteChildren(route, undefined);
    routeById.set(routeId, route);
  }

  for (const route of routes) {
    const routeId = getDesktopRouteId(route);
    if (!routeId || !routeById.has(routeId)) {
      continue;
    }
    const parentId = getDesktopRouteParentId(route);
    if (!parentId || !routeById.has(parentId)) {
      roots.push(route);
      continue;
    }
    const children = childrenByParentId.get(parentId) ?? [];
    children.push(route);
    childrenByParentId.set(parentId, children);
  }

  const visitRoute = (route: unknown, visitingRouteIds: Set<string>): unknown | undefined => {
    const routeId = getDesktopRouteId(route);
    if (!routeId || visitingRouteIds.has(routeId)) {
      return undefined;
    }
    visitingRouteIds.add(routeId);
    const visibleChildren = (childrenByParentId.get(routeId) ?? [])
      .map((child) => visitRoute(child, visitingRouteIds))
      .filter((child): child is unknown => child !== undefined);
    visitingRouteIds.delete(routeId);
    if (!accessibleRouteIds.has(routeId) && visibleChildren.length === 0) {
      return undefined;
    }
    setDesktopRouteChildren(route, visibleChildren.length ? visibleChildren : undefined);
    return route;
  };

  return roots
    .map((route) => visitRoute(route, new Set<string>()))
    .filter((route): route is unknown => route !== undefined);
}

async function includeDesktopRouteAncestorsForListAccessible(
  ctx: ResourcerContext,
  routes: unknown,
  portalFilter: Record<string, unknown>,
) {
  if (!Array.isArray(routes)) {
    return routes;
  }
  const accessibleRouteIds = new Set<string>();
  collectDesktopRouteStringIds(routes, accessibleRouteIds);
  if (!accessibleRouteIds.size) {
    return routes;
  }
  const portalRoutes = await ctx.db.getRepository('desktopRoutes').find({
    sort: 'sort',
    filter: portalFilter,
  });
  return buildAccessibleDesktopRouteTreeWithAncestors(portalRoutes, accessibleRouteIds);
}

function removeDesktopRoutesByIds(routes: unknown[], routeIds: Set<string>) {
  return routes
    .map((route) => {
      const routeId = getRecordField(route, 'id');
      const normalizedRouteId = routeId === null || routeId === undefined ? undefined : String(routeId);
      if (normalizedRouteId && routeIds.has(normalizedRouteId)) {
        return null;
      }

      const children = getRecordField(route, 'children');
      if (Array.isArray(children)) {
        setDesktopRouteChildren(route, removeDesktopRoutesByIds(children, routeIds));
      }

      return route;
    })
    .filter((route): route is unknown => route !== null);
}

async function getPortalOnlyDesktopRouteIds(ctx: ResourcerContext, routeIds: DesktopRouteId[]) {
  if (!routeIds.length) {
    return new Set<string>();
  }

  const routes = await ctx.db.getRepository('desktopRoutes').find({
    fields: ['id'],
    appends: ['multiPortals', 'uiLayouts'],
    filter: {
      id: uniqueDesktopRouteIds(routeIds),
    },
  });
  const portalOnlyRouteIds = new Set<string>();

  for (const route of routes) {
    const multiPortals = route.get('multiPortals');
    const uiLayouts = route.get('uiLayouts');
    if (!Array.isArray(multiPortals) || multiPortals.length === 0) {
      continue;
    }
    if (Array.isArray(uiLayouts) && uiLayouts.length > 0) {
      continue;
    }

    const routeId = route.get('id');
    if (routeId !== null && routeId !== undefined) {
      portalOnlyRouteIds.add(String(routeId));
    }
  }

  return portalOnlyRouteIds;
}

async function removeMultiPortalOwnedRoutesFromListResponse(ctx: ResourcerContext) {
  if (!Array.isArray(ctx.body)) {
    return;
  }

  const portalOnlyRouteIds = await getPortalOnlyDesktopRouteIds(ctx, collectDesktopRouteIds(ctx.body));
  if (portalOnlyRouteIds.size === 0) {
    return;
  }

  ctx.body = removeDesktopRoutesByIds(ctx.body, portalOnlyRouteIds);
}

async function removeMultiPortalOwnedRouteFromGetResponse(ctx: ResourcerContext) {
  if (!ctx.body) {
    return;
  }

  const routeIds = collectDesktopRouteIds(ctx.body);
  const portalOnlyRouteIds = await getPortalOnlyDesktopRouteIds(ctx, routeIds);
  if (portalOnlyRouteIds.size === 0) {
    return;
  }

  ctx.status = 204;
  ctx.body = undefined;
}

async function replaceListAccessibleRoutesWithPortalScopedRoutes(
  ctx: ResourcerContext,
  portalContext: MultiPortalAccessContext,
) {
  const routeIds = await getMultiPortalAccessibleRouteIds(ctx, portalContext);
  if (routeIds && routeIds.size === 0) {
    ctx.body = [];
    return;
  }

  const routes = await ctx.db.getRepository('desktopRoutes').find({
    tree: true,
    sort: 'sort',
    filter: {
      ...portalContext.filter,
      ...(routeIds ? { id: Array.from(routeIds) } : {}),
    },
  });
  ctx.body = removeNestedRootDesktopRoutes(
    await includeDesktopRouteAncestorsForListAccessible(ctx, routes, portalContext.filter),
  );
}

async function replaceGetAccessibleRouteWithPortalScopedRoute(
  ctx: ResourcerContext,
  portalContext: MultiPortalAccessContext,
) {
  const routeIds = await getMultiPortalAccessibleRouteIds(ctx, portalContext);
  if (routeIds && routeIds.size === 0) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  const route = await ctx.db.getRepository('desktopRoutes').findOne({
    sort: 'sort',
    filterByTk: ctx.action?.params.filterByTk,
    filter: {
      ...portalContext.filter,
      ...(routeIds ? { id: Array.from(routeIds) } : {}),
    },
  });

  if (!route) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  ctx.status = 200;
  ctx.body = route;
}

async function prepareAccessibleDesktopRoutesForMultiPortal(ctx: ResourcerContext) {
  const portalRequest = await findRequestedMultiPortal(ctx);
  if (!portalRequest.requested) {
    return;
  }

  const scope = portalRequest.scope;
  if (!scope) {
    return null;
  }

  if (scope.relation === 'multiPortals' && !(await canAccessMultiPortal(ctx, scope.portalUid))) {
    return null;
  }

  if (ctx.action?.params) {
    ctx.action.params.layout = scope.uiLayoutUid;
  }
  return scope;
}

async function addMultiPortalListAccessibleGuard(ctx: ResourcerContext, next: () => Promise<void>) {
  const portalContext = await prepareAccessibleDesktopRoutesForMultiPortal(ctx);
  if (portalContext === null) {
    ctx.body = [];
    return;
  }

  await next();
  if (portalContext) {
    await replaceListAccessibleRoutesWithPortalScopedRoutes(ctx, portalContext);
    return;
  }

  await removeMultiPortalOwnedRoutesFromListResponse(ctx);
}

async function addMultiPortalGetAccessibleGuard(ctx: ResourcerContext, next: () => Promise<void>) {
  const portalContext = await prepareAccessibleDesktopRoutesForMultiPortal(ctx);
  if (portalContext === null) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  await next();
  if (portalContext) {
    await replaceGetAccessibleRouteWithPortalScopedRoute(ctx, portalContext);
    return;
  }

  await removeMultiPortalOwnedRouteFromGetResponse(ctx);
}

async function mapMultiPortalLayoutToUiLayoutForRolePermissionTargets(
  ctx: ResourcerContext,
  next: () => Promise<void>,
) {
  const portalRequest = await findRequestedMultiPortal(ctx);
  if (portalRequest.requested && !portalRequest.portal) {
    ctx.status = 200;
    ctx.body = [];
    return;
  }

  const scope = portalRequest.scope;
  if (scope) {
    const routes = (await ctx.db.getRepository('desktopRoutes').find({
      sort: 'sort',
      filter: scope.filter,
      fields: [...DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS],
    })) as unknown[];
    const routeIds = new Set<string>();
    collectDesktopRouteStringIds(routes, routeIds);
    const routeTree = buildAccessibleDesktopRouteTreeWithAncestors(routes, routeIds);

    ctx.status = 200;
    ctx.body = removeNestedRootDesktopRoutes(routeTree).map((route) =>
      pickDesktopRouteRolePermissionTargetFields(route),
    );
    return;
  }

  await next();
  await removeMultiPortalOwnedRoutesFromListResponse(ctx);
}

async function addDesktopRouteCreateMultiPortal(ctx: ResourcerContext, next: () => Promise<void>) {
  const portalRequest = await findRequestedMultiPortal(ctx);
  if (portalRequest.requested && !portalRequest.portal) {
    ctx.throw(400, 'Invalid portal scope');
    return;
  }

  const scope = portalRequest.scope;

  if (scope) {
    await assertDesktopRouteParentsBelongToScope(ctx, scope);
    if (ctx.action?.actionName === 'updateOrCreate') {
      await assertDesktopRouteUpsertMatchesBelongToScope(ctx, scope);
    }
    ctx.action?.mergeParams(
      {
        values: withDesktopRouteEffectiveOwner(ctx.action?.params.values, scope),
      },
      {
        values: 'overwrite',
      },
    );
    await next();
    return;
  }

  await next();
}

async function addDesktopRouteEffectiveScopeFilter(ctx: ResourcerContext, next: () => Promise<void>) {
  const portalRequest = await findRequestedMultiPortal(ctx);
  if (!portalRequest.requested) {
    await next();
    return;
  }
  if (!portalRequest.scope) {
    ctx.throw(400, 'Invalid portal scope');
    return;
  }

  ctx.action?.mergeParams({
    filter: portalRequest.scope.filter,
  });
  await next();
}

function withoutDesktopRouteOwnerFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => withoutDesktopRouteOwnerFields(item));
  }
  if (!isDesktopRouteCreateValue(value)) {
    return value;
  }

  const { uiLayouts: _uiLayouts, multiPortals: _multiPortals, children, ...route } = value;
  return {
    ...route,
    ...(Array.isArray(children) ? { children: withoutDesktopRouteOwnerFields(children) } : {}),
  };
}

function normalizeDesktopRouteTargetIds(records: Model[]) {
  return records
    .map((record) => record.get('id'))
    .filter((id): id is DesktopRouteId => typeof id === 'string' || typeof id === 'number')
    .map(String)
    .sort();
}

async function findDesktopRouteMutationTargets(
  ctx: ResourcerContext,
  scopeFilter?: Record<string, string>,
  transaction?: Transaction,
  selector?: DesktopRouteMutationSelector,
) {
  const params = selector ?? ctx.action?.params ?? {};
  const values = params.values;
  const batchUpdateIds = Array.isArray(values)
    ? values.flatMap((value) => {
        if (!isDesktopRouteCreateValue(value)) {
          return [];
        }
        const routeId = value.id;
        return typeof routeId === 'string' || typeof routeId === 'number' ? [routeId] : [];
      })
    : [];
  const hasBatchUpdateTargets = batchUpdateIds.length > 0;
  const filterByTk = hasBatchUpdateTargets ? batchUpdateIds : params.filterByTk;
  const filter = !hasBatchUpdateTargets && isRecordLike(params.filter) ? params.filter : undefined;
  if ((filterByTk === undefined || filterByTk === null) && !filter) {
    return [];
  }

  return ctx.db.getRepository('desktopRoutes').find({
    fields: ['id'],
    ...(filterByTk !== undefined && filterByTk !== null ? { filterByTk } : {}),
    filter: {
      ...(filter ?? {}),
      ...(scopeFilter ?? {}),
    },
    ...(transaction && !scopeFilter ? { lock: transaction.LOCK.UPDATE } : {}),
    transaction,
  });
}

async function assertDesktopRouteMutationTargetsBelongToScope(
  ctx: ResourcerContext,
  scope: MultiPortalAccessContext,
  transaction?: Transaction,
  selector?: DesktopRouteMutationSelector,
) {
  const allTargets = await findDesktopRouteMutationTargets(ctx, undefined, transaction, selector);
  const scopedTargets = await findDesktopRouteMutationTargets(ctx, scope.filter, transaction, selector);
  const allTargetIds = normalizeDesktopRouteTargetIds(allTargets);
  const scopedTargetIds = normalizeDesktopRouteTargetIds(scopedTargets);
  if (!allTargetIds.length || allTargetIds.join(',') !== scopedTargetIds.join(',')) {
    ctx.throw(400, 'Desktop route does not belong to the requested portal scope');
  }
}

async function guardDesktopRouteUpdateScope(ctx: ResourcerContext, next: () => Promise<void>) {
  const portalRequest = await findRequestedMultiPortal(ctx);
  if (!portalRequest.requested) {
    await next();
    return;
  }
  const scope = portalRequest.scope;
  if (!scope) {
    ctx.throw(400, 'Invalid portal scope');
    return;
  }

  await assertDesktopRouteMutationTargetsBelongToScope(ctx, scope);

  await assertDesktopRouteParentsBelongToScope(ctx, scope);
  ctx.action?.mergeParams(
    {
      values: withoutDesktopRouteOwnerFields(ctx.action?.params.values),
    },
    {
      values: 'overwrite',
    },
  );

  await next();
}

function getDesktopRoutePortalContext(context: unknown) {
  if (!isRecordLike(context)) {
    return;
  }
  const ctx = context as ResourcerContext;
  if (ctx.action?.resourceName !== 'desktopRoutes' || !hasActionParam(ctx.action.params, 'portal')) {
    return;
  }
  return ctx;
}

async function resolveRequiredDesktopRouteScope(ctx: ResourcerContext, transaction: Transaction) {
  const portalRequest = await findRequestedMultiPortal(ctx, transaction);
  if (!portalRequest.scope) {
    ctx.throw(400, 'Invalid portal scope');
  }
  return portalRequest.scope;
}

function withDesktopRouteScopeFilter(filter: unknown, scope: MultiPortalAccessContext) {
  return {
    ...(isRecordLike(filter) ? filter : {}),
    ...scope.filter,
  };
}

class MultiPortalDesktopRouteRepository extends Repository {
  private async withAuthoritativeScopeTransaction<T>(
    existingTransaction: Transaction | undefined,
    callback: (transaction: Transaction) => Promise<T>,
  ) {
    if (existingTransaction) {
      return callback(existingTransaction);
    }
    return this.database.sequelize.transaction(callback);
  }

  async create(options: CreateOptions) {
    const ctx = getDesktopRoutePortalContext(options.context);
    if (!ctx) {
      return super.create(options);
    }

    return this.withAuthoritativeScopeTransaction(options.transaction, async (transaction) => {
      const scope = await resolveRequiredDesktopRouteScope(ctx, transaction);
      const values = withDesktopRouteEffectiveOwner(options.values, scope);
      await assertDesktopRouteParentsBelongToScope(ctx, scope, values, transaction);
      return super.create({
        ...options,
        values,
        transaction,
      });
    });
  }

  async update(options: UpdateOptions & { forceUpdate?: boolean }) {
    const ctx = getDesktopRoutePortalContext(options.context);
    if (!ctx) {
      return super.update(options);
    }

    return this.withAuthoritativeScopeTransaction(options.transaction, async (transaction) => {
      const scope = await resolveRequiredDesktopRouteScope(ctx, transaction);
      await assertDesktopRouteMutationTargetsBelongToScope(ctx, scope, transaction, options);
      const values = withoutDesktopRouteOwnerFields(options.values);
      await assertDesktopRouteParentsBelongToScope(ctx, scope, values, transaction);
      return super.update({
        ...options,
        filter: withDesktopRouteScopeFilter(options.filter, scope),
        values,
        transaction,
      });
    });
  }

  async updateOrCreate(options: FirstOrCreateOptions) {
    const ctx = getDesktopRoutePortalContext(options.context);
    if (!ctx) {
      return super.updateOrCreate(options);
    }

    return this.withAuthoritativeScopeTransaction(options.transaction, async (transaction) => {
      const scope = await resolveRequiredDesktopRouteScope(ctx, transaction);
      const values = withDesktopRouteEffectiveOwner(options.values, scope);
      await assertDesktopRouteParentsBelongToScope(ctx, scope, values, transaction);
      await assertDesktopRouteUpsertMatchesBelongToScope(ctx, scope, values, options.filterKeys, transaction);
      return super.updateOrCreate({
        ...options,
        values,
        transaction,
      });
    });
  }
}

async function guardDesktopRouteMoveScope(ctx: ResourcerContext, next: () => Promise<void>) {
  const portalRequest = await findRequestedMultiPortal(ctx);
  if (!portalRequest.requested) {
    await next();
    return;
  }

  const params = ctx.action?.params ?? {};
  const sourceId = params.sourceId;
  const targetId = params.targetId;
  const hasTargetId = targetId !== undefined && targetId !== null;
  if (
    (typeof sourceId !== 'string' && typeof sourceId !== 'number') ||
    (hasTargetId && typeof targetId !== 'string' && typeof targetId !== 'number') ||
    (params.sortField !== undefined && params.sortField !== 'sort')
  ) {
    ctx.throw(400, 'Invalid desktop route move scope');
    return;
  }

  await ctx.db.sequelize.transaction(async (transaction) => {
    const scope = await resolveRequiredDesktopRouteScope(ctx, transaction);
    const routeIds = uniqueDesktopRouteIds(hasTargetId ? [sourceId, targetId as DesktopRouteId] : [sourceId]);
    const allRoutes = await ctx.db.getRepository('desktopRoutes').find({
      fields: ['id', 'parentId', 'sort'],
      filter: {
        id: routeIds,
      },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    const scopedRoutes = await ctx.db.getRepository('desktopRoutes').find({
      fields: ['id', 'parentId', 'sort'],
      filter: {
        id: routeIds,
        ...scope.filter,
      },
      transaction,
    });
    if (
      normalizeDesktopRouteTargetIds(allRoutes).join(',') !== normalizeDesktopRouteTargetIds(scopedRoutes).join(',') ||
      scopedRoutes.length !== routeIds.length
    ) {
      ctx.throw(400, 'Move target does not belong to the requested portal scope');
      return;
    }

    const routesById = new Map<string, Model>(
      scopedRoutes.map((route): [string, Model] => [String(route.get('id')), route]),
    );
    let source = routesById.get(String(sourceId));
    const target = hasTargetId ? routesById.get(String(targetId)) : undefined;
    if (!source || (hasTargetId && !target)) {
      ctx.throw(400, 'Move target does not belong to the requested portal scope');
      return;
    }

    const targetScope = isRecordLike(params.targetScope) ? params.targetScope : undefined;
    const requestedParentId = targetScope?.parentId;
    const parentIds = uniqueDesktopRouteIds(
      [source.get('parentId'), target?.get('parentId'), requestedParentId].filter(
        (id): id is DesktopRouteId => typeof id === 'string' || typeof id === 'number',
      ),
    );
    if (parentIds.length) {
      const parents = await ctx.db.getRepository('desktopRoutes').find({
        fields: ['id'],
        filter: {
          id: parentIds,
          ...scope.filter,
        },
        transaction,
      });
      if (normalizeDesktopRouteTargetIds(parents).join(',') !== parentIds.map(String).sort().join(',')) {
        ctx.throw(400, 'Move parent does not belong to the requested portal scope');
        return;
      }
    }

    const updateSource = async (values: Record<string, unknown>, silent: boolean) => {
      const [updatedSource] = await ctx.db.getRepository('desktopRoutes').update({
        filterByTk: sourceId,
        values,
        silent,
        transaction,
      });
      if (!updatedSource) {
        ctx.throw(400, 'Move source does not belong to the requested portal scope');
      }
      source = updatedSource;
    };

    if (target) {
      const targetParentId = target.get('parentId');
      if (source.get('parentId') !== targetParentId) {
        await updateSource({ parentId: targetParentId }, false);
      }

      const sourceSort = source.get('sort');
      let targetSort = target.get('sort');
      if (typeof sourceSort !== 'number' || typeof targetSort !== 'number') {
        ctx.throw(400, 'Invalid desktop route sort value');
        return;
      }
      if (params.method === 'insertAfter') {
        targetSort += 1;
      }

      const movesForward = targetSort > sourceSort;
      const affectedRoutes = await ctx.db.getRepository('desktopRoutes').find({
        fields: ['id'],
        filter: {
          ...scope.filter,
          parentId: targetParentId ?? null,
          sort: movesForward
            ? {
                $gt: sourceSort,
                $lte: targetSort,
              }
            : {
                $lt: sourceSort,
                $gte: targetSort,
              },
        },
        transaction,
      });
      const affectedRouteIds = affectedRoutes.map((route) => route.get('id'));
      if (affectedRouteIds.length) {
        await ctx.db.getCollection('desktopRoutes').model.increment('sort', {
          where: {
            id: {
              [Op.in]: affectedRouteIds,
            },
          },
          by: movesForward ? -1 : 1,
          silent: true,
          transaction,
        });
      }
      await updateSource({ sort: targetSort }, true);
    }

    if (requestedParentId && source.get('parentId') !== requestedParentId) {
      await updateSource({ parentId: requestedParentId }, false);
      if (params.method === 'prepend') {
        await updateSource({ sort: 0 }, true);
      }
    }

    if (params.sticky) {
      await updateSource({ sort: 0 }, true);
    }
  });

  ctx.body = 'ok';
}

function normalizeDesktopRouteFilterByTk(filterByTk: unknown): DesktopRouteId[] {
  const values = Array.isArray(filterByTk) ? filterByTk : [filterByTk];
  return uniqueDesktopRouteIds(
    values.filter((value): value is DesktopRouteId => typeof value === 'string' || typeof value === 'number'),
  );
}

async function getDesktopRouteDestroyOwnerScope(
  ctx: ResourcerContext,
  transaction: Transaction,
): Promise<DesktopRouteOwnerScope | undefined> {
  const hasPortalScope = hasActionParam(ctx.action?.params, 'portal');
  const hasLayoutScope = hasActionParam(ctx.action?.params, 'layout');
  const portalUid = getExplicitRequestedLayoutUid(ctx.action?.params.portal);
  const layoutUid = getExplicitRequestedLayoutUid(ctx.action?.params.layout);
  if (hasPortalScope && hasLayoutScope) {
    ctx.throw(400, 'layout and portal cannot be used together');
    return;
  }

  if (hasPortalScope) {
    if (!portalUid) {
      ctx.throw(400, 'Invalid portal scope');
      return;
    }
    const portalRequest = await findRequestedMultiPortal(ctx, transaction);
    if (!portalRequest.scope) {
      ctx.throw(400, 'Invalid portal scope');
      return;
    }
    return portalRequest.scope;
  }

  if (!hasLayoutScope) {
    return;
  }
  if (!layoutUid) {
    ctx.throw(400, 'Invalid layout scope');
    return;
  }

  const layout = await ctx.db.getRepository('uiLayouts').findOne({
    fields: ['uid'],
    filter: {
      uid: layoutUid,
    },
    transaction,
  });
  if (!layout) {
    ctx.throw(400, 'Invalid layout scope');
    return;
  }

  return {
    filter: {
      'uiLayouts.uid': layoutUid,
    },
    relation: 'uiLayouts',
    uid: layoutUid,
  };
}

async function findDesktopRouteDestroyRoots(
  ctx: ResourcerContext,
  transaction: Transaction,
  scopeFilter?: Record<string, string>,
) {
  const filterByTk = normalizeDesktopRouteFilterByTk(ctx.action?.params.filterByTk);
  const actionFilter = isRecordLike(ctx.action?.params.filter) ? ctx.action?.params.filter : undefined;
  if (!filterByTk.length && !actionFilter) {
    return [];
  }

  const records = await ctx.db.getRepository('desktopRoutes').find({
    fields: ['id'],
    filter: {
      ...(actionFilter ?? {}),
      ...(scopeFilter ?? {}),
      ...(filterByTk.length ? { id: filterByTk } : {}),
    },
    ...(scopeFilter ? {} : { lock: transaction.LOCK.UPDATE }),
    transaction,
  });
  return collectDesktopRouteIds(records);
}

async function findDesktopRouteSubtreeIds(ctx: ResourcerContext, rootId: DesktopRouteId, transaction: Transaction) {
  const rootRoutes = await ctx.db.getRepository('desktopRoutes').find({
    fields: ['id'],
    filter: {
      id: rootId,
    },
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
  const routeIds = collectDesktopRouteIds(rootRoutes);
  let parentIds = [...routeIds];

  while (parentIds.length) {
    const children = await ctx.db.getRepository('desktopRoutes').find({
      fields: ['id'],
      filter: {
        parentId: parentIds,
      },
      lock: transaction.LOCK.UPDATE,
      sort: ['id'],
      transaction,
    });
    const childIds = collectDesktopRouteIds(children).filter((routeId) => !routeIds.includes(routeId));
    routeIds.push(...childIds);
    parentIds = childIds;
  }

  return routeIds;
}

function getDesktopRouteOwnerUids(route: unknown, relation: DesktopRouteOwnerRelation) {
  const owners = getRecordField(route, relation);
  if (!Array.isArray(owners)) {
    return [];
  }
  return owners
    .map((owner) => getRecordField(owner, 'uid'))
    .filter((uid): uid is string => typeof uid === 'string' && !!uid);
}

function desktopRouteHasOwnerOutsideScope(route: Model, scope: DesktopRouteOwnerScope) {
  const multiPortalUids = getDesktopRouteOwnerUids(route, 'multiPortals');
  const uiLayoutUids = getDesktopRouteOwnerUids(route, 'uiLayouts');
  if (scope.relation === 'multiPortals') {
    return multiPortalUids.some((uid) => uid !== scope.uid) || uiLayoutUids.length > 0;
  }
  return uiLayoutUids.some((uid) => uid !== scope.uid) || multiPortalUids.length > 0;
}

async function detachDesktopRouteTreeOwner(
  ctx: ResourcerContext,
  routeIds: DesktopRouteId[],
  scope: DesktopRouteOwnerScope,
  transaction: Transaction,
) {
  if (scope.relation === 'multiPortals') {
    await ctx.db.getRepository('rolesMultiPortalDesktopRoutes').destroy({
      filter: {
        multiPortalUid: scope.uid,
        desktopRouteId: routeIds,
      },
      transaction,
    });
  }
  for (const routeId of routeIds) {
    await ctx.db.getRepository(`desktopRoutes.${scope.relation}`, routeId).remove({
      tk: scope.uid,
      transaction,
    });
  }
}

async function detachOwnerAndFindDestroyRoots(
  ctx: ResourcerContext,
  routeIds: DesktopRouteId[],
  scope: DesktopRouteOwnerScope,
  transaction: Transaction,
) {
  await ctx.db.getRepository('desktopRoutes').find({
    fields: ['id'],
    filter: {
      id: routeIds,
    },
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
  const routes = await ctx.db.getRepository('desktopRoutes').find({
    fields: ['id', 'parentId'],
    appends: ['multiPortals', 'uiLayouts'],
    filter: {
      id: routeIds,
    },
    transaction,
  });
  const routesById = new Map<string, Model>(routes.map((route): [string, Model] => [String(route.get('id')), route]));
  const ownerlessRouteIds = new Set(
    routes.filter((route) => !desktopRouteHasOwnerOutsideScope(route, scope)).map((route) => String(route.get('id'))),
  );

  await detachDesktopRouteTreeOwner(ctx, routeIds, scope, transaction);

  for (const route of routes) {
    if (ownerlessRouteIds.has(String(route.get('id')))) {
      continue;
    }
    let parentId = route.get('parentId');
    const visitedParentIds = new Set<string>();
    while (parentId !== null && parentId !== undefined && ownerlessRouteIds.has(String(parentId))) {
      const normalizedParentId = String(parentId);
      if (visitedParentIds.has(normalizedParentId)) {
        ctx.throw(400, 'Invalid desktop route tree');
        return [];
      }
      visitedParentIds.add(normalizedParentId);
      parentId = routesById.get(normalizedParentId)?.get('parentId') ?? null;
    }
    if (route.get('parentId') !== parentId) {
      await ctx.db.getRepository('desktopRoutes').update({
        filterByTk: route.get('id'),
        values: {
          parentId,
        },
        transaction,
      });
    }
  }

  return routes
    .filter((route) => {
      if (!ownerlessRouteIds.has(String(route.get('id')))) {
        return false;
      }
      const parentId = route.get('parentId');
      return parentId === null || parentId === undefined || !ownerlessRouteIds.has(String(parentId));
    })
    .map((route) => route.get('id') as DesktopRouteId);
}

async function destroyScopedDesktopRoutes(ctx: ResourcerContext, next: () => Promise<void>) {
  if (!hasActionParam(ctx.action?.params, 'portal') && !hasActionParam(ctx.action?.params, 'layout')) {
    await next();
    return;
  }

  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const scope = await getDesktopRouteDestroyOwnerScope(ctx, transaction);
    if (!scope) {
      return true;
    }

    const allRootIds = (await findDesktopRouteDestroyRoots(ctx, transaction)).sort((left, right) =>
      String(left).localeCompare(String(right)),
    );
    const rootIds = (await findDesktopRouteDestroyRoots(ctx, transaction, scope.filter)).sort((left, right) =>
      String(left).localeCompare(String(right)),
    );
    if (allRootIds.map(String).join(',') !== rootIds.map(String).join(',')) {
      ctx.throw(400, 'Desktop route does not belong to the requested portal scope');
      return true;
    }
    const routeTrees: Array<{ rootId: DesktopRouteId; routeIds: DesktopRouteId[] }> = [];
    for (const rootId of rootIds) {
      routeTrees.push({
        rootId,
        routeIds: await findDesktopRouteSubtreeIds(ctx, rootId, transaction),
      });
    }
    const rootRouteTrees = routeTrees.filter(
      (routeTree, index) =>
        !routeTrees.some(
          (candidate, candidateIndex) => candidateIndex !== index && candidate.routeIds.includes(routeTree.rootId),
        ),
    );
    const physicalDestroyRootIds: DesktopRouteId[] = [];

    for (const routeTree of rootRouteTrees) {
      physicalDestroyRootIds.push(
        ...(await detachOwnerAndFindDestroyRoots(ctx, routeTree.routeIds, scope, transaction)),
      );
    }

    if (!physicalDestroyRootIds.length) {
      return true;
    }

    return ctx.db.getRepository('desktopRoutes').destroy({
      context: ctx,
      filterByTk: physicalDestroyRootIds.length === 1 ? physicalDestroyRootIds[0] : physicalDestroyRootIds,
      transaction,
    });
  });

  ctx.status = 200;
  ctx.body = result;
}

async function listEnabledMultiPortals(ctx: ResourcerContext, next: () => Promise<void>) {
  const records = await ctx.db.getRepository('multiPortals').find({
    filter: {
      enabled: true,
      uiLayoutUid: {
        $in: [...MULTI_PORTAL_UI_LAYOUT_UIDS],
      },
    },
    fields: [...MULTI_PORTAL_RUNTIME_FIELDS],
    sort: ['uid'],
  });

  ctx.body = records.map((record) => pickMultiPortalRuntimeFields(record));
  await next();
}

const DEFAULT_MULTI_PORTAL_RESPONSE_FIELDS = ['uid', 'portalType', 'routePath'] as const;

function getDefaultMultiPortalType(record: Model): MultiPortalSeedType | null {
  const portalType = record.get('portalType');
  if (portalType === null || portalType === undefined) {
    return 'no-code';
  }
  return isMultiPortalSeedType(portalType) ? portalType : null;
}

function pickDefaultMultiPortalFields(record: Model) {
  return {
    uid: String(record.get('uid')),
    portalType: getDefaultMultiPortalType(record) || 'no-code',
    routePath: String(record.get('routePath')),
  };
}

async function findEnabledDefaultMultiPortal(ctx: ResourcerContext, transaction?: Transaction) {
  const record = await ctx.db.getRepository('multiPortals').findOne({
    filter: {
      enabled: true,
      isDefault: true,
    },
    fields: [...DEFAULT_MULTI_PORTAL_RESPONSE_FIELDS, 'uiLayoutUid'],
    transaction,
  });
  if (!record) {
    return null;
  }

  const portalType = getDefaultMultiPortalType(record);
  if (!portalType) {
    return null;
  }
  if (!isMultiPortalUiLayoutUid(record.get('uiLayoutUid'))) {
    return null;
  }
  return record;
}

async function getDefaultMultiPortal(ctx: ResourcerContext, next: () => Promise<void>) {
  const record = await findEnabledDefaultMultiPortal(ctx);
  ctx.body = record ? pickDefaultMultiPortalFields(record) : null;
  ctx.status = 200;
  await next();
}

async function setDefaultMultiPortal(ctx: ResourcerContext, next: () => Promise<void>) {
  const filterByTk = ctx.action?.params.filterByTk;
  if (filterByTk === undefined || filterByTk === null || filterByTk === '') {
    ctx.throw(400, ctx.t('filterByTk is required', { ns: NAMESPACE }));
    return;
  }

  const repository = ctx.db.getRepository('multiPortals');
  const updated = await ctx.db.sequelize.transaction(async (transaction) => {
    const target = await repository.findOne({
      filterByTk,
      fields: [...DEFAULT_MULTI_PORTAL_RESPONSE_FIELDS, 'enabled', 'uiLayoutUid'],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!target) {
      ctx.throw(404, ctx.t('Portal not found', { ns: NAMESPACE }));
      return null;
    }
    if (target.get('enabled') !== true) {
      ctx.throw(400, ctx.t('Disabled Portal cannot be set as default', { ns: NAMESPACE }));
      return null;
    }
    const portalType = getDefaultMultiPortalType(target);
    if (!portalType) {
      ctx.throw(400, ctx.t('Unsupported Portal type cannot be set as default', { ns: NAMESPACE }));
      return null;
    }
    if (!isMultiPortalUiLayoutUid(target.get('uiLayoutUid'))) {
      ctx.throw(400, ctx.t('Portal device configuration is invalid', { ns: NAMESPACE }));
      return null;
    }

    await repository.update({
      filter: { isDefault: true },
      values: { isDefault: null },
      transaction,
    });
    await repository.update({
      filterByTk,
      values: { isDefault: true },
      transaction,
    });
    return repository.findOne({
      filterByTk,
      fields: [...DEFAULT_MULTI_PORTAL_RESPONSE_FIELDS],
      transaction,
    });
  });

  ctx.body = updated ? pickDefaultMultiPortalFields(updated) : null;
  await next();
}

async function listAccessibleMultiPortals(ctx: ResourcerContext, next: () => Promise<void>) {
  const accessiblePortalUids = await listCurrentRoleAccessibleMultiPortalUids(ctx);

  const records = await ctx.db.getRepository('multiPortals').find({
    filter: {
      enabled: true,
      uiLayoutUid: {
        $in: [...MULTI_PORTAL_UI_LAYOUT_UIDS],
      },
    },
    fields: [...MULTI_PORTAL_ACCESSIBLE_FIELDS],
    sort: ['uid'],
  });
  const accessiblePortalUidSet = Array.isArray(accessiblePortalUids) ? new Set(accessiblePortalUids) : undefined;
  const accessibleRecords = records.filter(
    (record) =>
      isDefaultLayoutMultiPortalUid(record.get('uid')) ||
      !accessiblePortalUidSet ||
      accessiblePortalUidSet.has(String(record.get('uid'))),
  );

  ctx.body = accessibleRecords.map((record) => pickMultiPortalAccessibleFields(record));
  await next();
}

async function grantDefaultRouteAccessToNewMultiPortalRoutes(
  ctx: ResourcerContext,
  multiPortalUid: string,
  desktopRouteIds: DesktopRouteId[],
  transaction: Transaction,
) {
  if (!desktopRouteIds.length) {
    return;
  }

  const routePolicies = await ctx.db.getRepository('rolesMultiPortalRoutePolicies').find({
    fields: ['roleName'],
    filter: {
      multiPortalUid,
      allowNewMenu: true,
    },
    transaction,
  });
  const roleNames = routePolicies
    .map((routePolicy) => routePolicy.get('roleName'))
    .filter((roleName): roleName is string => typeof roleName === 'string' && !!roleName);
  if (!roleNames.length) {
    return;
  }

  const routePermissionRepository = ctx.db.getRepository('rolesMultiPortalDesktopRoutes');
  for (const roleName of roleNames) {
    for (const desktopRouteId of desktopRouteIds) {
      await routePermissionRepository.firstOrCreate({
        filterKeys: ['roleName', 'multiPortalUid', 'desktopRouteId'],
        values: {
          roleName,
          multiPortalUid,
          desktopRouteId,
        },
        context: ctx,
        transaction,
      });
    }
  }
}

async function removeLayoutRoutePermissionsFromPortalRoutes(
  ctx: ResourcerContext,
  desktopRouteIds: DesktopRouteId[],
  transaction: Transaction,
) {
  if (!desktopRouteIds.length) {
    return;
  }

  await ctx.db.getRepository('rolesDesktopRoutes').destroy({
    filter: {
      desktopRouteId: desktopRouteIds,
    },
    context: ctx,
    transaction,
  });
}

async function reconcileCreatedDesktopRoutePermissions(desktopRoute: Model, options?: DatabaseHookOptions) {
  const ctx = options?.context;
  if (!ctx) {
    return;
  }

  const portalRequest = await findRequestedMultiPortal(ctx, options.transaction);
  if (!portalRequest.requested) {
    return;
  }
  const scope = portalRequest.scope;
  if (!scope) {
    ctx.throw(400, 'Invalid portal scope');
    return;
  }
  if (scope.relation !== 'multiPortals') {
    return;
  }
  const transaction = options.transaction;
  if (!transaction) {
    throw new Error('Portal desktop route creation requires a transaction');
  }
  const desktopRouteId = desktopRoute.get('id');
  if (typeof desktopRouteId !== 'string' && typeof desktopRouteId !== 'number') {
    throw new Error('Created Portal desktop route has no identifier');
  }

  await removeLayoutRoutePermissionsFromPortalRoutes(ctx, [desktopRouteId], transaction);
  await grantDefaultRouteAccessToNewMultiPortalRoutes(ctx, scope.portalUid, [desktopRouteId], transaction);
}

async function grantDefaultAccessToNewMultiPortal(
  db: Database,
  multiPortal: Model,
  options?: DatabaseHookOptions,
  grantOptions: GrantDefaultAccessOptions = {},
) {
  if (multiPortal.get('enabled') !== true) {
    return;
  }
  const multiPortalUid = multiPortal.get('uid');
  if (typeof multiPortalUid !== 'string' || !multiPortalUid) {
    return;
  }
  if (!grantOptions.includeDefaultLayoutMultiPortal && isDefaultLayoutMultiPortalUid(multiPortalUid)) {
    return;
  }
  if (!db.getCollection('roles') || !db.getCollection('rolesMultiPortals')) {
    return;
  }

  const roles = await db.getRepository('roles').find({
    fields: ['name'],
    filter: {
      allowNewMultiPortal: true,
    },
    transaction: options?.transaction,
  });
  const roleNames = roles
    .map((role) => role.get('name'))
    .filter((roleName): roleName is string => typeof roleName === 'string' && !!roleName);
  const records = roleNames.map((roleName) => ({
    roleName,
    multiPortalUid,
  }));
  const routePolicyRecords = roleNames.map((roleName) => ({
    roleName,
    multiPortalUid,
    allowNewMenu: true,
  }));

  if (!records.length) {
    return;
  }

  const repository = db.getRepository('rolesMultiPortals');
  for (const values of records) {
    await repository.firstOrCreate({
      filterKeys: ['roleName', 'multiPortalUid'],
      values,
      transaction: options?.transaction,
    });
  }

  if (multiPortal.get('portalType') === 'ai' || !db.getCollection('rolesMultiPortalRoutePolicies')) {
    return;
  }

  const routePolicyRepository = db.getRepository('rolesMultiPortalRoutePolicies');
  for (const values of routePolicyRecords) {
    await routePolicyRepository.firstOrCreate({
      filterKeys: ['roleName', 'multiPortalUid'],
      values,
      transaction: options?.transaction,
    });
  }
}

export class PluginMultiPortalServer extends Plugin {
  private portalStorageTaskKeys = new Set<string>();
  private portalStorageTasks = new Map<string, Promise<void>>();
  private deprecatedInitPortalEnvWarningEmitted = false;

  async afterAdd() {}

  private getAppName() {
    return this.app.name || MAIN_APP_NAME;
  }

  private getCurrentStorageAppName() {
    return normalizePortalStorageName(this.getAppName()) || MAIN_APP_NAME;
  }

  private getMultiPortalStorageItem(multiPortal: Model, previous = false): MultiPortalStorageItem | null {
    const record = multiPortal as ModelWithPrevious;
    const readField = (field: string) =>
      previous && typeof record.previous === 'function' ? record.previous(field) : getRecordField(record, field);
    const portalType = readField('portalType');
    if (portalType !== 'ai') {
      return null;
    }

    const portalName = normalizePortalStorageName(readField('portalName'));
    if (!portalName || !isValidPortalStorageName(portalName)) {
      return null;
    }

    return {
      appName: this.getAppName(),
      portalName,
      enabled: readField('enabled') === true,
    };
  }

  private warnPortalStorageSyncFailed(error: unknown) {
    this.app.logger?.warn?.('failed to sync multi-portal storage portal', {
      appName: this.getAppName(),
      error,
    });
  }

  private logPortalBuildHtml(
    item: Pick<MultiPortalStorageItem, 'appName' | 'portalName'>,
    status: 'requested' | 'skipped' | 'completed',
    reason: string,
  ) {
    this.app.logger?.info?.(`Portal yarn build:html ${status} for ${item.appName}/${item.portalName}`, {
      appName: item.appName,
      portalName: item.portalName,
      reason,
    });
  }

  private getPortalStorageTaskKey(item: Pick<MultiPortalStorageItem, 'appName' | 'portalName'>) {
    return `${item.appName}/${item.portalName}`;
  }

  private async runPortalStorageTask(task: () => Promise<void>, options?: DatabaseHookOptions) {
    const run = async () => {
      try {
        await task();
      } catch (error) {
        this.warnPortalStorageSyncFailed(error);
      }
    };

    if (options?.transaction?.afterCommit) {
      options.transaction.afterCommit(() => run());
      return;
    }

    await run();
  }

  private async removePortalStorageIndexHtml(item: Pick<MultiPortalStorageItem, 'appName' | 'portalName'>) {
    await fs.promises.rm(storagePathJoin('portals', item.appName, item.portalName, 'dist', 'client', 'index.html'), {
      force: true,
    });
  }

  private waitForPortalStorageTasks() {
    const tasks = [...this.portalStorageTasks.values()];
    if (!tasks.length) {
      return Promise.resolve();
    }
    return Promise.allSettled(tasks).then(() => undefined);
  }

  private async schedulePortalTemplateCopyAndBuild(
    item: MultiPortalStorageItem,
    template: ResolvedPortalTemplate,
    portalDir: string,
    options?: DatabaseHookOptions,
  ) {
    const taskKey = this.getPortalStorageTaskKey(item);
    if (this.portalStorageTaskKeys.has(taskKey)) {
      this.logPortalBuildHtml(item, 'skipped', 'a storage task is already running');
      await template.cleanup?.();
      return;
    }

    this.portalStorageTaskKeys.add(taskKey);
    const task = (async () => {
      const logPath = getPortalStorageLogPath(item);
      try {
        await appendPortalStorageLog(
          logPath,
          `Portal storage create task started for ${item.appName}/${item.portalName}.`,
        );
        if (!(await pathExists(portalDir))) {
          await appendPortalStorageLog(
            logPath,
            `Copying default portal template from ${template.dir} to ${portalDir}.`,
          );
          await copyPortalTemplate(template.dir, portalDir, { includeDist: template.includeDist });
          await appendPortalStorageLog(logPath, `Default portal template copied to ${portalDir}.`);
        }
        if (item.enabled) {
          this.logPortalBuildHtml(item, 'requested', 'storage directory was initialized');
          await buildPortalStorageItem(portalDir, item, options);
          this.logPortalBuildHtml(item, 'completed', 'yarn build:html finished successfully');
          return;
        }

        this.logPortalBuildHtml(item, 'skipped', 'the portal is disabled');
      } catch (error) {
        await appendPortalStorageLog(
          logPath,
          `Portal storage create task failed for ${item.appName}/${item.portalName}.`,
        );
        this.warnPortalStorageSyncFailed(error);
      } finally {
        await template.cleanup?.();
        this.portalStorageTaskKeys.delete(taskKey);
        this.portalStorageTasks.delete(taskKey);
      }
    })();

    this.portalStorageTasks.set(taskKey, task);
    await task;
  }

  private async ensurePortalStorageItem(
    item: MultiPortalStorageItem,
    options: DatabaseHookOptions & {
      forceBuild?: boolean;
    } = {},
  ) {
    const portalDir = storagePathJoin('portals', item.appName, item.portalName);
    const portalIndex = path.join(portalDir, PORTAL_CLIENT_DIST_DIR, 'index.html');
    const logPath = getPortalStorageLogPath(item);

    if (!(await pathExists(portalDir))) {
      const template = await resolvePortalTemplate(getInitPortalTemplate(), logPath);
      await this.schedulePortalTemplateCopyAndBuild(item, template, portalDir, options);
      return;
    }

    if (item.enabled) {
      const normalizedLegacyDist = await normalizeLegacyPortalClientDist(portalDir, logPath);
      const hasPortalIndex = normalizedLegacyDist || (await pathExists(portalIndex));
      if (options.forceBuild || !hasPortalIndex) {
        this.logPortalBuildHtml(
          item,
          'requested',
          options.forceBuild ? 'forceBuild is enabled' : 'dist/client/index.html does not exist',
        );
        await buildPortalStorageItem(portalDir, item, options);
        this.logPortalBuildHtml(item, 'completed', 'yarn build:html finished successfully');
      } else {
        this.logPortalBuildHtml(item, 'skipped', 'dist/client/index.html already exists');
      }
      return;
    }

    this.logPortalBuildHtml(item, 'skipped', 'the portal is disabled');
  }

  private async syncMultiPortalStorageItem(
    multiPortal: Model,
    options?: DatabaseHookOptions,
    syncPrevious = false,
    forceBuild = false,
  ) {
    const currentItem = this.getMultiPortalStorageItem(multiPortal);
    const previousItem = syncPrevious ? this.getMultiPortalStorageItem(multiPortal, true) : null;

    await this.runPortalStorageTask(async () => {
      if (
        previousItem &&
        (!currentItem ||
          previousItem.appName !== currentItem.appName ||
          previousItem.portalName !== currentItem.portalName)
      ) {
        await this.removePortalStorageIndexHtml(previousItem);
      }
      if (currentItem) {
        await this.ensurePortalStorageItem(currentItem, { ...options, forceBuild });
      }
    }, options);
  }

  private async removeMultiPortalStorageItem(multiPortal: Model, options?: DatabaseHookOptions) {
    const item = this.getMultiPortalStorageItem(multiPortal);
    if (!item) {
      return;
    }

    await this.runPortalStorageTask(async () => {
      const logPath = getPortalStorageLogPath(item);
      await appendPortalStorageLog(
        logPath,
        `Portal storage delete task started for ${item.appName}/${item.portalName}.`,
      );
      await fs.promises.rm(storagePathJoin('portals', item.appName, item.portalName), { force: true, recursive: true });
      await appendPortalStorageLog(logPath, `Portal storage directory deleted for ${item.appName}/${item.portalName}.`);
    }, options);
  }

  private async getMultiPortalLog(ctx: ResourcerContext, next: () => Promise<void>) {
    const filterByTk = ctx.action.params.filterByTk;
    if (typeof filterByTk !== 'string' || !filterByTk) {
      ctx.throw(400, 'filterByTk is required');
      return;
    }

    const multiPortal = await this.db.getRepository('multiPortals').findOne({
      filterByTk,
      fields: ['uid', 'portalType', 'portalName', 'enabled'],
    });
    const item = multiPortal ? this.getMultiPortalStorageItem(multiPortal) : null;
    if (!item) {
      ctx.throw(404, 'Portal log is only available for AI portals');
      return;
    }

    const logPath = getPortalStorageLogPath(item);
    const content = (await pathExists(logPath)) ? await fs.promises.readFile(logPath, 'utf-8') : '';
    ctx.body = {
      content,
      path: getPortalStorageLogRelativePath(item),
    };
    await next();
  }

  private async restartPortalHostAfterDeploy(appName: string, portalName: string) {
    const supervisor = PortalHostSupervisor.getInstance();
    const info = supervisor.getInfo();
    if (info.driver === 'external' || info.driver === 'disabled') {
      this.app.logger?.info?.(`Portal host restart skipped after deploy for ${appName}/${portalName}`, {
        appName,
        portalName,
        driver: info.driver,
        status: info.status,
      });
      return;
    }

    try {
      await supervisor.restart(`multiPortals:deploy updated ${appName}/${portalName}`);
      this.app.logger?.info?.(`Portal host restarted after deploy for ${appName}/${portalName}`, {
        appName,
        portalName,
        driver: info.driver,
      });
    } catch (error) {
      this.app.logger?.warn?.('failed to restart portal host after multi-portal deploy', {
        appName,
        portalName,
        error,
      });
    }
  }

  private async deployPortalDist(ctx: ResourcerContext, next: () => Promise<void>) {
    const deployCtx = ctx as MultiPortalDeployContext;
    const appName = this.getCurrentStorageAppName();
    const portalName = normalizePortalStorageName(deployCtx.request.body?.portal);
    const basePath = trimString(deployCtx.request.body?.basePath);
    const filePath = trimString(deployCtx.request.file?.path);

    try {
      if (!isValidPortalDeploySegment(appName)) {
        throw new Error('Invalid app');
      }
      if (!portalName || !isValidPortalDeploySegment(portalName)) {
        throw new Error('Invalid portal');
      }
      if (!basePath) {
        throw new Error('basePath is required');
      }
      if (!filePath || !(await pathExists(filePath))) {
        throw new Error('file is required');
      }

      validatePortalDeployBasePath(appName, portalName, basePath);
      const distPath = await replacePortalDistFromArchive({
        filePath,
        appName,
        portalName,
      });
      await this.restartPortalHostAfterDeploy(appName, portalName);
      ctx.body = {
        status: 'ok',
        app: appName,
        portal: portalName,
        basePath: resolvePortalStoragePublicPath(basePath),
        distPath,
        deployedAt: new Date().toISOString(),
      };
      await next();
    } catch (error) {
      if (filePath) {
        await fs.promises.rm(filePath, { force: true });
      }
      ctx.throw(400, error instanceof Error ? error.message : String(error));
    }
  }

  private async pullPortalSource(ctx: ResourcerContext, next: () => Promise<void>) {
    const appName = this.getCurrentStorageAppName();
    const portalName = normalizePortalStorageName(ctx.action.params.values?.portal);

    try {
      if (!isValidPortalDeploySegment(appName)) {
        throw new Error('Invalid app');
      }
      if (!portalName || !isValidPortalDeploySegment(portalName)) {
        throw new Error('Invalid portal');
      }

      const archivePath = await packPortalSource({ appName, portalName });
      ctx.attachment(`${portalName}-source.tar.gz`);
      ctx.body = fs.createReadStream(archivePath);
      ctx.res.once('finish', () => {
        fs.promises.rm(archivePath, { force: true });
      });
      await next();
    } catch (error) {
      ctx.throw(400, error instanceof Error ? error.message : String(error));
    }
  }

  private async pushPortalSource(ctx: ResourcerContext, next: () => Promise<void>) {
    const sourceCtx = ctx as MultiPortalDeployContext;
    const appName = this.getCurrentStorageAppName();
    const portalName = normalizePortalStorageName(sourceCtx.request.body?.portal);
    const filePath = trimString(sourceCtx.request.file?.path);

    try {
      if (!isValidPortalDeploySegment(appName)) {
        throw new Error('Invalid app');
      }
      if (!portalName || !isValidPortalDeploySegment(portalName)) {
        throw new Error('Invalid portal');
      }
      if (!filePath || !(await pathExists(filePath))) {
        throw new Error('file is required');
      }

      const sourcePath = await replacePortalSourceFromArchive({
        filePath,
        appName,
        portalName,
      });
      const sourceRevision = new Date().toISOString();
      const repository = this.db.getRepository('multiPortals');
      const multiPortal = await repository.findOne({
        filterByTk: portalName,
        fields: ['uid', 'options'],
      });
      const currentOptions = multiPortal ? getRecordField(multiPortal, 'options') : undefined;
      const options =
        currentOptions && typeof currentOptions === 'object' && !Array.isArray(currentOptions)
          ? { ...(currentOptions as Record<string, unknown>) }
          : {};
      await this.db.getRepository('multiPortals').update({
        filterByTk: portalName,
        values: {
          options: {
            ...options,
            sourceStorage: 'nocobase',
            sourceRevision,
            sourceUpdatedAt: sourceRevision,
          },
        },
      });
      ctx.body = {
        status: 'ok',
        app: appName,
        portal: portalName,
        sourcePath,
        sourceRevision,
      };
      await next();
    } catch (error) {
      if (filePath) {
        await fs.promises.rm(filePath, { force: true });
      }
      ctx.throw(400, error instanceof Error ? error.message : String(error));
    }
  }

  async listAppPortalManifest(options?: DatabaseHookOptions): Promise<AppPortalManifestItem[]> {
    const records = await this.db.getRepository('multiPortals').find({
      filter: {
        enabled: true,
        uiLayoutUid: {
          $in: [...MULTI_PORTAL_UI_LAYOUT_UIDS],
        },
      },
      fields: [...MULTI_PORTAL_ACCESSIBLE_FIELDS],
      sort: ['uid'],
      transaction: options?.transaction,
    });

    return records.flatMap((record) => {
      const item = this.toAppPortalManifestItem(record);
      return item ? [item] : [];
    });
  }

  private toAppPortalManifestItem(multiPortal: Model): AppPortalManifestItem | null {
    const uid = getRecordField(multiPortal, 'uid');
    const title = getRecordField(multiPortal, 'title');
    const portalType = getRecordField(multiPortal, 'portalType');
    const routePath = getRecordField(multiPortal, 'routePath');
    const enabled = getRecordField(multiPortal, 'enabled');

    if (
      typeof uid !== 'string' ||
      !uid ||
      typeof title !== 'string' ||
      typeof routePath !== 'string' ||
      !routePath ||
      enabled !== true
    ) {
      return null;
    }

    const uiLayoutUid = getRecordField(multiPortal, 'uiLayoutUid');
    const layout = getMultiPortalLayoutType(uiLayoutUid);
    if (!layout) {
      return null;
    }

    const icon = getRecordField(multiPortal, 'icon');
    return {
      uid,
      title,
      icon: typeof icon === 'string' ? icon : null,
      portalType: typeof portalType === 'string' ? portalType : null,
      routePath,
      layout,
    };
  }

  private async setAppManifestItem(item: AppPortalManifestItem, options?: DatabaseHookOptions) {
    try {
      await AppSupervisor.getInstance().setAppManifestItem(
        this.getAppName(),
        MULTI_PORTAL_MANIFEST_NAMESPACE,
        item.uid,
        item,
      );
      await this.notifyAppManifestChanged({ action: 'set', itemKey: item.uid }, options);
    } catch (error) {
      this.app.logger?.warn?.('failed to set multi-portal app manifest item', {
        appName: this.getAppName(),
        itemKey: item.uid,
        error,
      });
    }
  }

  private async removeAppManifestItem(itemKey: string, options?: DatabaseHookOptions) {
    try {
      await AppSupervisor.getInstance().removeAppManifestItem(
        this.getAppName(),
        MULTI_PORTAL_MANIFEST_NAMESPACE,
        itemKey,
      );
      await this.notifyAppManifestChanged({ action: 'remove', itemKey }, options);
    } catch (error) {
      this.app.logger?.warn?.('failed to remove multi-portal app manifest item', {
        appName: this.getAppName(),
        itemKey,
        error,
      });
    }
  }

  private async publishAppManifestItem(multiPortal: Model, options?: DatabaseHookOptions) {
    const uid = getRecordField(multiPortal, 'uid');
    if (typeof uid !== 'string' || !uid) {
      return;
    }
    const item = this.toAppPortalManifestItem(multiPortal);
    if (item) {
      await this.setAppManifestItem(item, options);
      return;
    }
    await this.removeAppManifestItem(uid, options);
  }

  private async reconcilePortalStorage(options?: DatabaseHookOptions) {
    const records = await this.db.getRepository('multiPortals').find({
      filter: {
        portalType: 'ai',
      },
      fields: ['uid', 'portalType', 'portalName', 'enabled'],
      transaction: options?.transaction,
    });
    for (const record of records) {
      await this.syncMultiPortalStorageItem(record, options);
    }
  }

  private async reconcileAppManifest(options?: DatabaseHookOptions) {
    await this.removeAppManifest();
    for (const item of await this.listAppPortalManifest(options)) {
      await this.setAppManifestItem(item, options);
    }
  }

  private async removeAppManifest() {
    try {
      await AppSupervisor.getInstance().removeAppManifest(this.getAppName(), MULTI_PORTAL_MANIFEST_NAMESPACE);
      await this.notifyAppManifestChanged({ action: 'clear' });
    } catch (error) {
      this.app.logger?.warn?.('failed to remove multi-portal app manifest', {
        appName: this.getAppName(),
        error,
      });
    }
  }

  private async notifyAppManifestChanged(
    message: Pick<AppPortalManifestSyncMessage, 'action' | 'itemKey'>,
    options?: DatabaseHookOptions,
  ) {
    const syncMessage = {
      type: MULTI_PORTAL_MANIFEST_SYNC_MESSAGE_TYPE,
      appName: this.getAppName(),
      namespace: MULTI_PORTAL_MANIFEST_NAMESPACE,
      ...message,
    } satisfies AppPortalManifestSyncMessage;

    if (options?.transaction?.afterCommit) {
      options.transaction.afterCommit(() => this.sendSyncMessage(syncMessage));
      return;
    }

    await this.sendSyncMessage(syncMessage);
  }

  async handleSyncMessage(message: unknown) {
    if (
      isRecordLike(message) &&
      message.type === MULTI_PORTAL_MANIFEST_SYNC_MESSAGE_TYPE &&
      message.namespace === MULTI_PORTAL_MANIFEST_NAMESPACE
    ) {
      this.app.emit(MULTI_PORTAL_MANIFEST_SYNC_MESSAGE_TYPE, message);
    }
  }

  async beforeLoad() {
    this.app.db.registerRepositories({ MultiPortalDesktopRouteRepository });
    this.app.resourceManager.registerPreActionHandler('roles:check', checkMultiPortalAccessForRolesCheck);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:list', addDesktopRouteEffectiveScopeFilter);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:get', addDesktopRouteEffectiveScopeFilter);
    this.app.resourceManager.registerPreActionHandler(
      'desktopRoutes:listAccessible',
      addMultiPortalListAccessibleGuard,
    );
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:getAccessible', addMultiPortalGetAccessibleGuard);
    this.app.resourceManager.registerPreActionHandler(
      'desktopRoutes:listRolePermissionTargets',
      mapMultiPortalLayoutToUiLayoutForRolePermissionTargets,
    );
    this.app.resourceManager.registerPreActionHandler('multiPortals:create', preventDirectDefaultPortalMutation);
    this.app.resourceManager.registerPreActionHandler('multiPortals:create', validateMultiPortalUiLayoutUidWrite);
    this.app.resourceManager.registerPreActionHandler('multiPortals:create', captureSkipCreatePortalDirectory);
    this.app.resourceManager.registerPreActionHandler('multiPortals:create', normalizeMultiPortalSlugValues);
    this.app.resourceManager.registerPreActionHandler('multiPortals:update', preventDirectDefaultPortalMutation);
    this.app.resourceManager.registerPreActionHandler('multiPortals:update', validateMultiPortalUiLayoutUidWrite);
    this.app.resourceManager.registerPreActionHandler('multiPortals:update', normalizeMultiPortalSlugValues);
    this.app.resourceManager.registerPreActionHandler('multiPortals:firstOrCreate', preventDirectDefaultPortalMutation);
    this.app.resourceManager.registerPreActionHandler(
      'multiPortals:firstOrCreate',
      validateMultiPortalUiLayoutUidWrite,
    );
    this.app.resourceManager.registerPreActionHandler('multiPortals:firstOrCreate', captureSkipCreatePortalDirectory);
    this.app.resourceManager.registerPreActionHandler('multiPortals:firstOrCreate', normalizeMultiPortalSlugValues);
    this.app.resourceManager.registerPreActionHandler(
      'multiPortals:updateOrCreate',
      preventDirectDefaultPortalMutation,
    );
    this.app.resourceManager.registerPreActionHandler(
      'multiPortals:updateOrCreate',
      validateMultiPortalUiLayoutUidWrite,
    );
    this.app.resourceManager.registerPreActionHandler('multiPortals:updateOrCreate', captureSkipCreatePortalDirectory);
    this.app.resourceManager.registerPreActionHandler('multiPortals:updateOrCreate', normalizeMultiPortalSlugValues);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:create', addDesktopRouteCreateMultiPortal, {
      after: UI_LAYOUT_DESKTOP_ROUTE_WRITE_LAYOUT_HANDLER_TAG,
    });
    this.app.resourceManager.registerPreActionHandler(
      'desktopRoutes:updateOrCreate',
      addDesktopRouteCreateMultiPortal,
      {
        after: UI_LAYOUT_DESKTOP_ROUTE_WRITE_LAYOUT_HANDLER_TAG,
      },
    );
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:update', guardDesktopRouteUpdateScope);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:move', guardDesktopRouteMoveScope);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:destroy', destroyScopedDesktopRoutes);
  }

  async load() {
    this.app.acl.registerSnippet({
      name: 'pm.multi-portal',
      actions: MULTI_PORTAL_MANAGEMENT_ACTIONS,
    });
    this.app.acl.registerSnippet({
      name: 'pm.acl.roles',
      actions: ROLE_MULTI_PORTAL_PERMISSION_ACTIONS,
    });
    this.app.acl.allow('multiPortals', 'listEnabled', 'public');
    this.app.acl.allow('multiPortals', 'getDefault', 'public');
    this.app.acl.allow('multiPortals', 'listAccessible', 'loggedIn');
    this.app.resourceManager.use(createPortalDeployUploadMiddleware(), {
      tag: 'multiPortalDeployUpload',
      after: 'acl',
    });
    this.app.resourceManager.registerActionHandler('multiPortals:listEnabled', listEnabledMultiPortals);
    this.app.resourceManager.registerActionHandler('multiPortals:getDefault', getDefaultMultiPortal);
    this.app.resourceManager.registerActionHandler('multiPortals:setDefault', setDefaultMultiPortal);
    this.app.resourceManager.registerActionHandler('multiPortals:listAccessible', listAccessibleMultiPortals);
    this.app.resourceManager.registerActionHandler('multiPortals:deploy', async (ctx, next) => {
      await this.deployPortalDist(ctx, next);
    });
    this.app.resourceManager.registerActionHandler('multiPortals:pullSource', async (ctx, next) => {
      await this.pullPortalSource(ctx, next);
    });
    this.app.resourceManager.registerActionHandler('multiPortals:pushSource', async (ctx, next) => {
      await this.pushPortalSource(ctx, next);
    });
    this.app.resourceManager.registerActionHandler('multiPortals:getLog', async (ctx, next) => {
      await this.getMultiPortalLog(ctx, next);
    });
    this.app.on('afterStart', async () => {
      await this.reconcileAppManifest();
      await this.reconcilePortalStorage();
    });
    this.app.on('beforeDestroy', async () => {
      await this.waitForPortalStorageTasks();
    });
    this.app.db.on('roles.beforeCreate', (role: Model) => {
      applyDefaultRoleMultiPortalAccess(role);
    });
    this.app.db.on('desktopRoutes.afterCreate', reconcileCreatedDesktopRoutePermissions);
    this.app.db.on('multiPortals.beforeUpdate', (multiPortal: Model) => {
      if (multiPortal.get('enabled') === false && multiPortal.get('isDefault') === true) {
        multiPortal.set('isDefault', null);
      }
    });
    this.app.db.on('multiPortals.afterCreate', async (multiPortal: Model, options?: DatabaseHookOptions) => {
      await grantDefaultAccessToNewMultiPortal(this.app.db, multiPortal, options);
      await this.publishAppManifestItem(multiPortal, options);
      if (shouldSkipCreatePortalDirectory(options)) {
        return;
      }
      await this.syncMultiPortalStorageItem(multiPortal, options, false, true);
    });
    this.app.db.on('multiPortals.afterUpdate', async (multiPortal: Model, options?: DatabaseHookOptions) => {
      await this.publishAppManifestItem(multiPortal, options);
      await this.syncMultiPortalStorageItem(multiPortal, options, true);
    });
    this.app.db.on('multiPortals.afterDestroy', async (multiPortal: Model, options?: DatabaseHookOptions) => {
      const uid = getRecordField(multiPortal, 'uid');
      if (typeof uid === 'string' && uid) {
        await this.removeAppManifestItem(uid, options);
      }
      await this.removeMultiPortalStorageItem(multiPortal, options);
    });
  }

  async install() {
    if (!this.deprecatedInitPortalEnvWarningEmitted && hasDeprecatedInitPortalEnv()) {
      this.deprecatedInitPortalEnvWarningEmitted = true;
      this.app.logger?.warn?.(
        'INIT_PORTAL_TYPE and INIT_PORTAL_NAME are deprecated and no longer affect multi-portal seeding; NocoBase now creates the AI Portal "main" plus the fixed no-code "admin" and "mobile" portals by default.',
      );
    }

    const version = await this.app.version.get();
    if (!version) {
      await ensureDefaultRoleMultiPortalAccess(this.db);
      await seedFreshMultiPortals(this.db);
    } else {
      await seedHistoricalMultiPortals(this.db);
    }
    await this.reconcilePortalStorage();
    await this.reconcileAppManifest();
  }

  async afterEnable() {
    await repairFixedLayoutMultiPortalRecords(this.db);
    await this.reconcilePortalStorage();
    await this.reconcileAppManifest();
  }

  async afterDisable() {
    await this.removeAppManifest();
  }

  async remove() {
    await this.removeAppManifest();
  }

  static async staticImport() {
    await appendToBuiltInPlugins('@nocobase/plugin-multi-portal');
  }
}

export default PluginMultiPortalServer;
