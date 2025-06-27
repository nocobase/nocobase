/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { CheckCircleOutlined, EllipsisOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { Badge, Button, Flex, Layout, Menu, Popover, Segmented, Tabs, theme, Tooltip } from 'antd';
import classnames from 'classnames';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NavBar, Toast } from 'antd-mobile';
import { observer } from '@formily/react';

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
  useMobileLayout,
  usePlugin,
  useRequest,
  useToken,
  SchemaInitializerItemType,
  APIClient,
} from '@nocobase/client';

import {
  MobilePageContentContainer,
  MobilePageHeader,
  MobilePageNavigationBar,
  MobilePageProvider,
  MobileRouteItem,
  MobileTabBarItem,
  useMobilePage,
  useMobileRoutes,
} from '@nocobase/plugin-mobile/client';

import PluginWorkflowClient from '.';
import { lang, NAMESPACE } from './locale';

const layoutClass = css`
  height: 100%;
  overflow: hidden;
`;

export interface TaskTypeOptions {
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

const TasksCountsContext = createContext<{ reload: () => void; counts: Stats; total: number }>({
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
  const mobilePage = useMobilePage();

  return (
    <Link
      to={
        mobilePage
          ? `/page/workflow/tasks/${type}/${TASK_STATUS.PENDING}`
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

export const TASK_STATUS = {
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
      navigate(mobilePage ? `/page/workflow/tasks/${taskType}/${key}` : `/admin/workflow/tasks/${taskType}/${key}`);
    },
    [navigate, taskType, mobilePage],
  );
  const isMobile = Boolean(mobilePage || isMobileLayout);
  const { Actions } = type;
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

function useTaskTypeItems() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const types = workflowPlugin.taskTypes.getKeys();
  const { counts } = useContext(TasksCountsContext);

  return useMemo(
    () =>
      Array.from(types)
        .filter((key: string) => workflowPlugin.taskTypes.get(key)?.alwaysShow || Boolean(counts[key]?.all))
        .map((key: string) => {
          return {
            key,
            label: <MenuLink type={key} />,
          };
        }),
    [counts, types, workflowPlugin.taskTypes],
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
  const { taskType, status = TASK_STATUS.PENDING, popupId } = useParams();
  const { record } = usePopupRecordContext();
  const navigate = useNavigate();
  const mobilePage = useMobilePage();
  const setVisible = useCallback(
    (visible: boolean) => {
      if (!visible) {
        if (window.history.state.idx) {
          navigate(-1);
        } else {
          navigate(
            mobilePage ? `/page/workflow/tasks/${taskType}/${status}` : `/admin/workflow/tasks/${taskType}/${status}`,
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

function TaskPageContent() {
  const navigate = useNavigate();
  const apiClient = useAPIClient();
  const { taskType, status = TASK_STATUS.PENDING, popupId } = useParams();
  const mobilePage = useMobilePage();
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const { token } = theme.useToken();
  const items = useTaskTypeItems();
  const { title, collection, action = 'list', useActionParams, Item, Detail, getPopupRecord } = useCurrentTaskType();
  const params = useActionParams(status);

  // useEffect(() => {
  //   setTitle?.(`${lang('Workflow todos')}${title ? `: ${compile(title)}` : ''}`);
  // }, [taskType, status, setTitle, title, compile]);

  useEffect(() => {
    if (!taskType) {
      navigate(
        mobilePage
          ? `/page/workflow/tasks/${items[0].key}/${status}`
          : `/admin/workflow/tasks/${items[0].key}/${status}`,
        { replace: true },
      );
    }
  }, [items, mobilePage, navigate, status, taskType]);

  useEffect(() => {
    if (popupId && !currentRecord) {
      let load;
      if (getPopupRecord) {
        load = getPopupRecord(apiClient, { params: { filterByTk: popupId } });
      } else {
        load = apiClient.resource(collection).get({
          ...params,
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

  useEffect(() => {
    if (!taskType) {
      navigate(
        mobilePage
          ? `/page/workflow/tasks/${items[0].key}/${status}`
          : `/admin/workflow/tasks/${items[0].key}/${status}`,
        { replace: true },
      );
    }
  }, [items, mobilePage, navigate, status, taskType]);

  const typeKey = taskType ?? items[0].key;

  const { isMobileLayout } = useMobileLayout();

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

  return (
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
  );
}

export function WorkflowTasks() {
  const compile = useCompile();
  const { setTitle } = useDocumentTitle();
  const navigate = useNavigate();
  const { taskType, status = TASK_STATUS.PENDING } = useParams();
  const { token } = useToken();
  const items = useTaskTypeItems();

  const { title } = useCurrentTaskType();

  useEffect(() => {
    setTitle?.(`${lang('Workflow todos')}${title ? `: ${compile(title)}` : ''}`);
  }, [taskType, status, setTitle, title, compile]);

  useEffect(() => {
    if (!taskType) {
      navigate(`/admin/workflow/tasks/${items[0].key}/${status}`, { replace: true });
    }
  }, [items, navigate, status, taskType]);

  const typeKey = taskType ?? items[0].key;

  const { isMobileLayout } = useMobileLayout();

  return (
    <Layout className={layoutClass}>
      {isMobileLayout ? (
        <Layout.Header style={{ background: token.colorBgContainer, padding: 0, height: '3em', lineHeight: '3em' }}>
          <Menu mode="horizontal" selectedKeys={[typeKey]} items={items} />
        </Layout.Header>
      ) : (
        <Layout.Sider theme="light" breakpoint="md" collapsedWidth="0" zeroWidthTriggerStyle={{ top: 24 }}>
          <Menu mode="inline" selectedKeys={[typeKey]} items={items} style={{ height: '100%' }} />
        </Layout.Sider>
      )}
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

function WorkflowTasksLink() {
  const { reload, total } = useContext(TasksCountsContext);
  const items = useTaskTypeItems();
  return items.length ? (
    <Tooltip title={lang('Workflow todos')}>
      <Button>
        <Link to={`/admin/workflow/tasks/${items[0].key}/${TASK_STATUS.PENDING}`} onClick={reload}>
          <Badge count={total} size="small">
            <CheckCircleOutlined />
          </Badge>
        </Link>
      </Button>
    </Tooltip>
  ) : null;
}

function transform(records) {
  return records.reduce((result, record) => {
    result[record.type] = record.stats;
    return result;
  }, {});
}

function TasksCountsProvider(props: any) {
  const app = useApp();
  const [counts, setCounts] = useState<Stats>({});
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

export const tasksSchemaInitializerItem: SchemaInitializerItemType = {
  name: 'workflow-tasks-center',
  type: 'item',
  useComponentProps() {
    const { resource, refresh, schemaResource } = useMobileRoutes();
    const items = useTaskTypeItems();
    return {
      isItem: true,
      title: lang('Workflow Tasks'),
      badge: 10,
      async onClick(values) {
        const res = await resource.list();
        if (Array.isArray(res?.data?.data)) {
          const findIndex = res?.data?.data.findIndex((route) => route?.options?.url === `/page/workflow/tasks`);
          if (findIndex > -1) {
            Toast.show({
              icon: 'fail',
              content: lang('The workflow tasks page has already been created.'),
            });
            return;
          }
        }
        const { data } = await resource.create({
          values: {
            type: 'page',
            title: lang('Workflow Tasks'),
            icon: 'CheckCircleOutlined',
            schemaUid: 'workflow/tasks',
            options: {
              url: `/page/workflow/tasks`,
              schema: {
                'x-component': 'MobileTabBarWorkflowTasksItem',
              },
            },
            // children: [
            //   {
            //     type: 'page',
            //     title: lang('Workflow tasks'),
            //     icon: 'CheckCircleOutlined',
            //     schemaUid: 'workflow-tasks',
            //     options: {
            //       url: `/page/workflow/tasks`,
            //       itemSchema: {
            //         name: uid(),
            //         'x-decorator': 'BlockItem',
            //         'x-settings': `mobile:tab-bar:page`,
            //         'x-component': 'MobileTabBarWorkflowTasksItem',
            //         'x-toolbar-props': {
            //           showBorder: false,
            //           showBackground: true,
            //         },
            //       },
            //     },
            //   },
            // ],
          } as MobileRouteItem,
        });
        // const parentId = data.data.id;
        refresh();
      },
    };
  },
};

export const MobileTabBarWorkflowTasksItem = observer(
  (props: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const items = useTaskTypeItems();
    const onClick = useCallback(() => {
      navigate(`/page/workflow/tasks/${items[0].key}/${TASK_STATUS.PENDING}`);
    }, [items, navigate]);
    const { total } = useContext(TasksCountsContext);

    const selected = props.url && location.pathname.startsWith(props.url);

    return (
      <MobileTabBarItem
        {...{
          ...props,
          onClick,
          badge: total > 0 ? total : undefined,
          selected,
        }}
      />
    );
  },
  {
    displayName: 'MobileTabBarWorkflowTasksItem',
  },
);

export function WorkflowTasksMobile() {
  const items = useTaskTypeItems();
  const { token } = useToken();
  const navigate = useNavigate();

  return (
    <MobilePageProvider>
      <MobilePageHeader>
        <NavBar className="nb-workflow-tasks-back-action" onBack={() => navigate(-1)}>
          {lang('Workflow tasks')}
        </NavBar>
        <Tabs
          className={css({
            padding: `0 ${token.paddingPageHorizontal}px`,
            '.adm-tabs-header': {
              borderBottomWidth: 0,
            },
            '.adm-tabs-tab': {
              height: 49,
              padding: '10px 0 10px',
            },
            '> .ant-tabs-nav': {
              marginBottom: 0,
              '&::before': {
                borderBottom: 'none',
              },
            },

            '.ant-tabs-tab+.ant-tabs-tab': {
              marginLeft: '2em',
            },
          })}
          items={items}
        />
      </MobilePageHeader>
      <MobilePageContentContainer
        className={css`
          padding: 0 !important;
          > div {
            height: 100%;
            overflow: hidden;

            > .ant-formily-layout {
              height: 100%;
              overflow: hidden;

              > div {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
              }
            }
          }

          .ant-nb-list {
            .itemCss:not(:last-child) {
              padding-bottom: 0;
              margin-bottom: 0.5em;
            }
            .itemCss:not(:first-child) {
              padding-top: 0;
              margin-top: 0.5em;
            }
          }
        `}
      >
        <TaskPageContent />
      </MobilePageContentContainer>
    </MobilePageProvider>
  );
}
