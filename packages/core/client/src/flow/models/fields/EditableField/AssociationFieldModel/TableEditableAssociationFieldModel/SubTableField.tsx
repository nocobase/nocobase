/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined } from '@ant-design/icons';
import { Table, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import React from 'react';

export function SubTableField(props) {
  const { t } = useTranslation();
  const { value = [], onChange, columns, disabled, allowAddNew, components } = props;
  // 新增一行
  const handleAdd = () => {
    const newRow = {};
    columns.forEach((col) => (newRow[col.dataIndex] = undefined));
    onChange?.([...(value || []), newRow]);
  };

  // 编辑单元格
  const handleCellChange = (rowIdx, dataIndex, cellValue) => {
    const newData = value.map((row, idx) => (idx === rowIdx ? { ...row, [dataIndex]: cellValue } : row));
    onChange?.(newData);
  };
  // 删除行
  const handleDelete = (index: number) => {
    const newValue = [...(value || [])];
    newValue.splice(index, 1);
    onChange?.(newValue);
  };
  // 渲染可编辑单元格
  const editableColumns = columns
    .map((col) => ({
      ...col,
      render: (text, record, rowIdx) => {
        if (!col.render) {
          return;
        }
        return col?.render({
          record,
          rowIdx,
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
        width: 60,
        align: 'center',
        fixed: 'right',
        render: (v, record, index) => {
          return (
            <div
              onClick={() => {
                handleDelete(index);
              }}
            >
              <CloseOutlined style={{ cursor: 'pointer', color: 'gray' }} />
            </div>
          );
        },
      },
    ]);
  return (
    <Form.Item>
      <Table
        dataSource={value}
        columns={editableColumns}
        rowKey={(row, idx) => idx}
        tableLayout="fixed"
        scroll={{ x: 'max-content' }}
        pagination={false}
        locale={{
          emptyText: <span> {!disabled ? t('Please add or select record') : t('No data')}</span>,
        }}
        components={components || {}}
      />
      {!disabled && allowAddNew !== false && (
        <a onClick={handleAdd} style={{ marginTop: 8 }}>
          <PlusOutlined /> {t('Add new')}
        </a>
      )}
    </Form.Item>
  );
}
