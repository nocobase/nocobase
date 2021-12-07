import xlsx from 'node-xlsx';
import render from '../renders';
import { BelongsToManyRepository, Collection, Repository } from '@nocobase/database';
import { Context, Next } from '@nocobase/actions';

async function _export(ctx: Context, next: Next) {
  let { title, columns, associatedName, associatedIndex, resourceName, filter, fields, appends, except } =
    ctx.action.params;

  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }

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

  const data = repository.find({
    filter,
    fields,
    appends,
    except,
  });

  const { rows, ranges } = render(
    {
      fields: collection.fields,
      data,
    },
    ctx,
  );

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

export default _export;
