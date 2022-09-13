import { Context, Next } from '@nocobase/actions';
import { Repository } from '@nocobase/database';
import xlsx from 'node-xlsx';
import { transform } from '../utils';

const IMPORT_LIMIT_COUNT = 10000;

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
  const failureData = list.splice(IMPORT_LIMIT_COUNT + 1);
  const titles = list.shift();
  if (list.length > 0 && titles?.length === columns.length) {
    const results = (
      await Promise.allSettled<any>(
        list.map(async (item) => {
          try {
            return await transform({ ctx, record: item, columns, fields: collectionFields });
          } catch (error) {
            failureData.unshift([...item, error.message]);
          }
        }),
      )
    ).filter((item) => 'value' in item && item.value !== undefined);
    //@ts-ignore
    const values = results.map((r) => r.value);
    const result = await ctx.db.sequelize.transaction(async (transaction) => {
      for (const [index, val] of values.entries()) {
        if (val === undefined || val === null) {
          continue;
        }
        try {
          await repository.create({
            values: { ...val },
            transaction,
          });
        } catch (error) {
          const failData = list[index];
          failData.push(error?.original?.message ?? error.message);
          failureData.unshift(failData);
        }
      }
      return {
        successCount: list.length - failureData.length,
        failureCount: failureData.length,
      };
    });
    const header = columns?.map((column) => column.defaultTitle);
    ctx.body = {
      rows: xlsx.build([
        {
          name: file.originalname,
          data: [header].concat(failureData),
        },
      ]),
      ...result,
    };
  } else {
    ctx.body = {
      rows: file.buffer.toJSON(),
      successCount: 0,
      failureCount: list?.length ?? 0,
    };
  }

  ctx.set({
    'Content-Type': 'application/octet-stream',
    // to avoid "invalid character" error in header (RFC)
    'Content-Disposition': `attachment; filename=${encodeURI('testTitle')}.xlsx`,
  });

  await next();
}
