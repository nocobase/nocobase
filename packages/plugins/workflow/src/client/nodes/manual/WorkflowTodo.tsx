import React, { useContext, createContext, useMemo, useEffect, useState } from "react";
import { createForm } from '@formily/core';
import { observer, useForm, useField, useFieldSchema } from '@formily/react';
import { Tag } from 'antd';
import parse from 'json-templates';
import { css } from "@emotion/css";
import moment from 'moment';

import { CollectionManagerProvider, CollectionProvider, SchemaComponent, SchemaComponentContext, SchemaComponentOptions, TableBlockProvider, useActionContext, useAPIClient, useCollectionManager, useRecord, useRequest, useTableBlockContext } from "@nocobase/client";
import { uid } from "@nocobase/utils/client";

import { JobStatusOptions, JobStatusOptionsMap } from "../../constants";
import { NAMESPACE } from "../../locale";
import { FlowContext, useFlowContext } from "../../FlowContext";
import { instructions, useAvailableUpstreams } from '..';
import { linkNodes } from "../../utils";

const nodeCollection = {
  title: `{{t("Task", { ns: "${NAMESPACE}" })}}`,
  name: 'flow_nodes',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      interface: 'm2o',
      uiSchema: {
        type: 'number',
        title: 'ID',
        'x-component': 'RemoteSelect',
        'x-component-props': {
          fieldNames: {
            label: 'title',
            value: 'id',
          },
          service: {
            resource: 'flow_nodes',
            params: {
              filter: {
                type: 'manual'
              }
            }
          },
        }
      }
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Title")}}',
        'x-component': 'Input'
      }
    },
  ]
};

const workflowCollection = {
  title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
  name: 'workflows',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Name")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      },
    },
  ]
};

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
      isAssociation: true,
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
            resource: 'workflows'
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
              },
              refresher: {
                type: 'void',
                title: '{{ t("Refresh") }}',
                'x-action': 'refresh',
                'x-component': 'Action',
                'x-designer': 'Action.Designer',
                'x-component-props': {
                  icon: 'ReloadOutlined',
                  useProps: '{{ useRefreshActionProps }}',
                },
                'x-align': 'right',
              },
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

function useSubmit() {
  const api = useAPIClient();
  const { setVisible } = useActionContext();
  const { values, submit } = useForm();
  const nextStatus = useManualActionStatusContext();
  const { service } = useTableBlockContext();
  const { id } = useRecord();
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

function useFlowRecordFromBlock(opts) {
  const { ['x-context-datasource']: dataSource } = useFieldSchema();
  const { execution } = useFlowContext();
  const context = {
    $context: execution?.context,
    $jobsMapByNodeId: (execution?.jobs ?? []).reduce((map, job) => Object.assign(map, { [job.nodeId]: job.result }),{})
  };
  let result = parse(dataSource)(context);

  return useRequest(() => {
    return Promise.resolve({ data: result })
  }, opts);
}

function FlowContextProvider(props) {
  const api = useAPIClient();
  const { node, executionId } = useRecord();
  const [flowContext, setFlowContext] = useState<any>(null);

  useEffect(() => {
    if (!executionId) {
      return;
    }
    api.resource('executions').get?.({
      filterByTk: executionId,
      appends: ['workflow', 'workflow.nodes', 'jobs'],
    })
      .then(({ data }) => {
        const {
          workflow: { nodes = [], ...workflow } = {},
          ...execution
        } = data?.data ?? {};
        linkNodes(nodes);
        setFlowContext({
          workflow,
          nodes,
          execution
        });
      });
  }, [executionId]);

  if (!flowContext) {
    return null;
  }

  const nodes = useAvailableUpstreams(flowContext.nodes.find(item => item.id === node.id));
  const nodeComponents = nodes.reduce((components, { type }) => Object.assign(components, instructions.get(type).components), {});

  return (
    <FlowContext.Provider value={flowContext}>
      <SchemaComponentOptions components={{ ...nodeComponents }}>
        {props.children}
      </SchemaComponentOptions>
    </FlowContext.Provider>
  );
}

WorkflowTodo.Drawer = function () {
  const ctx = useContext(SchemaComponentContext);
  const { node, workflow, status, result, updatedAt } = useRecord();

  const form = useMemo(() => createForm({
    readPretty: Boolean(status),
    initialValues: result
  }), [result]);

  const { blocks, collection, actions } = node.config.schema ?? {};

  const statusOption = JobStatusOptionsMap[status];
  const actionSchema = status
    ? {
      date: {
        type: 'void',
        'x-component': 'time',
        'x-component-props': {
          className: css`
            margin-right: .5em;
          `
        },
        'x-content': moment(updatedAt).format('YYYY-MM-DD HH:mm:ss')
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
            ManualActionStatusProvider,
            FlowContextProvider
          }}
          schema={{
            type: 'void',
            name: `drawer-${status}`,
            'x-decorator': 'Form',
            'x-decorator-props': {
              form,
            },
            'x-component': 'Action.Drawer',
            'x-component-props': {
              className: 'nb-action-popup',
            },
            title: `${workflow.title} - ${node.title ?? `#${node.id}`}`,
            properties: {
              tabs: {
                type: 'void',
                'x-decorator': 'FlowContextProvider',
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
            useSubmit,
            useFlowRecordFromBlock
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
      except: ['workflow.config'],
      filter: {
        'workflow.id.$exists': true
      }
    },
    rowKey: 'id',
    showIndex: true,
    dragSort: false,
  };

  return (
    <CollectionManagerProvider {...cm} collections={[...collections, nodeCollection, workflowCollection, todoCollection]}>
      <TableBlockProvider {...blockProps}>{children}</TableBlockProvider>
    </CollectionManagerProvider>
  );
}
