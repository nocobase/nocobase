import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { generateNTemplate } from '../../locale';

export const createCalendarBlockSchema = (options) => {
  const { collection, resource, fieldNames, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resource || collection}:list`,
    'x-decorator': 'CalendarBlockProvider',
    'x-decorator-props': {
      collection: collection,
      resource: resource || collection,
      action: 'list',
      fieldNames: {
        id: 'id',
        ...fieldNames,
      },
      params: {
        paginate: false,
      },
      ...others,
    },
    'x-designer': 'CalendarV2.Designer',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'CalendarV2',
        'x-component-props': {
          useProps: '{{ useCalendarBlockProps }}',
        },
        properties: {
          toolBar: {
            type: 'void',
            'x-component': 'CalendarV2.ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            'x-initializer': 'CalendarActionInitializers',
            properties: {},
          },
          event: {
            type: 'void',
            'x-component': 'CalendarV2.Event',
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Drawer',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                title: generateNTemplate('View record'),
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    'x-initializer-props': {
                      gridInitializer: 'RecordBlockInitializers',
                    },
                    properties: {
                      tab1: {
                        type: 'void',
                        title: generateNTemplate('Details'),
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer-props': {
                              actionInitializers: 'CalendarFormActionInitializers',
                            },
                            'x-initializer': 'RecordBlockInitializers',
                            properties: {},
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  console.log(JSON.stringify(schema, null, 2));
  return schema;
};
