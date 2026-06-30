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
import { useMemoizedFn } from 'ahooks';
import {
  App,
  Badge,
  Flex,
  Layout,
  List,
  Menu,
  Modal,
  Pagination,
  Result,
  Segmented,
  Tabs,
  Typography,
  theme,
} from 'antd';
import type { MenuProps } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

interface WorkflowTasksRouteParams {
  taskType?: string;
  status?: string;
  popupId?: string;
}

const MOBILE_TASK_TYPE_MENU_HEIGHT = 42;

function useWorkflowTasksRoute() {
  const params = useParams<WorkflowTasksRouteParams>();
  const location = useLocation();
  const status = normalizeWorkflowTaskStatus(params.status);
  const isMobileRoute =
    location.pathname.startsWith('/mobile/page/workflow-tasks') || location.pathname.startsWith('/page/workflow-tasks');

  return {
    taskType: params.taskType,
    status,
    popupId: params.popupId,
    isMobileRoute,
    search: location.search,
    hash: location.hash,
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
  const navigate = useNavigate();
  const t = useT();
  const { token } = theme.useToken();
  const route = useWorkflowTasksRoute();
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
    navigate(withCurrentLocationSuffix(getWorkflowTasksPath(key, TASK_STATUS.PENDING, undefined, mobile), route));
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
  const navigate = useNavigate();
  const t = useT();
  const { token } = theme.useToken();
  const Actions = type.Actions;
  const route = useWorkflowTasksRoute();
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
    navigate(
      withCurrentLocationSuffix(getWorkflowTasksPath(type.key, String(value), undefined, route.isMobileRoute), route),
    );
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
      tabBarExtraContent={Actions ? { right: <Actions reload={reload} /> } : undefined}
    />
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
  const pagination = {
    current: page,
    hideOnSinglePage: false,
    pageSize: WORKFLOW_TASKS_PAGE_SIZE,
    pageSizeOptions: [WORKFLOW_TASKS_PAGE_SIZE],
    showSizeChanger: !mobile,
    simple: true,
    total: Math.max(total, 1),
    onChange: onPageChange,
  };

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
        style={{ flex: '1 1 0%', minHeight: 0 }}
        renderItem={(record) => (
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
                  : `${token.paddingXS}px ${token.paddingLG}px ${token.paddingXXS}px`,
                background: token.colorBgContainer,
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
            borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
            padding: mobile ? '0.5em' : `0 ${token.paddingLG}px ${token.padding}px`,
          }}
        >
          <Pagination {...pagination} style={{ justifyContent: 'flex-end', width: '100%' }} />
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

function WorkflowTasksPageContent() {
  const ctx = useFlowContext() as WorkflowTaskFlowContext | undefined;
  const taskTypes = getWorkflowTaskRegistry(ctx);
  const countsState = useWorkflowTaskCounts(ctx, taskTypes);
  const { counts, reload: reloadCounts } = countsState;
  const { currentTaskType, currentTaskTypeKey, availableTaskTypeKeys } = useCurrentTaskType(taskTypes, counts);
  const route = useWorkflowTasksRoute();
  const { isMobileLayout } = useMobileLayout();
  const mobile = route.isMobileRoute || isMobileLayout;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const t = useT();
  const { token } = theme.useToken();
  const [records, setRecords] = useState<WorkflowTaskRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<WorkflowTaskRecord | null>(null);
  const [total, setTotal] = useState(0);
  const listSignature = `${currentTaskTypeKey ?? ''}\n${route.status}\n${route.search}`;
  const [paginationState, setPaginationState] = useState({ signature: '', page: 1 });
  const page = paginationState.signature === listSignature ? paginationState.page : 1;
  const [loading, setLoading] = useState(false);
  const listRequestSeqRef = useRef(0);
  const popupRequestSeqRef = useRef(0);
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
      navigate(
        withCurrentLocationSuffix(
          getWorkflowTasksPath(availableTaskTypeKeys[0], route.status, undefined, route.isMobileRoute),
          route,
        ),
        {
          replace: true,
        },
      );
    }
  }, [availableTaskTypeKeys, navigate, route, route.isMobileRoute, route.status, route.taskType]);

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
    setCurrentRecord(normalizeWorkflowTaskRecordResponse(response));
  });

  useEffect(() => {
    setCurrentRecord(null);
    if (!route.popupId) {
      popupRequestSeqRef.current += 1;
      return;
    }
    loadPopupRecord().catch((error) => {
      console.error('Failed to load workflow task detail', error);
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
    setCurrentRecord(record);
    if (recordKey !== undefined && recordKey !== null) {
      navigate(
        withCurrentLocationSuffix(
          getWorkflowTasksPath(currentTaskType.key, route.status, String(recordKey), route.isMobileRoute),
          route,
        ),
      );
    }
  });

  const handleCloseRecord = useMemoizedFn(() => {
    setCurrentRecord(null);
    if (currentTaskType) {
      navigate(
        withCurrentLocationSuffix(
          getWorkflowTasksPath(currentTaskType.key, route.status, undefined, route.isMobileRoute),
          route,
        ),
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

  return (
    <Layout
      data-testid={mobile ? 'workflow-tasks-mobile' : 'workflow-tasks-desktop'}
      style={{
        minHeight: mobile ? 0 : '100%',
        height: '100%',
        background: token.colorBgLayout,
      }}
    >
      {mobile ? (
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
      ) : (
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
            overflow: 'auto',
          }}
        >
          {mobile ? null : (
            <div
              style={{
                padding: `${token.padding}px ${token.padding}px 0`,
                background: token.colorBgContainer,
                borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
              }}
            >
              {header}
            </div>
          )}
          <div
            data-testid="workflow-task-list-region"
            style={{
              background: token.colorBgContainer,
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
        </Layout.Content>
      </Layout>
      <DetailModal
        type={currentTaskType}
        record={currentRecord}
        mobile={mobile}
        title={detailTitle}
        onClose={handleCloseRecord}
      >
        {detailContent}
      </DetailModal>
    </Layout>
  );
}

export default function WorkflowTasksPage() {
  return <WorkflowTasksPageContent />;
}
