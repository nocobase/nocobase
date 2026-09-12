/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, ExclamationCircleFilled, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { CollectionFilter, ExtendCollectionsProvider, Table } from '@nocobase/client-v2';
import { useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Flex, Space, Tooltip, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import executionCollection from '../../common/collections/executions';
import { EXECUTION_STATUS, EXECUTION_STATUS_OPTIONS } from '../../common/executionStatus';
import { ExecutionStatusTag } from '../components/ExecutionStatusTag';
import { useWorkflowRuntimePaths } from '../hooks/useWorkflowRuntimePaths';
import { useT, useWorkflowTranslation } from '../locale';

const EXECUTION_PAGE_SIZE = 20;

// Mirror v1's `nonfilterable: ['workflow']` on its execution `Filter.Action`. Dropping the `workflow` association also
// keeps the filter field picker from resolving the `workflows` target collection, which isn't published to the v2 data
// source.
const EXECUTIONS_NONFILTERABLE_FIELD_NAMES = ['workflow'];

type ExecutionRecord = {
  id: number | string;
  createdAt?: string;
  workflowId?: number | string;
  status?: number | null;
  [key: string]: any;
};

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records: ExecutionRecord[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const meta = body?.meta || payload?.meta || {};
  return { records, total: meta.count || meta.total || records.length };
}

function ExecutionHistoryDrawerInner({ workflowKey }: { workflowKey: string | number }) {
  const { t } = useWorkflowTranslation();
  const compile = useT();
  const ctx = useFlowContext();
  const engine = useFlowEngine();
  const { getWorkflowExecutionPath } = useWorkflowRuntimePaths();
  const { token } = theme.useToken();
  const { modal, message } = App.useApp();
  const resource = ctx.api.resource('executions');
  const filterCollection = useMemo(
    () => engine.context.dataSourceManager?.getDataSource?.('main')?.getCollection?.('executions'),
    [engine],
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(EXECUTION_PAGE_SIZE);
  const [filterPayload, setFilterPayload] = useState<Record<string, any> | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleFilterChange = useMemoizedFn((filter: Record<string, unknown> | undefined) => {
    setFilterPayload(filter);
    setPage(1);
  });

  const { data, loading, refresh } = useRequest(
    async () => {
      // The `{ key: workflowKey }` scope is mandatory; the user-built filter is ANDed onto it so it can never widen the
      // result set past this workflow.
      const filter: Record<string, any> = filterPayload
        ? { $and: [{ key: workflowKey }, filterPayload] }
        : { key: workflowKey };
      const response = await resource.list({
        page,
        pageSize,
        sort: ['-id'],
        except: ['context', 'output', 'stack'],
        filter,
      });
      return normalizeListResponse(response);
    },
    { refreshDeps: [page, pageSize, filterPayload, workflowKey] },
  );

  const handlePaginationChange = useMemoizedFn((nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }
    setPage(nextPage);
  });

  const handleDelete = useMemoizedFn((filterByTk: React.Key | React.Key[]) => {
    modal.confirm({
      title: t('Delete record'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({ filterByTk });
        setSelectedRowKeys([]);
        refresh();
      },
    });
  });

  const handleClear = useMemoizedFn(() => {
    modal.confirm({
      title: t('Clear all executions'),
      content: t(
        'Clear executions will not reset executed count, and started executions will not be deleted, are you sure you want to delete them all?',
      ),
      async onOk() {
        await resource.destroy({ filter: { key: workflowKey } });
        message.success(t('Operation succeeded'));
        setSelectedRowKeys([]);
        refresh();
      },
    });
  });

  const handleCancel = useMemoizedFn((record: ExecutionRecord) => {
    modal.confirm({
      title: t('Cancel the execution'),
      icon: <ExclamationCircleFilled />,
      content: t('Are you sure you want to cancel the execution?'),
      async onOk() {
        await resource.cancel({ filterByTk: record.id });
        message.success(t('Operation succeeded'));
        refresh();
      },
    });
  });

  const handleView = useMemoizedFn((record: ExecutionRecord) => {
    // Close the history drawer before leaving for the execution page.
    ctx.view?.close?.();
    ctx.router.navigate(getWorkflowExecutionPath(record.id));
  });

  const columns = useMemo<ColumnsType<ExecutionRecord>>(
    () => [
      { title: t('ID'), dataIndex: 'id' },
      {
        title: t('Triggered at'),
        dataIndex: 'createdAt',
        render: (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : null),
      },
      {
        // Linking to the workflow version opens the canvas, which is not yet migrated to v2 — show the version number
        // as plain text for now.
        title: t('Version'),
        dataIndex: 'workflowId',
        render: (value) => (value != null ? `#${value}` : null),
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        render: (value, record) => (
          <Space>
            <ExecutionStatusTag value={value} />
            {record.status === EXECUTION_STATUS.STARTED || record.status === EXECUTION_STATUS.QUEUEING ? (
              <Tooltip title={t('Cancel the execution')}>
                <Button
                  type="link"
                  danger
                  onClick={() => handleCancel(record)}
                  shape="circle"
                  size="small"
                  icon={<StopOutlined />}
                />
              </Tooltip>
            ) : null}
          </Space>
        ),
      },
      {
        title: t('Actions'),
        width: 160,
        render: (_, record) => (
          <Space size="middle" wrap={false} style={{ whiteSpace: 'nowrap' }}>
            <a onClick={() => handleView(record)}>{t('View')}</a>
            {record.status !== EXECUTION_STATUS.STARTED ? (
              <a onClick={() => handleDelete(record.id)}>{t('Delete')}</a>
            ) : null}
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleCancel, handleDelete, handleView, t],
  );

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: token.margin }}>
        <CollectionFilter
          collection={filterCollection}
          nonfilterableFieldNames={EXECUTIONS_NONFILTERABLE_FIELD_NAMES}
          onChange={handleFilterChange}
          t={compile}
        />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
            {t('Refresh')}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            disabled={!selectedRowKeys.length}
            onClick={() => handleDelete(selectedRowKeys)}
          >
            {t('Delete')}
          </Button>
          <Button danger onClick={handleClear}>
            {t('Clear')}
          </Button>
        </Space>
      </Flex>
      <Table<ExecutionRecord>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data?.records || []}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{ current: page, pageSize, total: data?.total || 0, onChange: handlePaginationChange }}
      />
    </div>
  );
}

export function ExecutionHistoryDrawer({ workflowKey }: { workflowKey: string | number }) {
  const compile = useT();
  // The shared `executions` collection is `schema-only`, so it isn't published to the v2 data source — register a
  // client-only copy so `CollectionFilter` can resolve its fields. Its `status` field carries the v1 Formily template
  // `enum: '{{ExecutionStatusOptions}}'`, which the v2 filter value renderer can't compile; replace it with the
  // resolved `{ label, value }` options up front so the Status condition renders as a Select (matching v1).
  const collections = useMemo(() => {
    const statusOptions = EXECUTION_STATUS_OPTIONS.map((option) => ({
      value: option.value,
      label: compile(option.label),
    }));
    return [
      {
        ...executionCollection,
        fields: executionCollection.fields.map((field) =>
          field?.name === 'status' && field.uiSchema
            ? { ...field, uiSchema: { ...field.uiSchema, enum: statusOptions } }
            : field,
        ),
      },
    ];
  }, [compile]);

  return (
    <ExtendCollectionsProvider collections={collections}>
      <ExecutionHistoryDrawerInner workflowKey={workflowKey} />
    </ExtendCollectionsProvider>
  );
}

export default ExecutionHistoryDrawer;
