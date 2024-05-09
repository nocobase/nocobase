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
import xlsx from 'node-xlsx';
import render from '../renders';
import { columns2Appends } from '../utils';

export async function exportXlsx(ctx: Context, next: Next) {
  const { title, filter, sort, fields, except } = ctx.action.params;
  let columns = ctx.action.params.values?.columns || ctx.action.params?.columns;
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }
  const repository = ctx.getCurrentRepository() as Repository;
  const collection = repository.collection;
  columns = columns?.filter((col) => collection.hasField(col.dataIndex[0]) && col?.dataIndex?.length > 0);
  const appends = columns2Appends(columns, ctx);
  const data = await repository.find({
    filter,
    fields,
    appends,
    except,
    sort,
    limit: 200,
    context: ctx,
  });
  const collectionFields = columns.map((col) => collection.fields.get(col.dataIndex[0]));
  const { rows, ranges } = await render({ columns, fields: collectionFields, data }, ctx);
  ctx.body = xlsx.build([
    {
      name: 'Sheet 1',
      data: rows,
      options: {
        '!merges': ranges,
      },
    },
  ]);

  ctx.set({
    'Content-Type': 'application/octet-stream',
    // to avoid "invalid character" error in header (RFC)
    'Content-Disposition': `attachment; filename=${encodeURI(title)}.xlsx`,
  });

  await next();
}
