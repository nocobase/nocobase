import { ISchema } from '@formily/react';
import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCurrentSchema } from '../utils';

export const SubTableFieldInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema(
    item.schema['x-collection-field'],
    'x-collection-field',
    item.find,
    item.remove,
  );
  return (
    <SchemaInitializer.Item
      onClick={() => {
        console.log(item, exists);
        if (exists) {
          return remove();
        }
        insert({
          ...item.schema,
          properties: {
            block: {
              type: 'void',
              'x-component': 'DataSourceProvider',
              'x-component-props': {
                collection: item?.field?.target,
                association: {
                  name: item.field.name,
                  sourceKey: item.field.sourceKey,
                  targetKey: item.field.targetKey,
                },
              },
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'ActionBar',
                  'x-component-props': {
                    style: {
                      marginBottom: 16,
                    },
                  },
                  properties: {
                    delete: {
                      type: 'void',
                      title: '{{ t("Delete") }}',
                      'x-component': 'Action',
                      'x-component-props': {
                        useAction: '{{ ds.useBulkDestroyAction }}',
                        confirm: {
                          title: "{{t('Delete record')}}",
                          content: "{{t('Are you sure you want to delete it?')}}",
                        },
                      },
                    },
                    create: {
                      type: 'void',
                      title: '{{ t("Add new") }}',
                      'x-action': 'create',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        openMode: 'drawer',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          title: '{{ t("Add new record") }}',
                          'x-component': 'Action.Container',
                          'x-component-props': {},
                          'x-decorator': 'Form',
                          properties: {
                            grid: {
                              type: 'void',
                              'x-component': 'Grid',
                              'x-initializer': 'GridFormItemInitializers',
                              properties: {},
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Container.Footer',
                              properties: {
                                actions: {
                                  type: 'void',
                                  'x-component': 'ActionBar',
                                  'x-component-props': {
                                    layout: 'one-column',
                                  },
                                  properties: {
                                    cancel: {
                                      title: '{{ t("Cancel") }}',
                                      'x-action': 'cancel',
                                      'x-component': 'Action',
                                      'x-component-props': {
                                        useAction: '{{ cm.useCancelAction }}',
                                      },
                                    },
                                    submit: {
                                      title: '{{ t("Submit") }}',
                                      'x-action': 'submit',
                                      'x-component': 'Action',
                                      'x-component-props': {
                                        type: 'primary',
                                        useAction: '{{ ds.useCreateAction }}',
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
                [item.field.name]: {
                  type: 'array',
                  title: '{{t("Fields")}}',
                  'x-component': 'Table.Array',
                  'x-initializer': 'TableColumnInitializers',
                  'x-component-props': {
                    pagination: false,
                    expandable: {
                      childrenColumnName: '__nochildren__',
                    },
                    rowSelection: {
                      type: 'checkbox',
                    },
                    useSelectedRowKeys: '{{ ds.useSelectedRowKeys }}',
                    useDataSource: '{{ ds.useDataSource }}',
                    // scroll: { x: '100%' },
                  },
                  properties: {
                    actions: {
                      type: 'void',
                      title: '{{ t("Actions") }}',
                      'x-decorator': 'Table.Column.ActionBar',
                      'x-component': 'Table.Column',
                      'x-designer': 'Table.RowActionDesigner',
                      'x-initializer': 'TableFieldRecordActionInitializers',
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
              },
            },
          },
        } as ISchema);
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch style={{ marginLeft: 20 }} size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
};
