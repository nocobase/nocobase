/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor, Plugin, appendToBuiltInPlugins } from '@nocobase/server';
import type { ResourcerContext } from '@nocobase/resourcer';
import type { Database, Model, Transaction } from '@nocobase/database';
import { koaMulter as multer, storagePathJoin } from '@nocobase/utils';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';
import { createGunzip } from 'zlib';
import {
  applyDefaultRoleMultiPortalAccess,
  ensureDefaultRoleMultiPortalAccess,
} from './ensureDefaultRoleMultiPortalAccess';

const MULTI_PORTAL_RUNTIME_FIELDS = [
  'uid',
  'title',
  'developmentMode',
  'routeName',
  'routePath',
  'authCheck',
  'enabled',
] as const;
const MULTI_PORTAL_RUNTIME_QUERY_FIELDS = [...MULTI_PORTAL_RUNTIME_FIELDS, 'uiLayoutUid'] as const;
const MULTI_PORTAL_ACCESSIBLE_FIELDS = [
  'uid',
  'title',
  'icon',
  'developmentMode',
  'routeName',
  'routePath',
  'authCheck',
  'enabled',
] as const;
const MULTI_PORTAL_ACCESSIBLE_QUERY_FIELDS = [...MULTI_PORTAL_ACCESSIBLE_FIELDS, 'uiLayoutUid'] as const;
const MULTI_PORTAL_UI_LAYOUT_RUNTIME_FIELDS = ['layoutType'] as const;
const DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS = ['id', 'title', 'hidden', 'parentId', 'options'] as const;
const UI_LAYOUT_DESKTOP_ROUTE_WRITE_LAYOUT_HANDLER_TAG = 'plugin-ui-layout:desktop-route-write-layout';
const MAIN_APP_NAME = 'main';
const UNION_ROLE_KEY = '__union__';
const MULTI_PORTAL_MANIFEST_NAMESPACE = 'multi-portal';
const MULTI_PORTAL_MANIFEST_SYNC_MESSAGE_TYPE = 'multi-portal:app-manifest-changed';
const DEFAULT_PORTAL_TEMPLATE_PACKAGE = '@nocobase/portal-template-default';
const PORTAL_CLIENT_PREFIX = 'x';
const PORTAL_DEPLOY_UPLOAD_LIMIT = 200 * 1024 * 1024;
const PORTAL_DEPLOY_UPLOAD_DIR_PREFIX = 'nocobase-portal-dist-upload-';
const PORTAL_PUBLIC_DIR_MODE = 0o755;
const PORTAL_PUBLIC_FILE_MODE = 0o644;
const DEFAULT_ADMIN_MULTI_PORTAL_UID = '__default_admin__';
const DEFAULT_ADMIN_VIBE_CODING_MULTI_PORTAL_UID = '__default_admin_vibe_coding__';
const DEFAULT_MOBILE_MULTI_PORTAL_UID = '__default_mobile__';
const MULTI_PORTAL_SLUG_PATTERN = /^[a-z0-9_-]+$/;
const DEFAULT_MULTI_PORTALS = [
  {
    uid: DEFAULT_ADMIN_MULTI_PORTAL_UID,
    title: 'Admin',
    icon: 'DesktopOutlined',
    developmentMode: 'no-code',
    routeName: 'admin',
    routePath: '/admin',
    authCheck: true,
    enabled: true,
    uiLayoutUid: 'admin-layout-model',
  },
  {
    uid: DEFAULT_ADMIN_VIBE_CODING_MULTI_PORTAL_UID,
    title: 'Admin',
    icon: 'DesktopOutlined',
    developmentMode: 'vibe-coding',
    routeName: 'admin',
    routePath: '/admin',
    authCheck: true,
    enabled: true,
    uiLayoutUid: 'admin-layout-model',
  },
  {
    uid: DEFAULT_MOBILE_MULTI_PORTAL_UID,
    title: 'Mobile',
    icon: 'MobileOutlined',
    developmentMode: 'no-code',
    routeName: 'mobile',
    routePath: '/mobile',
    authCheck: true,
    enabled: true,
    uiLayoutUid: 'mobile-layout-model',
  },
] as const;
const DEFAULT_MULTI_PORTAL_UIDS = DEFAULT_MULTI_PORTALS.map((portal) => portal.uid);
const DEFAULT_MULTI_PORTAL_UID_SET = new Set<string>(DEFAULT_MULTI_PORTAL_UIDS);
const MULTI_PORTAL_MANAGEMENT_ACTIONS = [
  'multiPortals:list',
  'multiPortals:get',
  'multiPortals:getLog',
  'multiPortals:create',
  'multiPortals:update',
  'multiPortals:firstOrCreate',
  'multiPortals:destroy',
  'multiPortals:deploy',
  'multiPortals:pullSource',
  'multiPortals:pushSource',
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
type MultiPortalUiLayoutRuntimeField = (typeof MULTI_PORTAL_UI_LAYOUT_RUNTIME_FIELDS)[number];
type DesktopRouteRolePermissionTargetField = (typeof DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS)[number];
type DesktopRouteCreateValue = Record<string, unknown> & {
  children?: unknown;
  multiPortals?: unknown;
  uiLayouts?: unknown;
};
type DesktopRouteId = string | number;
interface MultiPortalAccessContext {
  portalUid: string;
  uiLayoutUid: string;
}
interface MultiPortalRequestResult {
  portal?: Model;
  requested: boolean;
}
type DatabaseHookOptions = {
  transaction?: Transaction;
  context?: ResourcerContext;
};
type DefaultMultiPortalRecord = (typeof DEFAULT_MULTI_PORTALS)[number];
type AppPortalManifestItem = {
  uid: string;
  title: string;
  icon?: string | null;
  developmentMode?: string | null;
  routePath: string;
  layout: string | null;
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
};
type PortalStorageCommandError = Error & {
  code?: string | number | null;
  signal?: NodeJS.Signals | null;
  cmd?: string;
};
const EXPLICIT_DESKTOP_ROUTE_UI_LAYOUTS = Symbol('explicitDesktopRouteUiLayouts');
const SKIP_CREATE_PORTAL_DIRECTORY = Symbol('skipCreatePortalDirectory');
type MultiPortalResourcerContext = ResourcerContext & {
  [EXPLICIT_DESKTOP_ROUTE_UI_LAYOUTS]?: unknown;
  [SKIP_CREATE_PORTAL_DIRECTORY]?: boolean;
};
type MultiPortalDeployContext = ResourcerContext & {
  request: ResourcerContext['request'] & {
    file?: UploadedFile;
    body?: Record<string, unknown>;
  };
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

function getPortalStorageBasePath(routePath: string) {
  const portalPath = `/${PORTAL_CLIENT_PREFIX}${normalizePortalStoragePath(routePath, '').replace(/\/+$/, '')}/`;
  return resolvePortalStoragePublicPath(joinPortalStoragePublicPath(process.env.APP_PUBLIC_PATH || '/', portalPath));
}

function isAbsoluteUrl(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) || value.startsWith('//');
}

function getPortalStorageApiUrl() {
  const configuredApiUrl = trimString(
    process.env.NOCOBASE_API_URL || process.env.API_BASE_URL || process.env.API_BASE_PATH,
  );
  const apiUrl = configuredApiUrl || '/api';
  if (isAbsoluteUrl(apiUrl)) {
    return apiUrl;
  }

  const normalizedApiPath = normalizePortalStoragePath(apiUrl, 'api');
  const appPublicPath = resolvePortalStoragePublicPath(process.env.APP_PUBLIC_PATH || '/');
  if (appPublicPath === '/' || normalizedApiPath === appPublicPath.slice(0, -1)) {
    return normalizedApiPath;
  }

  if (normalizedApiPath.startsWith(appPublicPath)) {
    return normalizedApiPath;
  }

  return joinPortalStoragePublicPath(appPublicPath, normalizedApiPath);
}

function getPortalDeployBasePath(appName: string, portalName: string) {
  const portalPath =
    appName === MAIN_APP_NAME
      ? `/${PORTAL_CLIENT_PREFIX}/${portalName}/`
      : `/${PORTAL_CLIENT_PREFIX}/apps/${appName}/${portalName}/`;
  return resolvePortalStoragePublicPath(joinPortalStoragePublicPath(process.env.APP_PUBLIC_PATH || '/', portalPath));
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

function resolveDefaultPortalTemplateDir(): string {
  try {
    return path.dirname(require.resolve(`${DEFAULT_PORTAL_TEMPLATE_PACKAGE}/package.json`));
  } catch {
    throw new Error(`Default Portal template package "${DEFAULT_PORTAL_TEMPLATE_PACKAGE}" is not installed.`);
  }
}

async function copyPortalTemplate(sourceDir: string, targetDir: string): Promise<void> {
  const ignoredSegments = new Set(['.git', 'node_modules', 'dist', '.DS_Store']);
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

  subprocess.stdout?.pipe(logStream, { end: false });
  subprocess.stderr?.pipe(logStream, { end: false });

  let result: { code: number | null; signal: NodeJS.Signals | null };
  try {
    result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
      subprocess.once('error', reject);
      subprocess.once('close', (code, signal) => {
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

async function buildPortalStorageItem(portalDir: string, item: MultiPortalStorageItem): Promise<void> {
  const logPath = getPortalStorageLogPath(item);
  const buildEnv = getPortalStorageCommandEnv({
    NOCOBASE_API_URL: getPortalStorageApiUrl(),
    NOCOBASE_PORTAL_BASE: getPortalStorageBasePath(item.portalName),
  });
  await appendPortalStorageLog(logPath, `Building portal ${item.appName}/${item.portalName}.`);
  await appendPortalStorageLog(
    logPath,
    `Build environment: NOCOBASE_API_URL=${buildEnv.NOCOBASE_API_URL || ''} NOCOBASE_PORTAL_BASE=${
      buildEnv.NOCOBASE_PORTAL_BASE || ''
    } APP_PUBLIC_PATH=${buildEnv.APP_PUBLIC_PATH || ''}`,
  );
  await runPortalStorageCommandOnce('yarn', ['build:html'], {
    cwd: portalDir,
    env: buildEnv,
    logPath,
  });
  await appendPortalStorageLog(logPath, `Portal build completed for ${item.appName}/${item.portalName}.`);
}

function validatePortalDeployBasePath(appName: string, portalName: string, basePath: string) {
  const normalizedBasePath = resolvePortalStoragePublicPath(basePath);
  if (normalizedBasePath.includes('..')) {
    throw new Error('basePath cannot contain ".."');
  }

  const expectedBasePath = getPortalDeployBasePath(appName, portalName);
  if (normalizedBasePath !== expectedBasePath) {
    throw new Error(`basePath must be ${expectedBasePath}`);
  }
}

function isPortalDeployTarEntry(entry: unknown): entry is PortalDeployTarEntry {
  return Boolean(entry) && typeof entry === 'object';
}

function validatePortalDeployTarEntry(entryPath: string, entry: unknown) {
  const normalizedEntryPath = path.normalize(entryPath);
  if (
    path.isAbsolute(entryPath) ||
    normalizedEntryPath === '..' ||
    normalizedEntryPath.startsWith(`..${path.sep}`) ||
    normalizedEntryPath.split(path.sep).includes('..')
  ) {
    throw new Error(`Invalid dist archive entry path: ${entryPath}`);
  }

  const entryType = isPortalDeployTarEntry(entry) ? entry.type : undefined;
  if (entryType === 'SymbolicLink' || entryType === 'Link') {
    throw new Error(`Invalid dist archive link entry: ${entryPath}`);
  }

  const linkpath = isPortalDeployTarEntry(entry) ? entry.linkpath : undefined;
  if (linkpath) {
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
  await fs.promises.chmod(portalsDir, PORTAL_PUBLIC_DIR_MODE);
  await fs.promises.chmod(appDir, PORTAL_PUBLIC_DIR_MODE);
  await fs.promises.chmod(portalDir, PORTAL_PUBLIC_DIR_MODE);
  await chmodPortalDistTree(distDir);
}

async function replacePortalDistFromArchive(params: {
  filePath: string;
  appName: string;
  portalName: string;
}): Promise<string> {
  const portalDir = storagePathJoin('portals', params.appName, params.portalName);
  const distDir = path.join(portalDir, 'dist');
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

    const indexPath = path.join(uploadDir, 'index.html');
    const indexStat = await fs.promises.stat(indexPath).catch(() => null);
    if (!indexStat?.isFile()) {
      throw new Error('Portal dist archive is invalid: index.html is missing.');
    }

    if (await pathExists(distDir)) {
      await fs.promises.rename(distDir, backupDir);
      hasBackup = true;
    }
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

function isDefaultMultiPortalUid(uid: unknown): uid is string {
  return typeof uid === 'string' && DEFAULT_MULTI_PORTAL_UID_SET.has(uid);
}

function getDefaultMultiPortalRecord(uid: unknown): DefaultMultiPortalRecord | undefined {
  return DEFAULT_MULTI_PORTALS.find((portal) => portal.uid === uid);
}

function getDefaultMultiPortalUiLayoutUid(portal: DefaultMultiPortalRecord) {
  return Object.prototype.hasOwnProperty.call(portal, 'uiLayoutUid')
    ? (portal as DefaultMultiPortalRecord & { uiLayoutUid?: string }).uiLayoutUid ?? null
    : null;
}

function withCustomMultiPortalFilter(filter: Record<string, unknown> = {}) {
  const customFilter = { ...filter };
  const uidFilter = customFilter.uid;

  if (Array.isArray(uidFilter)) {
    customFilter.uid = uidFilter.filter((uid) => !isDefaultMultiPortalUid(uid));
    return customFilter;
  }
  if (isDefaultMultiPortalUid(uidFilter)) {
    customFilter.uid = [];
    return customFilter;
  }

  customFilter['uid.$notIn'] = DEFAULT_MULTI_PORTAL_UIDS;
  return customFilter;
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

function pickMultiPortalUiLayoutRuntimeFields(record: unknown) {
  const result = {} as Record<MultiPortalUiLayoutRuntimeField, unknown>;
  for (const field of MULTI_PORTAL_UI_LAYOUT_RUNTIME_FIELDS) {
    result[field] = getRecordField(record, field);
  }
  return result;
}

function pickMultiPortalRuntimeFields(record: unknown) {
  const result = {} as Record<MultiPortalRuntimeField | 'uiLayout', unknown>;
  for (const field of MULTI_PORTAL_RUNTIME_FIELDS) {
    result[field] = getRecordField(record, field);
  }
  result.uiLayout = pickMultiPortalUiLayoutRuntimeFields(getRecordField(record, 'uiLayout'));
  return result;
}

function pickMultiPortalAccessibleFields(record: unknown) {
  const result = {} as Record<MultiPortalAccessibleField | 'uiLayout', unknown>;
  for (const field of MULTI_PORTAL_ACCESSIBLE_FIELDS) {
    result[field] = getRecordField(record, field) ?? null;
  }
  result.uiLayout = pickMultiPortalUiLayoutRuntimeFields(getRecordField(record, 'uiLayout'));
  return result;
}

function getExplicitRequestedLayoutUid(layout: unknown) {
  const uid = Array.isArray(layout) ? layout[0] : layout;

  if (typeof uid === 'string' && uid.trim()) {
    return uid;
  }
}

function getRequestedMultiPortalUid(ctx: ResourcerContext) {
  const portalUid = getExplicitRequestedLayoutUid(ctx.action?.params.portal);
  const layoutUid = getExplicitRequestedLayoutUid(ctx.action?.params.layout);
  if (portalUid && layoutUid) {
    ctx.throw(400, 'layout and portal cannot be used together');
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

function getMultiPortalRouteNameFromValues(ctx: ResourcerContext) {
  const values = ctx.action?.params.values;
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return;
  }

  const routeName = (values as Record<string, unknown>).routeName;
  if (typeof routeName === 'string' && routeName.trim()) {
    return routeName;
  }
}

function getMultiPortalWriteValues(ctx: ResourcerContext) {
  const values = ctx.action?.params.values;
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return;
  }
  return values as Record<string, unknown>;
}

function isTruthyActionBoolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

async function captureSkipCreatePortalDirectory(ctx: ResourcerContext, next: () => Promise<void>) {
  const values = getMultiPortalWriteValues(ctx);
  if (!values || !Object.prototype.hasOwnProperty.call(values, 'skipCreatePortalDirectory')) {
    await next();
    return;
  }

  (ctx as MultiPortalResourcerContext)[SKIP_CREATE_PORTAL_DIRECTORY] = isTruthyActionBoolean(
    values.skipCreatePortalDirectory,
  );
  delete values.skipCreatePortalDirectory;
  await next();
}

function shouldSkipCreatePortalDirectory(options?: DatabaseHookOptions) {
  return (options?.context as MultiPortalResourcerContext | undefined)?.[SKIP_CREATE_PORTAL_DIRECTORY] === true;
}

async function normalizeMultiPortalSlugValues(ctx: ResourcerContext, next: () => Promise<void>) {
  const values = getMultiPortalWriteValues(ctx);
  const routeName = values?.routeName;
  if (routeName === undefined || routeName === null) {
    await next();
    return;
  }
  if (typeof routeName !== 'string') {
    await next();
    return;
  }

  const slug = routeName.trim();
  if (!slug) {
    await next();
    return;
  }
  if (!MULTI_PORTAL_SLUG_PATTERN.test(slug)) {
    ctx.throw(400, 'Portal slug can only contain lowercase letters, numbers, hyphens, and underscores');
    return;
  }

  values.routeName = slug;
  values.routePath = `/${slug}`;
  await next();
}

async function ensureDefaultMultiPortals(db: Database, options?: DatabaseHookOptions) {
  const repository = db.getRepository('multiPortals');
  for (const defaultPortal of DEFAULT_MULTI_PORTALS) {
    const existing = await repository.findOne({
      filterByTk: defaultPortal.uid,
      fields: ['uid', 'title', 'icon', 'developmentMode', 'routeName', 'routePath', 'authCheck', 'uiLayoutUid'],
      transaction: options?.transaction,
    });

    if (!existing) {
      await repository.create({
        values: defaultPortal,
        transaction: options?.transaction,
      });
      continue;
    }

    const protectedValues = {
      uid: defaultPortal.uid,
      developmentMode: defaultPortal.developmentMode ?? null,
      routeName: defaultPortal.routeName,
      routePath: defaultPortal.routePath,
      authCheck: defaultPortal.authCheck,
      uiLayoutUid: getDefaultMultiPortalUiLayoutUid(defaultPortal),
    };
    const shouldRepair = Object.entries(protectedValues).some(([field, value]) => existing.get(field) !== value);
    if (shouldRepair) {
      await repository.update({
        filterByTk: defaultPortal.uid,
        values: protectedValues,
        transaction: options?.transaction,
      });
    }
  }
}

async function protectDefaultMultiPortalUpdate(ctx: ResourcerContext, next: () => Promise<void>) {
  const defaultPortal = getDefaultMultiPortalRecord(ctx.action?.params.filterByTk);
  if (!defaultPortal) {
    await next();
    return;
  }

  const params = ctx.action?.params;
  const rawValues = isRecordLike(params?.values) ? params.values : {};
  const values: Record<string, unknown> = {
    uid: defaultPortal.uid,
    developmentMode: defaultPortal.developmentMode ?? null,
    routeName: defaultPortal.routeName,
    routePath: defaultPortal.routePath,
    authCheck: defaultPortal.authCheck,
    uiLayoutUid: getDefaultMultiPortalUiLayoutUid(defaultPortal),
  };

  if (Object.prototype.hasOwnProperty.call(rawValues, 'title')) {
    values.title = rawValues.title;
  }
  if (Object.prototype.hasOwnProperty.call(rawValues, 'icon')) {
    values.icon = rawValues.icon;
  }
  if (Object.prototype.hasOwnProperty.call(rawValues, 'enabled')) {
    values.enabled = rawValues.enabled;
  }

  ctx.action?.mergeParams(
    {
      values,
    },
    {
      values: 'overwrite',
    },
  );
  await next();
}

async function preventUiLayoutRouteNameConflict(ctx: ResourcerContext, next: () => Promise<void>) {
  if (isDefaultMultiPortalUid(ctx.action?.params.filterByTk)) {
    await next();
    return;
  }

  const routeName = getMultiPortalRouteNameFromValues(ctx);
  if (!routeName) {
    await next();
    return;
  }

  const uiLayout = await ctx.db.getRepository('uiLayouts').findOne({
    filter: {
      routeName,
    },
    fields: ['uid'],
  });
  if (uiLayout) {
    ctx.throw(400, 'Portal route name conflicts with an existing UI layout');
    return;
  }

  await next();
}

async function findRequestedMultiPortal(ctx: ResourcerContext): Promise<MultiPortalRequestResult> {
  const portalUid = getRequestedMultiPortalUid(ctx);
  if (portalUid === undefined) {
    return {
      requested: false,
    };
  }

  const isExplicitPortalRequest = getExplicitRequestedLayoutUid(ctx.action?.params.portal) !== undefined;
  if (!isExplicitPortalRequest) {
    const uiLayout = await ctx.db.getRepository('uiLayouts').findOne({
      filter: {
        uid: portalUid,
      },
      fields: ['uid'],
    });
    if (uiLayout) {
      return {
        requested: false,
      };
    }
  }

  const portal = await ctx.db.getRepository('multiPortals').findOne({
    filter: {
      uid: portalUid,
    },
    fields: ['uid', 'uiLayoutUid', 'enabled'],
  });

  if (portal?.get('enabled') === true) {
    return {
      portal,
      requested: true,
    };
  }

  return {
    requested: !!isExplicitPortalRequest || !!portal,
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

function hasDesktopRouteField(value: DesktopRouteCreateValue | undefined, field: string) {
  return !!value && Object.prototype.hasOwnProperty.call(value, field);
}

function pickExplicitDesktopRouteUiLayouts(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => pickExplicitDesktopRouteUiLayouts(item));
  }

  if (!isDesktopRouteCreateValue(value)) {
    return;
  }

  const route: DesktopRouteCreateValue = {};
  if (hasDesktopRouteField(value, 'uiLayouts')) {
    route.uiLayouts = value.uiLayouts;
  }
  if (Array.isArray(value.children)) {
    route.children = value.children.map((child) => pickExplicitDesktopRouteUiLayouts(child));
  }

  return route;
}

function withDesktopRouteMultiPortal(value: unknown, multiPortalUid: string, explicitValue: unknown = value): unknown {
  if (Array.isArray(value)) {
    const explicitValues = Array.isArray(explicitValue) ? explicitValue : [];
    return value.map((item, index) => withDesktopRouteMultiPortal(item, multiPortalUid, explicitValues[index]));
  }

  if (!isDesktopRouteCreateValue(value)) {
    return value;
  }

  const explicitRoute = isDesktopRouteCreateValue(explicitValue) ? explicitValue : undefined;
  const existingMultiPortals = Array.isArray(value.multiPortals)
    ? value.multiPortals.filter((uid): uid is string => typeof uid === 'string' && !!uid)
    : [];
  const { uiLayouts: _uiLayouts, children: _children, ...route } = value;

  return {
    ...route,
    ...(hasDesktopRouteField(explicitRoute, 'uiLayouts') ? { uiLayouts: explicitRoute?.uiLayouts } : {}),
    multiPortals: Array.from(new Set([...existingMultiPortals, multiPortalUid])),
    ...(Array.isArray(value.children)
      ? { children: withDesktopRouteMultiPortal(value.children, multiPortalUid, explicitRoute?.children) }
      : {}),
  };
}

async function captureExplicitDesktopRouteUiLayouts(ctx: ResourcerContext, next: () => Promise<void>) {
  (ctx as MultiPortalResourcerContext)[EXPLICIT_DESKTOP_ROUTE_UI_LAYOUTS] = pickExplicitDesktopRouteUiLayouts(
    ctx.action?.params.values,
  );
  await next();
}

async function canAccessMultiPortal(ctx: ResourcerContext, multiPortalUid: string) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return true;
  }
  if (!currentRoles.length) {
    return false;
  }

  const count = await ctx.db.getRepository('rolesMultiPortals').count({
    filter: {
      roleName: currentRoles,
      multiPortalUid,
    },
  });
  return count > 0;
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

async function getMultiPortalAccessibleRouteIds(ctx: ResourcerContext, multiPortalUid: string) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return;
  }
  if (!currentRoles.length) {
    return new Set<string>();
  }

  const routePermissions = await ctx.db.getRepository('rolesMultiPortalDesktopRoutes').find({
    fields: ['desktopRouteId'],
    filter: {
      roleName: currentRoles,
      multiPortalUid,
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
      ...getDesktopRoutePortalFilter(multiPortalUid),
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
    setDataValue?: (field: string, value: unknown) => void;
  };
  if (typeof maybeModel.setDataValue === 'function') {
    maybeModel.setDataValue('children', children);
    return;
  }

  (route as Record<string, unknown>).children = children;
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
  const routeIds = await getMultiPortalAccessibleRouteIds(ctx, portalContext.portalUid);
  if (routeIds && routeIds.size === 0) {
    ctx.body = [];
    return;
  }

  ctx.body = await ctx.db.getRepository('desktopRoutes').find({
    tree: true,
    sort: 'sort',
    filter: {
      ...getDesktopRoutePortalFilter(portalContext.portalUid),
      ...(routeIds ? { id: Array.from(routeIds) } : {}),
    },
  });
}

async function replaceGetAccessibleRouteWithPortalScopedRoute(
  ctx: ResourcerContext,
  portalContext: MultiPortalAccessContext,
) {
  const routeIds = await getMultiPortalAccessibleRouteIds(ctx, portalContext.portalUid);
  if (routeIds && routeIds.size === 0) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  const route = await ctx.db.getRepository('desktopRoutes').findOne({
    sort: 'sort',
    filterByTk: ctx.action?.params.filterByTk,
    filter: {
      ...getDesktopRoutePortalFilter(portalContext.portalUid),
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

  const portal = portalRequest.portal;
  if (!portal) {
    return null;
  }

  const portalUid = portal.get('uid');
  const uiLayoutUid = portal.get('uiLayoutUid');
  if (typeof portalUid !== 'string' || !portalUid || typeof uiLayoutUid !== 'string' || !uiLayoutUid) {
    return null;
  }

  if (!(await canAccessMultiPortal(ctx, portalUid))) {
    return null;
  }

  if (ctx.action?.params) {
    ctx.action.params.layout = uiLayoutUid;
  }
  return {
    portalUid,
    uiLayoutUid,
  };
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

  const portal = portalRequest.portal;
  const portalUid = portal?.get('uid');
  if (typeof portalUid === 'string' && portalUid) {
    const routes = (await ctx.db.getRepository('desktopRoutes').find({
      tree: true,
      sort: 'sort',
      filter: getDesktopRoutePortalFilter(portalUid),
      fields: [...DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS],
    })) as unknown[];

    ctx.status = 200;
    ctx.body = routes.map((route) => pickDesktopRouteRolePermissionTargetFields(route));
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

  const portal = portalRequest.portal;
  const portalUid = portal?.get('uid');

  if (typeof portalUid === 'string' && portalUid) {
    const explicitValues = (ctx as MultiPortalResourcerContext)[EXPLICIT_DESKTOP_ROUTE_UI_LAYOUTS];
    ctx.action?.mergeParams(
      {
        values: withDesktopRouteMultiPortal(ctx.action?.params.values, portalUid, explicitValues),
      },
      {
        values: 'overwrite',
      },
    );
    await next();

    const desktopRouteIds = collectDesktopRouteIds(ctx.body);
    await removeLayoutRoutePermissionsFromPortalOnlyRoutes(ctx, desktopRouteIds);
    await grantDefaultRouteAccessToNewMultiPortalRoutes(ctx, portalUid, desktopRouteIds);
    return;
  }

  await next();
}

async function listEnabledMultiPortals(ctx: ResourcerContext, next: () => Promise<void>) {
  const records = await ctx.db.getRepository('multiPortals').find({
    filter: withCustomMultiPortalFilter({
      enabled: true,
      'uiLayout.enabled': true,
    }),
    fields: [...MULTI_PORTAL_RUNTIME_QUERY_FIELDS],
    appends: ['uiLayout'],
    sort: ['uid'],
  });

  ctx.body = records.map((record) => pickMultiPortalRuntimeFields(record));
  await next();
}

async function listAccessibleMultiPortals(ctx: ResourcerContext, next: () => Promise<void>) {
  const accessiblePortalUids = await listCurrentRoleAccessibleMultiPortalUids(ctx);

  if (Array.isArray(accessiblePortalUids) && accessiblePortalUids.length === 0) {
    ctx.body = [];
    await next();
    return;
  }

  const filter: Record<string, unknown> = {
    enabled: true,
    'uiLayout.enabled': true,
  };
  if (Array.isArray(accessiblePortalUids)) {
    filter.uid = accessiblePortalUids;
  }

  const records = await ctx.db.getRepository('multiPortals').find({
    filter: withCustomMultiPortalFilter(filter),
    fields: [...MULTI_PORTAL_ACCESSIBLE_QUERY_FIELDS],
    appends: ['uiLayout'],
    sort: ['uid'],
  });

  ctx.body = records.map((record) => pickMultiPortalAccessibleFields(record));
  await next();
}

async function grantDefaultRouteAccessToNewMultiPortalRoutes(
  ctx: ResourcerContext,
  multiPortalUid: string,
  desktopRouteIds: DesktopRouteId[],
) {
  if (!desktopRouteIds.length) {
    return;
  }
  if (
    !ctx.db.getCollection('rolesMultiPortalRoutePolicies') ||
    !ctx.db.getCollection('rolesMultiPortalDesktopRoutes')
  ) {
    return;
  }

  const routePolicies = await ctx.db.getRepository('rolesMultiPortalRoutePolicies').find({
    fields: ['roleName'],
    filter: {
      multiPortalUid,
      allowNewMenu: true,
    },
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
      });
    }
  }
}

async function removeLayoutRoutePermissionsFromPortalOnlyRoutes(
  ctx: ResourcerContext,
  desktopRouteIds: DesktopRouteId[],
) {
  if (!desktopRouteIds.length || !ctx.db.getCollection('rolesDesktopRoutes')) {
    return;
  }

  const portalOnlyRouteIds = await getPortalOnlyDesktopRouteIds(ctx, desktopRouteIds);
  if (portalOnlyRouteIds.size === 0) {
    return;
  }

  await ctx.db.getRepository('rolesDesktopRoutes').destroy({
    filter: {
      desktopRouteId: Array.from(portalOnlyRouteIds),
    },
    context: ctx,
  });
}

async function grantDefaultAccessToNewMultiPortal(db: Database, multiPortal: Model, options?: DatabaseHookOptions) {
  if (multiPortal.get('enabled') !== true) {
    return;
  }
  const multiPortalUid = multiPortal.get('uid');
  if (typeof multiPortalUid !== 'string' || !multiPortalUid) {
    return;
  }
  if (isDefaultMultiPortalUid(multiPortalUid)) {
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

  if (!db.getCollection('rolesMultiPortalRoutePolicies')) {
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

  async afterAdd() {}

  private getAppName() {
    return this.app.name || MAIN_APP_NAME;
  }

  private getMultiPortalStorageItem(multiPortal: Model, previous = false): MultiPortalStorageItem | null {
    const record = multiPortal as ModelWithPrevious;
    const readField = (field: string) =>
      previous && typeof record.previous === 'function' ? record.previous(field) : getRecordField(record, field);
    const developmentMode = readField('developmentMode');
    if (developmentMode !== 'vibe-coding') {
      return null;
    }

    const portalName = normalizePortalStorageName(readField('routeName'));
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

  private async removePortalStorageDist(item: Pick<MultiPortalStorageItem, 'appName' | 'portalName'>) {
    await fs.promises.rm(storagePathJoin('portals', item.appName, item.portalName, 'dist'), {
      force: true,
      recursive: true,
    });
  }

  private waitForPortalStorageTasks() {
    const tasks = [...this.portalStorageTasks.values()];
    if (!tasks.length) {
      return Promise.resolve();
    }
    return Promise.allSettled(tasks).then(() => undefined);
  }

  private schedulePortalTemplateCopyAndBuild(item: MultiPortalStorageItem, templateDir: string, portalDir: string) {
    const taskKey = this.getPortalStorageTaskKey(item);
    if (this.portalStorageTaskKeys.has(taskKey)) {
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
          await appendPortalStorageLog(logPath, `Copying default portal template from ${templateDir} to ${portalDir}.`);
          await copyPortalTemplate(templateDir, portalDir);
          await appendPortalStorageLog(logPath, `Default portal template copied to ${portalDir}.`);
        }

        if (item.enabled) {
          await buildPortalStorageItem(portalDir, item);
          return;
        }

        await this.removePortalStorageDist(item);
        await appendPortalStorageLog(logPath, `Portal dist directory removed for ${item.appName}/${item.portalName}.`);
      } catch (error) {
        await appendPortalStorageLog(
          logPath,
          `Portal storage create task failed for ${item.appName}/${item.portalName}.`,
        );
        this.warnPortalStorageSyncFailed(error);
      } finally {
        this.portalStorageTaskKeys.delete(taskKey);
        this.portalStorageTasks.delete(taskKey);
      }
    })();

    this.portalStorageTasks.set(taskKey, task);
  }

  private async ensurePortalStorageItem(item: MultiPortalStorageItem) {
    const templateDir = resolveDefaultPortalTemplateDir();
    const portalDir = storagePathJoin('portals', item.appName, item.portalName);
    const portalIndex = path.join(portalDir, 'dist', 'index.html');

    if (!(await pathExists(portalDir))) {
      this.schedulePortalTemplateCopyAndBuild(item, templateDir, portalDir);
      return;
    }

    if (item.enabled) {
      if (!(await pathExists(portalIndex))) {
        await buildPortalStorageItem(portalDir, item);
      }
      return;
    }

    await this.removePortalStorageDist(item);
  }

  private async syncMultiPortalStorageItem(multiPortal: Model, options?: DatabaseHookOptions, syncPrevious = false) {
    const currentItem = this.getMultiPortalStorageItem(multiPortal);
    const previousItem = syncPrevious ? this.getMultiPortalStorageItem(multiPortal, true) : null;

    await this.runPortalStorageTask(async () => {
      if (
        previousItem &&
        (!currentItem ||
          previousItem.appName !== currentItem.appName ||
          previousItem.portalName !== currentItem.portalName ||
          !currentItem.enabled)
      ) {
        await this.removePortalStorageDist(previousItem);
      }
      if (currentItem) {
        await this.ensurePortalStorageItem(currentItem);
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
      fields: ['uid', 'developmentMode', 'routeName', 'enabled'],
    });
    const item = multiPortal ? this.getMultiPortalStorageItem(multiPortal) : null;
    if (!item) {
      ctx.throw(404, 'Portal log is only available for vibe-coding portals');
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

  private async deployPortalDist(ctx: ResourcerContext, next: () => Promise<void>) {
    const deployCtx = ctx as MultiPortalDeployContext;
    const appName = normalizePortalStorageName(deployCtx.request.body?.app || MAIN_APP_NAME) || MAIN_APP_NAME;
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
    const appName = normalizePortalStorageName(ctx.action.params.values?.app || MAIN_APP_NAME) || MAIN_APP_NAME;
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
    const appName = normalizePortalStorageName(sourceCtx.request.body?.app || MAIN_APP_NAME) || MAIN_APP_NAME;
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
      filter: withCustomMultiPortalFilter({
        enabled: true,
        'uiLayout.enabled': true,
      }),
      fields: [...MULTI_PORTAL_ACCESSIBLE_QUERY_FIELDS],
      appends: ['uiLayout'],
      sort: ['uid'],
      transaction: options?.transaction,
    });

    return records.map((record) => {
      const portal = pickMultiPortalAccessibleFields(record);
      const uiLayout = portal.uiLayout as Record<string, unknown> | undefined;
      const uid = typeof portal.uid === 'string' ? portal.uid : '';
      const title = typeof portal.title === 'string' ? portal.title : '';
      return {
        uid,
        title,
        icon: typeof portal.icon === 'string' ? portal.icon : null,
        developmentMode: typeof portal.developmentMode === 'string' ? portal.developmentMode : null,
        routePath: String(portal.routePath || ''),
        layout: typeof uiLayout?.layoutType === 'string' ? uiLayout.layoutType : null,
      };
    });
  }

  private async getUiLayout(uid: unknown, options?: DatabaseHookOptions) {
    if (typeof uid !== 'string' || !uid) {
      return null;
    }
    return this.db.getRepository('uiLayouts').findOne({
      filterByTk: uid,
      transaction: options?.transaction,
    });
  }

  private async toAppPortalManifestItem(
    multiPortal: Model,
    options?: DatabaseHookOptions,
  ): Promise<AppPortalManifestItem | null> {
    const uid = getRecordField(multiPortal, 'uid');
    const title = getRecordField(multiPortal, 'title');
    const developmentMode = getRecordField(multiPortal, 'developmentMode');
    const routePath = getRecordField(multiPortal, 'routePath');
    const enabled = getRecordField(multiPortal, 'enabled');

    if (
      typeof uid !== 'string' ||
      !uid ||
      isDefaultMultiPortalUid(uid) ||
      typeof title !== 'string' ||
      typeof routePath !== 'string' ||
      !routePath ||
      enabled !== true
    ) {
      return null;
    }

    const uiLayoutUid = getRecordField(multiPortal, 'uiLayoutUid');
    const uiLayout =
      (getRecordField(multiPortal, 'uiLayout') as Model | undefined) || (await this.getUiLayout(uiLayoutUid, options));
    if (!uiLayout || getRecordField(uiLayout, 'enabled') !== true) {
      return null;
    }

    const icon = getRecordField(multiPortal, 'icon');
    const layoutType = getRecordField(uiLayout, 'layoutType');
    return {
      uid,
      title,
      icon: typeof icon === 'string' ? icon : null,
      developmentMode: typeof developmentMode === 'string' ? developmentMode : null,
      routePath,
      layout: typeof layoutType === 'string' ? layoutType : null,
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
    const item = await this.toAppPortalManifestItem(multiPortal, options);
    if (item) {
      await this.setAppManifestItem(item, options);
      return;
    }
    await this.removeAppManifestItem(uid, options);
  }

  private async publishUiLayoutManifestItems(uiLayout: Model, options?: DatabaseHookOptions) {
    const uiLayoutUid = getRecordField(uiLayout, 'uid');
    if (typeof uiLayoutUid !== 'string' || !uiLayoutUid) {
      return;
    }
    const records = await this.db.getRepository('multiPortals').find({
      filter: withCustomMultiPortalFilter({
        uiLayoutUid,
      }),
      fields: [...MULTI_PORTAL_ACCESSIBLE_QUERY_FIELDS],
      transaction: options?.transaction,
    });
    for (const record of records) {
      record.set('uiLayout', uiLayout);
      await this.publishAppManifestItem(record, options);
    }
  }

  private async reconcilePortalStorage(options?: DatabaseHookOptions) {
    const records = await this.db.getRepository('multiPortals').find({
      filter: {
        developmentMode: 'vibe-coding',
      },
      fields: ['uid', 'developmentMode', 'routeName', 'enabled'],
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
    this.app.resourceManager.registerPreActionHandler(
      'desktopRoutes:listAccessible',
      addMultiPortalListAccessibleGuard,
    );
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:getAccessible', addMultiPortalGetAccessibleGuard);
    this.app.resourceManager.registerPreActionHandler(
      'desktopRoutes:listRolePermissionTargets',
      mapMultiPortalLayoutToUiLayoutForRolePermissionTargets,
    );
    this.app.resourceManager.registerPreActionHandler('multiPortals:create', captureSkipCreatePortalDirectory);
    this.app.resourceManager.registerPreActionHandler('multiPortals:create', normalizeMultiPortalSlugValues);
    this.app.resourceManager.registerPreActionHandler('multiPortals:create', preventUiLayoutRouteNameConflict);
    this.app.resourceManager.registerPreActionHandler('multiPortals:update', protectDefaultMultiPortalUpdate);
    this.app.resourceManager.registerPreActionHandler('multiPortals:update', normalizeMultiPortalSlugValues);
    this.app.resourceManager.registerPreActionHandler('multiPortals:update', preventUiLayoutRouteNameConflict);
    this.app.resourceManager.registerPreActionHandler('multiPortals:firstOrCreate', captureSkipCreatePortalDirectory);
    this.app.resourceManager.registerPreActionHandler('multiPortals:firstOrCreate', normalizeMultiPortalSlugValues);
    this.app.resourceManager.registerPreActionHandler('multiPortals:firstOrCreate', preventUiLayoutRouteNameConflict);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:create', captureExplicitDesktopRouteUiLayouts, {
      before: UI_LAYOUT_DESKTOP_ROUTE_WRITE_LAYOUT_HANDLER_TAG,
    });
    this.app.resourceManager.registerPreActionHandler(
      'desktopRoutes:updateOrCreate',
      captureExplicitDesktopRouteUiLayouts,
      {
        before: UI_LAYOUT_DESKTOP_ROUTE_WRITE_LAYOUT_HANDLER_TAG,
      },
    );
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
    this.app.acl.allow('multiPortals', 'listAccessible', 'loggedIn');
    this.app.resourceManager.use(createPortalDeployUploadMiddleware(), {
      tag: 'multiPortalDeployUpload',
      after: 'acl',
    });
    this.app.resourceManager.registerActionHandler('multiPortals:listEnabled', listEnabledMultiPortals);
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
    this.app.db.on('multiPortals.afterCreate', async (multiPortal: Model, options?: DatabaseHookOptions) => {
      await grantDefaultAccessToNewMultiPortal(this.app.db, multiPortal, options);
      await this.publishAppManifestItem(multiPortal, options);
      if (shouldSkipCreatePortalDirectory(options)) {
        return;
      }
      await this.syncMultiPortalStorageItem(multiPortal, options);
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
    this.app.db.on('uiLayouts.afterUpdate', async (uiLayout: Model, options?: DatabaseHookOptions) => {
      await this.publishUiLayoutManifestItems(uiLayout, options);
    });
  }

  async install() {
    await ensureDefaultMultiPortals(this.db);
    await ensureDefaultRoleMultiPortalAccess(this.db);
    await this.reconcilePortalStorage();
    await this.reconcileAppManifest();
  }

  async afterEnable() {
    await ensureDefaultMultiPortals(this.db);
    await ensureDefaultRoleMultiPortalAccess(this.db);
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
