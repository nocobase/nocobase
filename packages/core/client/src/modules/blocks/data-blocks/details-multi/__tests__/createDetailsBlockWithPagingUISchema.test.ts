import { createDetailsBlockWithPagingUISchema } from '../createDetailsBlockWithPagingUISchema';

vi.mock('@formily/shared', () => ({
  uid: vi.fn().mockReturnValue('mocked-uid'),
}));

describe('createDetailsBlockWithPagingUISchema', () => {
  it('should return the correct schema', () => {
    const schema = createDetailsBlockWithPagingUISchema({
      collectionName: 'users',
      dataSource: 'users',
      rowKey: 'id',
    });

    expect(schema).toEqual({
      type: 'void',
      'x-acl-action': 'users:view',
      'x-decorator': 'DetailsBlockProvider',
      'x-use-decorator-props': 'useDetailsBlockWithPagingDecoratorProps',
      'x-decorator-props': {
        dataSource: 'users',
        collection: 'users',
        association: undefined,
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
        'mocked-uid': {
          type: 'void',
          'x-component': 'Details',
          'x-read-pretty': true,
          'x-component-props': {
            useProps: '{{ useDetailsBlockWithPagingProps }}',
          },
          properties: {
            'mocked-uid': {
              type: 'void',
              'x-initializer': 'detailsWithPaging:configureActions',
              'x-component': 'ActionBar',
              'x-component-props': {
                style: {
                  marginBottom: 24,
                },
              },
              properties: {},
            },
            grid: {
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
    });
  });
});
