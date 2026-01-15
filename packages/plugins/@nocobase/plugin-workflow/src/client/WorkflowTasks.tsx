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
import { Badge, Button, Flex, Layout, Menu, Result, Segmented, Tabs, theme, Tooltip } from 'antd';
import classnames from 'classnames';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  ActionContextProvider,
  APIClient,
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
  useMobileLayout,
  useMobilePage,
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

export interface TaskTypeOptions {
  key: string;
  title: string;
  collection: string;
  action?: string;
  useActionParams: Function;
  Actions?: React.ComponentType;
  Item: React.ComponentType;
  Detail: React.ComponentType;
  getPopupRecord?: (apiClient: APIClient, { params }: { params: any }) => Promise<any>;
  // children?: TaskTypeOptions[];
  alwaysShow?: boolean;
}

type Stats = Record<string, { pending: number; all: number }>;

export const TasksCountsContext = createContext<{ reload: () => void; counts: Stats; total: number }>({
  reload() {},
  counts: {},
  total: 0,
});

export function useTasksCountsContext() {
  return useContext(TasksCountsContext);
}

function MenuLink({ type, isMobile }: any) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const compile = useCompile();
  const { title } = workflowPlugin.taskTypes.get(type);
  const { counts } = useContext(TasksCountsContext);
  const typeTitle = compile(title);
  const mobilePage = useMobilePage();

  return (
    <Link
      replace
      to={
        mobilePage
          ? `/page/workflow-tasks/${type}/${TASK_STATUS.PENDING}`
          : `/admin/workflow/tasks/${type}/${TASK_STATUS.PENDING}`
      }
      className={css`
        display: flex;
        gap: 0.5em;
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
      <Badge count={counts[type]?.pending || 0} size="small" />
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
  const { isMobileLayout } = useMobileLayout();
  const mobilePage = useMobilePage();
  const onSwitchTab = useCallback(
    (key: string) => {
      if (!type?.key) {
        return;
      }
      navigate(mobilePage ? `/page/workflow-tasks/${type.key}/${key}` : `/admin/workflow/tasks/${type.key}/${key}`);
    },
    [navigate, mobilePage, type],
  );
  const { Actions } = type;
  const isMobile = mobilePage || isMobileLayout;
  return isMobile ? (
    <Flex justify="space-between">
      <Segmented
        defaultValue={status}
        options={[
          {
            value: TASK_STATUS.PENDING,
            label: lang('Pending'),
          },
          {
            value: TASK_STATUS.COMPLETED,
            label: lang('Completed'),
          },
          {
            value: TASK_STATUS.ALL,
            label: lang('All'),
          },
        ]}
        onChange={onSwitchTab}
      />
      <Actions onlyIcon={isMobile} />
    </Flex>
  ) : (
    <Tabs
      activeKey={status}
      onChange={onSwitchTab}
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

export function useTaskTypeItems() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const types = workflowPlugin.taskTypes.getKeys();

  return useMemo(() => Array.from(types), [types]);
}

export function useAvailableTaskTypeItems(isMobile = false) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const types = useTaskTypeItems();
  const { counts } = useContext(TasksCountsContext);

  return useMemo(
    () =>
      types
        .filter((key: string) => workflowPlugin.taskTypes.get(key)?.alwaysShow || Boolean(counts[key]?.all))
        .map((key: string) => {
          return {
            key,
            label: <MenuLink type={key} isMobile={isMobile} />,
          };
        }),
    [counts, types, workflowPlugin.taskTypes, isMobile],
  );
}

function useCurrentTaskType() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const { taskType } = useParams();
  const items = useTaskTypeItems();
  return useMemo<any>(
    () => workflowPlugin.taskTypes.get(taskType ?? items[0]) ?? {},
    [items, taskType, workflowPlugin.taskTypes],
  );
}

function PopupContext(props: any) {
  const { taskType, status = TASK_STATUS.PENDING, popupId } = useParams();
  const { record } = usePopupRecordContext();
  const navigate = useNavigate();
  const { isMobileLayout } = useMobileLayout();
  const mobilePage = useMobilePage();
  const setVisible = useCallback(
    (visible: boolean) => {
      if (!visible) {
        if (window.history.state.idx) {
          navigate(-1);
        } else {
          navigate(
            mobilePage ? `/page/workflow-tasks/${taskType}/${status}` : `/admin/workflow/tasks/${taskType}/${status}`,
          );
        }
      }
    },
    [mobilePage, navigate, status, taskType],
  );
  if (!popupId) {
    return null;
  }

  return record ? (
    <ActionContextProvider visible={Boolean(popupId)} setVisible={setVisible} openMode="modal" openSize="large">
      <CollectionRecordProvider record={record}>{props.children}</CollectionRecordProvider>
    </ActionContextProvider>
  ) : null;
}

const PopupRecordContext = createContext<any>({ record: null, setRecord: (record) => {} });
export function usePopupRecordContext() {
  return useContext(PopupRecordContext);
}

export function TaskPageContent() {
  const apiClient = useAPIClient();
  const { taskType, status = TASK_STATUS.PENDING, popupId } = useParams();
  const { isMobileLayout } = useMobileLayout();
  const mobilePage = useMobilePage();
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const { token } = theme.useToken();
  const type = useCurrentTaskType();
  const { title, collection, action = 'list', useActionParams, Item, Detail, getPopupRecord } = type;
  const params = useActionParams?.(status);

  // useEffect(() => {
  //   if (!taskType) {
  //     navigate(`${items[0].key}/${status}`, {
  //       replace: true,
  //     });
  //   }
  // }, [items, mobilePage, navigate, status, taskType]);

  useEffect(() => {
    if (popupId && !currentRecord) {
      let load;
      if (getPopupRecord) {
        load = getPopupRecord(apiClient, { params: { filterByTk: popupId } });
      } else {
        load = apiClient.resource(collection).get({
          // ...params,
          filterByTk: popupId,
        });
      }
      load
        .then((res) => {
          if (res.data?.data) {
            setCurrentRecord(res.data.data);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [popupId, collection, currentRecord, apiClient, getPopupRecord, params]);

  // const typeKey = taskType ?? items[0].key;

  const isMobile = mobilePage || isMobileLayout;

  const contentClass = css`
    height: 100%;
    overflow: hidden;
    padding: 0;

    .nb-list {
      height: 100%;
      overflow: hidden;

      .nb-list-container {
        height: 100%;
        overflow: hidden;

        .ant-formily-layout {
          height: 100%;
          overflow: hidden;

          .ant-list {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;

            .ant-spin-nested-loading {
              flex-grow: 1;
              overflow: hidden;

              .ant-spin-container {
                height: 100%;
                overflow: auto;
                padding: ${isMobile ? '0.5em' : `${token.paddingContentHorizontalLG}px`};
              }
            }

            .itemCss:not(:last-child) {
              border-bottom: none;
            }
          }

          .ant-list-pagination {
            margin-top: 0;
            padding: ${isMobile
              ? '0.5em'
              : `${token.paddingContentHorizontal}px ${token.paddingContentHorizontalLG}px`};
            border-top: 1px solid ${token.colorBorderSecondary};
          }
        }
      }
    }
  `;

  return type?.key ? (
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
                  className: classnames(
                    'pageHeaderCss',
                    css`
                      .ant-page-header-content {
                        padding-top: 0;
                      }
                    `,
                  ),
                  style: {
                    position: 'sticky',
                    background: token.colorBgContainer,
                    padding: isMobile
                      ? '8px'
                      : `${token.paddingContentVertical}px ${token.paddingContentHorizontalLG}px 0 ${token.paddingContentHorizontalLG}px`,
                    borderBottom: isMobile ? `1px solid ${token.colorBorderSecondary}` : null,
                  },
                  title: isMobile ? null : title,
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
  ) : (
    <Result status="error" title={lang('Task type {{type}} is invalid', { type: taskType })} />
  );
}

function TaskMenu() {
  const { taskType, status = TASK_STATUS.PENDING } = useParams();
  const { token } = useToken();
  const items = useAvailableTaskTypeItems();
  const typeKey = taskType ?? items[0]?.key;

  const { isMobileLayout } = useMobileLayout();
  const navigate = useNavigate();

  useEffect(() => {
    if (!items.length) {
      return;
    }
    if (!taskType) {
      navigate(`/admin/workflow/tasks/${typeKey}/${status}`, { replace: true });
    }
  }, [items, navigate, status, taskType, typeKey]);

  return isMobileLayout ? (
    <Layout.Header style={{ background: token.colorBgContainer, padding: 0, height: '3em', lineHeight: '3em' }}>
      <Menu mode="horizontal" selectedKeys={[typeKey]} items={items} />
    </Layout.Header>
  ) : (
    <Layout.Sider breakpoint="md" collapsedWidth="0" zeroWidthTriggerStyle={{ top: 24 }}>
      <Menu mode="inline" selectedKeys={[typeKey]} items={items} style={{ height: '100%' }} />
    </Layout.Sider>
  );
}

export function WorkflowTasks() {
  const compile = useCompile();
  const { setTitle } = useDocumentTitle();
  const { taskType, status = TASK_STATUS.PENDING } = useParams();

  const { title } = useCurrentTaskType();

  useEffect(() => {
    setTitle?.(`${lang('Workflow todos')}${title ? `: ${compile(title)}` : ''}`);
  }, [taskType, status, setTitle, title, compile]);

  return (
    <Layout className={layoutClass}>
      <TasksCountsProvider>
        <TaskMenu />
      </TasksCountsProvider>
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
        <TaskPageContent />
      </Layout>
    </Layout>
  );
}

function WorkflowTasksBadge() {
  const { reload, total } = useContext(TasksCountsContext);
  const items = useAvailableTaskTypeItems();
  return items.length ? (
    <Tooltip title={lang('Workflow todos')}>
      <Button>
        <Link to={`/admin/workflow/tasks`} onClick={reload}>
          <Badge count={total} size="small">
            <CheckCircleOutlined />
          </Badge>
        </Link>
      </Button>
    </Tooltip>
  ) : null;
}

function WorkflowTasksLink() {
  return (
    <TasksCountsProvider>
      <WorkflowTasksBadge />
    </TasksCountsProvider>
  );
}

function transform(records) {
  return records.reduce((result, record) => {
    result[record.type] = record.stats;
    return result;
  }, {});
}

export function TasksCountsProvider(props: any) {
  const app = useApp();
  const [counts, setCounts] = useState<Stats>({});
  const types = useTaskTypeItems();
  const onTaskUpdate = useCallback(({ detail }: CustomEvent) => {
    setCounts((prev) => ({
      ...prev,
      ...transform([detail]),
    }));
  }, []);

  const { runAsync } = useRequest(
    {
      resource: 'userWorkflowTasks',
      action: 'listMine',
      params: {
        filter: {
          type: types,
        },
      },
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

  const total = Object.values(counts).reduce((result, item) => result + (item.pending || 0), 0) || 0;

  return <TasksCountsContext.Provider value={{ reload, total, counts }}>{props.children}</TasksCountsContext.Provider>;
}

export function TasksProvider(props: any) {
  const isLoggedIn = useIsLoggedIn();

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
}
