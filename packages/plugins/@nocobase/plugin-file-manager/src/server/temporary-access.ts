/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHmac } from 'crypto';
import type { Context, Next } from '@nocobase/actions';
import type { DataSource } from '@nocobase/data-source-manager';
import type { Collection } from '@nocobase/database';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type { PluginFileManagerServer } from './server';
import { getFileAccessPathSegment, getFilePublicBasePath } from './utils';

export const CREATE_TEMPORARY_URL_ACTION = 'createTemporaryURL';
export const TEMPORARY_FILE_ACCESS_AUDIENCE = 'temporary-file-access';

const DEFAULT_EXPIRES_IN = '10m';
const MIN_EXPIRES_IN_SECONDS = 5 * 60;
const MAX_EXPIRES_IN_SECONDS = 10 * 60;

export type TemporaryFileAccessPayload = JwtPayload & {
  app: string;
  dataSource: string;
  collection: string;
  id: string;
  storageId: string | number;
  role?: string;
};

type TemporaryFileAccessResource = Pick<
  TemporaryFileAccessPayload,
  'app' | 'dataSource' | 'collection' | 'id' | 'storageId' | 'sub' | 'role'
>;

function isFileCollection(collection: Collection | undefined): collection is Collection {
  return Boolean(collection && (collection.name === 'attachments' || collection.options?.template === 'file'));
}

function hasStandardIdAttribute(collection: Collection) {
  return Boolean(collection.model?.rawAttributes?.id || collection.model?.getAttributes?.().id);
}

export function getTemporaryFileAccessExpiresIn(): SignOptions['expiresIn'] {
  const value = process.env.TEMPORARY_FILE_ACCESS_EXPIRES_IN || DEFAULT_EXPIRES_IN;
  const matched = /^(\d+)(s|m)$/.exec(value);
  const seconds = matched ? Number(matched[1]) * (matched[2] === 'm' ? 60 : 1) : Number.NaN;
  if (!Number.isFinite(seconds) || seconds < MIN_EXPIRES_IN_SECONDS || seconds > MAX_EXPIRES_IN_SECONDS) {
    throw new Error('TEMPORARY_FILE_ACCESS_EXPIRES_IN must be between 5m and 10m');
  }
  return value as SignOptions['expiresIn'];
}

export function deriveTemporaryFileAccessSecret(plugin: PluginFileManagerServer) {
  const appName = plugin.app.name || 'main';
  const authSecret = plugin.app.authManager.jwt.getSecret();
  return createHmac('sha256', authSecret).update(`temporary-file-access:${appName}`).digest();
}

export function signTemporaryFileAccessToken(
  plugin: PluginFileManagerServer,
  resource: TemporaryFileAccessResource,
  options: Pick<SignOptions, 'expiresIn'> = {},
) {
  const currentUserId = resource.sub;
  return jwt.sign(
    {
      app: resource.app,
      dataSource: resource.dataSource,
      collection: resource.collection,
      id: String(resource.id),
      storageId: resource.storageId,
      ...(resource.role ? { role: resource.role } : {}),
    },
    deriveTemporaryFileAccessSecret(plugin),
    {
      algorithm: 'HS256',
      audience: TEMPORARY_FILE_ACCESS_AUDIENCE,
      ...(currentUserId ? { subject: String(currentUserId) } : {}),
      expiresIn: options.expiresIn || getTemporaryFileAccessExpiresIn(),
    },
  );
}

export function verifyTemporaryFileAccessToken(plugin: PluginFileManagerServer, token: string) {
  const decoded = jwt.verify(token, deriveTemporaryFileAccessSecret(plugin), {
    algorithms: ['HS256'],
    audience: TEMPORARY_FILE_ACCESS_AUDIENCE,
  });
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Invalid temporary file access token');
  }
  return decoded as TemporaryFileAccessPayload;
}

export async function createTemporaryURLAction(ctx: Context, next: Next) {
  const collectionName = ctx.action.resourceName;
  const collection = ctx.dataSource.collectionManager.getCollection(collectionName) as Collection | undefined;
  if (!isFileCollection(collection)) {
    return ctx.throw(404);
  }
  if (!hasStandardIdAttribute(collection)) {
    ctx.logger.error('file collection is missing standard id field', {
      method: 'file-manager.createTemporaryURL',
      collection: collection.name,
    });
    return ctx.throw(500);
  }

  const id = ctx.action.params.filterByTk;
  let filter = { id };
  if (
    ctx.app.options.acl !== false &&
    ctx.dataSource.options?.useACL !== false &&
    ctx.dataSource.options?.acl !== false
  ) {
    const permission = await ctx.dataSource.acl.checkAction({
      context: ctx,
      resource: collection.name,
      action: 'get',
      params: { filter },
    });
    filter = permission.mergedParams?.filter || filter;
  }

  const file = await ctx.getCurrentRepository().findOne({
    filter,
    fields: ['id', 'storageId', 'extname'],
    context: ctx,
  });
  const storageId = file?.get('storageId');
  if (!file || (typeof storageId !== 'string' && typeof storageId !== 'number')) {
    return ctx.throw(404);
  }

  const plugin = ctx.app.pm.get('file-manager') as PluginFileManagerServer;
  const appName = ctx.app.name || 'main';
  const dataSourceName = ctx.dataSource.name;
  const fileId = getFileAccessPathSegment(id, file.get('extname'));
  const token = signTemporaryFileAccessToken(plugin, {
    app: appName,
    dataSource: dataSourceName,
    collection: collection.name,
    id: String(id),
    storageId,
    sub: ctx.state.currentUser?.id ? String(ctx.state.currentUser.id) : undefined,
    role: ctx.state.currentRole,
  });
  const basePath = getFilePublicBasePath();
  const url = `${basePath}/files/${encodeURIComponent(appName)}/${encodeURIComponent(
    dataSourceName,
  )}/${encodeURIComponent(collection.name)}/${fileId}?temporary-access-token=${encodeURIComponent(token)}`;

  ctx.set('Cache-Control', 'no-store');
  ctx.body = { url };
  await next();
}

export function registerTemporaryFileAccess(dataSource: DataSource) {
  dataSource.resourceManager.registerActionHandler(CREATE_TEMPORARY_URL_ACTION, createTemporaryURLAction);
  dataSource.acl.allow('*', CREATE_TEMPORARY_URL_ACTION, 'loggedIn');
}
