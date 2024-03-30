import { createCalendarBlockUISchema } from '../schema-initializer/createCalendarBlockUISchema';

vi.mock('@formily/shared', async () => {
  const actual = await vi.importActual('@formily/shared');
  return {
    ...actual,
    uid: () => 'mocked-uid',
  };
});

describe('createCalendarBlockSchema', () => {
  it('should return the correct schema', () => {
    const options = {
      collectionName: 'users',
      dataSource: 'events',
      fieldNames: {
        title: 'title',
        startDate: 'start_date',
        endDate: 'end_date',
      },
      association: 'users.roles',
    };

    const schema = createCalendarBlockUISchema(options);

    expect(schema).toMatchInlineSnapshot(`
      {
        "properties": {
          "mocked-uid": {
            "properties": {
              "event": {
                "properties": {
                  "drawer": {
                    "properties": {
                      "tabs": {
                        "properties": {
                          "tab1": {
                            "properties": {
                              "grid": {
                                "type": "void",
                                "x-component": "Grid",
                                "x-initializer": "popup:common:addBlock",
                                "x-initializer-props": {
                                  "actionInitializers": "details:configureActions",
                                },
                              },
                            },
                            "title": "{{t('Details', { ns: 'calendar' })}}",
                            "type": "void",
                            "x-component": "Tabs.TabPane",
                            "x-component-props": {},
                            "x-designer": "Tabs.Designer",
                          },
                        },
                        "type": "void",
                        "x-component": "Tabs",
                        "x-component-props": {},
                        "x-initializer": "TabPaneInitializers",
                        "x-initializer-props": {
                          "gridInitializer": "popup:common:addBlock",
                        },
                      },
                    },
                    "title": "{{t('View record', { ns: 'calendar' })}}",
                    "type": "void",
                    "x-component": "Action.Drawer",
                    "x-component-props": {
                      "className": "nb-action-popup",
                    },
                  },
                },
                "type": "void",
                "x-component": "CalendarV2.Event",
              },
              "toolBar": {
                "type": "void",
                "x-component": "CalendarV2.ActionBar",
                "x-component-props": {
                  "style": {
                    "marginBottom": 24,
                  },
                },
                "x-initializer": "calendar:configureActions",
              },
            },
            "type": "void",
            "x-component": "CalendarV2",
            "x-use-component-props": "useCalendarBlockProps",
          },
        },
        "type": "void",
        "x-acl-action": "users.roles:list",
        "x-component": "CardItem",
        "x-decorator": "CalendarBlockProvider",
        "x-decorator-props": {
          "action": "list",
          "association": "users.roles",
          "collection": "users",
          "dataSource": "events",
          "fieldNames": {
            "endDate": "end_date",
            "id": "id",
            "startDate": "start_date",
            "title": "title",
          },
          "params": {
            "paginate": false,
          },
        },
        "x-settings": "blockSettings:calendar",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useCalendarBlockDecoratorProps",
      }
    `);
  });
});
