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
import { useFlowView } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Space, theme } from 'antd';
import type { TablePaginationConfig } from 'antd';
import React, { useMemo, useState } from 'react';
import { CollectionFilter, DEFAULT_PAGE_SIZE, Table, type CompiledFilter, type TableProps } from '@nocobase/client-v2';

export interface ResourcePickerRequestParams {
  filter?: CompiledFilter;
  page: number;
  pageSize: number;
}

export interface ResourcePickerLoadResult<RecordType extends object> {
  data: RecordType[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface ResourcePickerViewProps<RecordType extends object = Record<string, unknown>> {
  title: React.ReactNode;
  collection?: Collection;
  columns: TableProps<RecordType>['columns'];
  rowKey: TableProps<RecordType>['rowKey'];
  request: (params: ResourcePickerRequestParams) => Promise<ResourcePickerLoadResult<RecordType>>;
  onSubmit: (selectedRows: RecordType[], selectedRowKeys: React.Key[]) => Promise<void> | void;
  t?: (key: string, options?: Record<string, unknown>) => string;
  selectionType?: 'checkbox' | 'radio';
  submitText?: React.ReactNode;
  cancelText?: React.ReactNode;
  filterableFieldNames?: string[];
  noIgnore?: boolean;
  requireSelection?: boolean;
  defaultPageSize?: number;
  tableProps?: Omit<
    TableProps<RecordType>,
    'columns' | 'dataSource' | 'loading' | 'onChange' | 'pagination' | 'rowKey' | 'rowSelection'
  >;
}

const identity = (key: string) => key;

/**
 * Viewer-hosted record picker for settings pages and secondary selection
 * flows. Open it with `ctx.viewer.open(...)` and pass resource loading logic
 * through `request`; the component owns filter, pagination, and selection UI.
 */
export function ResourcePickerView<RecordType extends object = Record<string, unknown>>(
  props: ResourcePickerViewProps<RecordType>,
) {
  const view = useFlowView();
  const { token } = theme.useToken();
  const t = props.t ?? identity;
  const [filter, setFilter] = useState<CompiledFilter>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(props.defaultPageSize ?? DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<RecordType[]>([]);
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

  const service = useMemoizedFn(async () => {
    return props.request({ filter, page, pageSize });
  });
  const { data, loading, refresh } = useRequest(service, {
    refreshDeps: [filter, page, pageSize],
  });

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total,
      onChange: (nextPage, nextPageSize) => {
        setPage(nextPage);
        setPageSize(nextPageSize);
      },
    }),
    [data?.page, data?.pageSize, data?.total, page, pageSize],
  );

  const handleFilterChange = useMemoizedFn((nextFilter: CompiledFilter) => {
    setPage(1);
    setFilter(nextFilter);
  });

  const handleCancel = useMemoizedFn(async () => {
    await view.close();
  });

  const handleSubmit = useMemoizedFn(async () => {
    await props.onSubmit(selectedRows, selectedRowKeys);
    await view.close({ selectedRows, selectedRowKeys });
  });
  const { className: tablePropClassName, scroll: tablePropScroll, ...restTableProps } = props.tableProps ?? {};

  return (
    <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {view.Header ? <view.Header title={props.title} /> : null}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
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
            {props.collection ? (
              <CollectionFilter
                collection={props.collection}
                t={t}
                filterableFieldNames={props.filterableFieldNames}
                noIgnore={props.noIgnore}
                onChange={handleFilterChange}
              />
            ) : null}
          </Space>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              {t('Refresh')}
            </Button>
          </Space>
        </div>
        <Table<RecordType>
          {...restTableProps}
          rowKey={props.rowKey}
          loading={loading}
          dataSource={data?.data ?? []}
          columns={props.columns}
          pagination={pagination}
          scroll={{ x: 'max-content', y: '100%', ...tablePropScroll }}
          className={cx(tableClassName, tablePropClassName)}
          rowSelection={{
            type: props.selectionType ?? 'checkbox',
            selectedRowKeys,
            onChange: (keys, rows) => {
              setSelectedRowKeys([...keys]);
              setSelectedRows(rows);
            },
          }}
        />
      </div>
      {view.Footer ? (
        <view.Footer>
          <Space>
            <Button onClick={handleCancel}>{props.cancelText ?? t('Cancel')}</Button>
            <Button
              type="primary"
              disabled={props.requireSelection !== false && !selectedRowKeys.length}
              onClick={handleSubmit}
            >
              {props.submitText ?? t('Submit')}
            </Button>
          </Space>
        </view.Footer>
      ) : null}
    </div>
  );
}

export default ResourcePickerView;
