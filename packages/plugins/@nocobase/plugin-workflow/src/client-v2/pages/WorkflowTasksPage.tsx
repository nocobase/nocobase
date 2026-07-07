/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useMobileLayout } from '@nocobase/client-v2';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useMemoizedFn } from 'ahooks';
import {
  App,
  Badge,
  Button,
  Flex,
  Layout,
  List,
  Menu,
  Modal,
  Result,
  Segmented,
  Select,
  Tabs,
  Typography,
  theme,
} from 'antd';
import type { MenuProps } from 'antd';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getWorkflowTasksPath } from '../constants';
import {
  TASK_STATUS,
  TASK_STATUS_VALUES,
  WORKFLOW_TASKS_PAGE_SIZE,
  WorkflowTaskRecordContext,
  getAvailableWorkflowTaskTypeKeys,
  getWorkflowTaskRecordKey,
  getWorkflowTaskRegistry,
  getWorkflowTaskTypeKeys,
  normalizeWorkflowTaskRecordResponse,
  normalizeWorkflowTaskRecordsResponse,
  normalizeWorkflowTaskStatus,
  useWorkflowTaskCounts,
  type TaskTypeOptions,
  type WorkflowTaskFlowContext,
  type WorkflowTaskDetailModalProps,
  type WorkflowTaskRecord,
  type WorkflowTaskStatus,
} from '../taskCenter';
import { useT } from '../locale';
import {
  buildWorkflowTasksEmbeddedPath,
  parseWorkflowTasksEmbeddedRoute,
  type WorkflowTasksEmbeddedRoute,
} from './workflowTasksEmbeddedRoute';

interface WorkflowTasksRouteParams {
  taskType?: string;
  status?: string;
  popupId?: string;
}

type WorkflowTasksRouteState = WorkflowTasksEmbeddedRoute & {
  isMobileRoute: boolean;
};

type WorkflowTasksRouteTarget = {
  taskType?: string;
  status?: string;
  popupId?: string | number;
};

interface WorkflowTasksRouteAdapterValue {
  route: WorkflowTasksRouteState;
  navigate: (target: WorkflowTasksRouteTarget, options?: { replace?: boolean }) => void;
}

const MOBILE_TASK_TYPE_MENU_HEIGHT = 42;

interface PendingWorkflowTaskPopupRecord {
  popupId: string;
  record: WorkflowTaskRecord;
  taskTypeKey: string;
}

let pendingWorkflowTaskPopupRecord: PendingWorkflowTaskPopupRecord | null = null;

function getPendingWorkflowTaskPopupRecord(taskTypeKey?: string, popupId?: string) {
  if (
    pendingWorkflowTaskPopupRecord &&
    pendingWorkflowTaskPopupRecord.taskTypeKey === taskTypeKey &&
    pendingWorkflowTaskPopupRecord.popupId === popupId
  ) {
    const record = pendingWorkflowTaskPopupRecord.record;
    pendingWorkflowTaskPopupRecord = null;
    return record;
  }
  if (taskTypeKey || popupId) {
    pendingWorkflowTaskPopupRecord = null;
  }
  return null;
}

function clearPendingWorkflowTaskPopupRecord(taskTypeKey?: string, popupId?: string) {
  if (
    !taskTypeKey ||
    !popupId ||
    (pendingWorkflowTaskPopupRecord?.taskTypeKey === taskTypeKey && pendingWorkflowTaskPopupRecord.popupId === popupId)
  ) {
    pendingWorkflowTaskPopupRecord = null;
  }
}

const WorkflowTasksRouteContext = createContext<WorkflowTasksRouteAdapterValue | null>(null);

function useReactRouterWorkflowTasksRouteAdapter(): WorkflowTasksRouteAdapterValue {
  const params = useParams<'taskType' | 'status' | 'popupId'>();
  const location = useLocation();
  const navigate = useNavigate();
  const status = normalizeWorkflowTaskStatus(params.status);
  const isMobileRoute = /(^|\/)(mobile\/page|page)\/workflow-tasks(\/|$)/.test(location.pathname);
  const route = useMemo(
    () => ({
      taskType: params.taskType,
      status,
      popupId: params.popupId,
      isMobileRoute,
      search: location.search,
      hash: location.hash,
    }),
    [isMobileRoute, location.hash, location.search, params.popupId, params.taskType, status],
  );
  const navigateToRoute = useMemoizedFn((target: WorkflowTasksRouteTarget, options?: { replace?: boolean }) => {
    const path = withCurrentLocationSuffix(
      getWorkflowTasksPath(target.taskType, target.status, target.popupId, route.isMobileRoute),
      route,
    );
    if (options) {
      navigate(path, options);
      return;
    }
    navigate(path);
  });

  return useMemo(
    () => ({
      route,
      navigate: navigateToRoute,
    }),
    [navigateToRoute, route],
  );
}

function getEmbeddedViewUid(ctx?: WorkflowTaskFlowContext | null) {
  const viewUid = (ctx as { view?: { inputArgs?: { viewUid?: unknown } } } | undefined)?.view?.inputArgs?.viewUid;
  return typeof viewUid === 'string' ? viewUid : undefined;
}

export function WorkflowTasksEmbeddedRouteProvider({ children }: { children: React.ReactNode }) {
  const ctx = useFlowContext() as WorkflowTaskFlowContext | undefined;
  const location = useLocation();
  const navigate = useNavigate();
  const viewUid = getEmbeddedViewUid(ctx);
  const route = useMemo<WorkflowTasksRouteState>(() => {
    const embeddedRoute = parseWorkflowTasksEmbeddedRoute({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      viewUid,
    });
    return {
      ...embeddedRoute,
      isMobileRoute: true,
    };
  }, [location.hash, location.pathname, location.search, viewUid]);
  const navigateToRoute = useMemoizedFn((target: WorkflowTasksRouteTarget, options?: { replace?: boolean }) => {
    if (!viewUid) {
      return;
    }
    const path = buildWorkflowTasksEmbeddedPath({
      pathname: location.pathname,
      viewUid,
      route: target,
    });
    const nextPath = `${path}${location.search || ''}${location.hash || ''}`;
    if (options) {
      navigate(nextPath, options);
      return;
    }
    navigate(nextPath);
  });
  const value = useMemo(
    () => ({
      route,
      navigate: navigateToRoute,
    }),
    [navigateToRoute, route],
  );

  return <WorkflowTasksRouteContext.Provider value={value}>{children}</WorkflowTasksRouteContext.Provider>;
}

function useWorkflowTasksRouteAdapter() {
  const context = useContext(WorkflowTasksRouteContext);
  const reactRouterAdapter = useReactRouterWorkflowTasksRouteAdapter();
  return context || reactRouterAdapter;
}

function useWorkflowTasksRoute() {
  const { route } = useWorkflowTasksRouteAdapter();
  return {
    ...route,
  };
}

function withCurrentLocationSuffix(
  path: string,
  route: Pick<ReturnType<typeof useWorkflowTasksRoute>, 'search' | 'hash'>,
) {
  return `${path}${route.search || ''}${route.hash || ''}`;
}

function getWorkflowTaskListTotal(payload: ReturnType<typeof normalizeWorkflowTaskRecordsResponse>, page: number) {
  if (typeof payload.meta.count === 'number') {
    return payload.meta.count;
  }
  if (payload.meta.hasNext === true) {
    return page * WORKFLOW_TASKS_PAGE_SIZE + 1;
  }
  return (page - 1) * WORKFLOW_TASKS_PAGE_SIZE + payload.data.length;
}

function useCurrentTaskType(
  taskTypes: ReturnType<typeof getWorkflowTaskRegistry>,
  counts: ReturnType<typeof useWorkflowTaskCounts>['counts'],
) {
  const { taskType } = useWorkflowTasksRoute();
  const taskTypeKeys = useMemo(() => getWorkflowTaskTypeKeys(taskTypes), [taskTypes]);
  const availableTaskTypeKeys = useMemo(() => getAvailableWorkflowTaskTypeKeys(taskTypes, counts), [counts, taskTypes]);
  const currentTaskTypeKey = taskType ?? availableTaskTypeKeys[0] ?? taskTypeKeys[0];
  const currentTaskType = currentTaskTypeKey ? taskTypes?.get(currentTaskTypeKey) : undefined;

  return {
    taskTypeKeys,
    availableTaskTypeKeys,
    currentTaskType,
    currentTaskTypeKey,
  };
}

function TaskTypeMenu(props: {
  taskTypes: ReturnType<typeof getWorkflowTaskRegistry>;
  counts: ReturnType<typeof useWorkflowTaskCounts>['counts'];
  selectedKey?: string;
  status: WorkflowTaskStatus;
  mobile: boolean;
}) {
  const { taskTypes, counts, selectedKey, status, mobile } = props;
  const t = useT();
  const { token } = theme.useToken();
  const route = useWorkflowTasksRoute();
  const routeAdapter = useWorkflowTasksRouteAdapter();
  const taskTypeKeys = useMemo(() => getAvailableWorkflowTaskTypeKeys(taskTypes, counts), [counts, taskTypes]);
  const items = useMemo<MenuProps['items']>(
    () =>
      taskTypeKeys.map((key) => {
        const type = taskTypes?.get(key);
        return {
          key,
          label: (
            <Flex align="center" justify="space-between" gap={token.marginSM}>
              <span>{type?.title ? t(type.title) : key}</span>
              <Badge count={counts[key]?.pending || 0} size="small" />
            </Flex>
          ),
        };
      }),
    [counts, t, taskTypeKeys, taskTypes, token.marginSM],
  );

  const handleMenuClick = useMemoizedFn(({ key }: { key: string }) => {
    routeAdapter.navigate({ taskType: key, status: TASK_STATUS.PENDING });
  });

  if (!items?.length) {
    return null;
  }

  if (mobile) {
    return (
      <Menu
        data-testid="workflow-task-type-menu"
        mode="horizontal"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={items}
        onClick={handleMenuClick}
        style={{
          background: token.colorBgContainer,
          borderBottomColor: token.colorBorderSecondary,
          height: MOBILE_TASK_TYPE_MENU_HEIGHT,
          lineHeight: `${MOBILE_TASK_TYPE_MENU_HEIGHT}px`,
          minHeight: MOBILE_TASK_TYPE_MENU_HEIGHT,
          minWidth: 0,
        }}
      />
    );
  }

  return (
    <Layout.Sider
      theme="light"
      breakpoint="md"
      collapsedWidth={0}
      style={{
        background: token.colorBgContainer,
        borderRight: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={items}
        onClick={handleMenuClick}
        style={{ height: '100%', borderInlineEnd: 0 }}
      />
    </Layout.Sider>
  );
}

function TaskStatusControls(props: {
  type: TaskTypeOptions;
  status: WorkflowTaskStatus;
  mobile: boolean;
  reload: () => Promise<void>;
}) {
  const { type, status, mobile, reload } = props;
  const t = useT();
  const { token } = theme.useToken();
  const Actions = type.Actions;
  const route = useWorkflowTasksRoute();
  const routeAdapter = useWorkflowTasksRouteAdapter();
  const statusItems = useMemo(
    () =>
      TASK_STATUS_VALUES.map((value) => ({
        key: value,
        value,
        label: t(value === TASK_STATUS.PENDING ? 'Pending' : value === TASK_STATUS.COMPLETED ? 'Completed' : 'All'),
      })),
    [t],
  );

  const handleStatusChange = useMemoizedFn((value: string | number) => {
    routeAdapter.navigate({ taskType: type.key, status: String(value) });
  });

  if (mobile) {
    return (
      <Flex
        data-testid="workflow-task-status-controls"
        align="center"
        justify="space-between"
        gap={token.marginSM}
        wrap="wrap"
      >
        <Segmented
          value={status}
          options={statusItems.map(({ value, label }) => ({ value, label }))}
          onChange={handleStatusChange}
          style={{ minWidth: 0 }}
        />
        {Actions ? <Actions onlyIcon reload={reload} /> : null}
      </Flex>
    );
  }

  return (
    <Tabs
      activeKey={status}
      onChange={handleStatusChange}
      items={statusItems.map(({ key, label }) => ({ key, label }))}
      tabBarStyle={{ marginBottom: 0 }}
      tabBarExtraContent={Actions ? { right: <Actions reload={reload} /> } : undefined}
    />
  );
}

function WorkflowTaskPagination(props: {
  mobile: boolean;
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const { mobile, onPageChange, page, total } = props;
  const { token } = theme.useToken();
  const t = useT();
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 1) / WORKFLOW_TASKS_PAGE_SIZE));
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  const handlePrevious = useMemoizedFn(() => {
    if (hasPrevious) {
      onPageChange(page - 1);
    }
  });
  const handleNext = useMemoizedFn(() => {
    if (hasNext) {
      onPageChange(page + 1);
    }
  });

  return (
    <Flex
      align="center"
      className="ant-pagination"
      data-testid="workflow-task-pagination"
      gap={mobile ? token.marginXXS : token.marginSM}
      justify="end"
      style={{ width: '100%' }}
    >
      <Flex align="center" gap={token.marginXXS}>
        <Button
          aria-label={t('Previous page')}
          className={`ant-pagination-prev${hasPrevious ? '' : ' ant-pagination-disabled'}`}
          disabled={!hasPrevious}
          icon={<LeftOutlined />}
          onClick={handlePrevious}
          size="small"
          style={{ height: token.controlHeightSM, width: token.controlHeightSM }}
          type="text"
        />
        <Typography.Text
          data-testid="workflow-task-current-page"
          style={{
            lineHeight: `${token.controlHeightSM}px`,
            minWidth: token.sizeSM,
            textAlign: 'center',
          }}
        >
          {page}
        </Typography.Text>
        <Button
          aria-label={t('Next page')}
          className={`ant-pagination-next${hasNext ? '' : ' ant-pagination-disabled'}`}
          disabled={!hasNext}
          icon={<RightOutlined />}
          onClick={handleNext}
          size="small"
          style={{ height: token.controlHeightSM, width: token.controlHeightSM }}
          type="text"
        />
      </Flex>
      {mobile ? null : (
        <Select
          aria-label={t('Page size')}
          className="ant-pagination-options"
          options={[
            {
              label: `${WORKFLOW_TASKS_PAGE_SIZE} / page`,
              value: WORKFLOW_TASKS_PAGE_SIZE,
            },
          ]}
          popupMatchSelectWidth={false}
          size="middle"
          style={{ width: 112 }}
          value={WORKFLOW_TASKS_PAGE_SIZE}
        />
      )}
    </Flex>
  );
}

function WorkflowTaskList(props: {
  records: WorkflowTaskRecord[];
  loading: boolean;
  mobile: boolean;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onOpenRecord: (record: WorkflowTaskRecord) => void;
  refresh: () => Promise<void>;
  Item: TaskTypeOptions['Item'];
}) {
  const { records, loading, mobile, total, page, onPageChange, onOpenRecord, refresh, Item } = props;
  const { token } = theme.useToken();
  const t = useT();
  const showPagination = total > 0 || records.length > 0;

  const handleKeyDown = useMemoizedFn((event: React.KeyboardEvent<HTMLElement>, record: WorkflowTaskRecord) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenRecord(record);
    }
  });

  return (
    <>
      <List<WorkflowTaskRecord>
        dataSource={records}
        loading={loading}
        rowKey={(record) => String(getWorkflowTaskRecordKey(record) ?? '')}
        locale={{ emptyText: t('No data yet') }}
        split={false}
        style={{ background: token.colorBgLayout, flex: '1 1 0%', minHeight: 0, overflow: 'auto' }}
        renderItem={(record, index) => (
          <WorkflowTaskRecordContext.Provider value={{ record, openRecord: onOpenRecord, refresh }}>
            <List.Item
              role="button"
              tabIndex={0}
              onClick={() => onOpenRecord(record)}
              onKeyDown={(event) => handleKeyDown(event, record)}
              style={{
                cursor: 'pointer',
                padding: mobile
                  ? `0.5em 0.5em ${token.lineWidth}px`
                  : `${index === 0 ? token.paddingLG : token.paddingXS}px ${token.paddingLG}px ${token.paddingXXS}px`,
                background: token.colorBgLayout,
              }}
            >
              <div data-testid="workflow-task-list-item-content" style={{ width: '100%' }}>
                <Item />
              </div>
            </List.Item>
          </WorkflowTaskRecordContext.Provider>
        )}
      />
      {showPagination ? (
        <Flex
          justify="end"
          style={{
            background: token.colorBgLayout,
            flexShrink: 0,
            padding: mobile ? '0.5em' : `${token.padding}px ${token.paddingLG}px`,
          }}
        >
          <WorkflowTaskPagination mobile={mobile} onPageChange={onPageChange} page={page} total={total} />
        </Flex>
      ) : null}
    </>
  );
}

function getTaskRecordPathValue(record: WorkflowTaskRecord | null, path: string) {
  if (!record) {
    return undefined;
  }
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, record);
}

function getWorkflowTaskDetailTitle(type: TaskTypeOptions, record: WorkflowTaskRecord | null) {
  const title =
    getTaskRecordPathValue(record, 'node.title') ??
    getTaskRecordPathValue(record, 'title') ??
    getTaskRecordPathValue(record, 'workflow.title') ??
    type.title;
  return typeof title === 'string' && title ? title : type.title;
}

function WorkflowTaskDetailModal(props: WorkflowTaskDetailModalProps) {
  const { children, record, mobile, onClose, title } = props;
  const { token } = theme.useToken();

  return (
    <Modal
      open={Boolean(record)}
      title={title}
      footer={null}
      width="80vw"
      onCancel={onClose}
      destroyOnClose
      styles={{
        body: {
          maxHeight: mobile ? `calc(100dvh - ${token.sizeXXL * 2}px)` : undefined,
          overflow: 'auto',
        },
      }}
    >
      {children}
    </Modal>
  );
}

function WorkflowTaskMobileDetailPage(props: { children: React.ReactNode; onClose: () => void }) {
  const { children, onClose } = props;
  const { token } = theme.useToken();
  const t = useT();
  const contentClassName = css`
    > div > .ant-tabs > .ant-tabs-nav {
      background: ${token.colorBgContainer};
      margin: 0;
      padding-inline: ${token.padding}px ${token.padding}px;
      padding-left: ${token.controlHeight + token.paddingSM}px;
    }

    > div > .ant-tabs > .ant-tabs-content-holder {
      padding: ${token.padding}px;
    }
  `;

  return (
    <div
      data-testid="workflow-task-mobile-detail-page"
      style={{
        background: token.colorBgLayout,
        flex: '1 1 0%',
        minHeight: 0,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <Button
        aria-label={t('Back')}
        icon={<LeftOutlined />}
        onClick={onClose}
        style={{
          left: token.paddingXS,
          position: 'absolute',
          top: token.paddingSM,
          zIndex: 1,
        }}
        type="text"
      />
      <div data-testid="workflow-task-mobile-detail-content" className={contentClassName} style={{ minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

export function WorkflowTasksContent({ forceMobile = false }: { forceMobile?: boolean } = {}) {
  const ctx = useFlowContext() as WorkflowTaskFlowContext | undefined;
  const taskTypes = getWorkflowTaskRegistry(ctx);
  const countsState = useWorkflowTaskCounts(ctx, taskTypes);
  const { counts, reload: reloadCounts } = countsState;
  const { currentTaskType, currentTaskTypeKey, availableTaskTypeKeys } = useCurrentTaskType(taskTypes, counts);
  const route = useWorkflowTasksRoute();
  const routeAdapter = useWorkflowTasksRouteAdapter();
  const { isMobileLayout } = useMobileLayout();
  const mobile = forceMobile || route.isMobileRoute || isMobileLayout;
  const { message } = App.useApp();
  const t = useT();
  const { token } = theme.useToken();
  const [records, setRecords] = useState<WorkflowTaskRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<WorkflowTaskRecord | null>(() =>
    getPendingWorkflowTaskPopupRecord(currentTaskTypeKey, route.popupId),
  );
  const [total, setTotal] = useState(0);
  const listSignature = `${currentTaskTypeKey ?? ''}\n${route.status}\n${route.search}`;
  const [paginationState, setPaginationState] = useState({ signature: '', page: 1 });
  const page = paginationState.signature === listSignature ? paginationState.page : 1;
  const [loading, setLoading] = useState(false);
  const listRequestSeqRef = useRef(0);
  const popupRequestSeqRef = useRef(0);
  const currentRecordRouteRef = useRef<{ popupId: string; taskTypeKey?: string } | null>(
    currentRecord && route.popupId && currentTaskTypeKey
      ? { popupId: route.popupId, taskTypeKey: currentTaskTypeKey }
      : null,
  );
  const pendingOpenRouteRef = useRef<{ popupId: string; taskTypeKey?: string } | null>(currentRecordRouteRef.current);
  const showLoadFailed = useMemoizedFn(() => {
    message.error(t('Load failed'));
  });

  useEffect(() => {
    const previousTitle = document.title;
    if (currentTaskType?.title) {
      document.title = `${t('Workflow todos')}: ${t(currentTaskType.title)} - NocoBase`;
    }
    return () => {
      document.title = previousTitle;
    };
  }, [currentTaskType?.title, t]);

  useEffect(() => {
    if (!route.taskType && availableTaskTypeKeys.length) {
      routeAdapter.navigate(
        {
          taskType: availableTaskTypeKeys[0],
          status: route.status,
        },
        {
          replace: true,
        },
      );
    }
  }, [availableTaskTypeKeys, route.status, route.taskType, routeAdapter]);

  useEffect(() => {
    if (paginationState.signature !== listSignature) {
      setPaginationState({ signature: listSignature, page: 1 });
    }
  }, [listSignature, paginationState.signature]);

  const loadRecords = useMemoizedFn(async () => {
    const requestSeq = ++listRequestSeqRef.current;
    if (!ctx?.api || !currentTaskType) {
      setRecords([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    const resource = ctx.api.resource(currentTaskType.collection);
    const action = currentTaskType.action ?? 'list';
    const list = resource[action];
    if (!list) {
      setRecords([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = currentTaskType.useActionParams?.(route.status) ?? {};
      const response = await list({
        page,
        pageSize: WORKFLOW_TASKS_PAGE_SIZE,
        sort: ['-createdAt'],
        ...params,
      });
      const payload = normalizeWorkflowTaskRecordsResponse(response);
      if (requestSeq !== listRequestSeqRef.current) {
        return;
      }
      setRecords(payload.data);
      setTotal(getWorkflowTaskListTotal(payload, page));
    } catch (error) {
      if (requestSeq !== listRequestSeqRef.current) {
        return;
      }
      setRecords([]);
      setTotal(0);
      throw error;
    } finally {
      if (requestSeq === listRequestSeqRef.current) {
        setLoading(false);
      }
    }
  });

  const refresh = useMemoizedFn(async () => {
    await Promise.all([loadRecords(), reloadCounts()]);
  });

  useEffect(() => {
    loadRecords().catch((error) => {
      console.error('Failed to load workflow tasks', error);
      showLoadFailed();
    });
    return () => {
      listRequestSeqRef.current += 1;
    };
  }, [currentTaskTypeKey, loadRecords, page, route.search, route.status, showLoadFailed]);

  const loadPopupRecord = useMemoizedFn(async () => {
    const requestSeq = ++popupRequestSeqRef.current;
    if (!ctx?.api || !currentTaskType || !route.popupId) {
      currentRecordRouteRef.current = null;
      pendingOpenRouteRef.current = null;
      clearPendingWorkflowTaskPopupRecord();
      setCurrentRecord(null);
      return;
    }

    let response: unknown;
    try {
      response = currentTaskType.getPopupRecord
        ? await currentTaskType.getPopupRecord(ctx.api, { params: { filterByTk: route.popupId } })
        : await ctx.api.resource(currentTaskType.collection).get?.({ filterByTk: route.popupId });
    } catch (error) {
      if (requestSeq !== popupRequestSeqRef.current) {
        return;
      }
      throw error;
    }
    if (requestSeq !== popupRequestSeqRef.current) {
      return;
    }
    currentRecordRouteRef.current = {
      taskTypeKey: currentTaskType.key,
      popupId: route.popupId,
    };
    clearPendingWorkflowTaskPopupRecord(currentTaskType.key, route.popupId);
    setCurrentRecord(normalizeWorkflowTaskRecordResponse(response));
  });

  useEffect(() => {
    if (!route.popupId) {
      if (!pendingOpenRouteRef.current) {
        popupRequestSeqRef.current += 1;
        currentRecordRouteRef.current = null;
        clearPendingWorkflowTaskPopupRecord();
        setCurrentRecord(null);
      }
      return;
    }
    pendingOpenRouteRef.current = null;
    const nextPopupId = route.popupId;
    const nextTaskTypeKey = currentTaskTypeKey;
    setCurrentRecord((record) => {
      const routeKey = currentRecordRouteRef.current;
      const recordKey = record ? getWorkflowTaskRecordKey(record) : undefined;
      if (record && routeKey?.taskTypeKey === nextTaskTypeKey && String(recordKey) === nextPopupId) {
        return record;
      }
      currentRecordRouteRef.current = null;
      clearPendingWorkflowTaskPopupRecord();
      return null;
    });
    loadPopupRecord().catch((error) => {
      console.error('Failed to load workflow task detail', error);
      currentRecordRouteRef.current = null;
      pendingOpenRouteRef.current = null;
      clearPendingWorkflowTaskPopupRecord(currentTaskTypeKey, route.popupId);
      setCurrentRecord(null);
      showLoadFailed();
    });
    return () => {
      popupRequestSeqRef.current += 1;
    };
  }, [currentTaskTypeKey, loadPopupRecord, route.popupId, route.status, showLoadFailed]);

  const handleOpenRecord = useMemoizedFn((record: WorkflowTaskRecord) => {
    if (!currentTaskType) {
      return;
    }
    const recordKey = getWorkflowTaskRecordKey(record);
    popupRequestSeqRef.current += 1;
    currentRecordRouteRef.current =
      recordKey === undefined || recordKey === null
        ? null
        : {
            taskTypeKey: currentTaskType.key,
            popupId: String(recordKey),
          };
    pendingOpenRouteRef.current = currentRecordRouteRef.current;
    pendingWorkflowTaskPopupRecord = currentRecordRouteRef.current
      ? {
          popupId: currentRecordRouteRef.current.popupId,
          record,
          taskTypeKey: currentTaskType.key,
        }
      : null;
    setCurrentRecord(record);
    if (recordKey !== undefined && recordKey !== null) {
      routeAdapter.navigate({
        taskType: currentTaskType.key,
        status: route.status,
        popupId: String(recordKey),
      });
    }
  });

  const handleCloseRecord = useMemoizedFn(() => {
    popupRequestSeqRef.current += 1;
    currentRecordRouteRef.current = null;
    pendingOpenRouteRef.current = null;
    clearPendingWorkflowTaskPopupRecord();
    setCurrentRecord(null);
    if (currentTaskType) {
      routeAdapter.navigate(
        {
          taskType: currentTaskType.key,
          status: route.status,
        },
        { replace: true },
      );
    }
  });

  const handlePageChange = useMemoizedFn((nextPage: number) => {
    setPaginationState({ signature: listSignature, page: nextPage });
  });

  if (!currentTaskType || !currentTaskTypeKey) {
    return (
      <Result
        status={route.taskType ? 'error' : 'info'}
        title={
          route.taskType
            ? t('Task type {{type}} is invalid', { type: route.taskType })
            : t('No workflow tasks available. Please contact the administrator.')
        }
      />
    );
  }

  const header = (
    <Flex vertical gap={mobile ? token.marginXS : token.marginXXS}>
      {mobile ? null : (
        <Typography.Title level={4} style={{ lineHeight: `${token.controlHeight}px`, margin: 0 }}>
          {t(currentTaskType.title)}
        </Typography.Title>
      )}
      <TaskStatusControls type={currentTaskType} status={route.status} mobile={mobile} reload={refresh} />
    </Flex>
  );
  const DetailModal = currentTaskType.DetailModal ?? WorkflowTaskDetailModal;
  const Detail = currentTaskType.Detail;
  const detailTitle = t(getWorkflowTaskDetailTitle(currentTaskType, currentRecord));
  const detailContent = currentRecord ? (
    <WorkflowTaskRecordContext.Provider value={{ record: currentRecord, refresh, openRecord: setCurrentRecord }}>
      <Detail />
    </WorkflowTaskRecordContext.Provider>
  ) : null;
  const renderMobileDetailPage = mobile && Boolean(currentRecord);

  return (
    <Layout
      data-testid={mobile ? 'workflow-tasks-mobile' : 'workflow-tasks-desktop'}
      style={{
        minHeight: mobile ? 0 : '100%',
        height: '100%',
        background: token.colorBgLayout,
      }}
    >
      {mobile && !renderMobileDetailPage ? (
        <Layout.Header
          style={{
            height: 'auto',
            lineHeight: 'normal',
            padding: 0,
            background: token.colorBgContainer,
            borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
          }}
        >
          <Flex vertical gap={0}>
            <TaskTypeMenu
              taskTypes={taskTypes}
              counts={counts}
              selectedKey={currentTaskTypeKey}
              status={route.status}
              mobile
            />
            <div style={{ padding: token.paddingSM }}>{header}</div>
          </Flex>
        </Layout.Header>
      ) : mobile ? null : (
        <TaskTypeMenu
          taskTypes={taskTypes}
          counts={counts}
          selectedKey={currentTaskTypeKey}
          status={route.status}
          mobile={false}
        />
      )}
      <Layout style={{ background: token.colorBgLayout }}>
        <Layout.Content
          style={{
            display: 'flex',
            flex: '1 1 0%',
            flexDirection: 'column',
            minHeight: 0,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {mobile || renderMobileDetailPage ? null : (
            <div
              style={{
                padding: `${token.padding}px ${token.paddingLG}px 0`,
                background: token.colorBgContainer,
                borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
              }}
            >
              {header}
            </div>
          )}
          {renderMobileDetailPage ? (
            <WorkflowTaskMobileDetailPage onClose={handleCloseRecord}>{detailContent}</WorkflowTaskMobileDetailPage>
          ) : (
            <div
              data-testid="workflow-task-list-region"
              style={{
                background: token.colorBgLayout,
                display: 'flex',
                flex: '1 1 0%',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <WorkflowTaskList
                records={records}
                loading={loading}
                mobile={mobile}
                total={total}
                page={page}
                onPageChange={handlePageChange}
                onOpenRecord={handleOpenRecord}
                refresh={refresh}
                Item={currentTaskType.Item}
              />
            </div>
          )}
        </Layout.Content>
      </Layout>
      {renderMobileDetailPage ? null : (
        <DetailModal
          type={currentTaskType}
          record={currentRecord}
          mobile={mobile}
          title={detailTitle}
          onClose={handleCloseRecord}
        >
          {detailContent}
        </DetailModal>
      )}
    </Layout>
  );
}

export default function WorkflowTasksPage() {
  return <WorkflowTasksContent />;
}
