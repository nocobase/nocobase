import { createTableBlockUISchema } from '../createTableBlockUISchema';

describe('createTableBLockSchemaV2', () => {
  it('should create a default table block schema with minimum options', () => {
    const options = { dataSource: 'abc', collectionName: 'users', association: 'users.roles', rowKey: 'rowKey' };
    const schema = createTableBlockUISchema(options);

    expect(schema).toEqual({
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-acl-action': 'users:list',
      'x-use-decorator-props': 'useTableBlockDecoratorProps',
      'x-decorator-props': {
        collection: 'users',
        dataSource: 'abc',
        association: 'users.roles',
        action: 'list',
        params: {
          pageSize: 20,
        },
        rowKey: 'rowKey',
        showIndex: true,
        dragSort: false,
      },
      'x-toolbar': 'BlockSchemaToolbar',
      'x-settings': 'blockSettings:table',
      'x-component': 'CardItem',
      'x-filter-targets': [],
      properties: expect.any(Object), // since uid() generates a unique value every time, we check for any Object.
    });
  });

  it('should handle custom dataSource, rowKey, and collectionName', () => {
    const options = {
      collectionName: 'products',
      dataSource: 'productDataSource',
      rowKey: 'productId',
      association: 'productAssociation.name',
    };
    const schema = createTableBlockUISchema(options);

    expect(schema['x-decorator-props']).toEqual(
      expect.objectContaining({
        collection: 'products',
        dataSource: 'productDataSource',
        rowKey: 'productId',
        association: 'productAssociation.name',
      }),
    );
  });
});
