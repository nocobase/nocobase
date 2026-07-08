/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';
import type { DataSource } from '@nocobase/data-source-manager';
import { ensureGetFileAction } from './actions/get-file';
import type { PluginFileManagerServer } from './server';
import { trimPublicPath } from './utils';

const DEFAULT_APP_NAME = 'main';
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_-]*$/;

function stripPublicPath(path: string) {
  const publicPath = trimPublicPath(process.env.APP_PUBLIC_PATH);
  if (publicPath && (path === publicPath || path.startsWith(`${publicPath}/`))) {
    return path.slice(publicPath.length) || '/';
  }
  return path;
}

function parseFileAccessPath(path: string) {
  const normalizedPath = stripPublicPath(path);
  const segments = normalizedPath.split('/').filter(Boolean);
  if (segments[0] !== 'files') {
    return null;
  }
  if (segments.length !== 5 && segments.length !== 6) {
    throw Object.assign(new Error('Invalid file URL'), { status: 404 });
  }
  if (segments.length === 6 && segments[5] !== 'preview') {
    throw Object.assign(new Error('Invalid file URL'), { status: 404 });
  }
  try {
    const params = {
      appName: decodeURIComponent(segments[1]),
      dataSourceKey: decodeURIComponent(segments[2]),
      collectionName: decodeURIComponent(segments[3]),
      id: decodeURIComponent(segments[4]),
      preview: segments.length === 6,
    };
    if (
      !IDENTIFIER_PATTERN.test(params.appName) ||
      !IDENTIFIER_PATTERN.test(params.dataSourceKey) ||
      !IDENTIFIER_PATTERN.test(params.collectionName)
    ) {
      throw Object.assign(new Error('Invalid file URL'), { status: 404 });
    }
    return params;
  } catch (error) {
    throw Object.assign(new Error('Invalid file URL'), { status: 404 });
  }
}

function getApiBasePath(dataSource: DataSource) {
  return trimPublicPath(dataSource.resourceManager?.options?.prefix);
}

export function createFileAccessMiddleware(plugin: PluginFileManagerServer) {
  return async function handleFileAccess(ctx: Context, next: Next) {
    const params = parseFileAccessPath(ctx.path);
    if (!params) {
      return next();
    }
    if (!['GET', 'HEAD'].includes(ctx.method)) {
      return ctx.throw(405);
    }

    if (params.appName !== (plugin.app.name || DEFAULT_APP_NAME)) {
      return ctx.throw(404);
    }

    const dataSource = plugin.app.dataSourceManager.get(params.dataSourceKey);
    if (!dataSource) {
      return ctx.throw(404);
    }

    const originalPath = ctx.path;
    const originalDataSourceHeader = ctx.req.headers['x-data-source'];
    const originalDb = ctx.db;
    const originalOptionalAuth = ctx.state.optionalAuth;
    const originalFileAccess = ctx.state.fileAccess;

    try {
      ensureGetFileAction(dataSource, params.collectionName, plugin);
      ctx.path = `${getApiBasePath(dataSource)}/${encodeURIComponent(
        params.collectionName,
      )}:getFile/${encodeURIComponent(params.id)}`;
      ctx.req.headers['x-data-source'] = params.dataSourceKey;
      ctx.db = plugin.app.db;
      ctx.state.optionalAuth = true;
      ctx.state.fileAccess = params;
      await plugin.app.dataSourceManager.middleware()(ctx, async () => {});
    } finally {
      ctx.path = originalPath;
      if (originalDataSourceHeader === undefined) {
        delete ctx.req.headers['x-data-source'];
      } else {
        ctx.req.headers['x-data-source'] = originalDataSourceHeader;
      }
      ctx.db = originalDb;
      ctx.state.optionalAuth = originalOptionalAuth;
      ctx.state.fileAccess = originalFileAccess;
    }
  };
}
