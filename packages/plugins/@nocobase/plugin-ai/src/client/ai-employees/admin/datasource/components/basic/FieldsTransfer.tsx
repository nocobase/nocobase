/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Flex, Radio, Space, Table, Transfer } from 'antd';
import type { GetProp, TableColumnsType, TableProps, TransferProps } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import { useCollectionContext } from '../../context';

type TransferItem = GetProp<TransferProps, 'dataSource'>[number];
type TableRowSelection<T extends object> = TableProps<T>['rowSelection'];

interface DataType {
  key: string;
  title?: string;
  [key: string]: any;
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
  const currentCollection = useCollectionContext();
  const [dataSource, setDataSource] = useState<DataType[]>([]);

  const columns: TableColumnsType<DataType> = [
    {
      dataIndex: 'title',
      title: ctx.t('Field display name'),
    },
  ];

  useEffect(() => {
    const collection = currentCollection.collection;
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
  }, [ds, currentCollection]);

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

export const SortFieldsTransfer: React.FC<{
  value?: string[];
  onChange?: (targetKeys: string[]) => void;
}> = ({ value, onChange }) => {
  const ctx = useFlowContext();
  const ds = ctx.dataSourceManager;
  const currentCollection = useCollectionContext();
  const [dataSource, setDataSource] = useState<DataType[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>(value?.map((v) => (v.startsWith('-') ? v.slice(1) : v)) ?? []);

  const handleTransferTargetChange = useCallback(
    (targetKeys: string[]) => {
      setTargetKeys(targetKeys);
      onChange?.(
        targetKeys.map((key) => {
          const record = dataSource.find((item) => item.key === key);
          console.log(key, record);
          if (record?.direction === 'desc') {
            return `-${key}`;
          } else {
            return key;
          }
        }),
      );
    },
    [onChange, setTargetKeys, dataSource],
  );

  const leftColumns: TableColumnsType<DataType> = [
    {
      dataIndex: 'title',
      title: ctx.t('Field display name'),
    },
  ];

  const rightColumns: TableColumnsType<DataType> = [
    {
      dataIndex: 'title',
      title: ctx.t('Field display name'),
    },
    {
      title: ctx.t('Direction'),
      render: (_value, record) => {
        return (
          <>
            <div onClick={(e) => e.stopPropagation()}>
              <Radio.Group
                defaultValue="asc"
                value={record.direction}
                options={[
                  { value: 'asc', label: ctx.t('Asc') },
                  { value: 'desc', label: ctx.t('Desc') },
                ]}
                onChange={(e) => {
                  e.stopPropagation();
                  record.direction = e.target.value;
                  handleTransferTargetChange(targetKeys);
                }}
              />
            </div>
          </>
        );
      },
    },
    {
      title: ctx.t('Actions'),
      render: (_value, record) => {
        return (
          <>
            <Space direction="horizontal">
              <Button
                type="link"
                onClick={(e) => {
                  e.stopPropagation();
                  const sortingIndex = targetKeys.indexOf(record.key);
                  if (sortingIndex > 0) {
                    const newSortingKeys = [...targetKeys];
                    newSortingKeys[sortingIndex] = newSortingKeys[sortingIndex - 1];
                    newSortingKeys[sortingIndex - 1] = record.key;
                    handleTransferTargetChange(newSortingKeys);
                  }
                }}
              >
                {ctx.t('Up')}
              </Button>
              <Button
                type="link"
                onClick={(e) => {
                  e.stopPropagation();
                  const sortingIndex = targetKeys.indexOf(record.key);
                  if (sortingIndex !== -1 && sortingIndex < targetKeys.length - 1) {
                    const newSortingKeys = [...targetKeys];
                    newSortingKeys[sortingIndex] = newSortingKeys[sortingIndex + 1];
                    newSortingKeys[sortingIndex + 1] = record.key;
                    handleTransferTargetChange(newSortingKeys);
                  }
                }}
              >
                {ctx.t('Down')}
              </Button>
            </Space>
          </>
        );
      },
    },
  ];

  useEffect(() => {
    const collection = currentCollection.collection;
    if (!collection) {
      setDataSource([]);
      return;
    }
    const dataSource: DataType[] = collection
      .getFields()
      .filter((field) => field.options.interface && !field.options.hidden)
      .map((field) => ({
        key: field.name,
        title: field.title,
      }));

    const directions =
      value?.reduce((acc, cur) => {
        if (cur.startsWith('-')) {
          acc[cur.slice(1)] = 'desc';
        } else {
          acc[cur] = 'asc';
        }
        return acc;
      }, {}) ?? {};

    for (const ds of dataSource) {
      ds.direction = directions[ds.key];
    }

    setDataSource(dataSource);
  }, [ds, currentCollection]);

  return (
    <Flex align="start" gap="middle" vertical>
      <TableTransfer
        dataSource={dataSource}
        targetKeys={targetKeys}
        showSearch
        showSelectAll={false}
        onChange={handleTransferTargetChange}
        filterOption={filterOption}
        leftColumns={leftColumns}
        rightColumns={rightColumns}
      />
    </Flex>
  );
};
