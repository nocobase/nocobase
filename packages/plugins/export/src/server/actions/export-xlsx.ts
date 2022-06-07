import { Context, Next } from '@nocobase/actions';
import { Collection, Repository } from '@nocobase/database';
import xlsx from 'node-xlsx';
import render from '../renders';

export async function exportXlsx(ctx: Context, next: Next) {
  let { title, columns, associatedName, associatedIndex, resourceName, filter, fields, appends, except } =
    ctx.action.params;
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }
  columns = columns?.filter((col) => col?.dataIndex?.length > 0);

  let repository: Repository;
  let collection: Collection;

  if (associatedName && associatedIndex) {
    const associated = ctx.db.getCollection(associatedName);
    const resourceField = associated.getField(resourceName);
    collection = ctx.db.getCollection(resourceField.target);
    repository = associated.repository.relation(resourceName).of(associatedIndex) as any;
  } else {
    collection = ctx.db.getCollection(resourceName);
    repository = collection.repository;
  }
  const data = await repository.find({
    filter,
    fields,
    appends,
    except,
  });
  const collectionFields = columns.map((col) => collection.fields.get(col.dataIndex[0]));
  const { rows, ranges } = render({ columns, fields: collectionFields, data }, ctx);
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
