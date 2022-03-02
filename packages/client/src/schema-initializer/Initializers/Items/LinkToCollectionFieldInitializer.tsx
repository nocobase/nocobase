import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCurrentSchema } from '../utils';

export const LinkToFieldInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema(
    item.schema['x-collection-field'],
    'x-collection-field',
    item.find,
    item.remove,
  );
  const targetKey = item.field.targetKey || 'id';
  return (
    <SchemaInitializer.Item
      onClick={() => {
        console.log(item, exists);
        if (exists) {
          return remove();
        }
        insert({
          ...item.schema,
          // default: [
          //   { id: 1, name: 'name1' },
          //   { id: 2, name: 'name2' },
          // ],
          // 'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
          'x-component-props': {
            mode: 'tags',
            fieldNames: {
              label: targetKey,
              value: targetKey,
            },
          },
          properties: {
            options: {
              'x-component': 'RecordPicker.Options',
              type: 'void',
              title: 'Drawer Title',
              properties: {
                block: {
                  type: 'void',
                  'x-collection': 'collections',
                  'x-decorator': 'ResourceActionProvider',
                  'x-decorator-props': {
                    collection: item.field.target,
                    request: {
                      resource: item.field.target,
                      action: 'list',
                      params: {
                        pageSize: 20,
                        filter: {},
                        // sort: ['sort'],
                        appends: [],
                      },
                    },
                  },
                  'x-designer': 'Table.Void.Designer',
                  'x-component': 'CardItem',
                  properties: {
                    // actions: {
                    //   type: 'void',
                    //   'x-initializer': 'TableActionInitializers',
                    //   'x-component': 'ActionBar',
                    //   'x-component-props': {
                    //     style: {
                    //       marginBottom: 16,
                    //     },
                    //   },
                    //   properties: {},
                    // },
                    table: {
                      // type: 'void',
                      'x-component': 'Table.RowSelection',
                      'x-component-props': {
                        rowKey: targetKey,
                        objectValue: true,
                        rowSelection: {
                          type: 'checkbox',
                        },
                        useDataSource: '{{ cm.useDataSourceFromRAC }}',
                      },
                      'x-initializer': 'TableColumnInitializers',
                      properties: {
                        // actions: {
                        //   type: 'void',
                        //   title: '{{ t("Actions") }}',
                        //   'x-decorator': 'Table.Column.ActionBar',
                        //   'x-component': 'Table.Column',
                        //   'x-designer': 'Table.RowActionDesigner',
                        //   'x-initializer': 'TableRecordActionInitializers',
                        //   properties: {
                        //     actions: {
                        //       type: 'void',
                        //       'x-decorator': 'DndContext',
                        //       'x-component': 'Space',
                        //       'x-component-props': {
                        //         split: '|',
                        //       },
                        //       properties: {},
                        //     },
                        //   },
                        // },
                      },
                    },
                  },
                },
              },
            },
            item: {
              'x-component': 'RecordPicker.SelectedItem',
              properties: {
                drawer1: {
                  'x-component': 'Action.Drawer',
                  type: 'void',
                  title: 'Drawer Title',
                  properties: {
                    details: {
                      type: 'void',
                      'x-collection': 'collections',
                      'x-decorator': 'ResourceActionProvider',
                      'x-decorator-props': {
                        collection: item.field.target,
                        request: {
                          resource: item.field.target,
                          action: 'get',
                          params: {},
                        },
                      },
                      'x-designer': 'Form.Designer',
                      'x-component': 'CardItem',
                      properties: {
                        form: {
                          type: 'void',
                          'x-decorator': 'Form',
                          'x-decorator-props': {},
                          properties: {
                            actions: {
                              type: 'void',
                              'x-initializer': 'FormActionInitializers',
                              'x-component': 'ActionBar',
                              'x-component-props': {
                                layout: 'one-column',
                                style: {
                                  marginBottom: 16,
                                },
                              },
                              properties: {},
                            },
                            grid: {
                              type: 'void',
                              'x-component': 'Grid',
                              'x-initializer': 'GridFormItemInitializers',
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
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch style={{ marginLeft: 20 }} size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
};
