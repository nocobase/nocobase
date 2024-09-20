/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Next } from '@nocobase/actions';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { ResourcerContext } from '@nocobase/resourcer';
import { resolve, basename, join } from 'path';
import os from 'os';
import Database, { Collection } from '@nocobase/database';
import { getFileData } from 'packages/plugins/@nocobase/plugin-file-manager/src/server/actions/attachments';
import fs from 'fs';
import Application from '@nocobase/server';
import {
  excelTemplateReplacement,
  getDestFilePath,
  mimeTypeToExtensionMap,
  reverseMap,
  wordTemplateReplacement,
} from '../util';
import contentDisposition from 'content-disposition';
export async function formatTemplateAction(
  ctx: ResourcerContext,
  next: Next,
  app: Application,
  db: Database,
  fileManagerPlugin: PluginFileManagerServer,
) {
  // ctx.body = dictionaryCollections;
  // ctx.db.getCollection("printTemplate").model.findAll()
  //  await c.model.findAll()
  //  ctx.body = await c.model.findAll()

  const v = ctx.action.params.values;

  const dataSource = v.dataSource;
  const tableName = v.tableName;
  const rowFilterByTk = v.rowFilterByTk;
  const printTemplateId = v.printTemplateId;

  // 1.查模板ID对应的文件所在的BUF
  const rowTemplate = await db.getCollection('printTemplate').model.findOne({
    attributes: ['templateName', 'templateType', 'supportTable', 'attachmentsId'],
    where: {
      id: printTemplateId,
    },
  });

  if (rowTemplate === null) {
    ctx.body = {
      code: 1,
      message: '模板不存在',
    };
    return;
  }
  const { templateName, templateType, supportTable, attachmentsId } = rowTemplate;

  const rowAttachments = await db.getCollection('attachments').model.findOne({
    attributes: ['storageId', 'filename', 'extname', 'url'],
    where: {
      id: attachmentsId,
    },
  });
  const { storageId, filename, extname, url } = rowAttachments;
  const rowStorage = await db.getRepository('storages').findOne({
    filter: {
      id: storageId,
    },
  });
  if (rowStorage === null) {
    ctx.body = {
      code: 1,
      message: '存储实例不存在',
    };
    return;
  }
  const { type, baseUrl } = rowStorage;
  if (type !== 'local') {
    ctx.body = {
      code: 1,
      message: '暂不支持非本地存储',
    };
    return;
  }

  // const rs = fs.createReadStream(filePath);
  // console.log(Buffer.from(rs))
  // const file = {
  //   originalname: basename(url),
  //   path: url,
  //   stream: fileStream,
  // } as any;
  // const fileDataOptions = {
  //   app: app,
  //   file,
  //   storage: storageInstance,
  //   request: { body: {} }
  // } as any

  // getFileData(fileDataOptions)

  // ctx.body = {
  //   code: 0
  // }
  // 2. 查数据的数据表
  const rowData = await db.getCollection(tableName).model.findOne({
    where: {
      id: rowFilterByTk,
    },
  });
  if (rowData === null) {
    ctx.body = {
      code: 1,
      message: '数据不存在',
    };
    return;
  }
  const filePath = resolve(join(process.cwd(), url));
  const destPath = getDestFilePath(resolve('storage', 'tmp'));
  const rowDataJSON = rowData.toJSON();
  if (templateType === 'docx') {
    wordTemplateReplacement({ ...rowDataJSON }, filePath, resolve(destPath, basename(url)));
  } else if (templateType === 'xlsx') {
    excelTemplateReplacement({ ...rowDataJSON }, filePath, resolve(destPath, basename(url)));
  } else {
    ctx.body = {
      code: 1,
      message: '暂不支持该模板类型',
    };
    return;
  }
  const fn = templateName + '.' + templateType;
  ctx.set('Content-Disposition', contentDisposition(fn, { fallback: 'print' + '.' + templateType }));
  ctx.type = reverseMap(mimeTypeToExtensionMap)[templateType];
  ctx.body = fs.createReadStream(resolve(destPath, basename(url)));
  await next();
}
