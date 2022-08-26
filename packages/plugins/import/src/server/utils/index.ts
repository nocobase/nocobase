import { cloneDeep, set } from 'lodash';
import * as transforms from './transform';

function getTransform(name: string): Function {
  return transforms[name] || transforms._;
}

export function transform({ ctx, record, titles, columns, fields }) {
  const newRecord = {};
  record.forEach((cell, index) => {
    const title = titles[index];
    let { dataIndex } =
      columns.find((col) => {
        if (col.title) {
          if (col.title === title) {
            return true;
          }
        } else if (col.defaultTitle === title) {
          return true;
        }
        return false;
      }) ?? {};
    if (dataIndex?.length === 1) {
      const field = fields.find((f) => f.name === dataIndex[0]);
      const t = getTransform(field.options.interface);
      set(newRecord, dataIndex.join('.'), t({ ctx, value: cell, field }));
    } else if (dataIndex?.length > 1) {
      dataIndex = cloneDeep(dataIndex);
      const field = fields.find((f) => f.name === dataIndex[0]);
      const t = getTransform(field.options.interface);
      dataIndex.splice(0, 1, field.options.target);
      set(newRecord, dataIndex.join('.'), t({ ctx, value: cell, field }));
    }
  });
  return newRecord;
}
