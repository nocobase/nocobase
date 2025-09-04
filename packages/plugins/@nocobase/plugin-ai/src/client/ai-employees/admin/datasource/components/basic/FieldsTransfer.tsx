/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Flex, Table, Tag, Transfer, Form } from 'antd';
import type { GetProp, TableColumnsType, TableProps, TransferProps } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from '@nocobase/client';

type TransferItem = GetProp<TransferProps, 'dataSource'>[number];
type TableRowSelection<T extends object> = TableProps<T>['rowSelection'];

interface DataType {
  key: string;
  title?: string;
}

interface TableTransferProps extends TransferProps<TransferItem> {
  dataSource: DataType[];
  leftColumns: TableColumnsType<DataType>;
  rightColumns: TableColumnsType<DataType>;
}

const TableTransfer: React.FC<TableTransferProps> = (props) => {
  const { leftColumns, rightColumns, ...restProps } = props;
  return (
    <Transfer style={{ width: '100%' }} {...restProps}>
      {({
        direction,
        filteredItems,
        onItemSelect,
        onItemSelectAll,
        selectedKeys: listSelectedKeys,
        disabled: listDisabled,
      }) => {
        const columns = direction === 'left' ? leftColumns : rightColumns;
        const rowSelection: TableRowSelection<TransferItem> = {
          getCheckboxProps: () => ({ disabled: listDisabled }),
          onChange(selectedRowKeys) {
            onItemSelectAll(selectedRowKeys, 'replace');
          },
          selectedRowKeys: listSelectedKeys,
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
        };

        return (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredItems}
            size="small"
            style={{ pointerEvents: listDisabled ? 'none' : undefined }}
            pagination={{
              defaultPageSize: 20,
            }}
            onRow={({ key, disabled: itemDisabled }) => ({
              onClick: () => {
                if (itemDisabled || listDisabled) {
                  return;
                }
                onItemSelect(key, !listSelectedKeys.includes(key));
              },
            })}
          />
        );
      }}
    </Transfer>
  );
};

const filterOption = (input: string, item: DataType) => item.title?.includes(input);

export const FieldsTransfer: React.FC<{
  value?: string[];
  onChange?: (targetKeys: string[]) => void;
}> = ({ value, onChange }) => {
  const ctx = useFlowContext();
  const ds = ctx.dataSourceManager;
  const form = Form.useFormInstance();
  const collection = Form.useWatch('collection', form);
  const [dataSourceKey, collectionName] = collection || [];

  const [dataSource, setDataSource] = useState<DataType[]>([]);

  const columns: TableColumnsType<DataType> = [
    {
      dataIndex: 'title',
      title: ctx.t('Field display name'),
    },
  ];

  useEffect(() => {
    const collection = ds.getDataSource(dataSourceKey)?.getCollection(collectionName);
    if (!collection) {
      setDataSource([]);
      return;
    }
    const dataSource = collection
      .getFields()
      .filter((field) => field.options.interface && !field.options.hidden)
      .map((field) => ({
        key: field.name,
        title: field.title,
      }));
    setDataSource(dataSource);
  }, [ds, dataSourceKey, collectionName]);

  return (
    <Flex align="start" gap="middle" vertical>
      <TableTransfer
        dataSource={dataSource}
        targetKeys={value}
        showSearch
        showSelectAll={false}
        onChange={onChange}
        filterOption={filterOption}
        leftColumns={columns}
        rightColumns={columns}
      />
    </Flex>
  );
};
