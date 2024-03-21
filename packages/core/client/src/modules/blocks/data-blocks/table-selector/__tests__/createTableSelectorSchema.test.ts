import { createTableSelectorSchema } from '../createTableSelectorSchema';

vi.mock('@formily/shared', () => {
  return {
    uid: () => 'mocked-uid',
  };
});

describe('createTableSelectorSchema', () => {
  test('should return the correct schema', () => {
    const schema = createTableSelectorSchema({
      collectionName: 'example',
      dataSource: 'example',
      rowKey: 'id',
    });

    expect(schema).toEqual({
      type: 'void',
      'x-acl-action': 'example:list',
      'x-decorator': 'TableSelectorProvider',
      'x-use-decorator-props': 'useTableSelectorDecoratorProps',
      'x-decorator-props': {
        collection: 'example',
        dataSource: 'example',
        action: 'list',
        params: {
          pageSize: 20,
        },
        rowKey: 'id',
      },
      'x-toolbar': 'BlockSchemaToolbar',
      'x-settings': 'blockSettings:tableSelector',
      'x-component': 'CardItem',
      properties: {
        'mocked-uid': {
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
          'x-component-props': {
            rowSelection: {
              type: 'checkbox',
            },
            useProps: '{{ useTableSelectorProps }}',
          },
        },
      },
    });
  });
});
