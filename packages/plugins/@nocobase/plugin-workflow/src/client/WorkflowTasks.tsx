/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useEffect, useMemo } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Button, Layout, Menu, Spin, Badge, theme } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { CheckCircleOutlined } from '@ant-design/icons';
import classnames from 'classnames';

import {
  css,
  PinnedPluginListProvider,
  SchemaComponentContext,
  SchemaComponentOptions,
  useCompile,
  usePlugin,
} from '@nocobase/client';

import PluginWorkflowClient from '.';

const sideClass = css`
  height: calc(100vh - 46px);

  .ant-layout-sider-children {
    width: 200px;
    height: 100%;
  }
`;

export interface TaskTypeOptions {
  title: string;
  useCountRequest?: Function;
  component?: React.ComponentType;
  children?: TaskTypeOptions[];
}

function MenuLink({ type }: any) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const compile = useCompile();
  const { title, useCountRequest } = workflowPlugin.taskTypes.get(type);
  const { data, loading, run } = useCountRequest?.() || { loading: false };
  useEffect(() => {
    run?.();
  }, [run]);

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
      {loading ? <Spin /> : <Badge count={data?.data || 0} />}
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
  } = theme.useToken();

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

  const types = Array.from(workflowPlugin.taskTypes.getKeys());
  return types.length ? (
    <Button
      className={css`
        padding: 0;
        display: inline-flex;
        vertical-align: middle;
        a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;

          .anticon {
            display: inline-block;
            vertical-align: middle;
            line-height: 1em;
          }
        }
      `}
    >
      <Link to="/admin/workflow/tasks">
        <CheckCircleOutlined />
      </Link>
    </Button>
  ) : null;
}

export const TasksProvider = (props: any) => {
  return (
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
};
