/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { chmod, mkdir, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as tar from 'tar';
import { executeApiRequest, type RequestOperation } from './api-client.js';
import { translateCli } from './cli-locale.js';
import {
  buildPortalBasePath,
  resolvePortalAppFromApiBaseUrl,
  resolvePortalStoragePath,
  titleFromPortalSlug,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';
import { buildPortalCommandEnv } from './portal-command-env.js';
import { updatePortalEnvFiles } from './portal-env-files.js';
import { mergePortalConfigIntoOptions, readPortalConfig, type PortalConfig } from './portal-config.js';
import { run } from './run-npm.js';

type RunOptions = {
  cwd?: string;
  env?: Record<string, string>;
  envMode?: 'inherit' | 'replace';
  errorName?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
  timeoutMs?: number;
};

type RunCommand = (name: string, args: string[], options?: RunOptions) => Promise<void>;

type ApiRequest = typeof executeApiRequest;

export type PortalDeployEnvLike = PortalCreateEnvLike;

export type PortalDeployOptions = {
  portal: string;
  env: PortalDeployEnvLike;
  envName?: string;
  cliVersion?: string;
  runCommand?: RunCommand;
  apiRequest?: ApiRequest;
};

export type PortalDeployMode = 'local' | 'docker' | 'http';

export type PortalDeployResult = {
  app: string;
  portal: string;
  portalDir: string;
  portalBase: string;
  distDir: string;
  serverDistPath?: string;
  mode: PortalDeployMode;
  uploaded: boolean;
  recordSynced: boolean;
};

type PortalDeployUploadResult = {
  distPath?: string;
};

const portalDeployText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalDeploy.${key}`, values, { fallback });

const DEPLOY_OPERATION: RequestOperation = {
  method: 'POST',
  pathTemplate: '/multiPortals:deploy',
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
      name: 'basePath',
      flagName: 'basePath',
      in: 'body',
      required: true,
    },
  ],
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

const DEFAULT_PORTAL_UI_LAYOUT_UID = 'admin-layout-model';
const PORTAL_PUBLIC_DIR_MODE = 0o755;
const PORTAL_PUBLIC_FILE_MODE = 0o644;

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function readDistPathFromUploadResponse(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }

  const directDistPath = (data as { distPath?: unknown }).distPath;
  if (typeof directDistPath === 'string' && directDistPath.trim()) {
    return directDistPath;
  }

  return readDistPathFromUploadResponse((data as { data?: unknown }).data);
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function chmodPortalDistTree(targetDir: string): Promise<void> {
  await chmod(targetDir, PORTAL_PUBLIC_DIR_MODE);
  const entries = await readdir(targetDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await chmodPortalDistTree(entryPath);
        return;
      }
      if (entry.isFile()) {
        await chmod(entryPath, PORTAL_PUBLIC_FILE_MODE);
      }
    }),
  );
}

async function ensurePortalDistPublicReadable(params: {
  storagePath: string;
  app: string;
  portalDir: string;
  distDir: string;
}): Promise<void> {
  await chmod(path.join(params.storagePath, 'portals'), PORTAL_PUBLIC_DIR_MODE);
  await chmod(path.join(params.storagePath, 'portals', params.app), PORTAL_PUBLIC_DIR_MODE);
  await chmod(params.portalDir, PORTAL_PUBLIC_DIR_MODE);
  await chmodPortalDistTree(params.distDir);
}

async function assertFileExists(filePath: string, message: string): Promise<void> {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      return;
    }
  } catch {
    // Throw the normalized message below.
  }
  throw new Error(message);
}

async function packPortalDist(distDir: string): Promise<{ archivePath: string; cleanup: () => Promise<void> }> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-portal-dist-'));
  const archivePath = path.join(tempDir, 'dist.tar.gz');
  const entries = await readdir(distDir);
  await tar.create(
    {
      cwd: distDir,
      file: archivePath,
      gzip: true,
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

async function uploadPortalDist(params: {
  archivePath: string;
  app: string;
  portal: string;
  portalBase: string;
  envName?: string;
  cliVersion?: string;
  apiRequest?: ApiRequest;
}): Promise<PortalDeployUploadResult> {
  const apiRequest = params.apiRequest ?? executeApiRequest;
  const response = await apiRequest({
    cliVersion: params.cliVersion ?? '',
    envName: params.envName,
    flags: {
      file: params.archivePath,
      app: params.app,
      portal: params.portal,
      basePath: params.portalBase,
    },
    operation: DEPLOY_OPERATION,
  });

  if (!response.ok) {
    throw new Error(
      portalDeployText(
        'errors.uploadFailed',
        { status: response.status, details: JSON.stringify(response.data, null, 2) },
        `Portal dist upload failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
      ),
    );
  }

  return {
    distPath: readDistPathFromUploadResponse(response.data),
  };
}

async function syncMultiPortalRecord(params: {
  portal: string;
  config?: PortalConfig;
  envName?: string;
  cliVersion?: string;
  apiRequest?: ApiRequest;
}): Promise<void> {
  const apiRequest = params.apiRequest ?? executeApiRequest;
  const body: Record<string, unknown> = {
    uid: params.portal,
    title: titleFromPortalSlug(params.portal),
    developmentMode: 'vibe-coding',
    routeName: params.portal,
    routePath: `/${params.portal}`,
    authCheck: true,
    enabled: true,
    uiLayoutUid: DEFAULT_PORTAL_UI_LAYOUT_UID,
    skipCreatePortalDirectory: true,
  };
  if (params.config) {
    body.options = mergePortalConfigIntoOptions(params.config);
  }
  const response = await apiRequest({
    cliVersion: params.cliVersion ?? '',
    envName: params.envName,
    flags: {
      filterKeys: ['uid'],
      body: JSON.stringify(body),
    },
    operation: FIRST_OR_CREATE_PORTAL_OPERATION,
  });

  if (!response.ok) {
    throw new Error(
      portalDeployText(
        'errors.recordSyncFailed',
        { status: response.status, details: JSON.stringify(response.data, null, 2) },
        `Portal record sync failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
      ),
    );
  }
}

export async function deployPortalWorkspace(options: PortalDeployOptions): Promise<PortalDeployResult> {
  const portal = validatePortalSlug(options.portal);
  const apiBaseUrl = trimValue(options.env.apiBaseUrl);
  const storagePath = resolvePortalStoragePath(options.env);
  const { app, appPublicPath } = resolvePortalAppFromApiBaseUrl(apiBaseUrl, options.env.config.appPublicPath);
  const portalBase = buildPortalBasePath({ app, appPublicPath, portal });
  const portalDir = path.join(storagePath, 'portals', app, portal);
  const distDir = path.join(portalDir, 'dist');

  if (!(await pathExists(portalDir))) {
    throw new Error(
      portalDeployText(
        'errors.workspaceMissing',
        { portalDir, portal },
        `Portal workspace does not exist: ${portalDir}\nRun \`nb portal create ${portal}\` first.`,
      ),
    );
  }
  await assertFileExists(
    path.join(portalDir, 'package.json'),
    portalDeployText(
      'errors.packageJsonMissing',
      { portalDir },
      `Portal workspace is invalid: package.json is missing in ${portalDir}.`,
    ),
  );
  const portalConfig = await readPortalConfig(portalDir);

  await updatePortalEnvFiles({
    portalDir,
    apiBaseUrl,
    portalBase,
  });

  const runCommand = options.runCommand ?? run;
  await runCommand('pnpm', ['build'], {
    cwd: portalDir,
    env: buildPortalCommandEnv({
      NOCOBASE_API_URL: apiBaseUrl,
      NOCOBASE_PORTAL_BASE: portalBase,
    }),
    envMode: 'replace',
    errorName: 'pnpm build',
  });

  await assertFileExists(
    path.join(distDir, 'index.html'),
    portalDeployText(
      'errors.distMissing',
      { distDir },
      `Portal build did not produce ${path.join(distDir, 'index.html')}.`,
    ),
  );
  await ensurePortalDistPublicReadable({
    storagePath,
    app,
    portalDir,
    distDir,
  });

  if (options.env.kind === 'local' || options.env.kind === 'docker') {
    await syncMultiPortalRecord({
      portal,
      config: portalConfig,
      envName: options.envName,
      cliVersion: options.cliVersion,
      apiRequest: options.apiRequest,
    });

    return {
      app,
      portal,
      portalDir,
      portalBase,
      distDir,
      mode: options.env.kind,
      uploaded: false,
      recordSynced: true,
    };
  }

  if (options.env.kind !== 'http') {
    throw new Error(
      portalDeployText(
        'errors.unsupportedEnvKind',
        { kind: options.env.kind },
        `Cannot deploy a Portal workspace for ${options.env.kind} envs in the first version.`,
      ),
    );
  }

  const archive = await packPortalDist(distDir);
  let uploadResult: PortalDeployUploadResult;
  try {
    uploadResult = await uploadPortalDist({
      archivePath: archive.archivePath,
      app,
      portal,
      portalBase,
      envName: options.envName,
      cliVersion: options.cliVersion,
      apiRequest: options.apiRequest,
    });
  } finally {
    await archive.cleanup();
  }

  await syncMultiPortalRecord({
    portal,
    config: portalConfig,
    envName: options.envName,
    cliVersion: options.cliVersion,
    apiRequest: options.apiRequest,
  });

  return {
    app,
    portal,
    portalDir,
    portalBase,
    distDir,
    serverDistPath: uploadResult.distPath,
    mode: 'http',
    uploaded: true,
    recordSynced: true,
  };
}
