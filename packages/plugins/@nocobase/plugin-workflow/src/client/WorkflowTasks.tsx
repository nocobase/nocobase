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
import { observer } from '@nocobase/flow-engine';
import { App, Badge, Button, Flex, Layout, Menu, Result, Segmented, Tabs, theme, Tooltip } from 'antd';
import { NavBar, Toast } from 'antd-mobile';
import classnames from 'classnames';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  ActionContextProvider,
  APIClient,
  CollectionRecordProvider,
  css,
  ExtendCollectionsProvider,
  PinnedPluginListProvider,
  SchemaComponent,
  SchemaComponentContext,
  SchemaComponentOptions,
  SchemaComponentProvider,
  SchemaInitializerItemType,
  useAPIClient,
  useApp,
  useCompile,
  useDocumentTitle,
  useIsLoggedIn,
  useMobileLayout,
  usePlugin,
  useRequest,
  useToken,
} from '@nocobase/client';

import {
  MobilePageContentContainer,
  MobilePageHeader,
  MobilePageProvider,
  MobileRouteItem,
  MobileTabBarItem,
  useMobilePage,
  useMobileRoutes,
} from '@nocobase/plugin-mobile/client';

import PluginWorkflowClient from '.';
import { lang, NAMESPACE } from './locale';
import {
  useWorkflowTasksPageMenuRouteAdapter,
  WorkflowTasksPageMenuItemRouteScope,
  WorkflowTasksPageMenuRouteProvider,
  type WorkflowTasksPageMenuRouteTarget,
} from './workflowTasksPageMenuRoute';

export { WorkflowTasksPageMenuRouteProvider };

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

const TasksCountsContext = createContext<{ reload: () => void; counts: Stats; total: number }>({
  reload() {},
  counts: {},
  total: 0,
});

export function useTasksCountsContext() {
  return useContext(TasksCountsContext);
}

const TASK_STATUS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
};

type WorkflowTasksRouteState = {
  taskType?: string;
  status: string;
  popupId?: string;
};

function useWorkflowTasksRouteState(): WorkflowTasksRouteState {
  const adapter = useWorkflowTasksPageMenuRouteAdapter();
  const { taskType, status, popupId } = useParams();

  return (
    adapter?.route ?? {
      taskType,
      status: status || TASK_STATUS.PENDING,
      popupId,
    }
  );
}

function buildStandaloneWorkflowTasksPath(route: WorkflowTasksPageMenuRouteTarget, mobilePage: boolean) {
  const segments = [mobilePage ? '/page/workflow-tasks' : '/admin/workflow/tasks'];

  if (route.taskType) {
    segments.push(encodeURIComponent(route.taskType));
  }
  if (route.taskType || route.status) {
    segments.push(encodeURIComponent(route.status || TASK_STATUS.PENDING));
  }
  if (route.popupId !== undefined && route.popupId !== null && route.popupId !== '') {
    segments.push(encodeURIComponent(String(route.popupId)));
  }

  return segments.join('/');
}

function useWorkflowTasksPathBuilder() {
  const adapter = useWorkflowTasksPageMenuRouteAdapter();
  const mobilePage = Boolean(useMobilePage());
  const currentRoute = useWorkflowTasksRouteState();
  const { popupId, status, taskType } = currentRoute;

  return useCallback(
    (nextRoute: WorkflowTasksPageMenuRouteTarget) => {
      const route = {
        taskType,
        status,
        popupId,
        ...nextRoute,
      };

      return adapter?.buildPath(route) ?? buildStandaloneWorkflowTasksPath(route, mobilePage);
    },
    [adapter, mobilePage, popupId, status, taskType],
  );
}

function TaskTypeLabel({ type }: { type: string }) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const compile = useCompile();
  const { title } = workflowPlugin.taskTypes.get(type) || {};
  const { counts } = useContext(TasksCountsContext);
  const typeTitle = compile(title || type);

  return (
    <span
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
    </span>
  );
}

function MenuLink({ type }: { type: string }) {
  const buildPath = useWorkflowTasksPathBuilder();

  return (
    <Link replace to={buildPath({ taskType: type, status: TASK_STATUS.PENDING, popupId: undefined })}>
      <TaskTypeLabel type={type} />
    </Link>
  );
}

function StatusTabs() {
  const navigate = useNavigate();
  const { status } = useWorkflowTasksRouteState();
  const buildPath = useWorkflowTasksPathBuilder();
  const type = useCurrentTaskType();
  const { isMobileLayout } = useMobileLayout();
  const mobilePage = useMobilePage();
  const onSwitchTab = useCallback(
    (key: string) => {
      if (!type?.key) {
        return;
      }
      navigate(buildPath({ taskType: type.key, status: key, popupId: undefined }));
    },
    [buildPath, navigate, type],
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

  return useMemo(() => Array.from(types), [types]);
}

function useAvailableTaskTypeItems() {
  const keys = useAvailableTaskTypeKeys();

  return useMemo(
    () =>
      keys.map((key: string) => ({
        key,
        label: <MenuLink type={key} />,
      })),
    [keys],
  );
}

function useAvailableTaskTypeKeys() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const types = useTaskTypeItems();
  const { counts } = useContext(TasksCountsContext);

  return useMemo(
    () => types.filter((key: string) => workflowPlugin.taskTypes.get(key)?.alwaysShow || Boolean(counts[key]?.all)),
    [counts, types, workflowPlugin.taskTypes],
  );
}

function useCurrentTaskType() {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const { taskType } = useWorkflowTasksRouteState();
  const items = useTaskTypeItems();
  return useMemo<any>(
    () => workflowPlugin.taskTypes.get(taskType ?? items[0]) ?? {},
    [items, taskType, workflowPlugin.taskTypes],
  );
}

function PopupContext(props: any) {
  const { taskType, status, popupId } = useWorkflowTasksRouteState();
  const { record } = usePopupRecordContext();
  const navigate = useNavigate();
  const buildPath = useWorkflowTasksPathBuilder();
  const setVisible = useCallback(
    (visible: boolean) => {
      if (!visible) {
        if (window.history.state.idx) {
          navigate(-1);
        } else {
          navigate(buildPath({ taskType, status, popupId: undefined }));
        }
      }
    },
    [buildPath, navigate, status, taskType],
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

function WorkflowTaskItem() {
  const { Item } = useCurrentTaskType();

  return Item ? (
    <WorkflowTasksPageMenuItemRouteScope>
      <Item />
    </WorkflowTasksPageMenuItemRouteScope>
  ) : null;
}

function TaskPageContent() {
  const apiClient = useAPIClient();
  const { taskType, status, popupId } = useWorkflowTasksRouteState();
  const mobilePage = useMobilePage();
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const { token } = theme.useToken();
  const type = useCurrentTaskType();
  const { title, collection, action = 'list', useActionParams, Detail, getPopupRecord } = type;
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

            .ant-pagination {
              align-items: center;
            }
          }
        }
      }
    }
  `;

  return type?.key ? (
    <>
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
                          'x-component': WorkflowTaskItem,
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
    </>
  ) : (
    <Result status="error" title={lang('Task type {{type}} is invalid', { type: taskType })} />
  );
}

type TaskTypeNavigation = 'sider' | 'tabs';

function TaskMenu(props: { navigation?: TaskTypeNavigation }) {
  const { navigation = 'sider' } = props;
  const { taskType, status } = useWorkflowTasksRouteState();
  const { token } = useToken();
  const items = useAvailableTaskTypeItems();
  const taskTypeKeys = useAvailableTaskTypeKeys();
  const typeKey = taskType ?? taskTypeKeys[0];

  const { isMobileLayout } = useMobileLayout();
  const navigate = useNavigate();
  const buildPath = useWorkflowTasksPathBuilder();

  useEffect(() => {
    if (!taskTypeKeys.length) {
      return;
    }
    if (!taskType) {
      navigate(buildPath({ taskType: typeKey, status, popupId: undefined }), { replace: true });
    }
  }, [buildPath, navigate, status, taskType, taskTypeKeys.length, typeKey]);

  if (navigation === 'tabs') {
    return (
      <Layout.Header
        style={{
          background: token.colorBgContainer,
          height: 'auto',
          lineHeight: 'normal',
          padding: `0 ${token.paddingContentHorizontalLG}px`,
        }}
      >
        <Tabs
          activeKey={typeKey}
          items={taskTypeKeys.map((key) => ({
            key,
            label: <TaskTypeLabel type={key} />,
          }))}
          onChange={(key) => {
            navigate(buildPath({ taskType: key, status: TASK_STATUS.PENDING, popupId: undefined }));
          }}
          className={css`
            > .ant-tabs-nav {
              margin-bottom: 0;
            }
          `}
        />
      </Layout.Header>
    );
  }

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

function useWorkflowTasksDocumentTitle() {
  const compile = useCompile();
  const { setTitle } = useDocumentTitle();
  const { taskType, status } = useWorkflowTasksRouteState();

  const { title } = useCurrentTaskType();

  useEffect(() => {
    setTitle?.(`${lang('Workflow todos')}${title ? `: ${compile(title)}` : ''}`);
  }, [taskType, status, setTitle, title, compile]);
}

function WorkflowTasksContent(props: { taskTypeNavigation?: TaskTypeNavigation }) {
  return (
    <Layout className={layoutClass}>
      <TasksCountsProvider>
        <TaskMenu navigation={props.taskTypeNavigation} />
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

export function WorkflowTasksPageMenuContent() {
  const app = useApp();
  const workflowCollections = useMemo(() => {
    const dataSource = app.flowEngine.dataSourceManager.getDataSource('main');

    return Array.from(dataSource?.collectionManager.collections.values() || [])
      .filter((collection) => collection.hidden)
      .map((collection) => {
        const { hidden, ...options } = collection.options;
        return options;
      });
  }, [app.flowEngine.dataSourceManager]);
  useWorkflowTasksDocumentTitle();
  return (
    <ExtendCollectionsProvider collections={workflowCollections}>
      <SchemaComponentProvider designable={false} components={app.components} scope={app.scopes}>
        <WorkflowTasksContent taskTypeNavigation="tabs" />
      </SchemaComponentProvider>
    </ExtendCollectionsProvider>
  );
}

export function WorkflowTasks() {
  useWorkflowTasksDocumentTitle();
  return <WorkflowTasksContent />;
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

export const tasksSchemaInitializerItem: SchemaInitializerItemType = {
  name: 'workflow-tasks-center',
  type: 'item',
  useComponentProps() {
    const { resource, refresh, schemaResource } = useMobileRoutes();
    const items = useTaskTypeItems();
    return items.length
      ? {
          isItem: true,
          title: lang('Workflow tasks'),
          badge: 10,
          async onClick(values) {
            const res = await resource.list();
            if (Array.isArray(res?.data?.data)) {
              const findIndex = res?.data?.data.findIndex((route) => route?.options?.url === `/page/workflow-tasks`);
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
                title: lang('Workflow tasks'),
                icon: 'CheckCircleOutlined',
                schemaUid: 'workflow-tasks',
                options: {
                  url: `/page/workflow-tasks`,
                  schema: {
                    'x-decorator': 'TasksCountsProvider',
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
                //       url: `/page/workflow-tasks`,
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
        }
      : null;
  },
};

export const MobileTabBarWorkflowTasksItem = observer(
  (props: any) => {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const items = useAvailableTaskTypeItems();
    const onClick = useCallback(() => {
      if (items.length) {
        navigate(`/page/workflow-tasks/${items[0].key}/${TASK_STATUS.PENDING}`);
      } else {
        message.error(lang('No workflow tasks available. Please contact the administrator.'));
      }
    }, [items, message, navigate]);
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

function WorkflowTasksMobileTabs() {
  const { token } = useToken();
  const items = useAvailableTaskTypeItems();
  return (
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
  );
}

export function WorkflowTasksMobile() {
  const navigate = useNavigate();

  return (
    <MobilePageProvider>
      <MobilePageHeader>
        <NavBar className="nb-workflow-tasks-back-action" onBack={() => navigate(-1)}>
          {lang('Workflow tasks')}
        </NavBar>
        <TasksCountsProvider>
          <WorkflowTasksMobileTabs />
        </TasksCountsProvider>
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
