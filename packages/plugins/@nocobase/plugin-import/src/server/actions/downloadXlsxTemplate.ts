import { Context, Next } from '@nocobase/actions';
import xlsx from 'node-xlsx';

export async function downloadXlsxTemplate(ctx: Context, next: Next) {
  let { columns } = ctx.request.body as any;
  const { explain, title } = ctx.request.body as any;
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }
  const header = columns?.map((column) => column.defaultTitle);
  const data = [header];
  if (explain?.trim() !== '') {
    data.unshift([explain]);
  }

  ctx.body = xlsx.build([
    {
      name: 'Sheet 1',
      data,
      options: {},
    },
  ]);

  ctx.set({
    'Content-Type': 'application/octet-stream',
    // to avoid "invalid character" error in header (RFC)
    'Content-Disposition': `attachment; filename=${encodeURIComponent(title)}.xlsx`,
  });

  await next();
}
