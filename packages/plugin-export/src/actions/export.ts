import xlsx from 'node-xlsx';
import { actions, Context, Next } from '@nocobase/actions';
import render from '../renders';

async function _export(ctx: Context, next: Next) {
  let { columns } = ctx.action.params;
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }
  ctx.action.mergeParams({
    'fields[appends]': columns.map((column: any) => column.name).join(','),
  }, {
    payload: 'replace',
  });
  console.log({ columns });
  await actions.list(ctx, async () => {
    const {
      db,
      action: {
        params: {
          resourceName
        }
      },
      body,
    } = ctx;

    const table = db.getTable(resourceName);
    const tableOptions = table.getOptions();

    let fields = body.rows.length
      ? Object.keys(body.rows[0].get())
        .map(key => tableOptions.fields.find(({ name }) => name === key))
        .filter(item => item && !item.developerMode)
        .sort((a, b) => a.sort - b.sort)
      : [];

    if (columns && columns.length) {
      fields = columns.map(column => {
        const field = table.getField(column.name);
        return {
          ...field.options,
          ...column,
        };
      });
    }

    const { rows, ranges } = render({
      fields,
      data: body.rows
    }, ctx);

    ctx.body = xlsx.build([{
      name: tableOptions.title,
      data: rows,
      options: {
        '!merges': ranges
      }
    }]);

    ctx.set({
      'Content-Type': 'application/octet-stream',
      // to avoid "invalid character" error in header (RFC)
      'Content-Disposition': `attachment; filename=${encodeURI(tableOptions.title||tableOptions.name)}.xlsx`
    });
  });

  await next();
}

export default _export;
