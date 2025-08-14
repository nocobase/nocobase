/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sql } from 'mssql';

export function filterToSql(filter: any, request: sql.Request) {
  const where = [];
  const operatorMap = {
    $eq: '=',
    $ne: '!=',
    $gt: '>',
    $gte: '>=',
    $lt: '<',
    $lte: '<=',
    $in: 'IN',
    $like: 'LIKE',
  };

  for (const key in filter) {
    if (key === '$and') {
      const and = filter[key].map((item) => filterToSql(item, request)).join(' AND ');
      where.push(`(${and})`);
    } else if (key === '$or') {
      const or = filter[key].map((item) => filterToSql(item, request)).join(' OR ');
      where.push(`(${or})`);
    } else {
      const value = filter[key];
      if (typeof value === 'object' && value !== null) {
        for (const op in value) {
          if (op === '$in') {
            const values = value[op];
            if (Array.isArray(values) && values.length > 0) {
              const paramNames = [];
              for (const v of values) {
                const paramName = `param${Object.keys(request.parameters).length}`;
                request.input(paramName, v);
                paramNames.push(`@${paramName}`);
              }
              where.push(`${key} IN (${paramNames.join(', ')})`);
            } else {
              where.push(`1=0`);
            }
          } else {
            const paramName = `param${Object.keys(request.parameters).length}`;
            request.input(paramName, value[op]);
            where.push(`${key} ${operatorMap[op]} @${paramName}`);
          }
        }
      } else {
        const paramName = `param${Object.keys(request.parameters).length}`;
        request.input(paramName, value);
        where.push(`${key} = @${paramName}`);
      }
    }
  }
  return where.join(' AND ');
}
