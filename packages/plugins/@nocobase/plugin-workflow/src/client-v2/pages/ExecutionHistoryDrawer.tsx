/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Flex, Popover, Select, Space, Tooltip, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { EXECUTION_STATUS, EXECUTION_STATUS_OPTIONS } from '../../common/executionStatus';
import { ExecutionStatusTag } from '../components/ExecutionStatusTag';
import { useT, useWorkflowTranslation } from '../locale';

const EXECUTION_PAGE_SIZE = 20;

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

export function ExecutionHistoryDrawer({ workflowKey }: { workflowKey: string | number }) {
  const { t } = useWorkflowTranslation();
  const compile = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { modal, message } = App.useApp();
  const resource = ctx.api.resource('executions');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(EXECUTION_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data, loading, refresh } = useRequest(
    async () => {
      const filter: Record<string, any> = { key: workflowKey };
      if (statusFilter.length) {
        filter.status = { $in: statusFilter };
      }
      const response = await resource.list({
        page,
        pageSize,
        sort: ['-id'],
        except: ['context', 'output', 'stack'],
        filter,
      });
      return normalizeListResponse(response);
    },
    { refreshDeps: [page, pageSize, statusFilter, workflowKey] },
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
      content: t('Are you sure you want to cancel the execution?'),
      async onOk() {
        await resource.cancel({ filterByTk: record.id });
        message.success(t('Operation succeeded'));
        refresh();
      },
    });
  });

  const statusOptions = useMemo(
    () => EXECUTION_STATUS_OPTIONS.map((option) => ({ value: option.value, label: compile(option.label) })),
    [compile],
  );

  const columns = useMemo<ColumnsType<ExecutionRecord>>(
    () => [
      { title: t('ID'), dataIndex: 'id' },
      {
        title: t('Triggered at'),
        dataIndex: 'createdAt',
        render: (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : null),
      },
      {
        // Linking to the workflow version opens the canvas, which is not yet
        // migrated to v2 — show the version number as plain text for now.
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
            {value === EXECUTION_STATUS.STARTED || value === EXECUTION_STATUS.QUEUEING ? (
              <Button type="link" danger size="small" onClick={() => handleCancel(record)}>
                {t('Cancel the execution')}
              </Button>
            ) : null}
          </Space>
        ),
      },
      {
        title: t('Actions'),
        width: 160,
        render: (_, record) => (
          <Space split="|">
            <Tooltip title={t('Available in the classic UI for now')}>
              <Typography.Link disabled>{t('View')}</Typography.Link>
            </Tooltip>
            {record.status !== EXECUTION_STATUS.STARTED ? (
              <a onClick={() => handleDelete(record.id)}>{t('Delete')}</a>
            ) : null}
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleCancel, handleDelete, t],
  );

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: token.margin }}>
        <Popover
          trigger="click"
          content={
            <Select
              mode="multiple"
              allowClear
              style={{ minWidth: token.sizeXXL * 4 }}
              placeholder={t('Status')}
              value={statusFilter}
              options={statusOptions}
              optionFilterProp="label"
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            />
          }
        >
          <Button icon={<FilterOutlined />}>{t('Filter')}</Button>
        </Popover>
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

export default ExecutionHistoryDrawer;
