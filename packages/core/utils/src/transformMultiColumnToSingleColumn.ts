/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from './uid';
import _ from 'lodash';

// @ts-ignore
import pkg from '../package.json';

/**
 * 将多列布局转换为单列布局
 * @param {Object} schema - 输入的 JSON Schema 对象
 * @returns {Object} - 转换后的 JSON Schema 对象
 */
export const transformMultiColumnToSingleColumn = (schema: any): any => {
  // 深拷贝原始 schema，避免修改原始数据
  const result = JSON.parse(JSON.stringify(schema));

  // 遍历所有 Grid.Row
  if (result.properties) {
    // 记录需要删除的空行
    const keysToDelete = [];

    // 处理每一行
    Object.entries(result.properties).forEach(([rowKey, rowValue]: any) => {
      // 检查是否是 Grid.Row 组件
      if (rowValue && rowValue['x-component'] === 'Grid.Row') {
        // 检查是否有 properties
        if (!rowValue.properties || Object.keys(rowValue.properties).length === 0) {
          // 记录空行，稍后删除
          keysToDelete.push(rowKey);
          return;
        }

        // 获取所有列
        const columns = Object.values(rowValue.properties).filter((col) => col['x-component'] === 'Grid.Col');

        // 如果只有一列，不需要进行处理
        if (columns.length <= 1) {
          return;
        }

        // 保留第一列，将其余列的内容移到新的行中
        const firstColumn: any = columns[0];

        // 重置第一列的宽度
        _.set(firstColumn, 'x-component-props.width', 100);

        // 从第二列开始处理
        for (let i = 1; i < columns.length; i++) {
          const column: any = columns[i];

          // 创建新的行
          const newRowKey = `row_${uid()}`;
          const newColKey = `col_${uid()}`;

          // 创建新行并添加到 result.properties 中
          result.properties[newRowKey] = {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': rowValue['x-app-version'] || pkg.version,
            properties: {
              [newColKey]: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': column['x-app-version'] || pkg.version,
                properties: { ...column.properties },
                'x-uid': uid(),
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': uid(),
            'x-async': false,
            'x-index': Object.keys(result.properties).length + 1,
          };

          // 从原始行的 properties 中删除该列
          delete rowValue.properties[
            Object.keys(rowValue.properties).find((key) => rowValue.properties[key] === column)
          ];
        }
      }
    });

    // 删除空行
    keysToDelete.forEach((key) => delete result.properties[key]);

    // 重新调整所有行的 x-index
    const rows = Object.values(result.properties).filter((prop) => prop['x-component'] === 'Grid.Row');

    rows.forEach((row, index) => {
      row['x-index'] = index + 1;
    });
  }

  return result;
};
