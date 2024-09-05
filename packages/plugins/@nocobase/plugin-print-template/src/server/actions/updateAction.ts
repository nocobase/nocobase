/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { Context, Next } from '@nocobase/actions';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { ResourcerContext } from '@nocobase/resourcer';
import { resolve } from 'path';
import os from 'os';
export async function updateAction(ctx: ResourcerContext, next: Next, fileManagerPlugin: PluginFileManagerServer) {
  // 根据是否传递了文件，处理两套不同的逻辑，
  // 1. 传递了文件，保存文件后，把文件的ID拿到去更新printTemplate表
  // 2. 没有传递文件，直接更新printTemplate表
  const v = ctx.action.params.values;
  if (v.templateFile) {
    const recordOptions = {
      filePath: resolve(os.tmpdir(), v.templateFile.filename),
      collectionName: 'attachments',
      value: {
        title: v.templateName,
        extname: '.' + v.templateType,
        mimetype: v.templateFile.mimetype,
      },
    };

    if (!fileManagerPlugin) {
      ctx.body = {
        error: 'fileManagerPlugin is null',
      };
      return false;
    }
    const attachmentsRow = await fileManagerPlugin.createFileRecord(recordOptions);
    const attachmentsRowId = attachmentsRow.id;
    await ctx.db.getRepository('printTemplate').update({
      filterByTk: ctx.action.params.filterByTk,
      values: {
        templateName: v.templateName,
        templateRemark: v.templateRemark,
        templateType: v.templateType,
        supportTable: v.supportTable,
        attachmentsId: attachmentsRowId,
      },
    });
  } else {
    await ctx.db.getRepository('printTemplate').update({
      filterByTk: ctx.action.params.filterByTk,
      values: {
        templateName: v.templateName,
        templateRemark: v.templateRemark,
        templateType: v.templateType,
        supportTable: v.supportTable,
      },
    });
  }
  ctx.body = {
    code: '0',
  };
}
