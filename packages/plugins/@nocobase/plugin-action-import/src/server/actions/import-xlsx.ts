/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Repository } from '@nocobase/database';
import XLSX from 'xlsx';
import { XlsxImporter } from '../services/xlsx-importer';
import { DataSource } from '@nocobase/data-source-manager';
import PluginActionImportServer from '..';
import { LockAcquireError } from '@nocobase/lock-manager';

const IMPORT_LIMIT_COUNT = 2000;

async function importXlsxAction(ctx: Context, next: Next) {
  let columns = (ctx.request.body as any).columns as any[];
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }

  let readLimit = IMPORT_LIMIT_COUNT;

  // add header raw
  readLimit += 1;

  if ((ctx.request.body as any).explain) {
    readLimit += 1;
  }

  const workbook = XLSX.read(ctx.file.buffer, {
    type: 'buffer',
    sheetRows: readLimit,
  });

  const repository = ctx.getCurrentRepository() as Repository;
  const dataSource = ctx.dataSource as DataSource;

  const collection = repository.collection;

  const importer = new XlsxImporter({
    collectionManager: dataSource.collectionManager,
    collection,
    columns,
    workbook,
    explain: (ctx.request.body as any).explain,
  });

  const importedCount = await importer.run({
    context: ctx,
  });

  ctx.bodyMeta = { successCount: importedCount };
  ctx.body = ctx.bodyMeta;
}

export async function importXlsx(ctx: Context, next: Next) {
  const plugin = ctx.app.pm.get(PluginActionImportServer) as PluginActionImportServer;
  const { collection } = ctx.getCurrentRepository();
  const dataSource = ctx.dataSource as DataSource;
  const lockKey = `${plugin.name}:${dataSource.name}:${collection.name}`;
  let lock;
  try {
    lock = ctx.app.lockManager.tryAcquire(lockKey);
  } catch (error) {
    if (error instanceof LockAcquireError) {
      throw new Error(
        ctx.t(`another import action is running, please try again later.`, {
          ns: 'action-import',
        }),
      );
    }
  }

  const release = await lock.acquire(5000);

  try {
    await importXlsxAction(ctx, next);
  } finally {
    release();
  }

  await next();
}
