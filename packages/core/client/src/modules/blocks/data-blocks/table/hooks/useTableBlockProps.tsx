/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { isEqual } from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTableBlockContextBasicValue } from '../../../../../block-provider/TableBlockProvider';
import { findFilterTargets } from '../../../../../block-provider/hooks';
import { useDataBlockRequest } from '../../../../../data-source/data-block/DataBlockRequestProvider';
import { useDataBlockResource } from '../../../../../data-source/data-block/DataBlockResourceProvider';
import { DataBlock, useFilterBlock } from '../../../../../filter-provider/FilterProvider';
import { mergeFilter } from '../../../../../filter-provider/utils';
import { removeNullCondition } from '../../../../../schema-component';
import { useTableElementRef } from '../../../../../schema-component/antd/table-v2/Table';

export const useTableBlockProps = () => {
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const resource = useDataBlockResource();
  const service = useDataBlockRequest() as any;
  const { getDataBlocks } = useFilterBlock();
  const tableBlockContextBasicValue = useTableBlockContextBasicValue();

  const ctxRef = useRef(null);
  ctxRef.current = { service, resource };
  const meta = service?.data?.meta || {};
  const tableElementRef = useTableElementRef();
  const onPaginationChange = useCallback(() => {
    if (tableElementRef?.current) {
      tableElementRef.current.parentElement?.scrollIntoView({ block: 'start' });
    }
  }, [tableElementRef]);
  const pagination = useMemo(
    () => ({
      pageSize: meta?.pageSize,
      total: meta?.count,
      current: meta?.page,
      onChange: onPaginationChange,
    }),
    [meta?.count, meta?.page, meta?.pageSize, onPaginationChange],
  );

  const data = service?.data?.data || [];

  useEffect(() => {
    if (!service?.loading) {
      const selectedRowKeys = tableBlockContextBasicValue.field?.data?.selectedRowKeys;

      // if (!isEqual(field.value, data)) {
      //   field.value = data;
      //   field?.setInitialValue(data);
      // }
      field.data = field.data || {};

      if (!isEqual(field.data.selectedRowKeys, selectedRowKeys)) {
        field.data.selectedRowKeys = selectedRowKeys;
      }
    }
  }, [field, service?.data, service?.loading, tableBlockContextBasicValue.field?.data?.selectedRowKeys]);

  return {
    optimizeTextCellRender: true,
    value: data,
    childrenColumnName: tableBlockContextBasicValue.childrenColumnName,
    loading: service?.loading,
    showIndex: tableBlockContextBasicValue.showIndex,
    dragSort: tableBlockContextBasicValue.dragSort && tableBlockContextBasicValue.dragSortBy,
    rowKey: tableBlockContextBasicValue.rowKey || fieldSchema?.['x-component-props']?.rowKey || 'id',
    pagination: fieldSchema?.['x-component-props']?.pagination === false ? false : pagination,
    onRowSelectionChange: useCallback((selectedRowKeys, selectedRowData) => {
      if (tableBlockContextBasicValue) {
        tableBlockContextBasicValue.field.data = tableBlockContextBasicValue.field?.data || {};
        tableBlockContextBasicValue.field.data.selectedRowKeys = selectedRowKeys;
        tableBlockContextBasicValue.field.data.selectedRowData = selectedRowData;
        tableBlockContextBasicValue.field?.onRowSelect?.(selectedRowKeys);
      }
    }, []),
    onRowDragEnd: useCallback(
      async ({ from, to }) => {
        await ctxRef.current.resource.move({
          sourceId: from[tableBlockContextBasicValue.rowKey || 'id'],
          targetId: to[tableBlockContextBasicValue.rowKey || 'id'],
          sortField: tableBlockContextBasicValue.dragSort && tableBlockContextBasicValue.dragSortBy,
        });
        ctxRef.current.service.refresh();
        // ctx.resource
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      [
        tableBlockContextBasicValue.rowKey,
        tableBlockContextBasicValue.dragSort,
        tableBlockContextBasicValue.dragSortBy,
      ],
    ),
    onChange: useCallback(
      ({ current, pageSize }, filters, sorter) => {
        const globalSort = fieldSchema.parent?.['x-decorator-props']?.['params']?.['sort'];
        const sort = sorter.order
          ? sorter.order === `ascend`
            ? [sorter.field]
            : [`-${sorter.field}`]
          : globalSort || tableBlockContextBasicValue.dragSortBy;
        const currentPageSize = pageSize || fieldSchema.parent?.['x-decorator-props']?.['params']?.pageSize;
        const args = { ...ctxRef.current?.service?.params?.[0], page: current || 1, pageSize: currentPageSize };
        if (sort) {
          args['sort'] = sort;
        }
        ctxRef.current?.service.run(args);
      },
      [fieldSchema.parent],
    ),
    onClickRow: useCallback(
      (record, setSelectedRow, selectedRow) => {
        const { targets, uid } = findFilterTargets(fieldSchema);
        const dataBlocks = getDataBlocks();

        // 如果是之前创建的区块是没有 x-filter-targets 属性的，所以这里需要判断一下避免报错
        if (!targets || !targets.some((target) => dataBlocks.some((dataBlock) => dataBlock.uid === target.uid))) {
          // 当用户已经点击过某一行，如果此时再把相连接的区块给删除的话，行的高亮状态就会一直保留。
          // 这里暂时没有什么比较好的方法，只是在用户再次点击的时候，把高亮状态给清除掉。
          setSelectedRow((prev) => (prev.length ? [] : prev));
          return;
        }

        const currentBlock = dataBlocks.find((block) => block.uid === fieldSchema.parent['x-uid']);

        dataBlocks.forEach((block) => {
          const target = targets.find((target) => target.uid === block.uid);
          if (!target) return;
          const sourceKey = getSourceKey(currentBlock, target.field) || tableBlockContextBasicValue.rowKey || 'id';
          const value = [record[sourceKey]];
          const param = block.service.params?.[0] || {};
          // 保留原有的 filter
          const storedFilter = block.service.params?.[1]?.filters || {};

          if (selectedRow.includes(record[tableBlockContextBasicValue.rowKey])) {
            block.clearSelection?.();
            if (block.dataLoadingMode === 'manual') {
              return block.clearData();
            }
            delete storedFilter[uid];
          } else {
            storedFilter[uid] = {
              $and: [
                {
                  [target.field || tableBlockContextBasicValue.rowKey]: {
                    [target.field ? '$in' : '$eq']: value,
                  },
                },
              ],
            };
          }

          const mergedFilter = mergeFilter([
            ...Object.values(storedFilter).map((filter) => removeNullCondition(filter)),
            block.defaultFilter,
          ]);

          return block.doFilter(
            {
              ...param,
              page: 1,
              filter: mergedFilter,
            },
            { filters: storedFilter },
          );
        });

        // 更新表格的选中状态
        setSelectedRow((prev) =>
          prev?.includes(record[tableBlockContextBasicValue.rowKey])
            ? []
            : [record[tableBlockContextBasicValue.rowKey]],
        );
      },
      [tableBlockContextBasicValue.rowKey, fieldSchema, getDataBlocks],
    ),
    onExpand: useCallback((expanded, record) => {
      tableBlockContextBasicValue.field.onExpandClick?.(expanded, record);
    }, []),
  };
};

function getSourceKey(currentBlock: DataBlock, field: string) {
  const associationField = currentBlock?.associatedFields?.find((item) => item.foreignKey === field);
  return associationField?.sourceKey || field?.split?.('.')?.[1];
}
