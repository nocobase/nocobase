import { createDetailsBlockWithoutPagingUISchema } from '../createDetailsBlockWithoutPagingUISchema';

// Mock uid to always return a fixed value
vi.mock('@formily/shared', () => ({
  uid: () => 'fixed-uid',
}));

describe('createDetailsBlockWithoutPagingUISchema', () => {
  it('should throw an error when collectionName is missing', () => {
    const options = { dataSource: 'someDataSource' };

    // @ts-ignore
    expect(() => createDetailsBlockWithoutPagingUISchema(options)).toThrowError(
      'collectionName and dataSource are required',
    );
  });

  it('should throw an error when dataSource is missing', () => {
    const options = { collectionName: 'someCollectionName' };

    // @ts-ignore
    expect(() => createDetailsBlockWithoutPagingUISchema(options)).toThrowError(
      'collectionName and dataSource are required',
    );
  });

  it('should create a valid schema with mandatory fields', () => {
    const options = {
      collectionName: 'users',
      dataSource: 'usersDataSource',
    };

    const result = createDetailsBlockWithoutPagingUISchema(options);
    expect(result).toMatchInlineSnapshot(`
      {
        "properties": {
          "fixed-uid": {
            "properties": {
              "fixed-uid": {
                "properties": {},
                "type": "void",
                "x-component": "ActionBar",
                "x-component-props": {
                  "style": {
                    "marginBottom": 24,
                  },
                },
                "x-initializer": "details:configureActions",
              },
              "grid": {
                "properties": {},
                "type": "void",
                "x-component": "Grid",
                "x-initializer": "details:configureFields",
              },
            },
            "type": "void",
            "x-component": "Details",
            "x-component-props": {
              "useProps": "{{ useDetailsBlockWithoutPagingProps }}",
            },
            "x-read-pretty": true,
          },
        },
        "type": "void",
        "x-acl-action": "users:get",
        "x-component": "CardItem",
        "x-decorator": "DetailsBlockProvider",
        "x-decorator-props": {
          "action": "list",
          "association": undefined,
          "collection": "users",
          "dataSource": "usersDataSource",
          "readPretty": true,
        },
        "x-settings": "blockSettings:singleDataDetails",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useDetailsBlockWithoutPagingDecoratorProps",
      }
    `);
  });
});
