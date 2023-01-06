import React, { useContext, createContext, useMemo } from "react";
import { createForm } from '@formily/core';
import { observer, useForm, useField } from '@formily/react';
import { Tag } from 'antd';

import { CollectionManagerProvider, CollectionProvider, SchemaComponent, SchemaComponentContext, TableBlockProvider, useActionContext, useAPIClient, useCollectionManager, useRecord, useTableBlockContext } from "@nocobase/client";
import { uid } from "@nocobase/utils/client";

import { JobStatusOptions, JobStatusOptionsMap } from "../../constants";
import { NAMESPACE } from "../../locale";



const todoCollection = {
  title: `{{t("Workflow todos", { ns: "${NAMESPACE}" })}}`,
  name: 'users_jobs',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
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
      target: 'flow_nodes',
      foreignKey: 'nodeId',
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
      type: 'belongsTo',
      name: 'workflow',
      target: 'workflows',
      foreignKey: 'workflowId',
      interface: 'm2o',
      uiSchema: {
        type: 'number',
        title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'RemoteSelect',
        'x-component-props': {
          fieldNames: {
            label: 'title',
            value: 'id',
          },
          service: {
            resource: 'workflow'
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
    },
    {
      name: 'createdAt',
      type: 'date',
      interface: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {
          showTime: true,
        },
        'x-read-pretty': true,
      },
    },
  ]
}

const NodeColumn = observer(() => {
  const field = useField<any>();
  return field?.value?.title ?? `#${field.value?.id}`;
});

const WorkflowColumn = observer(() => {
  const field = useField<any>();
  return field?.value?.title ?? `#${field.value?.id}`;
});

const UserColumn = observer(() => {
  const field = useField<any>();
  return field?.value?.nickname ?? field.value?.id;
});

export function WorkflowTodo() {
  return (
    <SchemaComponent
      components={{
        NodeColumn,
        WorkflowColumn,
        UserColumn
      }}
      schema={{
        type: 'void',
        name: uid(),
        'x-component': 'div',
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
                title: `{{t("Task", { ns: "${NAMESPACE}" })}}`,
                properties: {
                  node: {
                    'x-component': 'NodeColumn',
                    'x-read-pretty': true,
                  },
                },
              },
              workflow: {
                type: 'void',
                'x-decorator': 'TableV2.Column.Decorator',
                'x-component': 'TableV2.Column',
                title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
                properties: {
                  workflow: {
                    'x-component': 'WorkflowColumn',
                    'x-read-pretty': true,
                  },
                },
              },
              createdAt: {
                type: 'void',
                'x-decorator': 'TableV2.Column.Decorator',
                'x-component': 'TableV2.Column',
                properties: {
                  createdAt: {
                    type: 'number',
                    'x-component': 'CollectionField',
                    'x-read-pretty': true,
                  },
                },
              },
              user: {
                type: 'void',
                'x-decorator': 'TableV2.Column.Decorator',
                'x-component': 'TableV2.Column',
                title: `{{t("Assignee", { ns: "${NAMESPACE}" })}}`,
                properties: {
                  user: {
                    'x-component': 'UserColumn',
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
                title: '{{t("Actions")}}',
                properties: {
                  view: {
                    type: 'void',
                    'x-component': 'Action.Link',
                    title: '{{t("View")}}',
                    properties: {
                      drawer: {
                        'x-component': 'WorkflowTodo.Drawer',
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }}
    />
  )
}

const ManualActionStatusContext = createContext<number | null>(null);

function useManualActionStatusContext() {
  return useContext(ManualActionStatusContext);
}

function ManualActionStatusProvider({ value, children }) {
  return (
    <ManualActionStatusContext.Provider value={value}>
      {children}
    </ManualActionStatusContext.Provider>
  )
}

WorkflowTodo.Drawer = function () {
  const ctx = useContext(SchemaComponentContext);
  const { node, workflow, id, status, result, updatedAt } = useRecord();
  const form = useMemo(() => createForm({
    readPretty: Boolean(status)
  }), []);
  const { blocks, collection, actions } = node.config.schema ?? {};

  const statusOption = JobStatusOptionsMap[status];
  const actionSchema = status
    ? {
      date: {
        type: 'void',
        'x-component': 'time',
        'x-content': (new Date(Date.parse(updatedAt))).toLocaleString()
      },
      status: {
        type: 'void',
        'x-component': 'Tag',
        'x-component-props': {
          icon: statusOption.icon,
          color: statusOption.color
        },
        'x-content': statusOption.label
      }
    }
    : actions;

  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
      <CollectionProvider collection={collection}>
        <SchemaComponent
          components={{
            Tag,
            ManualActionStatusProvider
          }}
          schema={{
            type: 'void',
            name: 'drawer',
            'x-decorator': 'Form',
            'x-decorator-props': {
              form,
              initialValue: result
            },
            'x-component': 'Action.Drawer',
            'x-component-props': {
              className: 'nb-action-popup',
            },
            title: `${workflow.title} - ${node.title ?? `#${node.id}`}`,
            properties: {
              tabs: {
                type: 'void',
                'x-component': 'Tabs',
                properties: blocks,
              },
              footer: {
                type: 'void',
                'x-component': 'Action.Drawer.Footer',
                properties: actionSchema
              }
            }
          }}
          scope={{
            useSubmit() {
              const api = useAPIClient();
              const { setVisible } = useActionContext();
              const { values, submit } = useForm();
              const nextStatus = useManualActionStatusContext();
              const { service } = useTableBlockContext();
              return {
                async run() {
                  await submit();
                  await api.resource('users_jobs').submit({
                    filterByTk: id,
                    values: {
                      status: nextStatus,
                      result: values
                    }
                  });
                  setVisible(false);
                  service.refresh();
                }
              }
            }
          }}
        />
      </CollectionProvider>
    </SchemaComponentContext.Provider>
  )
}

WorkflowTodo.Decorator = function ({ children }) {
  const { collections, ...cm } = useCollectionManager();
  const blockProps = {
    collection: 'users_jobs',
    resource: 'users_jobs',
    action: 'list',
    params: {
      pageSize: 20,
      sort: ['-createdAt'],
      appends: ['user', 'node', 'workflow'],
      except: ['workflow.config']
    },
    rowKey: 'id',
    showIndex: true,
    dragSort: false,
  };

  return (
    <CollectionManagerProvider {...cm} collections={[...collections, todoCollection]}>
      <TableBlockProvider {...blockProps}>{children}</TableBlockProvider>
    </CollectionManagerProvider>
  );
}
