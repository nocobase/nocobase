/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { CheckCircleOutlined, DownOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { observer } from '@nocobase/flow-engine';
import {
  App,
  Badge,
  Button,
  Drawer,
  Flex,
  Input,
  Layout,
  Menu,
  Result,
  Segmented,
  Spin,
  Tabs,
  theme,
  Tooltip,
} from 'antd';
import type { InputRef, MenuProps } from 'antd';
import { NavBar, Toast } from 'antd-mobile';
import classnames from 'classnames';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  ActionContextProvider,
  APIClient,
  CollectionRecordProvider,
  css,
  PinnedPluginListProvider,
  SchemaComponent,
  SchemaComponentContext,
  SchemaComponentOptions,
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

const layoutClass = css`
  height: 100%;
  overflow: hidden;
`;

export interface TaskTypeOptions {
  key: string;
  title: string;
  collection: string;
  action?: string;
  useActionParams: (status: string, workflowKey?: string) => Record<string, unknown>;
  Actions?: React.ComponentType;
  Item: React.ComponentType;
  Detail: React.ComponentType;
  getPopupRecord?: (apiClient: APIClient, { params }: { params: any }) => Promise<any>;
  // children?: TaskTypeOptions[];
  alwaysShow?: boolean;
}

type TaskStats = { pending: number; all: number };

type Stats = Record<string, TaskStats>;

type WorkflowTaskStatsItem = {
  workflowKey: string;
  title: string;
  stats: {
    pending: number;
    all: number;
  };
};

type WorkflowTaskSelection = {
  typeKey: string;
  workflow: WorkflowTaskStatsItem;
};

type WorkflowTaskFilterContextValue = {
  selectedWorkflow: WorkflowTaskStatsItem | null;
  selectWorkflow: (workflow: WorkflowTaskStatsItem | null) => void;
  workflows: WorkflowTaskStatsItem[];
  loading: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  error: boolean;
  search: string;
  setSearch: (search: string) => void;
  loadMore: () => void;
  reload: () => void;
};

const TasksCountsContext = createContext<{ reload: () => void; counts: Stats; total: number }>({
  reload() {},
  counts: {},
  total: 0,
});

export function useTasksCountsContext() {
  return useContext(TasksCountsContext);
}

const WorkflowTaskFilterContext = createContext<WorkflowTaskFilterContextValue>({
  selectedWorkflow: null,
  selectWorkflow() {},
  workflows: [],
  loading: false,
  loadingMore: false,
  hasNext: false,
  error: false,
  search: '',
  setSearch() {},
  loadMore() {},
  reload() {},
});

export function useWorkflowTaskFilterContext() {
  return useContext(WorkflowTaskFilterContext);
}

const WORKFLOW_TASK_STATS_PAGE_SIZE = 200;

function WorkflowTaskFilterProvider({ children }: React.PropsWithChildren) {
  const apiClient = useAPIClient();
  const app = useApp();
  const type = useCurrentTaskType();
  const typeKey = type?.key;
  const [workflowSelection, setWorkflowSelection] = useState<WorkflowTaskSelection | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowTaskStatsItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const requestIdRef = useRef(0);
  const previousTypeKeyRef = useRef(typeKey);
  const selectedWorkflow = workflowSelection?.typeKey === typeKey ? workflowSelection.workflow : null;

  const selectWorkflow = useCallback(
    (workflow: WorkflowTaskStatsItem | null) => {
      setWorkflowSelection(workflow && typeKey ? { typeKey, workflow } : null);
    },
    [typeKey],
  );

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!typeKey) {
        setWorkflows([]);
        setHasNext(false);
        return;
      }
      const requestId = ++requestIdRef.current;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setHasNext(false);
      }
      setError(false);
      try {
        const response = await apiClient.resource('userWorkflowTaskStats').listMine({
          type: typeKey,
          page: nextPage,
          pageSize: WORKFLOW_TASK_STATS_PAGE_SIZE,
          ...(search ? { search } : {}),
        });
        if (requestId !== requestIdRef.current) {
          return;
        }
        const rows = (response.data?.data ?? []) as WorkflowTaskStatsItem[];
        setWorkflowSelection((selection) => {
          if (!selection || selection.typeKey !== typeKey) {
            return selection;
          }
          const workflow = rows.find((item) => item.workflowKey === selection.workflow.workflowKey);
          return workflow ? { ...selection, workflow } : selection;
        });
        setWorkflows((previous) => {
          if (!append) {
            return rows;
          }
          const result = new Map(previous.map((item) => [item.workflowKey, item]));
          rows.forEach((item) => result.set(item.workflowKey, item));
          return Array.from(result.values());
        });
        setPage(nextPage);
        setHasNext(Boolean(response.data?.meta?.hasNext));
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(true);
          console.error(err);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [apiClient, search, typeKey],
  );

  const reload = useCallback(() => {
    loadPage(1, false);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasNext || loading || loadingMore) {
      return;
    }
    loadPage(page + 1, true);
  }, [hasNext, loadPage, loading, loadingMore, page]);

  useEffect(() => {
    if (previousTypeKeyRef.current === typeKey) {
      return;
    }
    previousTypeKeyRef.current = typeKey;
    requestIdRef.current += 1;
    setWorkflowSelection(null);
    setWorkflows([]);
    setPage(1);
    setHasNext(false);
    setSearch('');
  }, [typeKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onTaskUpdate = ({ detail }: CustomEvent) => {
      if (detail?.type !== typeKey) {
        return;
      }
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(reload, 300);
    };
    app.eventBus.addEventListener('ws:message:workflow:tasks:updated', onTaskUpdate);
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      app.eventBus.removeEventListener('ws:message:workflow:tasks:updated', onTaskUpdate);
    };
  }, [app.eventBus, reload, typeKey]);

  const value = useMemo<WorkflowTaskFilterContextValue>(
    () => ({
      selectedWorkflow,
      selectWorkflow,
      workflows,
      loading,
      loadingMore,
      hasNext,
      error,
      search,
      setSearch,
      loadMore,
      reload,
    }),
    [error, hasNext, loadMore, loading, loadingMore, reload, search, selectWorkflow, selectedWorkflow, workflows],
  );

  return <WorkflowTaskFilterContext.Provider value={value}>{children}</WorkflowTaskFilterContext.Provider>;
}

function MenuLink({ type }: any) {
  const mobilePage = useMobilePage();

  return (
    <Link
      replace
      to={
        mobilePage
          ? `/page/workflow-tasks/${type}/${TASK_STATUS.PENDING}`
          : `/admin/workflow/tasks/${type}/${TASK_STATUS.PENDING}`
      }
    >
      <TaskTypeLabel type={type} />
    </Link>
  );
}

function TaskTypeLabel({ type }: { type: string }) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const compile = useCompile();
  const { counts } = useContext(TasksCountsContext);
  const { token } = useToken();
  const typeTitle = compile(workflowPlugin.taskTypes.get(type)?.title);

  return (
    <span
      className={css`
        display: flex;
        gap: ${token.marginXS}px;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-width: 0;

        > span:first-child {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        > .ant-badge {
          flex: none;
        }
      `}
    >
      <span>{typeTitle}</span>
      <Badge count={counts[type]?.pending || 0} size="small" />
    </span>
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
    () => workflowPlugin.taskTypes.get(taskType ?? items[0]) ?? {},
    [items, taskType, workflowPlugin.taskTypes],
  );
}

function WorkflowMenuItemLabel({ title, count }: { title: React.ReactNode; count: number }) {
  const { token } = useToken();
  return (
    <span
      className={css`
        display: flex;
        gap: ${token.marginXS}px;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-width: 0;

        > span:first-child {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}
    >
      <span>{title}</span>
      <span
        className={css`
          flex: none;
          color: ${token.colorTextTertiary};
          font-size: ${token.fontSizeSM}px;
          font-variant-numeric: tabular-nums;
        `}
      >
        {count}
      </span>
    </span>
  );
}

function WorkflowAllMenuItemLabel({
  search,
  searchValue,
  onSearchValueChange,
  onSearch,
}: {
  search: string;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearch: (value: string) => void;
}) {
  const { token } = useToken();
  const [searchExpanded, setSearchExpanded] = useState(Boolean(search));
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<InputRef>(null);
  const focusAfterExpandRef = useRef(false);
  const isComposingRef = useRef(false);
  const suppressSubmitRef = useRef(false);

  useEffect(() => {
    if (search) {
      setSearchExpanded(true);
    }
  }, [search]);

  useEffect(() => {
    if (searchExpanded && focusAfterExpandRef.current) {
      focusAfterExpandRef.current = false;
      searchInputRef.current?.focus();
    }
  }, [searchExpanded]);

  const expandSearchWithFocus = useCallback(() => {
    focusAfterExpandRef.current = true;
    setSearchExpanded(true);
  }, []);

  const collapseSearch = useCallback(() => {
    if (!searchFocused && !searchValue) {
      setSearchExpanded(false);
    }
  }, [searchFocused, searchValue]);

  return (
    <div
      onMouseLeave={collapseSearch}
      className={css`
        display: flex;
        align-items: center;
        width: 100%;
        height: ${token.controlHeight}px;
      `}
    >
      {searchExpanded ? (
        <form
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (isComposingRef.current || suppressSubmitRef.current) {
              suppressSubmitRef.current = false;
              return;
            }
            onSearch(searchValue.trim());
          }}
          className={css`
            width: 100%;
          `}
        >
          <Input
            ref={searchInputRef}
            allowClear
            size="small"
            value={searchValue}
            placeholder={lang('Search workflows')}
            aria-label={lang('Search workflows')}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {
              setSearchFocused(false);
              if (!searchValue) {
                setSearchExpanded(false);
              }
            }}
            onChange={(event) => onSearchValueChange(event.target.value)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Enter') {
                suppressSubmitRef.current = event.nativeEvent.isComposing || isComposingRef.current;
              }
              if (event.key === 'Escape') {
                onSearchValueChange('');
                onSearch('');
                setSearchExpanded(false);
              }
            }}
          />
        </form>
      ) : (
        <>
          <span
            className={css`
              flex: 1;
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `}
          >
            {lang('All workflows')}
          </span>
          <button
            type="button"
            aria-label={lang('Search workflows')}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              expandSearchWithFocus();
            }}
            onMouseEnter={() => setSearchExpanded(true)}
            onFocus={expandSearchWithFocus}
            className={css`
              display: inline-flex;
              flex: none;
              align-items: center;
              justify-content: flex-end;
              width: ${token.controlHeightSM}px;
              height: ${token.controlHeightSM}px;
              padding: 0;
              color: ${token.colorTextSecondary};
              cursor: pointer;
              background: transparent;
              border: 0;
              border-radius: ${token.borderRadiusSM}px;

              &:hover,
              &:focus-visible {
                color: ${token.colorPrimary};
              }

              &:focus-visible {
                outline: 2px solid ${token.colorPrimaryBorder};
                outline-offset: -2px;
              }
            `}
          >
            <SearchOutlined />
          </button>
        </>
      )}
    </div>
  );
}

function TaskNavigationContent({ onWorkflowSelect }: { onWorkflowSelect?: () => void }) {
  const { taskType, status = TASK_STATUS.PENDING } = useParams();
  const { token } = useToken();
  const items = useAvailableTaskTypeItems();
  const typeKey = taskType ?? items[0]?.key;
  const navigate = useNavigate();
  const mobilePage = useMobilePage();
  const {
    selectedWorkflow,
    selectWorkflow,
    workflows,
    loading,
    loadingMore,
    hasNext,
    error,
    search,
    setSearch,
    loadMore,
    reload,
  } = useWorkflowTaskFilterContext();
  const [searchValue, setSearchValue] = useState(search);
  const typeMenuKey = typeKey ? `type:${typeKey}` : undefined;

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  const handleWorkflowSelect = useCallback(
    (workflow: WorkflowTaskStatsItem | null) => {
      selectWorkflow(workflow);
      onWorkflowSelect?.();
    },
    [onWorkflowSelect, selectWorkflow],
  );

  const handleMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      if (key === 'workflow:all') {
        handleWorkflowSelect(null);
        return;
      }
      if (key === 'action:retry') {
        reload();
        return;
      }
      if (key === 'action:loadMore') {
        loadMore();
        return;
      }
      if (!key.startsWith('workflow:')) {
        return;
      }
      const workflowKey = key.slice('workflow:'.length);
      const workflow = workflows.find((item) => item.workflowKey === workflowKey);
      if (workflow) {
        handleWorkflowSelect(workflow);
      }
    },
    [handleWorkflowSelect, loadMore, reload, workflows],
  );

  const handleOpenChange = useCallback<NonNullable<MenuProps['onOpenChange']>>(
    (openKeys) => {
      const nextTypeMenuKey = [...openKeys].reverse().find((key) => key.startsWith('type:') && key !== typeMenuKey);
      if (!nextTypeMenuKey) {
        selectWorkflow(null);
        return;
      }
      const nextType = nextTypeMenuKey.slice('type:'.length);
      if (nextType === typeKey) {
        return;
      }
      navigate(
        mobilePage
          ? `/page/workflow-tasks/${nextType}/${TASK_STATUS.PENDING}`
          : `/admin/workflow/tasks/${nextType}/${TASK_STATUS.PENDING}`,
      );
    },
    [mobilePage, navigate, selectWorkflow, typeKey, typeMenuKey],
  );

  useEffect(() => {
    if (!items.length || taskType) {
      return;
    }
    navigate(mobilePage ? `/page/workflow-tasks/${typeKey}/${status}` : `/admin/workflow/tasks/${typeKey}/${status}`, {
      replace: true,
    });
  }, [items.length, mobilePage, navigate, status, taskType, typeKey]);

  const workflowMenuItems: NonNullable<MenuProps['items']> = [
    {
      key: 'workflow:all',
      label: (
        <WorkflowAllMenuItemLabel
          search={search}
          searchValue={searchValue}
          onSearchValueChange={(value) => {
            setSearchValue(value);
            if (!value && search) {
              setSearch('');
            }
          }}
          onSearch={setSearch}
        />
      ),
    },
    ...workflows.map((workflow) => ({
      key: `workflow:${workflow.workflowKey}`,
      label: <WorkflowMenuItemLabel title={workflow.title} count={workflow.stats.pending} />,
    })),
  ];

  if (loading) {
    workflowMenuItems.push({
      key: 'status:loading',
      disabled: true,
      label: (
        <Flex justify="center">
          <Spin size="small" />
        </Flex>
      ),
    });
  }
  if (error) {
    workflowMenuItems.push({ key: 'action:retry', label: <Flex justify="center">{lang('Retry')}</Flex> });
  }
  if (hasNext && !error) {
    workflowMenuItems.push({
      key: 'action:loadMore',
      disabled: loadingMore,
      label: <Flex justify="center">{loadingMore ? <Spin size="small" /> : lang('Load more')}</Flex>,
    });
  }

  return (
    <Menu
      mode="inline"
      inlineIndent={token.padding}
      expandIcon={null}
      openKeys={typeMenuKey ? [typeMenuKey] : []}
      selectedKeys={[selectedWorkflow ? `workflow:${selectedWorkflow.workflowKey}` : 'workflow:all']}
      onClick={handleMenuClick}
      onOpenChange={handleOpenChange}
      items={items.map(({ key }) => ({
        key: `type:${key}`,
        label: <TaskTypeLabel type={key} />,
        children:
          key === typeKey
            ? workflowMenuItems
            : [
                {
                  key: `placeholder:${key}`,
                  disabled: true,
                  className: 'workflow-task-menu-placeholder',
                  label: null,
                },
              ],
      }))}
      className={css`
        height: 100%;
        overflow-y: auto;
        background: ${token.colorBgContainer};
        border-inline-end: 0 !important;

        .ant-menu-sub.ant-menu-inline {
          width: calc(100% - ${token.marginXXS * 2}px);
          margin-inline: ${token.marginXXS}px;
          padding-block: ${token.paddingXXS}px;
          background: ${token.colorFillTertiary} !important;
          border-radius: ${token.borderRadius}px;
        }

        .ant-menu-submenu-title {
          padding-inline-end: ${token.padding}px;
        }

        .ant-menu-sub.ant-menu-inline > .ant-menu-item {
          height: ${token.controlHeight}px;
          margin-block: 0;
          line-height: ${token.controlHeight}px;
        }

        .ant-menu-title-content {
          min-width: 0;
        }

        .workflow-task-menu-placeholder {
          display: none !important;
        }
      `}
    />
  );
}

function MobileTaskNavigation() {
  const [open, setOpen] = useState(false);
  const compile = useCompile();
  const type = useCurrentTaskType();
  const { selectedWorkflow } = useWorkflowTaskFilterContext();
  const { token } = useToken();
  return (
    <>
      <div
        style={{
          background: token.colorBgContainer,
          padding: `0 ${token.paddingPageHorizontal}px ${token.paddingXXS}px`,
        }}
      >
        <Button
          block
          type="text"
          aria-expanded={open}
          aria-label={lang('Select workflow')}
          onClick={() => setOpen(true)}
          className={css`
            height: ${token.controlHeight}px;
            padding-inline: ${token.paddingSM}px;
            background: ${token.colorFillAlter};
            border: 0;

            &:hover,
            &:focus-visible {
              background: ${token.colorFillSecondary} !important;
            }
          `}
        >
          <Flex
            align="center"
            justify="space-between"
            gap={token.marginXS}
            className={css`
              width: 100%;
              min-width: 0;
            `}
          >
            <Flex
              align="center"
              gap={token.marginXXS}
              className={css`
                min-width: 0;
              `}
            >
              <span>{compile(type.title)}</span>
              {selectedWorkflow ? (
                <>
                  <RightOutlined
                    className={css`
                      flex: none;
                      color: ${token.colorTextTertiary};
                      font-size: ${token.fontSizeSM}px;
                    `}
                  />
                  <span
                    className={css`
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    `}
                  >
                    {selectedWorkflow.title}
                  </span>
                </>
              ) : null}
            </Flex>
            <DownOutlined
              className={css`
                flex: none;
                margin-inline-start: auto;
                color: ${token.colorTextSecondary};
              `}
            />
          </Flex>
        </Button>
      </div>
      <Drawer
        title={lang('Workflow tasks')}
        placement="left"
        width="min(360px, 88vw)"
        open={open}
        onClose={() => setOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <TaskNavigationContent onWorkflowSelect={() => setOpen(false)} />
      </Drawer>
    </>
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

function TaskPageContent() {
  const apiClient = useAPIClient();
  const { taskType, status = TASK_STATUS.PENDING, popupId } = useParams();
  const mobilePage = useMobilePage();
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const { token } = theme.useToken();
  const type = useCurrentTaskType();
  const { selectedWorkflow } = useWorkflowTaskFilterContext();
  const { title, collection, action = 'list', useActionParams, Item, Detail, getPopupRecord } = type;
  const params = useActionParams?.(status, selectedWorkflow?.workflowKey);

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
            name: `${taskType}-${status}-${selectedWorkflow?.workflowKey ?? 'all'}`,
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
  const { token } = useToken();
  const { isMobileLayout } = useMobileLayout();

  return isMobileLayout ? (
    <Layout.Header
      style={{
        background: token.colorBgContainer,
        height: 'auto',
        padding: `${token.paddingXXS}px 0 0`,
        lineHeight: 'normal',
      }}
    >
      <MobileTaskNavigation />
    </Layout.Header>
  ) : (
    <Layout.Sider
      theme="light"
      width={220}
      breakpoint="md"
      collapsedWidth="0"
      zeroWidthTriggerStyle={{ top: 24 }}
      style={{
        background: token.colorBgContainer,
        borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <TaskNavigationContent />
    </Layout.Sider>
  );
}

export function WorkflowTasks() {
  const compile = useCompile();
  const { setTitle } = useDocumentTitle();
  const { taskType, status = TASK_STATUS.PENDING } = useParams();

  const currentType = useCurrentTaskType();
  const { title } = currentType;

  useEffect(() => {
    setTitle?.(`${lang('Workflow todos')}${title ? `: ${compile(title)}` : ''}`);
  }, [taskType, status, setTitle, title, compile]);

  return (
    <TasksCountsProvider>
      <WorkflowTaskFilterProvider>
        <Layout className={layoutClass}>
          <TaskMenu />
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
      </WorkflowTaskFilterProvider>
    </TasksCountsProvider>
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

export function WorkflowTasksMobile() {
  const navigate = useNavigate();

  return (
    <MobilePageProvider>
      <TasksCountsProvider>
        <WorkflowTaskFilterProvider>
          <MobilePageHeader>
            <NavBar className="nb-workflow-tasks-back-action" onBack={() => navigate(-1)}>
              {lang('Workflow tasks')}
            </NavBar>
            <MobileTaskNavigation />
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
        </WorkflowTaskFilterProvider>
      </TasksCountsProvider>
    </MobilePageProvider>
  );
}
