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
import type { Collection } from '@nocobase/database';
import type { PluginFileManagerServer } from '../server';
import { verifyTemporaryFileAccessToken } from '../temporary-access';
import { getFilePlainObject, getFileRecordValue, hasStandardFileId } from '../utils';
import type { AttachmentModel } from '../storages';
import { resolveFileAccessFilter } from '../resolve-file-access-filter';

const GET_FILE_ACTION = 'getFile';

type StorageFileURLResolver = {
  resolveStorageFileURL?: (options: {
    collectionName: string;
    file: Record<string, unknown>;
    preview: boolean;
    download: boolean;
  }) => Promise<string | undefined>;
};

export async function getFile(ctx: Context, next: Next) {
  const collection = ctx.dataSource.collectionManager.getCollection(ctx.action.resourceName);
  if (!collection || (collection.name !== 'attachments' && collection.options?.template !== 'file')) {
    return ctx.throw(404);
  }
  if (!hasStandardFileId(collection as Collection)) {
    ctx.logger.error('file collection is missing standard id field', {
      method: 'file-manager.getFile',
      collection: collection.name,
    });
    return ctx.throw(500);
  }

  const plugin = ctx.app.pm.get('file-manager') as PluginFileManagerServer;
  const id = ctx.state.fileAccess?.id ?? ctx.action.params.filterByTk;
  const temporaryAccess = Boolean(ctx.state.fileAccess?.temporaryAccess);
  let temporaryAccessPayload;
  if (temporaryAccess) {
    ctx.set('Cache-Control', 'private, no-store');
    ctx.set('Referrer-Policy', 'no-referrer');
    const token = ctx.state.fileAccess?.temporaryAccessToken;
    if (typeof token !== 'string' || !token) {
      return ctx.throw(403);
    }
    try {
      temporaryAccessPayload = verifyTemporaryFileAccessToken(plugin, token);
    } catch (error) {
      return ctx.throw(403);
    }
    const expectedResource = {
      app: ctx.state.fileAccess.appName,
      dataSource: ctx.state.fileAccess.dataSourceKey,
      collection: collection.name,
      id: String(id),
    };
    if (
      temporaryAccessPayload.app !== expectedResource.app ||
      temporaryAccessPayload.dataSource !== expectedResource.dataSource ||
      temporaryAccessPayload.collection !== expectedResource.collection ||
      String(temporaryAccessPayload.id) !== expectedResource.id
    ) {
      return ctx.throw(403);
    }
  }
  const fileAccessParams = ctx.state.fileAccess
    ? {
        appName: ctx.state.fileAccess.appName,
        dataSourceKey: ctx.state.fileAccess.dataSourceKey,
        collectionName: collection.name,
        id: String(id),
        preview: Boolean(ctx.state.fileAccess.preview),
      }
    : null;
  const authorizedByExtension =
    fileAccessParams && !temporaryAccess ? await plugin.authorizeFileAccess(ctx, fileAccessParams) : false;

  let filter: object = { id };
  if (
    !temporaryAccess &&
    !authorizedByExtension &&
    ctx.app.options.acl !== false &&
    ctx.dataSource.options?.useACL !== false &&
    ctx.dataSource.options?.acl !== false
  ) {
    filter = await resolveFileAccessFilter(ctx, collection as Collection, filter);
  }

  const file = await ctx.getCurrentRepository().findOne({
    filter,
    fields: ['id', 'storageId', 'path', 'filename', 'extname', 'mimetype', 'url', 'meta'],
    context: ctx,
  });

  const storageId = getFileRecordValue(file, 'storageId');
  if (!file || !storageId) {
    return ctx.throw(404);
  }
  if (temporaryAccessPayload && String(temporaryAccessPayload.storageId) !== String(storageId)) {
    return ctx.throw(403);
  }
  if (ctx.state.fileAccess?.extname && ctx.state.fileAccess.extname !== getFileRecordValue(file, 'extname')) {
    return ctx.throw(404);
  }

  const download = !temporaryAccess && ctx.method === 'GET' && ctx.query.download === '1';
  const preview = download ? false : temporaryAccess ? false : Boolean(ctx.state.fileAccess?.preview);
  const dataSource = ctx.dataSource as DataSource & StorageFileURLResolver;
  const finalUrl =
    (await dataSource.resolveStorageFileURL?.({
      collectionName: collection.name,
      file: getFilePlainObject(file as AttachmentModel) as Record<string, unknown>,
      preview,
      download,
    })) || (await plugin.getFileURL(file, preview, { download }));
  ctx.status = 302;
  ctx.redirect(finalUrl);
  await next();
}

export function registerGetFileAccess(dataSource: DataSource) {
  dataSource.resourceManager.registerActionHandler(GET_FILE_ACTION, getFile);
  dataSource.acl.use(skipGetFileAcl, { tag: 'skipGetFileAcl', before: 'core' });
}

export async function skipGetFileAcl(ctx: Context, next: Next) {
  if (ctx.action?.actionName === GET_FILE_ACTION) {
    ctx.permission.skip = true;
  }
  await next();
}
