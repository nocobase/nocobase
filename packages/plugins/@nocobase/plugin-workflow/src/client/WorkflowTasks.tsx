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
import { Button, Layout, Menu, Spin, Badge, theme, Tooltip, Tabs, Space } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { CheckCircleOutlined } from '@ant-design/icons';
import classnames from 'classnames';

import {
  css,
  List,
  PinnedPluginListProvider,
  SchemaComponent,
  SchemaComponentContext,
  SchemaComponentOptions,
  useCompile,
  useDocumentTitle,
  usePlugin,
} from '@nocobase/client';

import PluginWorkflowClient from '.';
import { lang, NAMESPACE } from './locale';
import { ISchema } from '@formily/react';

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
  useCountRequest?: Function;
  collection: string;
  useActionParams: Function;
  // schema: ISchema;
  component?: React.ComponentType;
  // children?: TaskTypeOptions[];
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
      to={`/admin/workflow/tasks/${type}/${TASK_STATUS.PENDING}`}
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

function ExtraActions() {
  return (
    <SchemaComponent
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
            },
          },
          filter: {
            type: 'void',
            title: '{{t("Filter")}}',
            'x-component': 'Filter.Action',
            'x-use-component-props': 'useFilterActionProps',
            'x-component-props': {
              icon: 'FilterOutlined',
            },
          },
        },
      }}
    />
  );
}

const TASK_STATUS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
};

function StatusTabs(props) {
  const navigate = useNavigate();
  const { taskType, status = TASK_STATUS.PENDING } = useParams();
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
      tabBarExtraContent={{
        right: <ExtraActions />,
      }}
    />
  );
}

export function WorkflowTasks() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const compile = useCompile();
  const { setTitle } = useDocumentTitle();
  const navigate = useNavigate();
  const { taskType, status = TASK_STATUS.PENDING } = useParams();
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

  const {
    title,
    collection,
    useActionParams,
    component: Component,
  } = useMemo<any>(
    () => workflowPlugin.taskTypes.get(taskType ?? items[0]?.key) ?? {},
    [items, taskType, workflowPlugin.taskTypes],
  );

  const params = useActionParams(status);

  useEffect(() => {
    setTitle?.(`${lang('Workflow todo')}${title ? `: ${compile(title)}` : ''}`);
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

  const types = Array.from(workflowPlugin.taskTypes.getKeys());
  return types.length ? (
    <Tooltip title={lang('Workflow todos')}>
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
        <Link to={`/admin/workflow/tasks/${types[0]}/${TASK_STATUS.PENDING}`}>
          <CheckCircleOutlined />
        </Link>
      </Button>
    </Tooltip>
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
