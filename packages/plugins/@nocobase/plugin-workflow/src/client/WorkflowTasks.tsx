/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { CheckCircleOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { Badge, Button, Layout, Menu, Tabs, Tooltip } from 'antd';
import classnames from 'classnames';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  ActionContextProvider,
  CollectionRecordProvider,
  css,
  PinnedPluginListProvider,
  SchemaComponent,
  SchemaComponentContext,
  SchemaComponentOptions,
  useAPIClient,
  useApp,
  useCompile,
  useDocumentTitle,
  useIsLoggedIn,
  usePlugin,
  useRequest,
  useToken,
} from '@nocobase/client';

import PluginWorkflowClient from '.';
import { lang, NAMESPACE } from './locale';

const layoutClass = css`
  height: 100%;
  overflow: hidden;
`;

const contentClass = css`
  min-height: 280px;
  overflow: auto;
`;

export interface TaskTypeOptions {
  title: string;
  collection: string;
  action: string;
  useActionParams: Function;
  Actions?: React.ComponentType;
  Item: React.ComponentType;
  Detail: React.ComponentType;
  // children?: TaskTypeOptions[];
}

const TasksCountsContext = createContext<{ reload: () => void; counts: Record<string, number>; total: number }>({
  reload() {},
  counts: {},
  total: 0,
});

function MenuLink({ type }: any) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const compile = useCompile();
  const { title } = workflowPlugin.taskTypes.get(type);
  const { counts } = useContext(TasksCountsContext);
  const typeTitle = compile(title);

  return (
    <Link
      to={`/admin/workflow/tasks/${type}/${TASK_STATUS.PENDING}`}
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        overflow: hidden;

        > span:first-child {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}
    >
      <span>{typeTitle}</span>
      <Badge count={counts[type] || 0} size="small" />
    </Link>
  );
}

export const TASK_STATUS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
};

function StatusTabs() {
  const navigate = useNavigate();
  const { taskType, status = TASK_STATUS.PENDING } = useParams();
  const type = useCurrentTaskType();
  const { Actions } = type;
  return (
    <Tabs
      activeKey={status}
      onChange={(activeKey) => {
        navigate(`/admin/workflow/tasks/${taskType}/${activeKey}`);
      }}
      className={css`
        &.ant-tabs-top > .ant-tabs-nav {
          margin-bottom: 0;
        }
      `}
      items={[
        {
          key: TASK_STATUS.PENDING,
          label: lang('Pending'),
        },
        {
          key: TASK_STATUS.COMPLETED,
          label: lang('Completed'),
        },
        {
          key: TASK_STATUS.ALL,
          label: lang('All'),
        },
      ]}
      tabBarExtraContent={
        Actions
          ? {
              right: <Actions />,
            }
          : {}
      }
    />
  );
}

function useTaskTypeItems() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);

  return useMemo(
    () =>
      Array.from(workflowPlugin.taskTypes.getKeys()).map((key: string) => {
        return {
          key,
          label: <MenuLink type={key} />,
        };
      }),
    [workflowPlugin.taskTypes],
  );
}

function useCurrentTaskType() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const { taskType } = useParams();
  const items = useTaskTypeItems();
  return useMemo<any>(
    () => workflowPlugin.taskTypes.get(taskType ?? items[0]?.key) ?? {},
    [items, taskType, workflowPlugin.taskTypes],
  );
}

function PopupContext(props: any) {
  const { popupId } = useParams();
  const { record } = usePopupRecordContext();
  const navigate = useNavigate();
  if (!popupId) {
    return null;
  }
  return (
    <ActionContextProvider
      visible={Boolean(popupId)}
      setVisible={(visible) => {
        if (!visible) {
          navigate(-1);
        }
      }}
      openMode="modal"
    >
      <CollectionRecordProvider record={record}>{props.children}</CollectionRecordProvider>
    </ActionContextProvider>
  );
}

const PopupRecordContext = createContext<any>({ record: null, setRecord: (record) => {} });
export function usePopupRecordContext() {
  return useContext(PopupRecordContext);
}

export function WorkflowTasks() {
  const compile = useCompile();
  const { setTitle } = useDocumentTitle();
  const navigate = useNavigate();
  const apiClient = useAPIClient();
  const { taskType, status = TASK_STATUS.PENDING, popupId } = useParams();
  const { token } = useToken();
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const items = useTaskTypeItems();

  const { title, collection, action = 'list', useActionParams, Item, Detail } = useCurrentTaskType();

  const params = useActionParams(status);

  useEffect(() => {
    setTitle?.(`${lang('Workflow todos')}${title ? `: ${compile(title)}` : ''}`);
  }, [taskType, status, setTitle, title, compile]);

  useEffect(() => {
    if (!taskType) {
      navigate(`/admin/workflow/tasks/${items[0].key}/${status}`, { replace: true });
    }
  }, [items, navigate, status, taskType]);

  useEffect(() => {
    if (popupId && !currentRecord) {
      apiClient
        .resource(collection)
        .get({
          filterByTk: popupId,
        })
        .then((res) => {
          if (res.data?.data) {
            setCurrentRecord(res.data.data);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [popupId, collection, currentRecord, apiClient]);

  const typeKey = taskType ?? items[0].key;

  return (
    <Layout className={layoutClass}>
      <Layout.Sider theme="light" breakpoint="md" collapsedWidth="0" zeroWidthTriggerStyle={{ top: 24 }}>
        <Menu mode="inline" selectedKeys={[typeKey]} items={items} style={{ height: '100%' }} />
      </Layout.Sider>
      <Layout
        className={css`
          > div {
            height: 100%;
            overflow: hidden;

            > .ant-formily-layout {
              height: 100%;

              > div {
                display: flex;
                flex-direction: column;
                height: 100%;
              }
            }
          }
        `}
      >
        <PopupRecordContext.Provider
          value={{
            record: currentRecord,
            setRecord: setCurrentRecord,
          }}
        >
          <SchemaComponentContext.Provider value={{ designable: false }}>
            <SchemaComponent
              components={{
                Layout,
                PageHeader,
                StatusTabs,
              }}
              schema={{
                name: `${taskType}-${status}`,
                type: 'void',
                'x-decorator': 'List.Decorator',
                'x-decorator-props': {
                  collection,
                  action,
                  params: {
                    pageSize: 20,
                    sort: ['-createdAt'],
                    ...params,
                  },
                },
                properties: {
                  header: {
                    type: 'void',
                    'x-component': 'PageHeader',
                    'x-component-props': {
                      className: classnames('pageHeaderCss'),
                      style: {
                        background: token.colorBgContainer,
                        padding: '12px 24px 0 24px',
                      },
                      title,
                    },
                    properties: {
                      tabs: {
                        type: 'void',
                        'x-component': 'StatusTabs',
                      },
                    },
                  },
                  content: {
                    type: 'void',
                    'x-component': 'Layout.Content',
                    'x-component-props': {
                      className: contentClass,
                      style: {
                        padding: `${token.paddingPageVertical}px ${token.paddingPageHorizontal}px`,
                      },
                    },
                    properties: {
                      list: {
                        type: 'array',
                        'x-component': 'List',
                        'x-component-props': {
                          className: css`
                            > .itemCss:not(:last-child) {
                              border-bottom: none;
                            }
                          `,
                          locale: {
                            emptyText: `{{ t("No data yet", { ns: "${NAMESPACE}" }) }}`,
                          },
                        },
                        properties: {
                          item: {
                            type: 'object',
                            'x-decorator': 'List.Item',
                            'x-component': Item,
                            'x-read-pretty': true,
                          },
                        },
                      },
                    },
                  },
                  popup: {
                    type: 'void',
                    'x-decorator': PopupContext,
                    'x-component': Detail,
                  },
                },
              }}
            />
          </SchemaComponentContext.Provider>
        </PopupRecordContext.Provider>
      </Layout>
    </Layout>
  );
}

function WorkflowTasksLink() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const { reload, total } = useContext(TasksCountsContext);

  const types = Array.from(workflowPlugin.taskTypes.getKeys());
  return types.length ? (
    <Tooltip title={lang('Workflow todos')}>
      <Button>
        <Link to={`/admin/workflow/tasks/${types[0]}/${TASK_STATUS.PENDING}`} onClick={reload}>
          <Badge count={total} size="small">
            <CheckCircleOutlined />
          </Badge>
        </Link>
      </Button>
    </Tooltip>
  ) : null;
}

function transform(detail) {
  return detail.reduce((result, stats) => {
    result[stats.type] = stats.count;
    return result;
  }, {});
}

function TasksCountsProvider(props: any) {
  const app = useApp();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const onTaskUpdate = useCallback(({ detail = [] }: CustomEvent) => {
    setCounts(transform(detail));
  }, []);

  const { runAsync } = useRequest(
    {
      resource: 'workflowTasks',
      action: 'countMine',
    },
    {
      manual: true,
    },
  );

  const reload = useCallback(() => {
    runAsync()
      .then((res) => {
        setCounts(transform(res['data']));
      })
      .catch((err) => {
        console.error(err);
      });
  }, [runAsync]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    app.eventBus.addEventListener('ws:message:workflow:tasks:updated', onTaskUpdate);

    return () => {
      app.eventBus.removeEventListener('ws:message:workflow:tasks:updated', onTaskUpdate);
    };
  }, [app.eventBus, onTaskUpdate]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 0;

  return <TasksCountsContext.Provider value={{ reload, total, counts }}>{props.children}</TasksCountsContext.Provider>;
}

export function TasksProvider(props: any) {
  const isLoggedIn = useIsLoggedIn();

  const content = (
    <PinnedPluginListProvider
      items={{
        todo: { component: 'WorkflowTasksLink', pin: true, snippet: '*' },
      }}
    >
      <SchemaComponentOptions
        components={{
          WorkflowTasksLink,
        }}
      >
        {props.children}
      </SchemaComponentOptions>
    </PinnedPluginListProvider>
  );

  return isLoggedIn ? <TasksCountsProvider>{content}</TasksCountsProvider> : content;
}
