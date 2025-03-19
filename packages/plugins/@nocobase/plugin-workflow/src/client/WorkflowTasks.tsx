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
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';

import {
  css,
  PinnedPluginListProvider,
  SchemaComponent,
  SchemaComponentContext,
  SchemaComponentOptions,
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

const sideClass = css`
  overflow: auto;
  position: sticky;
  top: 0;
  bottom: 0;
  height: 100%;

  .ant-layout-sider-children {
    width: 200px;
    height: 100%;
  }
`;

const contentClass = css`
  padding: 24px;
  min-height: 280px;
  overflow: auto;
`;

export interface TaskTypeOptions {
  title: string;
  collection: string;
  useActionParams: Function;
  component: React.ComponentType;
  extraActions?: React.ComponentType;
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
      to={`/admin/workflow/tasks/${type}`}
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

const TASK_STATUS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
};

function StatusTabs() {
  const navigate = useNavigate();
  const { taskType, status = TASK_STATUS.PENDING } = useParams();
  const type = useCurrentTaskType();
  const { extraActions: ExtraActions } = type;
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
        ExtraActions
          ? {
              right: <ExtraActions />,
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

export function WorkflowTasks() {
  const compile = useCompile();
  const { setTitle } = useDocumentTitle();
  const navigate = useNavigate();
  const { taskType, status = TASK_STATUS.PENDING } = useParams();
  const {
    token: { colorBgContainer },
  } = useToken();

  const items = useTaskTypeItems();

  const { title, collection, useActionParams, component: Component } = useCurrentTaskType();

  const params = useActionParams(status);

  useEffect(() => {
    setTitle?.(`${lang('Workflow todos')}${title ? `: ${compile(title)}` : ''}`);
  }, [taskType, status, setTitle, title, compile]);

  useEffect(() => {
    if (!taskType) {
      navigate(`/admin/workflow/tasks/${items[0].key}/${status}`, { replace: true });
    }
  }, [items, navigate, status, taskType]);

  const typeKey = taskType ?? items[0].key;

  return (
    <Layout className={layoutClass}>
      <Layout.Sider className={sideClass} theme="light">
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
                action: 'list',
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
                      background: colorBgContainer,
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
                          'x-component': Component,
                          'x-read-pretty': true,
                        },
                      },
                    },
                  },
                },
              },
            }}
          />
          <Outlet />
        </SchemaComponentContext.Provider>
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
        <Link to={`/admin/workflow/tasks/${types[0]}`} onClick={reload}>
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

export const TasksProvider = (props: any) => {
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
};
