import { createFilterFormBlockSchema } from '../createFilterFormBlockSchema';

vi.mock('@formily/shared', () => {
  return {
    uid: () => 'mocked-uid',
  };
});

describe('createFilterFormBlockSchema', () => {
  test('should return the correct schema', () => {
    const schema = createFilterFormBlockSchema({
      collectionName: 'myCollection',
      dataSource: 'myDataSource',
      templateSchema: { type: 'string' },
    });

    expect(schema).toEqual({
      type: 'void',
      'x-decorator': 'FilterFormBlockProvider',
      'x-use-decorator': 'useFilterFormBlockDecoratorProps',
      'x-decorator-props': {
        dataSource: 'myDataSource',
        collection: 'myCollection',
      },
      'x-toolbar': 'BlockSchemaToolbar',
      'x-settings': 'blockSettings:filterForm',
      'x-component': 'CardItem',
      'x-filter-targets': [],
      'x-filter-operators': {},
      properties: {
        'mocked-uid': {
          type: 'void',
          'x-component': 'FormV2',
          'x-component-props': {
            useProps: '{{ useFilterFormBlockProps }}',
          },
          properties: {
            grid: { type: 'string' },
            'mocked-uid': {
              type: 'void',
              'x-initializer': 'filterForm:configureActions',
              'x-component': 'ActionBar',
              'x-component-props': {
                layout: 'one-column',
                style: {
                  float: 'right',
                },
              },
            },
          },
        },
      },
    });
  });

  test('should return the correct schema without templateSchema', () => {
    const schema = createFilterFormBlockSchema({
      collectionName: 'myCollection',
      dataSource: 'myDataSource',
    });

    expect(schema).toEqual({
      type: 'void',
      'x-decorator': 'FilterFormBlockProvider',
      'x-use-decorator': 'useFilterFormBlockDecoratorProps',
      'x-decorator-props': {
        dataSource: 'myDataSource',
        collection: 'myCollection',
      },
      'x-toolbar': 'BlockSchemaToolbar',
      'x-settings': 'blockSettings:filterForm',
      'x-component': 'CardItem',
      'x-filter-targets': [],
      'x-filter-operators': {},
      properties: {
        'mocked-uid': {
          type: 'void',
          'x-component': 'FormV2',
          'x-component-props': {
            useProps: '{{ useFilterFormBlockProps }}',
          },
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'filterForm:configureFields',
            },
            'mocked-uid': {
              type: 'void',
              'x-initializer': 'filterForm:configureActions',
              'x-component': 'ActionBar',
              'x-component-props': {
                layout: 'one-column',
                style: {
                  float: 'right',
                },
              },
            },
          },
        },
      },
    });
  });
});
