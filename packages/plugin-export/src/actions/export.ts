import xlsx from 'node-xlsx';
import { actions } from '@nocobase/actions';
import render from '../renders';

async function _export(ctx, next) {
  await actions.common.list(ctx, async () => {
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

    const fields = body.rows.length
      ? Object.keys(body.rows[0].get())
        .map(key => tableOptions.fields.find(({ name }) => name === key))
        .filter(item => item && !item.developerMode)
        .sort((a, b) => a.sort - b.sort)
      : [];

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
      'Content-Disposition': `attachment; filename=${encodeURI(tableOptions.title)}.xlsx`
    });
  });

  await next();
}

export default _export;
