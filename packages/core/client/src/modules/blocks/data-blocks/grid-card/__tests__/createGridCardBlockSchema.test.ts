import { createGridCardBlockSchema } from '../createGridCardBlockSchema';

describe('createGridCardBlockSchema', () => {
  test('should return the correct schema', () => {
    const options = {
      collectionName: 'testCollection',
      dataSource: 'testDataSource',
      association: 'testAssociation',
      templateSchema: { type: 'string' },
      rowKey: 'testRowKey',
    };

    const schema = createGridCardBlockSchema(options);

    expect(schema).toEqual({
      type: 'void',
      'x-acl-action': 'testAssociation:view',
      'x-decorator': 'GridCard.Decorator',
      'x-use-decorator-props': 'useGridCardBlockDecoratorProps',
      'x-decorator-props': {
        collection: 'testCollection',
        association: 'testAssociation',
        dataSource: 'testDataSource',
        readPretty: true,
        action: 'list',
        params: {
          pageSize: 12,
        },
        runWhenParamsChanged: true,
        rowKey: 'testRowKey',
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
                grid: { type: 'string' },
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
    });
  });

  test('should return the correct schema when templateSchema is empty', () => {
    const options = {
      collectionName: 'testCollection',
      dataSource: 'testDataSource',
      association: 'testAssociation',
      rowKey: 'testRowKey',
    };

    const schema = createGridCardBlockSchema(options);

    expect(schema).toEqual({
      type: 'void',
      'x-acl-action': 'testAssociation:view',
      'x-decorator': 'GridCard.Decorator',
      'x-use-decorator-props': 'useGridCardBlockDecoratorProps',
      'x-decorator-props': {
        collection: 'testCollection',
        association: 'testAssociation',
        dataSource: 'testDataSource',
        readPretty: true,
        action: 'list',
        params: {
          pageSize: 12,
        },
        runWhenParamsChanged: true,
        rowKey: 'testRowKey',
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
                grid: {
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
    });
  });
});
