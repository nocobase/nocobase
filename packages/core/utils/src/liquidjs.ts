/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Liquid } from 'liquidjs';
const liquid = new Liquid();

export function transformLiquidContext(paths = []) {
  const result = {};

  for (const fullPath of paths) {
    const path = fullPath.replace(/^ctx\./, '');
    const keys = path.split('.');

    let current = result;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const isLast = i === keys.length - 1;

      if (isLast) {
        current[key] = `{{${fullPath}}}`;
      } else {
        current[key] = current[key] || {};
        current = current[key];
      }
    }
  }

  return result;
}

export async function getLiquidContext(template: string) {
  const vars = await liquid.fullVariables(template);
  return transformLiquidContext(vars);
}

export async function parseLiquidContext(template: string, liquidContext: any) {
  return await liquid.parseAndRender(template, { ctx: liquidContext });
}
