import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export function createDetailsWithPaginationUISchema(options: {
  dataSource: string;
  rowKey: string;
  collectionName?: string;
  association?: string;
  templateSchema?: ISchema;
  hideActionInitializer?: boolean;
}): ISchema {
  const { collectionName, dataSource, association, templateSchema, hideActionInitializer, rowKey } = options;
  const resourceName = association || collectionName;

  if (!dataSource || !rowKey) {
    throw new Error('dataSource and rowKey are required');
  }

  return {
    type: 'void',
    'x-acl-action': `${resourceName}:view`,
    'x-decorator': 'DetailsBlockProvider',
    'x-use-decorator-props': 'useDetailsWithPaginationDecoratorProps',
    'x-decorator-props': {
      dataSource,
      collection: collectionName,
      association,
      readPretty: true,
      action: 'list',
      params: {
        pageSize: 1,
      },
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:detailsWithPagination',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Details',
        'x-read-pretty': true,
        'x-use-component-props': 'useDetailsWithPaginationProps',
        properties: {
          [uid()]: {
            type: 'void',
            'x-initializer': hideActionInitializer ? undefined : 'details:configureActions',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            properties: {},
          },
          grid: templateSchema || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'details:configureFields',
            properties: {},
          },
          pagination: {
            type: 'void',
            'x-component': 'Pagination',
            'x-use-component-props': 'useDetailsPaginationProps',
          },
        },
      },
    },
  };
}
