/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Button, Layout, Menu, Spin, Badge, Tooltip } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { CheckCircleOutlined } from '@ant-design/icons';
import classnames from 'classnames';

import {
  css,
  PinnedPluginListProvider,
  SchemaComponentContext,
  SchemaComponentOptions,
  useApp,
  useCompile,
  usePlugin,
  useRequest,
  useToken,
} from '@nocobase/client';

import PluginWorkflowClient from '.';
import { lang } from './locale';

const sideClass = css`
  height: calc(100vh - 46px);

  .ant-layout-sider-children {
    width: 200px;
    height: 100%;
  }
`;

export interface TaskTypeOptions {
  title: string;
  component?: React.ComponentType;
  children?: TaskTypeOptions[];
}

const TasksCountsContext = createContext<{ counts: Record<string, number>; total: number }>({ counts: {}, total: 0 });

function MenuLink({ type }: any) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const compile = useCompile();
  const { title } = workflowPlugin.taskTypes.get(type);
  const { counts } = useContext(TasksCountsContext);

  return (
    <Link
      to={`/admin/workflow/tasks/${type}`}
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
      `}
    >
      <span>{compile(title)}</span>
      <Badge count={counts[type] || 0} size="small" />
    </Link>
  );
}

export function WorkflowTasks() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const navigate = useNavigate();
  const { taskType } = useParams();
  const compile = useCompile();
  const {
    token: { colorBgContainer },
  } = useToken();

  const items = useMemo(
    () =>
      Array.from(workflowPlugin.taskTypes.getKeys()).map((key: string) => {
        return {
          key,
          label: <MenuLink type={key} />,
        };
      }),
    [workflowPlugin.taskTypes],
  );

  const { title, component: Component } = useMemo<any>(
    () => workflowPlugin.taskTypes.get(taskType ?? items[0]?.key) ?? {},
    [items, taskType, workflowPlugin.taskTypes],
  );

  useEffect(() => {
    if (!taskType && items[0].key) {
      navigate(`/admin/workflow/tasks/${items[0].key}`, { replace: true });
    }
  }, [items, navigate, taskType]);

  const key = taskType ?? items[0].key;

  return (
    <Layout>
      <Layout.Sider className={sideClass} theme="light">
        <Menu mode="inline" selectedKeys={[key]} items={items} style={{ height: '100%' }} />
      </Layout.Sider>
      <Layout>
        <PageHeader
          className={classnames('pageHeaderCss', 'height0')}
          style={{ background: colorBgContainer, padding: '12px 24px 0 24px' }}
          title={compile(title)}
        />
        <Layout.Content style={{ padding: '24px', minHeight: 280 }}>
          <SchemaComponentContext.Provider value={{ designable: false }}>
            {Component ? <Component /> : null}
            <Outlet />
          </SchemaComponentContext.Provider>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

function WorkflowTasksLink() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const { total } = useContext(TasksCountsContext);

  const types = Array.from(workflowPlugin.taskTypes.getKeys());
  return types.length ? (
    <Tooltip title={lang('Workflow todos')}>
      <Button>
        <Link to="/admin/workflow/tasks">
          <Badge dot={Boolean(total)}>
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

export const TasksProvider = (props: any) => {
  const app = useApp();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const onTaskUpdate = useCallback(({ detail = [] }: CustomEvent) => {
    setCounts((prev) => {
      return {
        ...prev,
        ...transform(detail),
      };
    });
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

  useEffect(() => {
    runAsync()
      .then((res) => {
        setCounts((prev) => {
          return {
            ...prev,
            ...transform(res['data']),
          };
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }, [runAsync]);

  useEffect(() => {
    app.eventBus.addEventListener('ws:message:workflow:tasks:updated', onTaskUpdate);

    return () => {
      app.eventBus.removeEventListener('ws:message:workflow:tasks:updated', onTaskUpdate);
    };
  }, [app.eventBus, onTaskUpdate]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 0;

  return (
    <TasksCountsContext.Provider value={{ total, counts }}>
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
    </TasksCountsContext.Provider>
  );
};
