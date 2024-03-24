import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export const createTableSelectorUISchema = (options: {
  collectionName: string;
  dataSource: string;
  rowKey: string;
}): ISchema => {
  const { collectionName, dataSource, rowKey } = options;

  if (!collectionName || !dataSource || !rowKey) {
    throw new Error('collectionName, dataSource, rowKey is required');
  }

  return {
    type: 'void',
    'x-acl-action': `${collectionName}:list`,
    'x-decorator': 'TableSelectorProvider',
    'x-use-decorator-props': 'useTableSelectorDecoratorProps',
    'x-decorator-props': {
      collection: collectionName,
      dataSource,
      action: 'list',
      params: {
        pageSize: 20,
      },
      rowKey,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:tableSelector',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-initializer': 'table:configureActions',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 'var(--nb-spacing)',
          },
        },
      },
      value: {
        type: 'array',
        'x-initializer': 'table:configureColumns',
        'x-component': 'TableV2.Selector',
        'x-use-component-props': 'useTableSelectorProps',
        'x-component-props': {
          rowSelection: {
            type: 'checkbox',
          },
        },
      },
    },
  };
};
