import { CreateFormBlockUISchemaOptions, createCreateFormBlockUISchema } from '../createCreateFormBlockUISchema';

vi.mock('@formily/shared', () => {
  return {
    uid: () => 'mocked-uid',
  };
});

describe('createCreateFormBlockUISchema', () => {
  it('should create a schema with all options', () => {
    const options: CreateFormBlockUISchemaOptions = {
      collectionName: 'users',
      dataSource: 'userDataSource',
      association: 'userAssociation',
      templateSchema: { type: 'string' },
      isCusomeizeCreate: true,
    };

    const result = createCreateFormBlockUISchema(options);
    expect(result).toMatchInlineSnapshot(`
      {
        "properties": {
          "mocked-uid": {
            "properties": {
              "grid": {
                "type": "string",
              },
              "mocked-uid": {
                "type": "void",
                "x-component": "ActionBar",
                "x-component-props": {
                  "layout": "one-column",
                  "style": {
                    "marginTop": 24,
                  },
                },
                "x-initializer": "createForm:configureActions",
              },
            },
            "type": "void",
            "x-component": "FormV2",
            "x-use-component-props": "useCreateFormBlockProps",
          },
        },
        "type": "void",
        "x-acl-action": "userAssociation:create",
        "x-acl-action-props": {
          "skipScopeCheck": true,
        },
        "x-component": "CardItem",
        "x-decorator": "FormBlockProvider",
        "x-decorator-props": {
          "association": "userAssociation",
          "collection": "users",
          "dataSource": "userDataSource",
          "isCusomeizeCreate": true,
        },
        "x-settings": "blockSettings:createForm",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useCreateFormBlockDecoratorProps",
      }
    `);
  });
});
