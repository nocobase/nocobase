/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import * as transforms from './transform';
export * from './logger-utils';

function getTransform(name: string): Function {
  return transforms[name] || transforms._;
}

export async function transform({ ctx, record, columns, fields }) {
  const newRecord = {};
  for (let index = 0, iLen = record.length; index < iLen; index++) {
    const cell = record[index];
    const column = columns[index] ?? {};
    const { dataIndex } = column;
    const field = fields.find((f) => f.name === dataIndex[0]);
    const t = getTransform(field.options.interface);
    const value = await t({ ctx, column, value: cell, field });
    lodash.set(newRecord, dataIndex[0], value);
  }
  return newRecord;
}
