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
import { CollectionFilter, Table, type CompiledFilter, type TableProps } from '@nocobase/client-v2';
import type { RoleTabProps } from '@nocobase/plugin-acl/client-v2';
import { useFlowContext, useFlowView } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button, Empty, Popconfirm, Space, Typography, theme } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { useT } from '../locale';
import type { DepartmentPrimaryKey, DepartmentRecord } from '../shared/department';
import { buildLazyDepartmentTreeNodes, getDepartmentTitle } from '../shared/department';

const ROLE_DEPARTMENTS_PAGE_SIZE = 20;
const ROLE_DEPARTMENTS_DRAWER_WIDTH = '50%';
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

function hasCompiledFilter(filter?: CompiledFilter) {
  return Boolean(filter && typeof filter === 'object' && Object.keys(filter).length > 0);
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

function departmentPickerColumns(
  t: (key: string, options?: Record<string, unknown>) => string,
  hasFilter: boolean,
): TableProps<DepartmentRecord>['columns'] {
  return [
    {
      title: t('Department name'),
      render: (_, record) => (hasFilter ? getDepartmentTitle(record) : record.title),
    },
  ];
}

function replaceDepartmentChildren(
  records: DepartmentRecord[],
  parentId: DepartmentPrimaryKey,
  children: DepartmentRecord[],
): DepartmentRecord[] {
  return records.map((record) => {
    if (record.id === parentId) {
      const next = { ...record, isLeaf: children.length ? false : true };
      if (children.length) {
        next.children = children;
      } else {
        delete next.children;
      }
      return next;
    }

    if (record.children?.length) {
      return {
        ...record,
        children: replaceDepartmentChildren(record.children, parentId, children),
      };
    }

    return record;
  });
}

function useDrawerTableLayoutStyles() {
  const { token } = theme.useToken();
  const contentClassName = useMemo(
    () => css`
      height: 100%;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `,
    [],
  );
  const toolbarClassName = useMemo(
    () => css`
      flex: 0 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${token.marginSM}px;
      flex-wrap: wrap;
      margin-bottom: ${token.marginSM}px;
    `,
    [token.marginSM],
  );
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

      .ant-table-content,
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

  return { contentClassName, tableClassName, toolbarClassName };
}

function RoleDepartmentsPicker(props: { roleName: string; onSubmitted: () => Promise<void> | void }) {
  const ctx = useFlowContext();
  const view = useFlowView();
  const t = useT();
  const { contentClassName, tableClassName, toolbarClassName } = useDrawerTableLayoutStyles();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [filter, setFilter] = useState<CompiledFilter>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ROLE_DEPARTMENTS_PAGE_SIZE);
  const [submitting, setSubmitting] = useState(false);
  const [departmentTreeData, setDepartmentTreeData] = useState<DepartmentRecord[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const loadingDepartmentKeysRef = useRef(new Set<React.Key>());
  const collection = ctx.dataSourceManager?.getDataSource('main')?.getCollection('departments');
  const filtered = hasCompiledFilter(filter);

  const departmentsRequest = useRequest(
    async () => {
      const response = await ctx.api.resource('departments').list({
        appends: ['parent(recursively=true)', 'roles'],
        filter: filtered ? filter : { parentId: null },
        page,
        pageSize,
        sort: ['sort'],
      });
      return toTableData<DepartmentRecord>(response);
    },
    {
      refreshDeps: [filter, filtered, page, pageSize],
      onSuccess: (result) => {
        if (!filtered) {
          setDepartmentTreeData(buildLazyDepartmentTreeNodes(result.data));
          setExpandedRowKeys([]);
        }
      },
    },
  );

  const loadDepartmentChildren = useCallback(
    async (record: DepartmentRecord) => {
      if (record.isLeaf || record.children?.length || loadingDepartmentKeysRef.current.has(record.id)) {
        return;
      }

      loadingDepartmentKeysRef.current.add(record.id);
      try {
        const response = await ctx.api.resource('departments').list({
          appends: ['parent(recursively=true)', 'roles'],
          filter: { parentId: record.id },
          paginate: false,
          sort: ['sort'],
        });
        const children = buildLazyDepartmentTreeNodes(toTableData<DepartmentRecord>(response).data);
        setDepartmentTreeData((current) => replaceDepartmentChildren(current, record.id, children));
      } finally {
        loadingDepartmentKeysRef.current.delete(record.id);
      }
    },
    [ctx.api],
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
      await view.close();
    } finally {
      setSubmitting(false);
    }
  }, [ctx.api, ctx.message, props, selectedKeys, t, view]);

  const handleCancel = useCallback(async () => {
    await view.close();
  }, [view]);

  return (
    <div
      style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {view.Header ? <view.Header title={t('Add departments')} /> : null}
      <div className={contentClassName}>
        <div className={toolbarClassName}>
          <Space wrap>
            <CollectionFilter
              collection={collection}
              t={t}
              onChange={(nextFilter) => {
                setSelectedKeys([]);
                setExpandedRowKeys([]);
                setPage(1);
                setFilter(nextFilter);
              }}
            />
          </Space>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => departmentsRequest.refresh()}>
              {t('Refresh')}
            </Button>
          </Space>
        </div>
        <Table<DepartmentRecord>
          rowKey="id"
          showIndex={false}
          loading={departmentsRequest.loading}
          dataSource={filtered ? departmentsRequest.data?.data || [] : departmentTreeData}
          columns={departmentPickerColumns(t, filtered)}
          expandable={
            filtered
              ? undefined
              : {
                  defaultExpandAllRows: false,
                  expandedRowKeys,
                  rowExpandable: (record) => record.isLeaf === false || Boolean(record.children?.length),
                  onExpand: (expanded, record) => {
                    if (expanded) {
                      loadDepartmentChildren(record);
                    }
                  },
                  onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]),
                }
          }
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
          scroll={{ x: 'max-content', y: '100%' }}
          className={tableClassName}
        />
      </div>
      {view.Footer ? (
        <view.Footer>
          <Space>
            <Button onClick={handleCancel}>{t('Cancel')}</Button>
            <Button type="primary" loading={submitting} disabled={!selectedKeys.length} onClick={handleSubmit}>
              {t('Submit')}
            </Button>
          </Space>
        </view.Footer>
      ) : null}
    </div>
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
      width: ROLE_DEPARTMENTS_DRAWER_WIDTH,
      styles: {
        body: {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      },
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
