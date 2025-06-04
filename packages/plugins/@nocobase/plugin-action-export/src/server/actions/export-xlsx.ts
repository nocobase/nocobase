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

import { XlsxExporter } from '../services/xlsx-exporter';
import { Mutex } from 'async-mutex';
import { DataSource } from '@nocobase/data-source-manager';
import { Logger } from '@nocobase/logger';

const mutex = new Mutex();

async function exportXlsxAction(ctx: Context, next: Next, logger: Logger) {
  const { title, filter, sort, fields, except } = ctx.action.params;
  let columns = ctx.action.params.values?.columns || ctx.action.params?.columns;

  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }

  const repository = ctx.getCurrentRepository() as Repository;
  const dataSource = ctx.dataSource as DataSource;

  const collection = repository.collection;

  const xlsxExporter = new XlsxExporter({
    collectionManager: dataSource.collectionManager,
    collection,
    repository,
    columns,
    logger,
    findOptions: {
      filter,
      fields,
      except,
      sort,
    },
  });

  try {
    await xlsxExporter.run(ctx);
    const buffer = xlsxExporter.getXlsxBuffer();
    xlsxExporter.cleanOutputFile();
    ctx.body = buffer;
  } catch (error) {
    logger.error('Error writing XLSX file:', error);
    throw error;
  }

  ctx.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename=${encodeURI(title)}.xlsx`,
  });
}

export async function exportXlsx(ctx: Context, next: Next) {
  if (ctx.exportHandled) {
    return await next();
  }

  if (mutex.isLocked()) {
    throw new Error(
      ctx.t(`another export action is running, please try again later.`, {
        ns: 'action-export',
      }),
    );
  }

  const release = await mutex.acquire();
  try {
    await exportXlsxAction(ctx, next, this.logger);
  } finally {
    release();
  }

  await next();
}
