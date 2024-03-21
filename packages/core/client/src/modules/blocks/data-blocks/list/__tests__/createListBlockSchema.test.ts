import { createListBlockSchema } from '../createListBlockSchema';

describe('createListBlockSchema', () => {
  test('should return the correct schema', () => {
    const options = {
      collectionName: 'users',
      dataSource: 'users',
      association: 'user',
      templateSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'number',
          },
        },
      },
      rowKey: 'id',
    };

    const schema = createListBlockSchema(options);

    expect(schema).toEqual({
      type: 'void',
      'x-acl-action': 'user:view',
      'x-decorator': 'List.Decorator',
      'x-decorator-props': {
        collection: 'users',
        dataSource: 'users',
        association: 'user',
        readPretty: true,
        action: 'list',
        params: {
          pageSize: 10,
        },
        runWhenParamsChanged: true,
        rowKey: 'id',
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
                grid: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    age: {
                      type: 'number',
                    },
                  },
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
    });
  });
});
