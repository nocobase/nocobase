/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import { Button, Card, Descriptions, Space, Spin, Tag } from 'antd';
import { TableOutlined } from '@ant-design/icons';
import { useAntdToken } from 'antd-style';
import dayjs from 'dayjs';

import {
  ActionContextProvider,
  css,
  PopupContextProvider,
  SchemaInitializerItem,
  useCollectionRecordData,
  useCompile,
  useOpenModeContext,
  usePlugin,
  usePopupSettings,
  usePopupUtils,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';

import {
  SchemaComponent,
  SchemaComponentContext,
  TableBlockProvider,
  useAPIClient,
  useActionContext,
  useCurrentUserContext,
  useFormBlockContext,
  useTableBlockContext,
} from '@nocobase/client';
import WorkflowPlugin, {
  DetailsBlockProvider,
  FlowContext,
  JobStatusOptions,
  JobStatusOptionsMap,
  linkNodes,
  useAvailableUpstreams,
  useFlowContext,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow/client';

import { lang, NAMESPACE, useLang } from '../locale';
import { FormBlockProvider } from './instruction/FormBlockProvider';
import { ManualFormType, manualFormTypes } from './instruction/SchemaConfig';

export const nodeCollection = {
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

export const workflowCollection = {
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

export const todoCollection = {
  title: `{{t("Workflow todos", { ns: "${NAMESPACE}" })}}`,
  name: 'workflowManualTasks',
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
      type: 'string',
      name: 'title',
      uiSchema: {
        type: 'string',
        title: `{{t("Task title", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input',
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
    {
      name: 'updatedAt',
      type: 'date',
      interface: 'updatedAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Updated at")}}',
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

function UserJobStatusColumn(props) {
  const recordData = useCollectionRecordData();
  const labelUnprocessed = useLang('Unprocessed');
  if (recordData?.execution?.status && !recordData?.status) {
    return <Tag>{labelUnprocessed}</Tag>;
  }
  return props.children;
}

const tableColumns = {
  title: {
    type: 'void',
    'x-decorator': 'TableV2.Column.Decorator',
    'x-component': 'TableV2.Column',
    'x-component-props': {
      width: null,
    },
    title: `{{t("Task title", { ns: "${NAMESPACE}" })}}`,
    properties: {
      title: {
        'x-component': 'CollectionField',
        'x-read-pretty': true,
      },
    },
  },
  workflow: {
    type: 'void',
    'x-decorator': 'TableV2.Column.Decorator',
    'x-component': 'TableV2.Column',
    'x-component-props': {
      width: null,
    },
    title: `{{t("Workflow", { ns: "workflow" })}}`,
    properties: {
      workflow: {
        'x-component': 'WorkflowColumn',
        'x-read-pretty': true,
      },
    },
  },
  status: {
    type: 'void',
    'x-decorator': 'TableV2.Column.Decorator',
    'x-component': 'TableV2.Column',
    'x-component-props': {
      width: 100,
    },
    title: `{{t("Status", { ns: "workflow" })}}`,
    properties: {
      status: {
        type: 'number',
        'x-decorator': 'UserJobStatusColumn',
        'x-component': 'CollectionField',
        'x-read-pretty': true,
      },
    },
  },
  user: {
    type: 'void',
    'x-decorator': 'TableV2.Column.Decorator',
    'x-component': 'TableV2.Column',
    'x-component-props': {
      width: 140,
    },
    title: `{{t("Assignee", { ns: "${NAMESPACE}" })}}`,
    properties: {
      user: {
        'x-component': 'UserColumn',
        'x-read-pretty': true,
      },
    },
  },
  createdAt: {
    type: 'void',
    'x-decorator': 'TableV2.Column.Decorator',
    'x-component': 'TableV2.Column',
    'x-component-props': {
      width: 160,
    },
    properties: {
      createdAt: {
        type: 'string',
        'x-component': 'CollectionField',
        'x-read-pretty': true,
      },
    },
  },
};

export const WorkflowTodo: React.FC<{ columns?: string[] }> & {
  Initializer: React.FC;
  Drawer: React.FC;
  Decorator: React.FC;
  // TaskBlock: React.FC;
} = (props) => {
  const { columns = Object.keys(tableColumns) } = props;
  const { defaultOpenMode } = useOpenModeContext();

  return (
    <SchemaComponent
      components={{
        NodeColumn,
        WorkflowColumn,
        UserColumn,
        UserJobStatusColumn,
      }}
      schema={{
        type: 'void',
        properties: {
          actions: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 'var(--nb-spacing)',
              },
            },
            properties: {
              filter: {
                type: 'void',
                title: '{{ t("Filter") }}',
                'x-action': 'filter',
                'x-designer': 'Filter.Action.Designer',
                'x-component': 'Filter.Action',
                'x-use-component-props': 'useFilterActionProps',
                'x-component-props': {
                  icon: 'FilterOutlined',
                },
                'x-align': 'left',
              },
              refresher: {
                type: 'void',
                title: '{{ t("Refresh") }}',
                'x-action': 'refresh',
                'x-component': 'Action',
                'x-use-component-props': 'useRefreshActionProps',
                // 'x-designer': 'Action.Designer',
                'x-toolbar': 'ActionSchemaToolbar',
                'x-settings': 'actionSettings:refresh',
                'x-component-props': {
                  icon: 'ReloadOutlined',
                },
                'x-align': 'right',
              },
            },
          },
          table: {
            type: 'array',
            'x-component': 'TableV2',
            'x-use-component-props': 'useTableBlockProps',
            'x-component-props': {
              rowKey: 'id',
            },
            properties: {
              actions: {
                type: 'void',
                'x-decorator': 'TableV2.Column.Decorator',
                'x-component': 'TableV2.Column',
                'x-component-props': {
                  width: 60,
                },
                title: '{{t("Actions")}}',
                properties: {
                  view: getWorkflowTodoViewActionSchema({ defaultOpenMode, collectionName: 'workflowManualTasks' }),
                },
              },
              ...columns.reduce((schema, key) => {
                schema[key] = tableColumns[key];
                return schema;
              }, {}),
            },
          },
        },
      }}
    />
  );
};

export function getWorkflowTodoViewActionSchema({ defaultOpenMode, collectionName }) {
  return {
    name: 'view',
    type: 'void',
    'x-component': 'Action.Link',
    'x-component-props': {
      openMode: defaultOpenMode,
    },
    title: '{{t("View")}}',
    // 1. “弹窗 URL”需要 Schema 中必须包含 uid
    // 2. 所以，在这里加上一个固定的 uid 用以支持“弹窗 URL”
    // 3. 然后，把这段 Schema 完整的（加上弹窗的部分）保存到内存中，以便“弹窗 URL”可以直接使用
    'x-uid': `${collectionName}-view`,
    'x-action': 'view',
    'x-action-context': {
      dataSource: 'main',
      collection: collectionName,
      doNotUpdateContext: true,
    },
    properties: {
      drawer: {
        type: 'void',
        'x-component': WorkflowTodo.Drawer,
      },
    },
  };
}

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
ManualActionStatusContext.displayName = 'ManualActionStatusContext';

function ManualActionStatusProvider({ value, children }) {
  const { userJob, execution } = useFlowContext();
  const button = useField();
  const buttonSchema = useFieldSchema();
  const compile = useCompile();

  useEffect(() => {
    if (execution.status || userJob.status) {
      button.disabled = true;
      button.visible = userJob.status === value && userJob.result._ === buttonSchema.name;
    }
  }, [execution, userJob, value, button, buttonSchema.name]);

  return (
    <ManualActionStatusContext.Provider value={value}>
      {execution.status || userJob.status ? (
        <Button type="primary" disabled>
          {compile(buttonSchema.title)}
        </Button>
      ) : (
        children
      )}
    </ManualActionStatusContext.Provider>
  );
}

function useSubmit() {
  const api = useAPIClient();
  const { setVisible, setSubmitted } = useActionContext();
  const { values, submit } = useForm();
  const field = useField();
  const buttonSchema = useFieldSchema();
  const { service } = useTableBlockContext();
  const { userJob, execution } = useFlowContext();
  const { name: actionKey } = buttonSchema;
  const { name: formKey } = buttonSchema.parent.parent;
  const { assignedValues = {} } = buttonSchema?.['x-action-settings'] ?? {};
  return {
    async run() {
      if (execution.status || userJob.status) {
        return;
      }
      await submit();
      field.data = field.data || {};
      field.data.loading = true;

      await api.resource('workflowManualTasks').submit({
        filterByTk: userJob.id,
        values: {
          result: { [formKey]: { ...values, ...assignedValues.values }, _: actionKey },
        },
      });

      field.data.loading = false;
      setSubmitted(true);
      setVisible(false);
      service?.refresh();
    },
  };
}

function FlowContextProvider(props) {
  const workflowPlugin = usePlugin(WorkflowPlugin);
  const api = useAPIClient();
  const { id } = useCollectionRecordData() || {};
  const [flowContext, setFlowContext] = useState<any>(null);
  const [node, setNode] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    api
      .resource('workflowManualTasks')
      .get?.({
        filterByTk: id,
        appends: ['node', 'job', 'workflow', 'workflow.nodes', 'execution', 'execution.jobs'],
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
  const { userJob, execution } = useFlowContext();
  const recordData = useCollectionRecordData();
  const { data: user } = useCurrentUserContext();
  const { form } = useFormBlockContext();

  const pattern =
    execution.status || userJob.status
      ? recordData
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
  const { status, updatedAt } = useCollectionRecordData() || {};
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
  const { id, node, workflow, status } = useCollectionRecordData() || {};

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
          'x-component': 'Action.Container',
          'x-component-props': {
            className: 'nb-action-popup',
          },
          title: `${workflow?.title} - ${node?.title ?? `#${node?.id}`}`,
          properties: {
            tabs: {
              type: 'void',
              'x-component': 'FlowContextProvider',
            },
            footer: {
              type: 'void',
              'x-component': 'Action.Container.Footer',
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

function Decorator(props) {
  const { params = {}, children } = props;
  const blockProps = {
    collection: 'workflowManualTasks',
    resource: 'workflowManualTasks',
    action: 'list',
    params: {
      pageSize: 20,
      sort: ['-createdAt'],
      ...params,
      filter: {
        ...params.filter,
      },
      appends: ['user', 'node', 'workflow', 'execution.status'],
      except: ['node.config', 'workflow.config', 'workflow.options'],
    },
    rowKey: 'id',
    showIndex: true,
    dragSort: false,
  };

  return (
    <TableBlockProvider name="workflow-todo" {...blockProps}>
      {children}
    </TableBlockProvider>
  );
}

function Initializer() {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
      icon={<TableOutlined />}
      {...itemConfig}
      onClick={() => {
        insert({
          type: 'void',
          'x-decorator': 'WorkflowTodo.Decorator',
          'x-decorator-props': {},
          'x-component': 'CardItem',
          'x-toolbar': 'BlockSchemaToolbar',
          'x-settings': 'blockSettings:table',
          properties: {
            todos: {
              type: 'void',
              'x-component': 'WorkflowTodo',
            },
          },
        });
      }}
    />
  );
}

WorkflowTodo.Initializer = Initializer;
WorkflowTodo.Drawer = Drawer;
WorkflowTodo.Decorator = Decorator;

function ContentDetail() {
  const record = useCollectionRecordData();
  return (
    <Descriptions
      items={[
        {
          key: 'workflow.title',
          label: lang('Workflow belonged'),
          children: record.workflow.title,
        },
      ]}
    />
  );
}

function TaskItem() {
  const token = useAntdToken();
  const [visible, setVisible] = useState(false);
  // const { defaultOpenMode } = useOpenModeContext();
  // const { openPopup } = usePopupUtils();
  // const { isPopupVisibleControlledByURL } = usePopupSettings();
  const onOpen = useCallback((e: React.MouseEvent) => {
    const targetElement = e.target as Element; // 将事件目标转换为Element类型
    const currentTargetElement = e.currentTarget as Element;
    if (currentTargetElement.contains(targetElement)) {
      setVisible(true);
      // if (!isPopupVisibleControlledByURL()) {
      // } else {
      //   openPopup({
      //     // popupUidUsedInURL: 'job',
      //     customActionSchema: {
      //       type: 'void',
      //       'x-uid': 'job-view',
      //       'x-action-context': {
      //         dataSource: 'main',
      //         collection: 'workflowManualTasks',
      //         doNotUpdateContext: true,
      //       },
      //       properties: {},
      //     },
      //   });
      // }
    }
    e.stopPropagation();
  }, []);

  return (
    <>
      <Card onClick={onOpen} hoverable size="small">
        <SchemaComponent
          components={{
            Space,
          }}
          schema={{
            name: 'grid',
            type: 'void',
            'x-component': 'Grid',
            properties: {
              titleRow: {
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  left: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      title: {
                        type: 'void',
                        'x-component': 'Space',
                        properties: {
                          'workflow.title': {
                            type: 'string',
                            'x-component': 'CollectionField',
                            'x-component-props': {
                              className: css`
                                color: ${token.colorTextDescription};

                                &:after {
                                  content: '>';
                                  margin-left: 4px;
                                }
                              `,
                            },
                          },
                          title: {
                            type: 'string',
                            'x-component': 'CollectionField',
                          },
                        },
                      },
                    },
                  },
                  right: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-align': 'right',
                    'x-component-props': {
                      className: css`
                        text-align: right;
                      `,
                    },
                    properties: {
                      meta: {
                        type: 'void',
                        'x-component': 'Space',
                        properties: {
                          status: {
                            type: 'number',
                            'x-component': 'CollectionField',
                          },
                          updatedAt: {
                            type: 'string',
                            'x-component': 'CollectionField',
                            'x-component-props': {
                              className: css`
                                color: ${token.colorTextDescription};
                              `,
                            },
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
      </Card>
      <PopupContextProvider visible={visible} setVisible={setVisible}>
        <Drawer />
      </PopupContextProvider>
    </>
  );
}

const StatusFilterMap = {
  pending: {
    status: JOB_STATUS.PENDING,
    'execution.status': EXECUTION_STATUS.STARTED,
  },
  completed: {
    status: JOB_STATUS.RESOLVED,
  },
};

function useTodoActionParams(status) {
  const { data: user } = useCurrentUserContext();
  const filter = StatusFilterMap[status] ?? {};
  return {
    filter: {
      ...filter,
      userId: user?.data?.id,
    },
    appends: [
      'job.id',
      'job.status',
      'job.result',
      'workflow.id',
      'workflow.title',
      'workflow.enabled',
      'execution.id',
      'execution.status',
    ],
  };
}

export const manualTodo = {
  title: `{{t("My manual tasks", { ns: "${NAMESPACE}" })}}`,
  collection: 'workflowManualTasks',
  useActionParams: useTodoActionParams,
  component: TaskItem,
};
