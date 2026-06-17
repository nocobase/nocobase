/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReloadOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import type { Collection } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Space, theme } from 'antd';
import type { TablePaginationConfig } from 'antd';
import React, { useMemo, useState } from 'react';
import { CollectionFilter, DEFAULT_PAGE_SIZE, Table, type CompiledFilter, type TableProps } from '@nocobase/client-v2';

export interface ResourceTableRequestParams {
  filter?: CompiledFilter;
  page: number;
  pageSize: number;
}

export interface ResourceTableLoadResult<RecordType extends object> {
  data: RecordType[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface ResourceTablePageToolbarArgs {
  loading: boolean;
  refresh: () => void;
  refreshAsync: () => Promise<unknown>;
}

export interface ResourceTablePageProps<RecordType extends object = Record<string, unknown>> {
  collection?: Collection;
  columns: TableProps<RecordType>['columns'];
  rowKey: TableProps<RecordType>['rowKey'];
  request: (params: ResourceTableRequestParams) => Promise<ResourceTableLoadResult<RecordType>>;
  t?: (key: string, options?: Record<string, unknown>) => string;
  filterableFieldNames?: string[];
  noIgnore?: boolean;
  toolbar?: React.ReactNode | ((args: ResourceTablePageToolbarArgs) => React.ReactNode);
  toolbarLayout?: 'inline' | 'split';
  showRefresh?: boolean;
  padding?: boolean;
  defaultPageSize?: number;
  fillHeight?: boolean;
  tableProps?: Omit<
    TableProps<RecordType>,
    'columns' | 'dataSource' | 'loading' | 'onChange' | 'pagination' | 'rowKey'
  >;
}

const identity = (key: string) => key;

/**
 * Settings-page table shell for resource-backed lists. It owns the common
 * filter + pagination + refresh lifecycle while callers provide business
 * actions, columns, and request mapping.
 */
export function ResourceTablePage<RecordType extends object = Record<string, unknown>>(
  props: ResourceTablePageProps<RecordType>,
) {
  const { token } = theme.useToken();
  const t = props.t ?? identity;
  const [filter, setFilter] = useState<CompiledFilter>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(props.defaultPageSize ?? DEFAULT_PAGE_SIZE);

  const service = useMemoizedFn(async () => {
    return props.request({ filter, page, pageSize });
  });
  const { data, loading, refresh, refreshAsync } = useRequest(service, {
    refreshDeps: [filter, page, pageSize],
  });
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

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total,
      showTotal:
        typeof data?.total === 'number'
          ? (count) => {
              return t('Total {{count}} items', { count });
            }
          : false,
      onChange: (nextPage, nextPageSize) => {
        setPage(nextPage);
        setPageSize(nextPageSize);
      },
    }),
    [data?.page, data?.pageSize, data?.total, page, pageSize, t],
  );

  const handleFilterChange = useMemoizedFn((nextFilter: CompiledFilter) => {
    setPage(1);
    setFilter(nextFilter);
  });

  const toolbarArgs = useMemo<ResourceTablePageToolbarArgs>(
    () => ({ loading, refresh, refreshAsync }),
    [loading, refresh, refreshAsync],
  );

  const toolbarContent = typeof props.toolbar === 'function' ? props.toolbar(toolbarArgs) : props.toolbar;
  const { className: tablePropClassName, scroll: tablePropScroll, ...restTableProps } = props.tableProps ?? {};
  const filterButton = props.collection ? (
    <CollectionFilter
      collection={props.collection}
      t={t}
      filterableFieldNames={props.filterableFieldNames}
      noIgnore={props.noIgnore}
      onChange={handleFilterChange}
    />
  ) : null;
  const refreshButton =
    props.showRefresh === false ? null : (
      <Button icon={<ReloadOutlined />} onClick={refresh}>
        {t('Refresh')}
      </Button>
    );

  return (
    <div
      style={{
        ...(props.padding === false ? undefined : { padding: token.paddingLG }),
        ...(props.fillHeight
          ? { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
          : undefined),
      }}
    >
      {props.toolbarLayout === 'split' ? (
        <div
          style={{
            flex: props.fillHeight ? '0 0 auto' : undefined,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: token.marginSM,
            flexWrap: 'wrap',
            marginBottom: token.marginSM,
          }}
        >
          <Space wrap>{filterButton}</Space>
          <Space wrap>
            {toolbarContent}
            {refreshButton}
          </Space>
        </div>
      ) : (
        <Space style={{ flex: props.fillHeight ? '0 0 auto' : undefined, marginBottom: token.marginSM }} wrap>
          {toolbarContent}
          {refreshButton}
          {filterButton}
        </Space>
      )}
      <Table<RecordType>
        {...restTableProps}
        rowKey={props.rowKey}
        loading={loading}
        dataSource={data?.data ?? []}
        columns={props.columns}
        pagination={pagination}
        scroll={props.fillHeight ? { x: 'max-content', y: '100%', ...tablePropScroll } : tablePropScroll}
        className={cx(props.fillHeight && tableClassName, tablePropClassName)}
      />
    </div>
  );
}

export default ResourceTablePage;
