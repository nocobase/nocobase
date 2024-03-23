import { ISchema } from '@formily/react';

export const createListBlockSchema = (options: {
  dataSource: string;
  collectionName?: string;
  association?: string;
  templateSchema?: ISchema;
  rowKey?: string;
}): ISchema => {
  const { collectionName, dataSource, association, templateSchema, rowKey } = options;
  const resourceName = association || collectionName;

  return {
    type: 'void',
    'x-acl-action': `${resourceName}:view`,
    'x-decorator': 'List.Decorator',
    'x-use-decorator-props': 'useListBlockDecoratorProps',
    'x-decorator-props': {
      collection: collectionName,
      dataSource,
      association,
      readPretty: true,
      action: 'list',
      params: {
        pageSize: 10,
      },
      runWhenParamsChanged: true,
      rowKey,
    },
    'x-component': 'CardItem',
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:list',
    properties: {
      actionBar: {
        type: 'void',
        'x-initializer': 'list:configureActions',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 'var(--nb-spacing)',
          },
        },
        properties: {},
      },
      list: {
        type: 'array',
        'x-component': 'List',
        'x-component-props': {
          props: '{{ useListBlockProps }}',
        },
        properties: {
          item: {
            type: 'object',
            'x-component': 'List.Item',
            'x-read-pretty': true,
            'x-component-props': {
              useProps: '{{ useListItemProps }}',
            },
            properties: {
              grid: templateSchema || {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': 'details:configureFields',
                'x-initializer-props': {
                  useProps: '{{ useListItemInitializerProps }}',
                },
                properties: {},
              },
              actionBar: {
                type: 'void',
                'x-align': 'left',
                'x-initializer': 'list:configureItemActions',
                'x-component': 'ActionBar',
                'x-component-props': {
                  useProps: '{{ useListActionBarProps }}',
                  layout: 'one-column',
                },
                properties: {},
              },
            },
          },
        },
      },
    },
  };
};
