import { Context, Next } from '@nocobase/actions';
import { Repository } from '@nocobase/database';
import xlsx from 'node-xlsx';
import render from '../renders';
import { columns2Appends } from '../utils';

export async function exportXlsx(ctx: Context, next: Next) {
  let { title, columns, filter, fields, except } = ctx.action.params;
  const { resourceName, resourceOf } = ctx.action;
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }
  const appends = columns2Appends(columns, ctx);
  columns = columns?.filter((col) => col?.dataIndex?.length > 0);
  const repository = ctx.db.getRepository<any>(resourceName, resourceOf) as Repository;
  const collection = repository.collection;
  const data = await repository.find({
    filter,
    fields,
    appends,
    except,
    context: ctx,
  });
  const collectionFields = columns.map((col) => collection.fields.get(col.dataIndex[0]));
  const { rows, ranges } = await render({ columns, fields: collectionFields, data }, ctx);
  ctx.body = xlsx.build([
    {
      name: title,
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
