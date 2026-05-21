/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, ZoomInOutlined } from '@ant-design/icons';
import { Table, Form, Space, Button } from 'antd';
import { css } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActionWithoutPermission } from '../../../base/ActionModel';
import { parsePathString } from '../../../blocks/form/value-runtime/path';
import { getSubTableRowIdentity, normalizeSubTableRows } from './rowIdentity';

type NamePath = Array<string | number>;

function isSamePathPrefix(prefix: NamePath, path: NamePath) {
  if (!prefix.length || prefix.length > path.length) return false;
  return prefix.every((seg, index) => seg === path[index]);
}

function isRelatedPath(a: NamePath, b: NamePath) {
  return isSamePathPrefix(a, b) || isSamePathPrefix(b, a);
}

function normalizeChangedPath(path: unknown): NamePath | null {
  const rawPath = Array.isArray(path) ? path : typeof path === 'string' ? [path] : null;
  if (!rawPath) return null;
  const normalized = rawPath.flatMap((seg) => {
    if (typeof seg === 'number') return [seg];
    if (typeof seg !== 'string') return [];
    return parsePathString(seg).filter((parsed): parsed is string | number => typeof parsed !== 'object');
  });
  return normalized.length ? normalized : null;
}

function shouldRefreshForChangedPaths(fieldPath: unknown, changedPaths: unknown) {
  const currentFieldPath = normalizeChangedPath(fieldPath);
  if (!currentFieldPath) return false;
  const paths = Array.isArray(changedPaths) ? changedPaths : [];
  return paths.some((path) => {
    const changedPath = normalizeChangedPath(path);
    return changedPath ? isRelatedPath(currentFieldPath, changedPath) : false;
  });
}

export function SubTableField(props) {
  const { t } = useTranslation();
  const {
    onChange,
    columns,
    disabled,
    allowAddNew,
    components,
    allowSelectExistingRecord,
    onSelectExitRecordClick,
    allowDisassociation,
    pageSize,
    allowCreate, //acl
    isConfigMode,
    parentFieldIndex,
    parentItem,
    resetPage,
    filterTargetKey = 'id',
    getCurrentValue,
    fieldPathArray,
    formValuesChangeEmitter,
  } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [, forceRefresh] = useState(0);
  const rawCurrentValue = getCurrentValue();
  const currentValue = useMemo(() => normalizeSubTableRows(rawCurrentValue), [rawCurrentValue]);
  const getRecordIdentity = React.useCallback(
    (record: any) => getSubTableRowIdentity(record, filterTargetKey),
    [filterTargetKey],
  );
  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);
  useEffect(() => {
    resetPage && setCurrentPage(1);
  }, [resetPage]);
  useEffect(() => {
    if (!formValuesChangeEmitter?.on || !formValuesChangeEmitter?.off) return;
    const listener = (payload: any) => {
      if (!shouldRefreshForChangedPaths(fieldPathArray, payload?.changedPaths)) return;
      forceRefresh((v) => v + 1);
    };
    formValuesChangeEmitter.on('formValuesChange', listener);
    return () => {
      formValuesChangeEmitter.off('formValuesChange', listener);
    };
  }, [fieldPathArray, formValuesChangeEmitter]);
  const applyValue = React.useCallback((nextValue: any) => onChange?.(normalizeSubTableRows(nextValue)), [onChange]);
  const getLatestValue = React.useCallback(() => normalizeSubTableRows(getCurrentValue()), [getCurrentValue]);
  useEffect(() => {
    if (currentValue !== rawCurrentValue) {
      applyValue(currentValue);
    }
  }, [applyValue, currentValue, rawCurrentValue]);

  // 前端分页
  const pagination = useMemo(() => {
    return {
      style: {
        position: 'absolute',
        right: '0px',
        bottom: '0px',
      },
      current: currentPage,
      pageSize: currentPageSize,
      total: currentValue.length,
      onChange: (page, size) => {
        setCurrentPage(page);
        setCurrentPageSize(size);
      },
      showSizeChanger: true,
      showTotal: (total) => {
        return t('Total {{count}} items', { count: total });
      },
    } as any;
  }, [currentPage, currentPageSize, currentValue.length]);

  // 新增一行
  const handleAdd = () => {
    if (allowCreate === false) return;

    const newRow = {
      __is_new__: true,
    };
    columns.forEach((col) => {
      newRow[col.dataIndex] = undefined;
    });
    const newValue = [...getLatestValue(), newRow];
    setCurrentPage(Math.ceil(newValue.length / currentPageSize));
    applyValue(newValue);
  };

  // 删除行
  const handleDelete = (index: number) => {
    const newValue = [...getLatestValue()];
    newValue.splice(index, 1);
    const lastPage = Math.ceil(newValue.length / currentPageSize);
    setCurrentPage(currentPage > lastPage ? lastPage : currentPage);
    applyValue(newValue);
  };

  // 编辑单元格
  const handleCellChange = (rowIdx, dataIndex, cellValue) => {
    const newData = getLatestValue().map((row, idx) => (idx === rowIdx ? { ...row, [dataIndex]: cellValue } : row));
    applyValue(newData);
  };

  // 渲染可编辑单元格
  const editableColumns = columns
    .map((col) => ({
      ...col,
      render: (text, record, rowIdx) => {
        const pageRowIdx = (currentPage - 1) * currentPageSize + rowIdx;
        const rowIdentity = getRecordIdentity(record) ?? `row:${pageRowIdx}`;
        // row identity keeps logical rows stable, while binding key still follows
        // the current array index so Form.Item can rebind after reordering/removal.
        const rowBindingKey = `${rowIdentity}:${pageRowIdx}`;
        const columnKey = col.dataIndex ?? col.key ?? 'cell';
        if (!col.render) {
          return;
        }
        return col.render({
          record,
          rowIdx: pageRowIdx,
          id: `field-${String(columnKey)}-${rowBindingKey}`,
          value: text,
          parentFieldIndex,
          parentItem,
          onChange: (value) => {
            handleCellChange(pageRowIdx, col.dataIndex, value?.target?.value ?? value);
          },
          ['aria-describedby']: `field-${String(columnKey)}-${rowBindingKey}`,
        });
      },
    }))
    .concat([
      !disabled && {
        title: '',
        key: 'delete',
        width: 50,
        align: 'center',
        fixed: 'right',
        render: (v, record, index) => {
          const pageRowIdx = (currentPage - 1) * currentPageSize + index;
          if (!allowDisassociation && !(record.__is_new__ || record.__is_stored__)) {
            return;
          }
          return (
            <div
              onMouseDown={(event) => {
                const activeElement = document.activeElement as HTMLElement | null;
                if (!activeElement || event.currentTarget.contains(activeElement)) {
                  return;
                }
                activeElement.blur?.();
              }}
              onClick={() => {
                setTimeout(() => {
                  handleDelete(pageRowIdx);
                });
              }}
            >
              <CloseOutlined style={{ cursor: 'pointer', color: 'gray' }} />
            </div>
          );
        },
      },
    ])
    .filter(Boolean);

  const pagedDataSource = useMemo(() => {
    if (!currentValue.length) return [];

    const start = (currentPage - 1) * currentPageSize;
    return currentValue.slice(start, start + currentPageSize);
  }, [currentValue, currentPage, currentPageSize]);
  return (
    <Form.Item>
      <Table
        dataSource={pagedDataSource}
        columns={editableColumns}
        rowKey={(record) => getRecordIdentity(record) ?? ''}
        tableLayout="fixed"
        scroll={{ x: 'max-content' }}
        pagination={pagination}
        locale={{
          emptyText: (
            <span>
              {disabled
                ? t('No data')
                : allowAddNew && allowSelectExistingRecord
                  ? t('Please add or select record')
                  : allowAddNew
                    ? t('Please add record')
                    : allowSelectExistingRecord
                      ? t('Please select record')
                      : t('No data')}
            </span>
          ),
        }}
        components={components ?? {}}
        className={css`
          .ant-table-cell-ellipsis.ant-table-cell-fix-right-first .ant-table-cell-content {
            display: inline;
          }
          .ant-table-footer {
            padding: 0;
            button {
              margin-top: 4px !important;
              margin-bottom: 4px;
            }
          }
        `}
        footer={() => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: '20px',
            }}
          >
            <Space>
              {allowAddNew &&
                (allowCreate || isConfigMode) &&
                (allowCreate ? (
                  <Button type="link" onClick={handleAdd} disabled={disabled}>
                    <PlusOutlined />
                    {t('Add new')}
                  </Button>
                ) : (
                  <ActionWithoutPermission message={t('No permission to add new')} forbidden={{ actionName: 'create' }}>
                    <Button type="link" disabled>
                      <PlusOutlined />
                      {t('Add new')}
                    </Button>
                  </ActionWithoutPermission>
                ))}
              {allowSelectExistingRecord && (
                <Button
                  type="link"
                  onClick={() => onSelectExitRecordClick(setCurrentPage, currentPageSize)}
                  disabled={disabled}
                >
                  <ZoomInOutlined /> {t('Select record')}
                </Button>
              )}
            </Space>
          </div>
        )}
      />
    </Form.Item>
  );
}
