import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export function createDetailsBlockWithPagingUISchema(options: {
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
    'x-use-decorator-props': 'useDetailsBlockWithPagingDecoratorProps',
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
    'x-settings': 'blockSettings:multiDataDetails',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Details',
        'x-read-pretty': true,
        'x-component-props': {
          useProps: '{{ useDetailsBlockWithPagingProps }}',
        },
        properties: {
          [uid()]: {
            type: 'void',
            'x-initializer': hideActionInitializer ? undefined : 'detailsWithPaging:configureActions',
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
            'x-component-props': {
              useProps: '{{ useDetailsPaginationProps }}',
            },
          },
        },
      },
    },
  };
}
