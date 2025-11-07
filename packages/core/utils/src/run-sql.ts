/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getLiquidContext } from './liquidjs';

export function parseSQLBindParams(template: string) {
  let index = 1;
  const bind = {};

  const sql = template.replace(/{{\s*([^}]+)\s*}}/g, (_, expr) => {
    const key = `__var${index}`;
    bind[key] = `{{${expr.trim()}}}`;
    index++;
    return `$${key}`;
  });

  return { sql, bind };
}

export async function transformSQL(template: string) {
  const { sql, bind } = parseSQLBindParams(template);
  const liquidContext = await getLiquidContext(sql);
  return { sql, bind, liquidContext };
}
