/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, ZoomInOutlined } from '@ant-design/icons';
import { Table, Form, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';

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
  } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);

  // 前端分页
  const pagination = useMemo(() => {
    return {
      current: currentPage, // 当前页码
      pageSize: currentPageSize, // 每页条目数
      total: value.length, // 数据总条数
      onChange: (page, size) => {
        setCurrentPage(page); // 更新当前页码
        setCurrentPageSize(size); // 更新每页显示条目数
      },
      showSizeChanger: true, // 显示每页条数切换
      showTotal: (total) => `Total ${total} items`, // 显示总条数
    };
  }, [currentPage, currentPageSize, value]);

  // 新增一行
  const handleAdd = () => {
    const newRow = { isNew: true };
    columns.forEach((col) => (newRow[col.dataIndex] = undefined));
    const newValue = [...(value || []), newRow];
    const lastPage = Math.ceil(newValue.length / currentPageSize);
    setCurrentPage(lastPage);
    onChange?.([...(value || []), newRow]);
  };

  // 删除行
  const handleDelete = (index: number) => {
    console.log(index);
    const newValue = [...(value || [])];
    newValue.splice(index, 1);
    console.log(newValue);
    const lastPage = Math.ceil(newValue.length / currentPageSize);
    console.log(lastPage);
    setCurrentPage(lastPage);
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
          onChange: (value) => {
            handleCellChange(rowIdx, col.dataIndex, value?.target?.value || value);
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
          if (!allowDisassociation && !record.isNew) {
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
  return (
    <Form.Item>
      <Table
        dataSource={value}
        columns={editableColumns}
        rowKey={(row, idx) => idx}
        tableLayout="fixed"
        scroll={{ x: 'max-content' }}
        pagination={pagination}
        locale={{
          emptyText: <span> {!disabled ? t('Please add or select record') : t('No data')}</span>,
        }}
        components={components || {}}
      />
      <Space size={'middle'}>
        {!disabled && allowAddNew !== false && (
          <a onClick={handleAdd} style={{ marginTop: 8 }}>
            <PlusOutlined /> {t('Add new')}
          </a>
        )}
        {!disabled && allowSelectExistingRecord && (
          <a onClick={onSelectExitRecordClick} style={{ marginTop: 8 }}>
            <ZoomInOutlined /> {t('Select record')}
          </a>
        )}
      </Space>
    </Form.Item>
  );
}
