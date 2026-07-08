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

const GET_FILE_ACTION = 'getFile';
const registeredDataSources = new WeakSet<DataSource>();

function hasStandardIdAttribute(collection: Collection) {
  return Boolean(collection.model?.rawAttributes?.id || collection.model?.getAttributes?.().id);
}

export function createGetFileAction(plugin: PluginFileManagerServer) {
  return async function getFile(ctx: Context, next: Next) {
    const collection = ctx.dataSource.collectionManager.getCollection(ctx.action.resourceName);
    if (!collection || (collection.name !== 'attachments' && collection.options?.template !== 'file')) {
      return ctx.throw(404);
    }
    if (!hasStandardIdAttribute(collection)) {
      ctx.logger.error('file collection is missing standard id field', {
        method: 'file-manager.getFile',
        collection: collection.name,
      });
      return ctx.throw(500);
    }

    const id = ctx.state.fileAccess?.id ?? ctx.action.params.filterByTk;
    const fileAccessParams = ctx.state.fileAccess
      ? {
          appName: ctx.state.fileAccess.appName,
          dataSourceKey: ctx.state.fileAccess.dataSourceKey,
          collectionName: collection.name,
          id: String(id),
          preview: Boolean(ctx.state.fileAccess.preview),
        }
      : null;
    const authorizedByExtension = fileAccessParams ? await plugin.authorizeFileAccess(ctx, fileAccessParams) : false;

    let filter = { id };
    if (
      !authorizedByExtension &&
      ctx.app.options.acl !== false &&
      ctx.dataSource.options?.useACL !== false &&
      ctx.dataSource.options?.acl !== false
    ) {
      const permission = await ctx.dataSource.acl.checkAction({
        context: ctx,
        resource: collection.name,
        action: 'get',
        params: {
          filter,
        },
      });
      filter = permission.mergedParams?.filter || filter;
    }

    const file = await ctx.getCurrentRepository().findOne({
      filter,
      fields: ['id', 'storageId', 'path', 'filename', 'mimetype', 'url', 'meta'],
      context: ctx,
    });

    if (!file || !file.get('storageId')) {
      return ctx.throw(404);
    }

    const finalUrl = await plugin.getStorageFileURL(file, Boolean(ctx.state.fileAccess?.preview));
    ctx.status = 302;
    ctx.redirect(finalUrl);
    await next();
  };
}

export function registerGetFileAccess(dataSource: DataSource, plugin: PluginFileManagerServer) {
  if (registeredDataSources.has(dataSource)) {
    return;
  }

  dataSource.resourceManager.registerActionHandler(GET_FILE_ACTION, createGetFileAction(plugin));
  dataSource.acl.use(skipGetFileAcl, { tag: 'skipGetFileAcl', before: 'core' });
  registeredDataSources.add(dataSource);
}

export function ensureGetFileAction(dataSource: DataSource, collectionName: string, plugin: PluginFileManagerServer) {
  registerGetFileAccess(dataSource, plugin);

  if (!dataSource.resourceManager.isDefined(collectionName)) {
    return;
  }

  const resource = dataSource.resourceManager.getResource(collectionName);
  try {
    resource.getAction(GET_FILE_ACTION);
  } catch (error) {
    resource.addAction(GET_FILE_ACTION, createGetFileAction(plugin));
  }
}

export async function skipGetFileAcl(ctx: Context, next: Next) {
  if (ctx.action?.actionName === GET_FILE_ACTION) {
    ctx.permission.skip = true;
  }
  await next();
}
