import lodash from 'lodash';
import * as transforms from './transform';

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
