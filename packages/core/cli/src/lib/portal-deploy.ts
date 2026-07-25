/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as tar from 'tar';
import { executeApiRequest, type RequestOperation } from './api-client.js';
import { translateCli } from './cli-locale.js';
import {
  buildPortalBasePath,
  resolvePortalAppFromApiBaseUrl,
  resolvePortalEnvApiUrl,
  resolvePortalStoragePath,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';
import { buildPortalCommandEnv } from './portal-command-env.js';
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

function upsertEnvContent(content: string, values: Record<string, string>): string {
  const nextValues = { ...values };
  const lines = content ? content.replace(/\r\n/g, '\n').split('\n') : [];
  const result: string[] = [];

  for (const line of lines) {
    if (!line && result.length === lines.length - 1) {
      continue;
    }
    const match = line.match(/^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    const key = match?.[2];
    if (key && Object.prototype.hasOwnProperty.call(nextValues, key)) {
      result.push(`${key}=${nextValues[key]}`);
      delete nextValues[key];
      continue;
    }
    result.push(line);
  }

  for (const [key, value] of Object.entries(nextValues)) {
    result.push(`${key}=${value}`);
  }

  return `${result.join('\n').replace(/\n*$/, '')}\n`;
}

export async function upsertPortalEnvFile(filePath: string, values: Record<string, string>): Promise<void> {
  let content = '';
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    content = '';
  }
  await writeFile(filePath, upsertEnvContent(content, values), 'utf-8');
}

async function updatePortalEnvFiles(params: {
  portalDir: string;
  apiBaseUrl: string;
  portalBase: string;
}): Promise<void> {
  await upsertPortalEnvFile(path.join(params.portalDir, '.env'), {
    NOCOBASE_API_URL: resolvePortalEnvApiUrl(params.apiBaseUrl),
    NOCOBASE_PORTAL_BASE: params.portalBase,
  });
  await upsertPortalEnvFile(path.join(params.portalDir, '.env.local'), {
    NOCOBASE_API_URL: params.apiBaseUrl,
    NOCOBASE_PORTAL_BASE: params.portalBase,
  });
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

  if (options.env.kind === 'local' || options.env.kind === 'docker') {
    return {
      app,
      portal,
      portalDir,
      portalBase,
      distDir,
      mode: options.env.kind,
      uploaded: false,
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

  return {
    app,
    portal,
    portalDir,
    portalBase,
    distDir,
    serverDistPath: uploadResult.distPath,
    mode: 'http',
    uploaded: true,
  };
}
