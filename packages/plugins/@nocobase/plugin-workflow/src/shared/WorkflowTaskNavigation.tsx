/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Badge, Button, Drawer, Flex, Input, Layout, Menu, Spin, theme } from 'antd';
import type { InputRef, MenuProps } from 'antd';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface WorkflowTaskStatsItem {
  workflowKey: string;
  title: string;
  stats: {
    pending: number;
    all: number;
  };
}

export interface WorkflowTaskNavigationType {
  count: number;
  key: string;
  title: React.ReactNode;
}

interface WorkflowTaskSelection {
  typeKey: string;
  workflow: WorkflowTaskStatsItem;
}

interface WorkflowTaskStatsListParams {
  page: number;
  pageSize: number;
  search?: string;
  type: string;
}

export type LoadWorkflowTaskStats = (params: WorkflowTaskStatsListParams) => Promise<unknown>;

export interface WorkflowTaskFilterContextValue {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeWorkflowTaskStatsResponse(response: unknown) {
  const responseData = isRecord(response) ? response.data : undefined;
  const payload = isRecord(responseData) ? responseData : undefined;
  const rows = Array.isArray(responseData) ? responseData : payload?.data;
  const meta = isRecord(payload?.meta) ? payload.meta : undefined;

  return {
    rows: Array.isArray(rows)
      ? rows.filter(
          (item): item is WorkflowTaskStatsItem =>
            isRecord(item) &&
            typeof item.workflowKey === 'string' &&
            typeof item.title === 'string' &&
            isRecord(item.stats),
        )
      : [],
    hasNext: meta?.hasNext === true,
  };
}

export function WorkflowTaskFilterProvider(
  props: React.PropsWithChildren<{
    eventBus?: EventTarget;
    loadWorkflowTaskStats: LoadWorkflowTaskStats;
    typeKey?: string;
  }>,
) {
  const { children, eventBus, loadWorkflowTaskStats, typeKey } = props;
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
        const response = await loadWorkflowTaskStats({
          type: typeKey,
          page: nextPage,
          pageSize: WORKFLOW_TASK_STATS_PAGE_SIZE,
          ...(search ? { search } : {}),
        });
        if (requestId !== requestIdRef.current) {
          return;
        }
        const result = normalizeWorkflowTaskStatsResponse(response);
        setWorkflowSelection((selection) => {
          if (!selection || selection.typeKey !== typeKey) {
            return selection;
          }
          const workflow = result.rows.find((item) => item.workflowKey === selection.workflow.workflowKey);
          return workflow ? { ...selection, workflow } : selection;
        });
        setWorkflows((previous) => {
          if (!append) {
            return result.rows;
          }
          const merged = new Map(previous.map((item) => [item.workflowKey, item]));
          result.rows.forEach((item) => merged.set(item.workflowKey, item));
          return Array.from(merged.values());
        });
        setPage(nextPage);
        setHasNext(result.hasNext);
      } catch (loadError) {
        if (requestId === requestIdRef.current) {
          setError(true);
          console.error('Failed to load workflow task stats', loadError);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [loadWorkflowTaskStats, search, typeKey],
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
    if (!eventBus) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onTaskUpdate: EventListener = (event) => {
      if (!('detail' in event) || !isRecord((event as CustomEvent<unknown>).detail)) {
        return;
      }
      const detail = (event as CustomEvent<Record<string, unknown>>).detail;
      if (detail.type !== typeKey) {
        return;
      }
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(reload, 300);
    };
    eventBus.addEventListener('ws:message:workflow:tasks:updated', onTaskUpdate);
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      eventBus.removeEventListener('ws:message:workflow:tasks:updated', onTaskUpdate);
    };
  }, [eventBus, reload, typeKey]);

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

function NavigationItemLabel({ count, title }: Pick<WorkflowTaskNavigationType, 'count' | 'title'>) {
  const { token } = theme.useToken();
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
      <span>{title}</span>
      <Badge count={count} size="small" />
    </span>
  );
}

function WorkflowItemLabel({ title, count }: { title: React.ReactNode; count: number }) {
  const { token } = theme.useToken();
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

function AllWorkflowsLabel(props: {
  search: string;
  searchValue: string;
  setSearchValue: (value: string) => void;
  setSearch: (value: string) => void;
  t: (key: string) => string;
}) {
  const { search, searchValue, setSearchValue, setSearch, t } = props;
  const { token } = theme.useToken();
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
            setSearch(searchValue.trim());
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
            placeholder={t('Search workflows')}
            aria-label={t('Search workflows')}
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
            onChange={(event) => {
              const value = event.target.value;
              setSearchValue(value);
              if (!value && search) {
                setSearch('');
              }
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Enter') {
                suppressSubmitRef.current = event.nativeEvent.isComposing || isComposingRef.current;
              }
              if (event.key === 'Escape') {
                setSearchValue('');
                setSearch('');
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
            {t('All workflows')}
          </span>
          <button
            type="button"
            aria-label={t('Search workflows')}
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
                outline: ${token.lineWidthFocus}px solid ${token.colorPrimaryBorder};
                outline-offset: -${token.lineWidthFocus}px;
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

function WorkflowTaskNavigationMenu(props: {
  currentTypeKey?: string;
  onTaskTypeSelect: (typeKey: string) => void;
  onWorkflowSelect?: () => void;
  taskTypes: WorkflowTaskNavigationType[];
  t: (key: string) => string;
}) {
  const { currentTypeKey, onTaskTypeSelect, onWorkflowSelect, taskTypes, t } = props;
  const { token } = theme.useToken();
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
  const typeMenuKey = currentTypeKey ? `type:${currentTypeKey}` : undefined;
  const [openKeys, setOpenKeys] = useState<string[]>(typeMenuKey ? [typeMenuKey] : []);

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  useEffect(() => {
    setOpenKeys(typeMenuKey ? [typeMenuKey] : []);
  }, [typeMenuKey]);

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
    (nextOpenKeys) => {
      const nextTypeMenuKey = [...nextOpenKeys].reverse().find((key) => key.startsWith('type:'));
      if (!nextTypeMenuKey) {
        setOpenKeys([]);
        return;
      }
      setOpenKeys([nextTypeMenuKey]);
      const nextType = nextTypeMenuKey.slice('type:'.length);
      if (nextType !== currentTypeKey) {
        onTaskTypeSelect(nextType);
      }
    },
    [currentTypeKey, onTaskTypeSelect],
  );

  const workflowMenuItems: NonNullable<MenuProps['items']> = [
    {
      key: 'workflow:all',
      label: (
        <AllWorkflowsLabel
          search={search}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          setSearch={setSearch}
          t={t}
        />
      ),
    },
    ...workflows.map((workflow) => ({
      key: `workflow:${workflow.workflowKey}`,
      label: <WorkflowItemLabel title={workflow.title} count={workflow.stats.pending} />,
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
    workflowMenuItems.push({ key: 'action:retry', label: <Flex justify="center">{t('Retry')}</Flex> });
  }
  if (hasNext && !error) {
    workflowMenuItems.push({
      key: 'action:loadMore',
      disabled: loadingMore,
      label: <Flex justify="center">{loadingMore ? <Spin size="small" /> : t('Load more')}</Flex>,
    });
  }

  return (
    <Menu
      data-testid="workflow-task-navigation-menu"
      mode="inline"
      inlineIndent={token.padding}
      expandIcon={null}
      openKeys={openKeys}
      selectedKeys={[
        ...(typeMenuKey ? [typeMenuKey] : []),
        selectedWorkflow ? `workflow:${selectedWorkflow.workflowKey}` : 'workflow:all',
      ]}
      onClick={handleMenuClick}
      onOpenChange={handleOpenChange}
      items={taskTypes.map((type) => ({
        key: `type:${type.key}`,
        label: <NavigationItemLabel title={type.title} count={type.count} />,
        children:
          type.key === currentTypeKey
            ? workflowMenuItems
            : [
                {
                  key: `placeholder:${type.key}`,
                  disabled: true,
                  className: 'workflow-task-menu-placeholder',
                  label: null,
                },
              ],
      }))}
      className={css`
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        background: ${token.colorBgContainer};
        border-inline-end: 0 !important;

        > .ant-menu-submenu {
          flex: none;
          min-height: 0;
        }

        > .ant-menu-submenu-open {
          display: flex;
          flex: 0 1 auto;
          flex-direction: column;
          min-height: ${token.controlHeightLG + token.marginXXS * 2}px;
          overflow: hidden;
        }

        > .ant-menu-submenu-open > .ant-menu-submenu-title {
          flex: none;
        }

        > .ant-menu-submenu-open > .ant-menu-sub.ant-menu-inline {
          flex: 1;
          min-height: 0;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
        }

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

export function WorkflowTaskNavigation(props: {
  currentTypeKey?: string;
  mobile: boolean;
  onTaskTypeSelect: (typeKey: string) => void;
  taskTypes: WorkflowTaskNavigationType[];
  t: (key: string) => string;
}) {
  const { currentTypeKey, mobile, onTaskTypeSelect, taskTypes, t } = props;
  const { selectedWorkflow } = useWorkflowTaskFilterContext();
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  const currentType = taskTypes.find((type) => type.key === currentTypeKey);

  if (mobile) {
    return (
      <Layout.Header
        style={{
          background: token.colorBgContainer,
          height: 'auto',
          lineHeight: 'normal',
          padding: `${token.paddingXXS}px ${token.padding}px`,
        }}
      >
        <Button
          block
          type="text"
          aria-expanded={open}
          aria-label={t('Select workflow')}
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
          <Flex align="center" justify="space-between" gap={token.marginXS} style={{ minWidth: 0, width: '100%' }}>
            <Flex align="center" gap={token.marginXXS} style={{ minWidth: 0 }}>
              <span>{currentType?.title}</span>
              {selectedWorkflow ? (
                <>
                  <RightOutlined aria-hidden style={{ color: token.colorTextTertiary, flex: 'none' }} />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedWorkflow.title}
                  </span>
                </>
              ) : null}
            </Flex>
            <DownOutlined
              aria-hidden
              style={{ color: token.colorTextSecondary, flex: 'none', marginInlineStart: 'auto' }}
            />
          </Flex>
        </Button>
        <Drawer
          title={t('Workflow tasks')}
          placement="left"
          open={open}
          onClose={() => setOpen(false)}
          styles={{ body: { padding: 0 } }}
        >
          <WorkflowTaskNavigationMenu
            currentTypeKey={currentTypeKey}
            onTaskTypeSelect={onTaskTypeSelect}
            onWorkflowSelect={() => setOpen(false)}
            taskTypes={taskTypes}
            t={t}
          />
        </Drawer>
      </Layout.Header>
    );
  }

  return (
    <Layout.Sider
      theme="light"
      breakpoint="md"
      collapsedWidth={0}
      style={{
        background: token.colorBgContainer,
        borderInlineEnd: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      }}
    >
      <WorkflowTaskNavigationMenu
        currentTypeKey={currentTypeKey}
        onTaskTypeSelect={onTaskTypeSelect}
        taskTypes={taskTypes}
        t={t}
      />
    </Layout.Sider>
  );
}
