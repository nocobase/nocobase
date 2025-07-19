/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useAntdToken } from 'antd-style';
import { Card, ConfigProvider, Descriptions, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

import {
  SchemaComponentContext,
  useCollectionRecordData,
  SchemaComponent,
  css,
  useCurrentUserContext,
  useAPIClient,
  usePlugin,
  useFormBlockContext,
  RemoteSchemaComponent,
  CollectionRecordProvider,
  useActionContext,
  useListBlockContext,
} from '@nocobase/client';
import PluginWorkflowClient, {
  DetailsBlockProvider,
  FlowContext,
  linkNodes,
  NodeContext,
  useAvailableUpstreams,
  usePopupRecordContext,
  useTasksCountsContext,
  WorkflowTitle,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE, TASK_STATUS, TASK_TYPE_CC } from '../common/constants';
import { useTranslation } from 'react-i18next';
import { lang } from './locale';

function useDetailsBlockProps() {
  const { form } = useFormBlockContext();
  return { form };
}

function useReadAction() {
  const record = useCollectionRecordData();
  const ctx = useActionContext();
  const api = useAPIClient();
  const { id } = useCollectionRecordData();
  const { service } = useListBlockContext() || {};
  const action = record.status ? 'unread' : 'read';
  return {
    async run() {
      try {
        await api.resource('workflowCcTasks')[action]({
          filterByTk: id,
        });
        ctx.setVisible(false);
        ctx.setSubmitted(true);
        service?.refresh?.();
      } catch (error) {
        console.error('Failed to mark task as read:', error);
      }
    },
  };
}

function useReadActionProps(props) {
  const record = useCollectionRecordData();
  return record.status
    ? {
        title: lang('Mark as unread'),
      }
    : {
        type: 'primary',
        title: lang('Mark as read'),
      };
}

function useReadAllAction() {
  const api = useAPIClient();
  const ctx = useListBlockContext();

  return {
    async run() {
      try {
        await api.resource('workflowCcTasks').read();
        ctx?.service?.refresh?.();
      } catch (error) {
        console.error('Failed to mark task as read:', error);
      }
    },
  };
}

function useReadAllActionProps(props) {
  const { counts } = useTasksCountsContext();
  return {
    ...props,
    disabled: !counts[TASK_TYPE_CC].pending,
  };
}

function FlowContextProvider(props) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const api = useAPIClient();
  const { id } = useCollectionRecordData() || {};
  const [flowContext, setFlowContext] = useState<any>(null);
  const [record, setRecord] = useState<any>(useCollectionRecordData());
  const [node, setNode] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    api
      .resource('workflowCcTasks')
      .get?.({
        filterByTk: id,
        appends: ['node', 'job', 'workflow', 'workflow.nodes', 'execution', 'execution.jobs'],
      })
      .then(({ data }) => {
        const { node, workflow: { nodes = [], ...workflow } = {}, execution } = data?.data ?? {};
        linkNodes(nodes);
        setNode(node);
        setFlowContext({
          workflow,
          nodes,
          execution,
        });
        setRecord(data?.data);
        return;
      });
  }, [api, id]);

  const upstreams = useAvailableUpstreams(flowContext?.nodes.find((item) => item.id === node.id));
  const nodeComponents = upstreams.reduce(
    (components, { type }) => Object.assign(components, workflowPlugin.instructions.get(type).components),
    {},
  );

  return node && flowContext ? (
    <CollectionRecordProvider record={record}>
      <FlowContext.Provider value={flowContext}>
        <NodeContext.Provider value={node}>
          <RemoteSchemaComponent
            components={{
              DetailsBlockProvider,
              ...nodeComponents,
            }}
            scope={{
              useDetailsBlockProps,
            }}
            uid={node.config?.ccDetail}
            noForm
          />
        </NodeContext.Provider>
      </FlowContext.Provider>
    </CollectionRecordProvider>
  ) : (
    <Spin />
  );
}

function Drawer() {
  const ctx = useContext(SchemaComponentContext);
  const record = useCollectionRecordData();
  const { id, node, workflow, status } = record || {};

  return record ? (
    <SchemaComponentContext.Provider value={{ ...ctx, reset() {}, designable: false }}>
      <SchemaComponent
        components={{
          FlowContextProvider,
        }}
        scope={{
          useReadAction,
          useReadActionProps,
        }}
        schema={{
          type: 'void',
          name: `manual-detail-drawer-${id}-${status}`,
          'x-component': 'Action.Container',
          'x-component-props': {
            className: css`
              .ant-modal-content {
                background: var(--nb-box-bg);
              }
              .ant-modal-header {
                background: none;
              }
            `,
          },
          title: node?.title ?? `${workflow?.title} - ${`#${node?.id}`}`,
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
                  'x-component': 'ActionBar',
                  'x-component-props': {
                    style: {
                      marginBottom: 0,
                    },
                  },
                  properties: {
                    read: {
                      type: 'void',
                      'x-component': 'Action',
                      'x-use-component-props': 'useReadActionProps',
                      'x-component-props': {
                        useAction: '{{useReadAction}}',
                      },
                    },
                  },
                },
              },
            },
          },
        }}
      />
    </SchemaComponentContext.Provider>
  ) : null;
}

function ContentDetail(props) {
  const { t } = useTranslation();
  const token = useAntdToken();
  return (
    <ConfigProvider
      theme={{
        token: {
          fontSizeLG: 14,
        },
      }}
    >
      <Descriptions
        {...props}
        column={1}
        items={[
          {
            key: 'createdAt',
            label: t('Created at'),
            children: (
              <SchemaComponent
                schema={{
                  name: 'createdAt',
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                }}
              />
            ),
          },
          {
            key: 'status',
            label: t('Status', { ns: 'workflow' }),
            children: (
              <SchemaComponent
                components={
                  {
                    // TaskStatusColumn,
                  }
                }
                schema={{
                  name: 'status',
                  type: 'number',
                  // 'x-decorator': 'TaskStatusColumn',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                }}
              />
            ),
          },
        ]}
        className={css`
          .ant-descriptions-header {
            margin-bottom: 0.5em;
            .ant-descriptions-extra {
              color: ${token.colorTextDescription};
            }
          }
          .ant-descriptions-item-label {
            width: 6em;
          }
        `}
      />
    </ConfigProvider>
  );
}

function RecordTitle(props) {
  const record = useCollectionRecordData();
  if (Array.isArray(props.dataIndex)) {
    for (const index of props.dataIndex) {
      const title = get(record, index);
      if (title) {
        return title;
      }
    }
  }
  return get(record, props.dataIndex);
}

function ContentDetailWithTitle(props) {
  return (
    <ContentDetail
      title={<RecordTitle dataIndex={['title', 'node.title']} />}
      extra={<RecordTitle dataIndex={'workflow.title'} />}
    />
  );
}

function TaskItem() {
  const token = useAntdToken();
  const record = useCollectionRecordData();
  const navigate = useNavigate();
  const { setRecord } = usePopupRecordContext();
  const onOpen = useCallback(
    (e: React.MouseEvent) => {
      const targetElement = e.target as Element; // 将事件目标转换为Element类型
      const currentTargetElement = e.currentTarget as Element;
      if (currentTargetElement.contains(targetElement)) {
        setRecord(record);
        navigate(`./${record.id}`);
      }
      e.stopPropagation();
    },
    [navigate, record, setRecord],
  );

  return (
    <Card
      onClick={onOpen}
      hoverable
      size="small"
      title={record.title}
      extra={<WorkflowTitle {...record.workflow} />}
      className={css`
        .ant-card-extra {
          color: ${token.colorTextDescription};
        }
      `}
    >
      <ContentDetail />
    </Card>
  );
}

const StatusFilterMap = {
  pending: {
    status: TASK_STATUS.UNREAD,
  },
  completed: {
    status: TASK_STATUS.READ,
  },
};

function useTodoActionParams(status) {
  const { data: user } = useCurrentUserContext();
  const filter = StatusFilterMap[status] ?? {};
  return {
    filter,
    appends: [
      'node.id',
      'node.title',
      'workflow.id',
      'workflow.title',
      'workflow.enabled',
      'execution.id',
      'execution.status',
    ],
    except: ['node.config', 'workflow.config', 'workflow.options', 'execution.context', 'execution.output'],
  };
}

function TodoExtraActions(props) {
  return (
    <SchemaComponent
      scope={{
        useReadAllAction,
        useReadAllActionProps,
      }}
      schema={{
        name: 'actions',
        type: 'void',
        'x-component': 'ActionBar',
        properties: {
          refresh: {
            type: 'void',
            title: '{{ t("Refresh") }}',
            'x-component': 'Action',
            'x-use-component-props': 'useRefreshActionProps',
            'x-component-props': {
              icon: 'ReloadOutlined',
              ...props,
            },
          },
          filter: {
            type: 'void',
            title: '{{t("Filter")}}',
            'x-component': 'Filter.Action',
            'x-use-component-props': 'useFilterActionProps',
            'x-component-props': {
              icon: 'FilterOutlined',
              ...props,
            },
            default: {
              $and: [{ title: { $includes: '' } }, { 'workflow.title': { $includes: '' } }],
            },
          },
          readAll: {
            type: 'void',
            title: `{{t("Mark all as read", { ns: "${NAMESPACE}" })}}`,
            'x-component': 'Action',
            'x-use-component-props': 'useReadAllActionProps',
            'x-component-props': {
              useAction: '{{useReadAllAction}}',
              icon: 'CheckOutlined',
              ...props,
            },
          },
        },
      }}
    />
  );
}

export const ccTodo = {
  title: `{{t("CC to me", { ns: "${NAMESPACE}" })}}`,
  collection: 'workflowCcTasks',
  action: 'listMine',
  useActionParams: useTodoActionParams,
  Actions: TodoExtraActions,
  Item: TaskItem,
  Detail: Drawer,
};
