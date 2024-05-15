/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { TableProps } from 'antd';
import { ISchema } from '@formily/json-schema';

import { AllDataBlockProps } from '../../data-source';
import { useTableBlockProps } from '../../modules/blocks/data-blocks/table';
import { SchemaComponent } from '../../schema-component';

interface CreateTableBlockOptions {
  collectionName: string;
  columns: Record<string, Record<string, any>>;
  tableProps?: TableProps<any>;
  tableBlockProps?: Partial<AllDataBlockProps>;
}

export const createTableBlock = (options: CreateTableBlockOptions) => {
  const { collectionName, columns, tableProps = {}, tableBlockProps = {} } = options;

  const getTableColumns = (columns: CreateTableBlockOptions['columns']) => {
    return Object.keys(columns).reduce((acc, fieldName) => {
      acc[fieldName] = {
        type: 'void',
        'x-decorator': 'TableV2.Column.Decorator',
        'x-component': 'TableV2.Column',
        properties: {
          [fieldName]: {
            type: 'string',
            'x-component': 'CollectionField',
            'x-pattern': 'readPretty',
            'x-component-props': columns[fieldName],
          },
        },
      };
      return acc;
    }, {});
  };

  const schema: ISchema = {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-decorator': 'TableBlockProvider',
        'x-decorator-props': {
          collection: collectionName,
          action: 'list',
          showIndex: true,
          dragSort: false,
          ...tableBlockProps,
        },
        properties: {
          table: {
            type: 'array',
            'x-component': 'TableV2',
            'x-use-component-props': useTableBlockProps, // 自动注入 Table 所需的 props
            'x-component-props': {
              rowKey: 'id',
              rowSelection: {
                type: 'checkbox',
              },
              ...tableProps,
            },
            properties: getTableColumns(columns),
          },
        },
      },
    },
  };

  const TableBlockComponent = () => {
    return <SchemaComponent schema={schema} />;
  };

  return TableBlockComponent;
};
