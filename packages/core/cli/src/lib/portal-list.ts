/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stat } from 'node:fs/promises';
import path from 'node:path';
import { appendAppPublicPath } from './app-public-path.js';
import { executeApiRequest, type RequestOperation } from './api-client.js';
import { translateCli } from './cli-locale.js';
import {
  buildPortalBasePath,
  resolvePortalAppContext,
  resolvePortalStoragePath,
  type ResolvedPortalApp,
  type PortalCreateEnvLike,
} from './portal-create.js';

type ApiRequest = typeof executeApiRequest;

export type PortalListEnvLike = PortalCreateEnvLike;

export type PortalListMode = 'local' | 'docker' | 'http';

export type PortalListOptions = {
  env: PortalListEnvLike;
  envName?: string;
  cliVersion?: string;
  apiRequest?: ApiRequest;
  appContext?: ResolvedPortalApp;
};

export type PortalListItem = {
  uid: string;
  portalName: string;
  routePath: string;
  portalType: string;
  enabled: boolean;
  sourceStorage: string;
  gitRepo: string;
  gitBranch: string;
  gitPath: string;
  sourceRevision: string;
  options: Record<string, unknown>;
  portalUrl: string;
  portalDir: string;
  localSynced: boolean | null;
};

export type PortalOutputItem = {
  name: string;
  url: string;
  portalType: string;
  localPath: string;
  enabled: boolean;
  sourceStorage: string;
  localSynced: boolean | null;
};

export type PortalListResult = {
  app: string;
  mode: PortalListMode;
  storagePath: string;
  items: PortalListItem[];
};

const portalListText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalList.${key}`, values, { fallback });

const LIST_PORTALS_OPERATION: RequestOperation = {
  method: 'GET',
  pathTemplate: '/multiPortals:list',
  parameters: [
    {
      name: 'pageSize',
      flagName: 'pageSize',
      in: 'query',
      type: 'integer',
    },
    {
      name: 'sort[]',
      flagName: 'sort',
      in: 'query',
      isArray: true,
    },
  ],
};

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function readRecordString(record: Record<string, unknown>, key: string): string {
  return trimValue(record[key]);
}

function readRecordBoolean(record: Record<string, unknown>, key: string): boolean {
  return record[key] === true;
}

function readRecordObject(record: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = record[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readListData(data: unknown): Array<Record<string, unknown>> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [];
  }

  const directData = (data as { data?: unknown }).data;
  if (Array.isArray(directData)) {
    return directData.filter((item): item is Record<string, unknown> => (
      Boolean(item) && typeof item === 'object' && !Array.isArray(item)
    ));
  }

  return readListData(directData);
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

function buildPortalAccessUrl(apiBaseUrl: string, portalBase: string): string {
  try {
    const baseUrl = new URL(apiBaseUrl);
    return new URL(portalBase, baseUrl.origin).toString();
  } catch {
    return portalBase;
  }
}

function normalizeRootPath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function isAbsoluteUrl(value: string): boolean {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) || value.startsWith('//');
}

function stripBasePath(pathname: string, basePath: string): string {
  const pathValue = normalizeRootPath(pathname);
  const baseValue = normalizeRootPath(basePath);
  if (pathValue === baseValue) {
    return '/';
  }
  if (pathValue.startsWith(`${baseValue}/`)) {
    return pathValue.slice(baseValue.length) || '/';
  }
  return pathValue;
}

function normalizeNoCodeRoutePath(routePath: string, appPublicPath: string, app: string): string {
  let normalizedRoutePath = normalizeRootPath(routePath);
  const basePaths =
    app === 'main'
      ? []
      : [
          appendAppPublicPath(appPublicPath, `v/apps/${app}`, { trailingSlash: false }),
          appendAppPublicPath(appPublicPath, `x/apps/${app}`, { trailingSlash: false }),
          `/v/apps/${app}`,
          `/x/apps/${app}`,
        ];
  for (const basePath of [
    ...basePaths,
    appendAppPublicPath(appPublicPath, 'v', { trailingSlash: false }),
    appendAppPublicPath(appPublicPath, 'x', { trailingSlash: false }),
    '/v',
    '/x',
  ]) {
    normalizedRoutePath = stripBasePath(normalizedRoutePath, basePath);
  }
  return normalizedRoutePath;
}

function buildNoCodePortalBasePath(params: { app: string; appPublicPath: string; routePath: string }): string {
  if (isAbsoluteUrl(params.routePath)) {
    return params.routePath;
  }

  const normalizedRoutePath = normalizeNoCodeRoutePath(params.routePath, params.appPublicPath, params.app);
  const routeSegment = normalizedRoutePath.replace(/^\/+/, '');
  let segment = normalizedRoutePath === '/' ? 'v' : `v/${routeSegment}`;
  if (params.app !== 'main') {
    segment = normalizedRoutePath === '/' ? `v/apps/${params.app}` : `v/apps/${params.app}/${routeSegment}`;
  }
  return appendAppPublicPath(params.appPublicPath, segment, { trailingSlash: normalizedRoutePath === '/' });
}

export function toPortalOutputItem(item: PortalListItem): PortalOutputItem {
  return {
    name: item.portalName,
    url: item.portalUrl,
    portalType: item.portalType,
    localPath: item.localSynced === true ? item.portalDir : '',
    enabled: item.enabled,
    sourceStorage: item.sourceStorage,
    localSynced: item.localSynced,
  };
}

async function listMultiPortalRecords(params: {
  envName?: string;
  cliVersion?: string;
  apiRequest?: ApiRequest;
}): Promise<Array<Record<string, unknown>>> {
  const apiRequest = params.apiRequest ?? executeApiRequest;
  const response = await apiRequest({
    cliVersion: params.cliVersion ?? '',
    envName: params.envName,
    flags: {
      pageSize: 200,
      sort: ['portalName'],
    },
    operation: LIST_PORTALS_OPERATION,
  });

  if (!response.ok) {
    throw new Error(
      portalListText(
        'errors.listFailed',
        { status: response.status, details: JSON.stringify(response.data, null, 2) },
        `Portal list failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
      ),
    );
  }

  return readListData(response.data);
}

export async function listPortalWorkspaces(options: PortalListOptions): Promise<PortalListResult> {
  const apiBaseUrl = trimValue(options.env.apiBaseUrl);
  const storagePath = resolvePortalStoragePath(options.env);
  const { app, appPublicPath, portalBaseApp } = options.appContext ?? (await resolvePortalAppContext(options));
  const mode = options.env.kind;
  const baseApp = portalBaseApp ?? app;

  if (mode !== 'local' && mode !== 'docker' && mode !== 'http') {
    throw new Error(
      portalListText(
        'errors.unsupportedEnvKind',
        { kind: mode },
        `Cannot list portals for ${mode} envs in the first version.`,
      ),
    );
  }
  const listMode: PortalListMode = mode;

  const records = await listMultiPortalRecords({
    envName: options.envName,
    cliVersion: options.cliVersion,
    apiRequest: options.apiRequest,
  });
  const items = await Promise.all(
    records.map(async (record) => {
      const uid = readRecordString(record, 'uid');
      const portalName = readRecordString(record, 'portalName') || uid;
      const routePath = readRecordString(record, 'routePath') || `/${portalName}`;
      const portalType = readRecordString(record, 'portalType');
      const enabled = readRecordBoolean(record, 'enabled');
      const options = readRecordObject(record, 'options');
      const git = readRecordObject(options, 'git');
      const sourceStorage = trimValue(options.sourceStorage) || readRecordString(record, 'sourceStorage') || 'nocobase';
      const isAi = portalType === 'ai';
      const portalDir = isAi ? path.join(storagePath, 'portals', app, portalName) : '';

      return {
        uid,
        portalName,
        routePath,
        portalType,
        enabled,
        sourceStorage,
        gitRepo: trimValue(git.repo) || readRecordString(record, 'gitRepo'),
        gitBranch: trimValue(git.branch) || readRecordString(record, 'gitBranch'),
        gitPath: trimValue(git.path) || readRecordString(record, 'gitPath'),
        sourceRevision: trimValue(options.sourceRevision) || readRecordString(record, 'sourceRevision'),
        options,
        portalUrl: enabled
          ? buildPortalAccessUrl(
              apiBaseUrl,
              isAi
                ? buildPortalBasePath({ app: baseApp, appPublicPath, portal: portalName })
                : buildNoCodePortalBasePath({ app: baseApp, appPublicPath, routePath }),
            )
          : '',
        portalDir,
        localSynced: isAi ? await pathExists(portalDir) : null,
      };
    }),
  );

  return {
    app,
    mode: listMode,
    storagePath,
    items,
  };
}
