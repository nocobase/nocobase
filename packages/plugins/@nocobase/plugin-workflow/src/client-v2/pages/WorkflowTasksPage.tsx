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
import { App, Badge, Drawer, Flex, Layout, List, Menu, Result, Segmented, Tabs, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
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
  type WorkflowTaskRecord,
  type WorkflowTaskStatus,
} from '../taskCenter';
import { useT } from '../locale';

interface WorkflowTasksRouteParams {
  taskType?: string;
  status?: string;
  popupId?: string;
}

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
  };
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
    navigate(getWorkflowTasksPath(key, TASK_STATUS.PENDING, undefined, mobile));
  });

  if (!items?.length) {
    return null;
  }

  if (mobile) {
    return (
      <Menu
        mode="horizontal"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={items}
        onClick={handleMenuClick}
        style={{
          background: token.colorBgContainer,
          borderBottomColor: token.colorBorderSecondary,
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
    navigate(getWorkflowTasksPath(type.key, String(value), undefined, route.isMobileRoute));
  });

  if (mobile) {
    return (
      <Flex align="center" justify="space-between" gap={token.marginSM}>
        <Segmented
          value={status}
          options={statusItems.map(({ value, label }) => ({ value, label }))}
          onChange={handleStatusChange}
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
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onOpenRecord: (record: WorkflowTaskRecord) => void;
  refresh: () => Promise<void>;
  Item: TaskTypeOptions['Item'];
}) {
  const { records, loading, total, page, onPageChange, onOpenRecord, refresh, Item } = props;
  const { token } = theme.useToken();
  const t = useT();
  const pagination =
    total > WORKFLOW_TASKS_PAGE_SIZE
      ? {
          current: page,
          pageSize: WORKFLOW_TASKS_PAGE_SIZE,
          total,
          onChange: onPageChange,
          showSizeChanger: false,
        }
      : false;

  const handleKeyDown = useMemoizedFn((event: React.KeyboardEvent<HTMLElement>, record: WorkflowTaskRecord) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenRecord(record);
    }
  });

  return (
    <List<WorkflowTaskRecord>
      dataSource={records}
      loading={loading}
      rowKey={(record) => String(getWorkflowTaskRecordKey(record) ?? '')}
      locale={{ emptyText: t('No data yet') }}
      pagination={pagination}
      renderItem={(record) => (
        <WorkflowTaskRecordContext.Provider value={{ record, openRecord: onOpenRecord, refresh }}>
          <List.Item
            role="button"
            tabIndex={0}
            onClick={() => onOpenRecord(record)}
            onKeyDown={(event) => handleKeyDown(event, record)}
            style={{
              cursor: 'pointer',
              padding: token.padding,
              background: token.colorBgContainer,
            }}
          >
            <Item />
          </List.Item>
        </WorkflowTaskRecordContext.Provider>
      )}
    />
  );
}

function WorkflowTaskDetailDrawer(props: {
  type: TaskTypeOptions;
  record: WorkflowTaskRecord | null;
  mobile: boolean;
  refresh: () => Promise<void>;
  onClose: () => void;
}) {
  const { type, record, mobile, refresh, onClose } = props;
  const t = useT();
  const { token } = theme.useToken();
  const Detail = type.Detail;

  return (
    <Drawer
      open={Boolean(record)}
      title={t(type.title)}
      size="large"
      placement={mobile ? 'bottom' : 'right'}
      height={mobile ? '100dvh' : undefined}
      onClose={onClose}
      destroyOnClose
      styles={{
        body: {
          padding: token.paddingLG,
        },
      }}
    >
      {record ? (
        <WorkflowTaskRecordContext.Provider value={{ record, refresh }}>
          <Detail />
        </WorkflowTaskRecordContext.Provider>
      ) : null}
    </Drawer>
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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const showLoadFailed = useMemoizedFn(() => {
    message.error(t('Load failed'));
  });

  useEffect(() => {
    if (!route.taskType && availableTaskTypeKeys.length) {
      navigate(getWorkflowTasksPath(availableTaskTypeKeys[0], route.status, undefined, route.isMobileRoute), {
        replace: true,
      });
    }
  }, [availableTaskTypeKeys, navigate, route.isMobileRoute, route.status, route.taskType]);

  useEffect(() => {
    setPage(1);
  }, [currentTaskTypeKey, route.status]);

  const loadRecords = useMemoizedFn(async () => {
    if (!ctx?.api || !currentTaskType) {
      setRecords([]);
      setTotal(0);
      return;
    }
    const resource = ctx.api.resource(currentTaskType.collection);
    const action = currentTaskType.action ?? 'list';
    const list = resource[action];
    if (!list) {
      setRecords([]);
      setTotal(0);
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
      setRecords(payload.data);
      setTotal(typeof payload.meta.count === 'number' ? payload.meta.count : payload.data.length);
    } finally {
      setLoading(false);
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
  }, [currentTaskTypeKey, loadRecords, page, route.status, showLoadFailed]);

  const loadPopupRecord = useMemoizedFn(async () => {
    if (!ctx?.api || !currentTaskType || !route.popupId) {
      setCurrentRecord(null);
      return;
    }

    const response = currentTaskType.getPopupRecord
      ? await currentTaskType.getPopupRecord(ctx.api, { params: { filterByTk: route.popupId } })
      : await ctx.api.resource(currentTaskType.collection).get?.({ filterByTk: route.popupId });
    setCurrentRecord(normalizeWorkflowTaskRecordResponse(response));
  });

  useEffect(() => {
    if (!route.popupId) {
      setCurrentRecord(null);
      return;
    }
    loadPopupRecord().catch((error) => {
      console.error('Failed to load workflow task detail', error);
      showLoadFailed();
    });
  }, [loadPopupRecord, route.popupId, showLoadFailed]);

  const handleOpenRecord = useMemoizedFn((record: WorkflowTaskRecord) => {
    if (!currentTaskType) {
      return;
    }
    const recordKey = getWorkflowTaskRecordKey(record);
    setCurrentRecord(record);
    if (recordKey !== undefined && recordKey !== null) {
      navigate(getWorkflowTasksPath(currentTaskType.key, route.status, String(recordKey), route.isMobileRoute));
    }
  });

  const handleCloseRecord = useMemoizedFn(() => {
    setCurrentRecord(null);
    if (currentTaskType) {
      navigate(getWorkflowTasksPath(currentTaskType.key, route.status, undefined, route.isMobileRoute));
    }
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
    <Flex vertical gap={token.marginSM}>
      {mobile ? null : (
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t(currentTaskType.title)}
        </Typography.Title>
      )}
      <TaskStatusControls type={currentTaskType} status={route.status} mobile={mobile} reload={refresh} />
    </Flex>
  );

  return (
    <Layout
      data-testid={mobile ? 'workflow-tasks-mobile' : 'workflow-tasks-desktop'}
      style={{
        minHeight: mobile ? '100dvh' : '100%',
        height: mobile ? undefined : '100%',
        background: token.colorBgLayout,
      }}
    >
      {mobile ? (
        <Layout.Header
          style={{
            height: 'auto',
            lineHeight: 'normal',
            padding: token.paddingSM,
            background: token.colorBgContainer,
            borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
          }}
        >
          <Flex vertical gap={token.marginSM}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t('Workflow tasks')}
            </Typography.Title>
            <TaskTypeMenu
              taskTypes={taskTypes}
              counts={counts}
              selectedKey={currentTaskTypeKey}
              status={route.status}
              mobile
            />
            {header}
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
            padding: mobile ? token.paddingSM : token.paddingLG,
            overflow: 'auto',
          }}
        >
          {mobile ? null : (
            <div
              style={{
                padding: token.paddingLG,
                background: token.colorBgContainer,
                borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
              }}
            >
              {header}
            </div>
          )}
          <div
            style={{
              background: token.colorBgContainer,
            }}
          >
            <WorkflowTaskList
              records={records}
              loading={loading}
              total={total}
              page={page}
              onPageChange={setPage}
              onOpenRecord={handleOpenRecord}
              refresh={refresh}
              Item={currentTaskType.Item}
            />
          </div>
        </Layout.Content>
      </Layout>
      <WorkflowTaskDetailDrawer
        type={currentTaskType}
        record={currentRecord}
        mobile={mobile}
        refresh={refresh}
        onClose={handleCloseRecord}
      />
    </Layout>
  );
}

export default function WorkflowTasksPage() {
  return <WorkflowTasksPageContent />;
}
