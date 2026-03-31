/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAntdToken } from 'antd-style';
import { Card, ConfigProvider, Descriptions, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

import {
  SchemaComponentContext,
  useCollectionRecordData,
  SchemaComponent,
  css,
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
import { useTempAssociationSources } from './hooks/useTempAssociationSources';

import { NAMESPACE, TASK_STATUS, TASK_TYPE_CC } from '../common/constants';
import { useTranslation } from 'react-i18next';
import { lang } from './locale';
import { RemoteFlowModelRenderer } from './flow/RemoteFlowModelRenderer';
import { CCTaskCardDetailsModel } from './models/CCTaskCardDetailsModel';

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

function useReadActionProps() {
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
  const pending = counts[TASK_TYPE_CC]?.pending;
  return {
    ...props,
    disabled: pending === 0,
  };
}

function FlowContextProvider() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const api = useAPIClient();
  const { id } = useCollectionRecordData() || {};
  const [flowContext, setFlowContext] = useState<any>(null);
  const [record, setRecord] = useState<any>(useCollectionRecordData());
  const [node, setNode] = useState<any>(null);
  const currentNode = flowContext?.nodes?.find((item) => item.id === node?.id) ?? node;
  const availableUpstreams = useAvailableUpstreams(currentNode);
  const tempAssociationSources = useTempAssociationSources(flowContext?.workflow, availableUpstreams);

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

  // V2: 使用 FlowModel 渲染
  const ccUid = node?.config?.ccUid;
  if (ccUid && node && flowContext) {
    const trigger = workflowPlugin.triggers.get(flowContext.workflow.type);
    const upstreams = availableUpstreams;

    return (
      <CollectionRecordProvider record={record}>
        <FlowContext.Provider value={flowContext}>
          <NodeContext.Provider value={node}>
            <RemoteFlowModelRenderer
              uid={ccUid}
              onModelLoaded={(model) => {
                model.context.defineProperty('flowSettingsEnabled', { value: false });
                model.context.defineProperty('disableBlockGridPadding', { value: true });
                model.context.defineProperty('view', {
                  value: {
                    inputArgs: {
                      flowContext,
                      availableUpstreams: upstreams,
                      trigger,
                      node,
                    },
                  },
                });
                model.context.defineProperty('workflow', {
                  value: flowContext.workflow,
                });
                model.context.defineProperty('nodes', {
                  value: flowContext.nodes,
                });
                model.context.defineProperty('tempAssociationSources', {
                  value: tempAssociationSources,
                  cache: false,
                });
              }}
            />
          </NodeContext.Provider>
        </FlowContext.Provider>
      </CollectionRecordProvider>
    );
  }

  // V1: 使用 RemoteSchemaComponent 渲染
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const upstreams = availableUpstreams;
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

const getUpstreams = (currentNode: any, nodes: any[]) => {
  if (!currentNode || !nodes) {
    return [];
  }
  const result = [];
  const upstreamNode = nodes.find((node) => node.id === currentNode.upstreamId);
  if (upstreamNode) {
    result.push(upstreamNode, ...getUpstreams(upstreamNode, nodes));
  }
  return result;
};

function TaskItem() {
  const token = useAntdToken();
  const record = useCollectionRecordData();
  const navigate = useNavigate();
  const { setRecord } = usePopupRecordContext();

  const onOpen = useCallback(
    (e: React.MouseEvent) => {
      const targetElement = e.target as Element;
      const currentTargetElement = e.currentTarget as Element;
      if (currentTargetElement.contains(targetElement)) {
        setRecord(record);
        navigate(`./${record.id}`);
      }
      e.stopPropagation();
    },
    [navigate, record, setRecord],
  );

  // V2: 使用 FlowModel 任务卡片渲染
  const taskCardUid = record.node?.config?.taskCardUid;

  const availableUpstreams = getUpstreams(record.node, record.workflow?.nodes);
  const tempAssociationSources = useTempAssociationSources(record.workflow, availableUpstreams);

  const onModelLoaded = useCallback(
    (model: CCTaskCardDetailsModel) => {
      model.setDecoratorProps({ onClick: onOpen, hoverable: true });
      model.getCurrentRecord = () => record;
      model.context.defineProperty('workflow', {
        get: () => record.workflow,
        cache: false,
      });
      model.context.defineProperty('nodes', {
        get: () => record.workflow?.nodes ?? [],
        cache: false,
      });
      model.context.defineProperty('tempAssociationSources', {
        get: () => tempAssociationSources,
        cache: false,
      });
    },
    [record, onOpen, tempAssociationSources],
  );

  const mapModel = useCallback((model) => model.clone(), []);
  const taskCardReloadKey = record.node?.updatedAt?.valueOf?.() ?? record.node?.updatedAt;

  if (taskCardUid) {
    return (
      <RemoteFlowModelRenderer
        uid={taskCardUid}
        onModelLoaded={onModelLoaded}
        mapModel={mapModel}
        reloadKey={taskCardReloadKey}
      />
    );
  }

  // V1: 使用默认 Card 渲染
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
  const filter = StatusFilterMap[status] ?? {};
  return {
    filter,
    appends: [
      'node.id',
      'node.title',
      'node.updatedAt',
      'node.config',
      'workflow.id',
      'workflow.title',
      'workflow.enabled',
      'workflow.config',
      'workflow.nodes',
      'workflow.nodes.title',
      'workflow.nodes.key',
      'workflow.nodes.config',
      'execution.id',
      'execution.status',
    ],
    except: ['workflow.options', 'execution.context', 'execution.output'],
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
            title: `{{t("Refresh", { ns: "${NAMESPACE}" })}}`,
            'x-component': 'Action',
            'x-use-component-props': 'useRefreshActionProps',
            'x-component-props': {
              icon: 'ReloadOutlined',
              ...props,
            },
          },
          filter: {
            type: 'void',
            title: `{{t("Filter", { ns: "${NAMESPACE}" })}}`,
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
  key: TASK_TYPE_CC,
  title: `{{t("CC to me", { ns: "${NAMESPACE}" })}}`,
  collection: 'workflowCcTasks',
  action: 'listMine',
  useActionParams: useTodoActionParams,
  Actions: TodoExtraActions,
  Item: TaskItem,
  Detail: Drawer,
  getPopupRecord: (apiClient, { params }) =>
    apiClient.resource('workflowCcTasks').get({
      ...params,
      appends: ['node', 'workflow', 'workflow.nodes', 'execution', 'execution.jobs'],
    }),
};
