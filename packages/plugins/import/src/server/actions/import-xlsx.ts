import { Context, Next } from '@nocobase/actions';
import { Repository } from '@nocobase/database';
import xlsx from 'node-xlsx';

export async function importXlsx(ctx: Context, next: Next) {
  let { fields, except } = ctx.action.params;
  let { columns } = ctx.request.body;
  const { ['file']: file, storage } = ctx;
  const { resourceName, resourceOf } = ctx.action;
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }
  columns = columns?.filter((col) => col?.dataIndex?.length > 0);
  const list = xlsx.parse(file.buffer);
  const repository = ctx.db.getRepository<any>(resourceName, resourceOf) as Repository;

  ctx.body = {
    result: 'ok',
  };

  await next();
}
