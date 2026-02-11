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
import { getRowKey } from '../../../blocks/table/utils';

export function SubTableField(props) {
  const { t } = useTranslation();
  const {
    value = [],
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
  } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);
  useEffect(() => {
    resetPage && setCurrentPage(1);
  }, [resetPage]);

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
      total: value?.length,
      onChange: (page, size) => {
        setCurrentPage(page);
        setCurrentPageSize(size);
      },
      showSizeChanger: true,
      showTotal: (total) => {
        return t('Total {{count}} items', { count: total });
      },
    } as any;
  }, [currentPage, currentPageSize, value]);

  // 新增一行
  const handleAdd = () => {
    if (allowCreate === false) return;

    const newRow = {
      __is_new__: true,
    };

    columns.forEach((col) => {
      newRow[col.dataIndex] = undefined;
    });

    const newValue = [...(value || []), newRow];
    setCurrentPage(Math.ceil(newValue.length / currentPageSize));
    onChange?.(newValue);
  };

  // 删除行
  const handleDelete = (index: number) => {
    const newValue = [...(value || [])];
    newValue.splice(index, 1);
    const lastPage = Math.ceil(newValue.length / currentPageSize);
    setCurrentPage(currentPage > lastPage ? lastPage : currentPage);
    onChange?.(newValue);
  };

  // 编辑单元格
  const handleCellChange = (rowIdx, dataIndex, cellValue) => {
    const newData = value.map((row, idx) => (idx === rowIdx ? { ...row, [dataIndex]: cellValue } : row));
    onChange?.(newData);
  };

  // 渲染可编辑单元格
  const editableColumns = columns
    .map((col) => ({
      ...col,
      render: (text, record, rowIdx) => {
        const pageRowIdx = (currentPage - 1) * currentPageSize + rowIdx;
        if (!col.render) {
          return;
        }
        return col?.render({
          record,
          rowIdx: pageRowIdx,
          id: `field-${col.dataIndex}-${rowIdx}`,
          value: text,
          parentFieldIndex,
          parentItem,
          onChange: (value) => {
            handleCellChange(pageRowIdx, col.dataIndex, value?.target?.value || value);
          },
          ['aria-describedby']: `field-${col.dataIndex}-${rowIdx}`,
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
              onClick={() => {
                handleDelete(pageRowIdx);
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
    if (!value?.length) return [];

    const start = (currentPage - 1) * currentPageSize;
    return value.slice(start, start + currentPageSize);
  }, [value, currentPage, currentPageSize]);
  return (
    <Form.Item>
      <Table
        dataSource={pagedDataSource}
        columns={editableColumns}
        rowKey={(record) => getRowKey(record, filterTargetKey)}
        tableLayout="fixed"
        scroll={{ x: 'max-content' }}
        pagination={pagination}
        locale={{
          emptyText: <span> {!disabled ? t('Please add or select record') : t('No data')}</span>,
        }}
        components={components || {}}
        className={css`
          .ant-table-footer {
            background-color: transparent;
          }
          .ant-table-cell-ellipsis.ant-table-cell-fix-right-first .ant-table-cell-content {
            display: inline;
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
