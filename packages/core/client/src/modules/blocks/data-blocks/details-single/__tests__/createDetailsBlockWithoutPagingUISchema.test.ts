import { createDetailsUISchema } from '../createDetailsUISchema';

// Mock uid to always return a fixed value
vi.mock('@formily/shared', () => ({
  uid: () => 'fixed-uid',
}));

describe('createDetailsBlockWithoutPagingUISchema', () => {
  it('should create a valid schema with mandatory fields', () => {
    const options = {
      collectionName: 'users',
      dataSource: 'usersDataSource',
    };

    const result = createDetailsUISchema(options);
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
            "x-read-pretty": true,
            "x-use-component-props": "useDetailsProps",
          },
        },
        "type": "void",
        "x-acl-action": "users:get",
        "x-component": "CardItem",
        "x-decorator": "DetailsBlockProvider",
        "x-decorator-props": {
          "action": "get",
          "association": undefined,
          "collection": "users",
          "dataSource": "usersDataSource",
          "readPretty": true,
        },
        "x-settings": "blockSettings:details",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useDetailsDecoratorProps",
      }
    `);
  });
});
