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
import * as XLSX from 'xlsx';
import { Mutex } from 'async-mutex';
import { XlsxImporter } from '../services/xlsx-importer';
import { DataSource } from '@nocobase/data-source-manager';

const IMPORT_LIMIT_COUNT = 2000;

const mutex = new Mutex();

export function readImportWorkbook(buffer: Buffer, sheetRows: number) {
  return XLSX.read(buffer, {
    type: 'buffer',
    sheetRows,
    // Keep Excel date cells as serial numbers. SheetJS `cellDates: true` converts
    // them to local-time Date objects through a timezone-sensitive path, which can
    // shift date-only values in non-UTC environments (for example Asia/Shanghai).
    cellDates: false,
  });
}

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

  const workbook = readImportWorkbook(ctx.file.buffer, readLimit);

  const repository = ctx.getCurrentRepository() as Repository;
  const dataSource = ctx.dataSource as DataSource;

  const collection = repository.collection;

  const importer = new XlsxImporter({
    collectionManager: dataSource.collectionManager,
    collection,
    columns,
    workbook,
    explain: (ctx.request.body as any).explain,
    repository,
    rowDefaultValues: ctx.action.params?.rowDefaultValues || {},
  });

  const importedCount = await importer.run({
    context: ctx,
  });

  ctx.bodyMeta = { successCount: importedCount };
  ctx.body = ctx.bodyMeta;
}

export async function importXlsx(ctx: Context, next: Next) {
  if (mutex.isLocked()) {
    throw new Error(
      ctx.t(`another import action is running, please try again later.`, {
        ns: 'action-import',
      }),
    );
  }

  const release = await mutex.acquire();

  try {
    await importXlsxAction(ctx, next);
  } finally {
    release();
  }

  await next();
}
