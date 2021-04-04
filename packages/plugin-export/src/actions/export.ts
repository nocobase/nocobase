import xlsx from 'node-xlsx';
import { actions } from '@nocobase/actions';

async function _export(ctx: actions.Context, next: actions.Next) {
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
    const { title, fields } = table.getOptions();

    ctx.body = xlsx.build([{
      name: title,
      data: [
        fields.map(field => field.title),
        ...body.rows.map(row => fields.map(field => row.get(field.name)))
      ]
    }]);

    ctx.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${title}.xlsx`
    });
  });
  
  await next();
}

export default _export;
