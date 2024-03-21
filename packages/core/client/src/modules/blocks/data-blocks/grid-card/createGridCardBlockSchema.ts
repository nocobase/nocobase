import { ISchema } from '@formily/react';

export const createGridCardBlockSchema = (options: {
  collectionName: string;
  dataSource: string;
  association?: string;
  templateSchema?: ISchema;
  rowKey?: string;
}): ISchema => {
  const { collectionName, association, templateSchema, dataSource, rowKey } = options;
  const resourceName = association || collectionName;

  if (!collectionName || !dataSource) {
    throw new Error('collectionName and dataSource are required');
  }

  return {
    type: 'void',
    'x-acl-action': `${resourceName}:view`,
    'x-decorator': 'GridCard.Decorator',
    'x-use-decorator-props': 'useGridCardBlockDecoratorProps',
    'x-decorator-props': {
      collection: collectionName,
      association,
      dataSource,
      readPretty: true,
      action: 'list',
      params: {
        pageSize: 12,
      },
      runWhenParamsChanged: true,
      rowKey,
    },
    'x-component': 'BlockItem',
    'x-component-props': {
      useProps: '{{ useGridCardBlockItemProps }}',
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:gridCard',
    properties: {
      actionBar: {
        type: 'void',
        'x-initializer': 'gridCard:configureActions',
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
        'x-component': 'GridCard',
        'x-component-props': {
          useProps: '{{ useGridCardBlockProps }}',
        },
        properties: {
          item: {
            type: 'object',
            'x-component': 'GridCard.Item',
            'x-read-pretty': true,
            'x-component-props': {
              useProps: '{{ useGridCardItemProps }}',
            },
            properties: {
              grid: templateSchema || {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': 'details:configureFields',
                'x-initializer-props': {
                  useProps: '{{ useGridCardItemInitializerProps }}',
                },
                properties: {},
              },
              actionBar: {
                type: 'void',
                'x-align': 'left',
                'x-initializer': 'gridCard:configureItemActions',
                'x-component': 'ActionBar',
                'x-component-props': {
                  useProps: '{{ useGridCardActionBarProps }}',
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
