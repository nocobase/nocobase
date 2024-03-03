import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useCompile, useCollection_deprecated } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const useGanttTranslation = () => {
  return useTranslation('gantt');
};
export const useOptions = (type = 'string') => {
  const compile = useCompile();
  const { fields } = useCollection_deprecated();
  const options = fields
    ?.filter((field) => field.type === type)
    ?.map((field) => {
      return {
        value: field.name,
        label: compile(field?.uiSchema?.title),
      };
    });
  return options;
};
export const createGanttBlockSchema = (options) => {
  const { collection, resource, fieldNames, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resource || collection}:list`,
    'x-decorator': 'GanttBlockProvider',
    'x-decorator-props': {
      collection: collection,
      resource: resource || collection,
      action: 'list',
      fieldNames: {
        ...fieldNames,
      },
      params: {
        paginate: false,
      },
      ...others,
    },
    'x-designer': 'Gantt.Designer',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Gantt',
        'x-component-props': {
          useProps: '{{ useGanttBlockProps }}',
        },
        properties: {
          toolBar: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            'x-initializer': 'GanttActionInitializers',
            properties: {},
          },
          table: {
            type: 'array',
            'x-decorator': 'div',
            'x-decorator-props': {
              style: {
                float: 'left',
                maxWidth: '35%',
              },
            },

            'x-initializer': 'TableColumnInitializers',
            'x-component': 'TableV2',
            'x-component-props': {
              rowKey: 'id',
              rowSelection: {
                type: 'checkbox',
              },
              useProps: '{{ useTableBlockProps }}',
              pagination: false,
            },
            properties: {
              actions: {
                type: 'void',
                title: '{{ t("Actions") }}',
                'x-action-column': 'actions',
                'x-decorator': 'TableV2.Column.ActionBar',
                'x-component': 'TableV2.Column',
                'x-designer': 'TableV2.ActionColumnDesigner',
                'x-initializer': 'TableActionColumnInitializers',
                properties: {
                  actions: {
                    type: 'void',
                    'x-decorator': 'DndContext',
                    'x-component': 'Space',
                    'x-component-props': {
                      split: '|',
                    },
                    properties: {},
                  },
                },
              },
            },
          },
          detail: {
            type: 'void',
            'x-component': 'Gantt.Event',
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Drawer',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                title: '{{ t("View record") }}',
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '{{t("Details")}}',
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
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

  return schema;
};
