import React from 'react';
import { TableOutlined } from '@ant-design/icons';

import { SchemaInitializer, useCollectionManager } from "@nocobase/client";

import { JobStatusOptions } from "../../constants";
import { NAMESPACE } from "../../locale";



const todoCollection = {
  title: `{{t("Workflow todos", { ns: "${NAMESPACE}" })}}`,
  name: 'users_jobs',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
      interface: 'm2o',
      uiSchema: {
        type: 'number',
        title: '{{t("User")}}',
        'x-component': 'RemoteSelect',
        'x-component-props': {
          fieldNames: {
            label: 'nickname',
            value: 'id',
          },
          service: {
            resource: 'users'
          },
        }
      }
    },
    {
      type: 'belongsTo',
      name: 'node',
      interface: 'm2o',
      uiSchema: {
        type: 'number',
        title: `{{t("Task", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'RemoteSelect',
        'x-component-props': {
          fieldNames: {
            label: 'title',
            value: 'id',
          },
          service: {
            resource: 'flow_nodes'
          },
        }
      }
    },
    {
      type: 'integer',
      name: 'status',
      interface: 'select',
      uiSchema: {
        type: 'number',
        title: `{{t("Status", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Select',
        enum: JobStatusOptions
      }
    }
  ]
}

export function WorkflowTodoBlockInitializer({ insert, ...props }) {
  const { collections, ...ctx } = useCollectionManager();
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...props}
      onClick={() => {
        insert({
          type: 'void',
          'x-decorator': 'CollectionManagerProvider',
          'x-decorator-props': {
            ...ctx,
            collections: [
              ...collections,
              todoCollection
            ],
          },
          'x-component': 'div',
          properties: {
            block: {
              'x-decorator': 'TableBlockProvider',
              'x-decorator-props': {
                collection: todoCollection,
                resource: 'users_jobs',
                action: 'list',
                params: {
                  pageSize: 20,
                  sort: ['-createdAt'],
                  appends: ['job', 'user', 'node', 'workflow'],
                },
                rowKey: 'id',
                showIndex: true,
                dragSort: false,
              },
              'x-component': 'CardItem',
              'x-designer': 'TableBlockDesigner',
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
                    filter: {
                      type: 'void',
                      title: '{{ t("Filter") }}',
                      'x-action': 'filter',
                      'x-designer': 'Filter.Action.Designer',
                      'x-component': 'Filter.Action',
                      'x-component-props': {
                        icon: 'FilterOutlined',
                        useProps: '{{ useFilterActionProps }}',
                      },
                      'x-align': 'left',
                    }
                  },
                },
                table: {
                  type: 'array',
                  'x-component': 'TableV2',
                  'x-component-props': {
                    rowKey: 'id',
                    useProps: '{{ useTableBlockProps }}',
                  },
                  properties: {
                    node: {
                      type: 'void',
                      'x-decorator': 'TableV2.Column.Decorator',
                      'x-component': 'TableV2.Column',
                      properties: {
                        node: {
                          type: 'object',
                          'x-component': 'CollectionField',
                          'x-read-pretty': true,
                        },
                      },
                    },
                    status: {
                      type: 'void',
                      'x-decorator': 'TableV2.Column.Decorator',
                      'x-component': 'TableV2.Column',
                      properties: {
                        status: {
                          type: 'number',
                          'x-component': 'CollectionField',
                          'x-read-pretty': true,
                        },
                      },
                    },
                    actions: {
                      type: 'void',
                      'x-decorator': 'TableV2.Column.Decorator',
                      'x-component': 'TableV2.Column',
                      properties: {
                        view: {
                          type: 'void',
                          'x-component': 'Action',
                          title: 'View',
                          properties: {
                            drawer: {
                              'x-component': 'Action.Drawer',
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
      }}
    />
  );
}
