import { Context, Next } from '@nocobase/actions';
import { Repository } from '@nocobase/database';
import xlsx from 'node-xlsx';
import { transform } from '../utils';

export async function importXlsx(ctx: Context, next: Next) {
  let { columns } = ctx.request.body;
  const { ['file']: file } = ctx;
  const { resourceName, resourceOf } = ctx.action;
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }
  const repository = ctx.db.getRepository<any>(resourceName, resourceOf) as Repository;
  const collection = repository.collection;

  columns = columns?.filter((col) => col?.dataIndex?.length > 0);
  const collectionFields = columns.map((col) => collection.fields.get(col.dataIndex[0]));
  const {
    0: { data: list },
  } = xlsx.parse(file.buffer);
  let titles;
  if (list?.length > 1) {
    titles = list.shift();
    const values = list.map((item) => transform({ record: item, titles, columns, fields: collectionFields }));
    console.log(values);

    ctx.body = await ctx.db.sequelize.transaction(async (transaction) => {
      await repository.createMany({
        records: values,
        transaction,
      });
    });
  } else {
    ctx.body = {
      result: 'ok',
    };
  }

  await next();
}
