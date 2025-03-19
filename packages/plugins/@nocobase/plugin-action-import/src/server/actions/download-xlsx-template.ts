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
import { Workbook } from 'exceljs';

export async function downloadXlsxTemplate(ctx: Context, next: Next) {
  const { resourceName, values = {} } = ctx.action.params;
  const { collection } = ctx.db;

  const templateCreator = new TemplateCreator({
    collection,
    ...values,
  });

  const workbook = await templateCreator.run();

  const buffer = await (workbook as Workbook).xlsx.writeBuffer();

  ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  ctx.set('Content-Disposition', `attachment; filename="${resourceName}-import-template.xlsx"`);
  ctx.body = buffer;

  await next();
}
