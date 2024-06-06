/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { TemplateCreator } from '../services/template-creator';
import XLSX from 'xlsx';

export async function downloadXlsxTemplate(ctx: Context, next: Next) {
  let { columns } = ctx.request.body as any;
  const { explain, title } = ctx.request.body as any;
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }

  const templateCreator = new TemplateCreator({
    explain,
    title,
    columns,
  });

  const workbook = await templateCreator.run();

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  ctx.body = buffer;

  ctx.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename=${encodeURIComponent(title)}.xlsx`,
  });

  await next();
}
