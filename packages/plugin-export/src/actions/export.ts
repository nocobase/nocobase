import xlsx from 'node-xlsx';
import { actions } from '@nocobase/actions';
import getInterfaceRender from '../renders';

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
        ...body.rows.map(row => fields.map(field => {
          const render = getInterfaceRender(field.interface);
          return render(field, row);
        }))
      ]
    }]);

    ctx.set({
      'Content-Type': 'application/octet-stream',
      // to avoid "invalid character" error in header (RFC)
      'Content-Disposition': `attachment; filename=${encodeURI(title)}.xlsx`
    });
  });
  
  await next();
}

export default _export;
