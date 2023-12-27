import React, { createContext, useContext, useEffect, useState } from 'react';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import { Space, Spin, Tag } from 'antd';
import dayjs from 'dayjs';

import { css, usePlugin } from '@nocobase/client';

import {
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentContext,
  TableBlockProvider,
  useAPIClient,
  useActionContext,
  useCollectionManager,
  useCompile,
  useCurrentUserContext,
  useFormBlockContext,
  useRecord,
  useTableBlockContext,
} from '@nocobase/client';
import WorkflowPlugin, {
  useAvailableUpstreams,
  FlowContext,
  useFlowContext,
  JobStatusOptions,
  JobStatusOptionsMap,
  linkNodes,
} from '@nocobase/plugin-workflow/client';

import { DetailsBlockProvider } from './instruction/DetailsBlockProvider';
import { FormBlockProvider } from './instruction/FormBlockProvider';
import { ManualFormType, manualFormTypes } from './instruction/SchemaConfig';
import { NAMESPACE } from '../locale';

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
                type: 'manual',
              },
            },
          },
        },
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Title")}}',
        'x-component': 'Input',
      },
    },
  ],
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
  ],
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
            resource: 'users',
          },
        },
      },
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
            resource: 'flow_nodes',
          },
        },
      },
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
            resource: 'workflows',
          },
        },
      },
    },
    {
      type: 'integer',
      name: 'status',
      interface: 'select',
      uiSchema: {
        type: 'number',
        title: `{{t("Status", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Select',
        enum: JobStatusOptions,
      },
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
      },
    },
  ],
};

const NodeColumn = observer(
  () => {
    const field = useField<any>();
    return field?.value?.title ?? `#${field.value?.id}`;
  },
  { displayName: 'NodeColumn' },
);

const WorkflowColumn = observer(
  () => {
    const field = useField<any>();
    return field?.value?.title ?? `#${field.value?.id}`;
  },
  { displayName: 'WorkflowColumn' },
);

const UserColumn = observer(
  () => {
    const field = useField<any>();
    return field?.value?.nickname ?? field.value?.id;
  },
  { displayName: 'UserColumn' },
);

export const WorkflowTodo: React.FC & { Drawer: React.FC; Decorator: React.FC } = () => {
  return (
    <SchemaComponent
      components={{
        NodeColumn,
        WorkflowColumn,
        UserColumn,
      }}
      schema={{
        type: 'void',
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
                    type: 'string',
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
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};

function ActionBarProvider(props) {
  // * status is done:
  //   1. form is this form: show action button, and emphasis used status button
  //   2. form is not this form: hide action bar
  // * status is not done:
  //   1. current user: show action bar
  //   2. not current user: disabled action bar

  const { data: user } = useCurrentUserContext();
  const { userJob } = useFlowContext();
  const { status, result, userId } = userJob;
  const buttonSchema = useFieldSchema();
  const { name } = buttonSchema.parent.toJSON();

  let { children: content } = props;
  if (status) {
    if (!result[name]) {
      content = null;
    }
  } else {
    if (user?.data?.id !== userId) {
      content = null;
    }
  }

  return content;
}

const ManualActionStatusContext = createContext<number | null>(null);

function ManualActionStatusProvider({ value, children }) {
  const { userJob } = useFlowContext();
  const button = useField();
  const buttonSchema = useFieldSchema();

  useEffect(() => {
    if (userJob.status) {
      button.disabled = true;
      button.visible = userJob.status === value && userJob.result._ === buttonSchema.name;
    }
  }, [userJob, value, button, buttonSchema.name]);

  return <ManualActionStatusContext.Provider value={value}>{children}</ManualActionStatusContext.Provider>;
}

function useSubmit() {
  const api = useAPIClient();
  const { setVisible } = useActionContext();
  const { values, submit } = useForm();
  const buttonSchema = useFieldSchema();
  const { service } = useTableBlockContext();
  const { userJob } = useFlowContext();
  const { name: actionKey } = buttonSchema;
  const { name: formKey } = buttonSchema.parent.parent;
  return {
    async run() {
      if (userJob.status) {
        return;
      }
      await submit();
      await api.resource('users_jobs').submit({
        filterByTk: userJob.id,
        values: {
          result: { [formKey]: values, _: actionKey },
        },
      });
      setVisible(false);
      service.refresh();
    },
  };
}

function FlowContextProvider(props) {
  const workflowPlugin = usePlugin(WorkflowPlugin);
  const api = useAPIClient();
  const { id } = useRecord();
  const [flowContext, setFlowContext] = useState<any>(null);
  const [node, setNode] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    api
      .resource('users_jobs')
      .get?.({
        filterByTk: id,
        appends: ['node', 'workflow', 'workflow.nodes', 'execution', 'execution.jobs'],
      })
      .then(({ data }) => {
        const { node, workflow: { nodes = [], ...workflow } = {}, execution, ...userJob } = data?.data ?? {};
        linkNodes(nodes);
        setNode(node);
        setFlowContext({
          userJob,
          workflow,
          nodes,
          execution,
        });
        return;
      });
  }, [api, id]);

  const upstreams = useAvailableUpstreams(flowContext?.nodes.find((item) => item.id === node.id));
  const nodeComponents = upstreams.reduce(
    (components, { type }) => Object.assign(components, workflowPlugin.instructions.get(type).components),
    {},
  );

  return node && flowContext ? (
    <FlowContext.Provider value={flowContext}>
      <SchemaComponent
        components={{
          FormBlockProvider,
          DetailsBlockProvider,
          ActionBarProvider,
          ManualActionStatusProvider,
          // @ts-ignore
          ...Array.from(manualFormTypes.getValues()).reduce(
            (result, item: ManualFormType) => Object.assign(result, item.block.components),
            {},
          ),
          ...nodeComponents,
        }}
        scope={{
          useSubmit,
          useFormBlockProps,
          useDetailsBlockProps,
          // @ts-ignore
          ...Array.from(manualFormTypes.getValues()).reduce(
            (result, item: ManualFormType) => Object.assign(result, item.block.scope),
            {},
          ),
        }}
        schema={{
          type: 'void',
          name: 'tabs',
          'x-component': 'Tabs',
          properties: node.config?.schema,
        }}
      />
    </FlowContext.Provider>
  ) : (
    <Spin />
  );
}

function useFormBlockProps() {
  const { userJob } = useFlowContext();
  const record = useRecord();
  const { data: user } = useCurrentUserContext();
  const { form } = useFormBlockContext();

  const pattern = userJob.status
    ? record
      ? 'readPretty'
      : 'disabled'
    : user?.data?.id !== userJob.userId
      ? 'disabled'
      : 'editable';

  useEffect(() => {
    form?.setPattern(pattern);
  }, [pattern, form]);

  return { form };
}

function useDetailsBlockProps() {
  const { form } = useFormBlockContext();
  return { form };
}

function FooterStatus() {
  const compile = useCompile();
  const { status, updatedAt } = useRecord();
  const statusOption = JobStatusOptionsMap[status];
  return status ? (
    <Space>
      <time
        className={css`
          margin-right: 0.5em;
        `}
      >
        {dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss')}
      </time>
      <Tag icon={statusOption.icon} color={statusOption.color}>
        {compile(statusOption.label)}
      </Tag>
    </Space>
  ) : null;
}

function Drawer() {
  const ctx = useContext(SchemaComponentContext);
  const { id, node, workflow, status } = useRecord();

  return (
    <SchemaComponentContext.Provider value={{ ...ctx, reset() {}, designable: false }}>
      <SchemaComponent
        components={{
          FooterStatus,
          FlowContextProvider,
        }}
        schema={{
          type: 'void',
          name: `drawer-${id}-${status}`,
          'x-component': 'Action.Drawer',
          'x-component-props': {
            className: 'nb-action-popup',
          },
          title: `${workflow.title} - ${node.title ?? `#${node.id}`}`,
          properties: {
            tabs: {
              type: 'void',
              'x-component': 'FlowContextProvider',
            },
            footer: {
              type: 'void',
              'x-component': 'Action.Drawer.Footer',
              properties: {
                content: {
                  type: 'void',
                  'x-component': 'FooterStatus',
                },
              },
            },
          },
        }}
      />
    </SchemaComponentContext.Provider>
  );
}

function Decorator({ params = {}, children }) {
  const { collections, ...cm } = useCollectionManager();
  const blockProps = {
    collection: 'users_jobs',
    resource: 'users_jobs',
    action: 'list',
    params: {
      pageSize: 20,
      sort: ['-createdAt'],
      ...params,
      appends: ['user', 'node', 'workflow'],
      except: ['node.config', 'workflow.config', 'workflow.options'],
    },
    rowKey: 'id',
    showIndex: true,
    dragSort: false,
  };

  return (
    <CollectionManagerProvider
      {...cm}
      collections={[...collections, nodeCollection, workflowCollection, todoCollection]}
    >
      <TableBlockProvider name="workflow-todo" {...blockProps}>
        {children}
      </TableBlockProvider>
    </CollectionManagerProvider>
  );
}

WorkflowTodo.Drawer = Drawer;
WorkflowTodo.Decorator = Decorator;
