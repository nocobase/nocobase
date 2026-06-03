/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { CollectionFilter, DrawerFormLayout, Table, type CompiledFilter, type TableProps } from '@nocobase/client-v2';
import type { RoleTabProps } from '@nocobase/plugin-acl/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button, Empty, Popconfirm, Space, Typography, theme } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

import { useT } from '../locale';
import type { DepartmentPrimaryKey, DepartmentRecord } from '../shared/department';
import { getDepartmentTitle } from '../shared/department';

const ROLE_DEPARTMENTS_PAGE_SIZE = 20;
const TABLE_ACTION_BUTTON_STYLE: React.CSSProperties = { paddingInline: 0, height: 'auto' };

interface ListPayload<RecordType extends object> {
  data?: RecordType[];
  rows?: RecordType[];
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    count?: number;
  };
  page?: number;
  pageSize?: number;
  total?: number;
  count?: number;
}

function toListPayload<RecordType extends object>(response: unknown): ListPayload<RecordType> {
  const data = (response as { data?: unknown })?.data;
  if (!data || typeof data !== 'object') {
    return {};
  }

  return data as ListPayload<RecordType>;
}

function toTableData<RecordType extends object>(response: unknown) {
  const payload = toListPayload<RecordType>(response);
  return {
    data: payload.data ?? payload.rows ?? [],
    page: payload.meta?.page ?? payload.page,
    pageSize: payload.meta?.pageSize ?? payload.pageSize,
    total: payload.meta?.total ?? payload.meta?.count ?? payload.total ?? payload.count,
  };
}

function departmentColumns(
  t: (key: string, options?: Record<string, unknown>) => string,
): TableProps<DepartmentRecord>['columns'] {
  return [
    {
      title: t('Department name'),
      render: (_, record) => getDepartmentTitle(record) || record.title,
    },
  ];
}

function RoleDepartmentsPicker(props: { roleName: string; onSubmitted: () => Promise<void> | void }) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [filter, setFilter] = useState<CompiledFilter>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ROLE_DEPARTMENTS_PAGE_SIZE);
  const [submitting, setSubmitting] = useState(false);
  const collection = ctx.dataSourceManager?.getDataSource('main')?.getCollection('departments');

  const departmentsRequest = useRequest(
    async () => {
      const response = await ctx.api.resource('departments').list({
        appends: ['parent(recursively=true)', 'roles'],
        filter,
        page,
        pageSize,
        sort: ['sort'],
      });
      return toTableData<DepartmentRecord>(response);
    },
    {
      refreshDeps: [filter, page, pageSize],
    },
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedKeys.length) {
      return;
    }

    setSubmitting(true);
    try {
      await ctx.api.resource('roles.departments', props.roleName).add({
        values: selectedKeys,
      });
      ctx.message.success(t('Saved successfully'));
      await props.onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }, [ctx.api, ctx.message, props, selectedKeys, t]);

  return (
    <DrawerFormLayout
      title={t('Add departments')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <CollectionFilter
          collection={collection}
          t={t}
          filterableFieldNames={['title']}
          onChange={(nextFilter) => {
            setSelectedKeys([]);
            setPage(1);
            setFilter(nextFilter);
          }}
        />
        <Table<DepartmentRecord>
          rowKey="id"
          showIndex={false}
          loading={departmentsRequest.loading}
          dataSource={departmentsRequest.data?.data || []}
          columns={departmentColumns(t)}
          pagination={{
            current: departmentsRequest.data?.page ?? page,
            pageSize: departmentsRequest.data?.pageSize ?? pageSize,
            total: departmentsRequest.data?.total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          rowSelection={{
            preserveSelectedRowKeys: true,
            selectedRowKeys: selectedKeys,
            onChange: setSelectedKeys,
            getCheckboxProps: (record) => ({
              disabled: record.roles?.some((role) => role.name === props.roleName),
            }),
          }}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
          style={{ marginTop: token.marginSM }}
        />
      </Space>
    </DrawerFormLayout>
  );
}

export default function RoleDepartmentsManager(props: RoleTabProps) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const role = props.role;
  const collection = ctx.dataSourceManager?.getDataSource('main')?.getCollection('departments');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [filter, setFilter] = useState<CompiledFilter>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ROLE_DEPARTMENTS_PAGE_SIZE);
  const tableClassName = useMemo(
    () => css`
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;

      .ant-spin-nested-loading,
      .ant-spin-container,
      .ant-table,
      .ant-table-container {
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .ant-table-content {
        flex: 1;
        min-height: 0;
      }

      .ant-table-body {
        flex: 1;
        min-height: 0;
      }

      .ant-table-thead > tr > th {
        white-space: nowrap;
      }

      .ant-pagination {
        flex: 0 0 auto;
      }
    `,
    [],
  );

  const departmentsRequest = useRequest(
    async () => {
      if (!role) {
        return { data: [], page, pageSize, total: 0 };
      }

      const response = await ctx.api.resource(`roles/${role.name}/departments`).list({
        appends: ['parent(recursively=true)'],
        filter,
        page,
        pageSize,
      });
      return toTableData<DepartmentRecord>(response);
    },
    {
      ready: !!role,
      refreshDeps: [filter, page, pageSize, role?.name],
      onSuccess: () => setSelectedKeys([]),
    },
  );

  const refresh = useCallback(async () => {
    await departmentsRequest.refreshAsync();
  }, [departmentsRequest]);

  const removeDepartments = useCallback(
    async (departmentIds: DepartmentPrimaryKey[]) => {
      if (!role || !departmentIds.length) {
        return;
      }

      await ctx.api.resource(`roles/${role.name}/departments`).remove({
        values: departmentIds,
      });
      ctx.message.success(t('Removed successfully'));
      setSelectedKeys([]);
      await refresh();
    },
    [ctx.api, ctx.message, refresh, role, t],
  );

  const openAddDepartments = useCallback(() => {
    if (!role) {
      return;
    }

    ctx.viewer.drawer({
      closable: true,
      width: '70%',
      content: () => <RoleDepartmentsPicker roleName={role.name} onSubmitted={refresh} />,
    });
  }, [ctx.viewer, refresh, role]);

  const columns = useMemo<TableProps<DepartmentRecord>['columns']>(
    () => [
      ...departmentColumns(t),
      {
        title: t('Actions'),
        width: 120,
        render: (_, record) => (
          <Popconfirm
            title={t('Remove department')}
            description={t('Are you sure you want to remove it?')}
            onConfirm={() => removeDepartments([record.id])}
          >
            <Button type="link" size="small" style={TABLE_ACTION_BUTTON_STYLE}>
              {t('Remove')}
            </Button>
          </Popconfirm>
        ),
      },
    ],
    [removeDepartments, t],
  );

  if (!role) {
    return <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>;
  }

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: token.marginSM,
          flexWrap: 'wrap',
          marginBottom: token.marginSM,
        }}
      >
        <Space wrap>
          <CollectionFilter
            collection={collection}
            t={t}
            filterableFieldNames={['title']}
            onChange={(nextFilter) => {
              setPage(1);
              setFilter(nextFilter);
            }}
          />
        </Space>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => departmentsRequest.refresh()}>
            {t('Refresh')}
          </Button>
          <Popconfirm
            title={t('Remove')}
            description={t('Are you sure you want to remove these departments?')}
            onConfirm={() => removeDepartments(selectedKeys as DepartmentPrimaryKey[])}
          >
            <Button icon={<DeleteOutlined />} disabled={!selectedKeys.length}>
              {t('Remove')}
            </Button>
          </Popconfirm>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddDepartments}>
            {t('Add departments')}
          </Button>
        </Space>
      </div>
      <Table<DepartmentRecord>
        rowKey="id"
        showIndex={false}
        loading={departmentsRequest.loading}
        dataSource={departmentsRequest.data?.data || []}
        columns={columns}
        scroll={{ x: 'max-content', y: '100%' }}
        className={tableClassName}
        pagination={{
          current: departmentsRequest.data?.page ?? page,
          pageSize: departmentsRequest.data?.pageSize ?? pageSize,
          total: departmentsRequest.data?.total,
          showSizeChanger: true,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys([...keys]),
        }}
      />
    </div>
  );
}
