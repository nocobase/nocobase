/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from './uid';

// @ts-ignore
import pkg from '../package.json';
import _ from 'lodash';

/**
 * 将多列布局转换为单列布局
 * @param {Object} schema - 输入的 JSON Schema 对象
 * @returns {Object} - 转换后的 JSON Schema 对象
 */
export const transformMultiColumnToSingleColumn = (schema: any): any => {
  if (!schema) return schema;

  if (schema['x-component'] !== 'Grid') {
    Object.keys(schema.properties || {}).forEach((key) => {
      schema.properties[key] = transformMultiColumnToSingleColumn(schema.properties[key]);
    });
    return schema;
  }

  schema = _.cloneDeep(schema);

  const newProperties: any = {};
  const { properties = {} } = schema;
  let index = 0;
  Object.keys(properties).forEach((key, rowIndex) => {
    const row = properties[key];

    if (row['x-component'] !== 'Grid.Row') {
      row['x-index'] = ++index;
      newProperties[key] = row;
      return;
    }

    // 忽略没有列的行
    if (!row.properties) {
      return;
    }

    // 如果一个行只有一列，那么无需展开
    if (Object.keys(row.properties).length === 1) {
      row['x-index'] = ++index;
      newProperties[key] = row;
      return;
    }

    // 如果一个行有多列，则保留第一列，其余的列需要放到外面形成新的行（每一行依然保持一列）
    Object.keys(row.properties).forEach((columnKey, colIndex) => {
      const column = row.properties[columnKey];
      _.set(column, 'x-component-props.width', 100);

      if (colIndex === 0) {
        row['x-index'] = ++index;
        newProperties[key] = row;
        return;
      }

      delete row.properties[columnKey];
      // 将列转换为行
      newProperties[`${uid()}_${columnKey}`] = createRow(column, columnKey, ++index);
    });
  });

  schema.properties = newProperties;
  return schema;
};

function createRow(column: any, key: string, index: number) {
  return {
    type: 'void',
    version: '2.0',
    'x-component': 'Grid.Row',
    'x-app-version': pkg.version,
    'x-uid': uid(),
    'x-async': false,
    'x-index': index,
    _isJSONSchemaObject: true,
    properties: {
      [key]: column,
    },
  };
}
