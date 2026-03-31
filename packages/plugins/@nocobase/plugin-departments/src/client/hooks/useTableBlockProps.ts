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
import { useCallback, useEffect, useRef } from 'react';
import {
  useTableBlockContext,
  findFilterTargets,
  DataBlock,
  useFilterBlock,
  mergeFilter,
  removeNullCondition,
} from '@nocobase/client';

export const useTableBlockProps = () => {
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const ctx = useTableBlockContext();
  const { getDataBlocks } = useFilterBlock();
  const isLoading = ctx?.service?.loading;

  const ctxRef = useRef(null);
  ctxRef.current = ctx;

  useEffect(() => {
    if (!isLoading) {
      const serviceResponse = ctx?.service?.data;
      const data = serviceResponse?.data || [];
      const meta = serviceResponse?.meta || {};
      const selectedRowKeys = ctx?.field?.data?.selectedRowKeys;

      if (!isEqual(field.value, data)) {
        field.value = data;
        field?.setInitialValue(data);
      }
      field.data = field.data || {};

      if (!isEqual(field.data.selectedRowKeys, selectedRowKeys)) {
        field.data.selectedRowKeys = selectedRowKeys;
      }

      field.componentProps.pagination = field.componentProps.pagination || {};
      field.componentProps.pagination.pageSize = meta?.pageSize;
      field.componentProps.pagination.total = meta?.count;
      field.componentProps.pagination.current = meta?.page;
    }
  }, [field, ctx?.service?.data, isLoading, ctx?.field?.data?.selectedRowKeys]);

  return {
    bordered: ctx.bordered,
    childrenColumnName: ctx.childrenColumnName,
    loading: ctx?.service?.loading,
    showIndex: ctx.showIndex,
    dragSort: ctx.dragSort && ctx.dragSortBy,
    rowKey: ctx.rowKey || fieldSchema?.['x-component-props']?.rowKey || 'id',
    pagination: fieldSchema?.['x-component-props']?.pagination === false ? false : field.componentProps.pagination,
    onRowSelectionChange: useCallback((selectedRowKeys, selectedRowData) => {
      ctx.field.data = ctx?.field?.data || {};
      ctx.field.data.selectedRowKeys = selectedRowKeys;
      ctx.field.data.selectedRowData = selectedRowData;
      ctx?.field?.onRowSelect?.(selectedRowKeys);
    }, []),
    onRowDragEnd: useCallback(
      async ({ from, to }) => {
        await ctx.resource.move({
          sourceId: from[ctx.rowKey || 'id'],
          targetId: to[ctx.rowKey || 'id'],
          sortField: ctx.dragSort && ctx.dragSortBy,
        });
        ctx.service.refresh();
        // ctx.resource
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      [ctx.rowKey, ctx.dragSort, ctx.dragSortBy],
    ),
    onChange: useCallback(
      ({ current, pageSize }, filters, sorter) => {
        const globalSort = fieldSchema.parent?.['x-decorator-props']?.['params']?.['sort'];
        const sort = sorter.order
          ? sorter.order === `ascend`
            ? [sorter.field]
            : [`-${sorter.field}`]
          : globalSort || ctxRef.current.dragSortBy;
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

          const isForeignKey = block.foreignKeyFields?.some((field) => field.name === target.field);
          const sourceKey = getSourceKey(currentBlock, target.field);
          const recordKey = isForeignKey ? sourceKey : ctx.rowKey;
          const value = [record[recordKey]];

          const param = block.service.params?.[0] || {};
          // 保留原有的 filter
          const storedFilter = block.service.params?.[1]?.filters || {};

          if (selectedRow.includes(record[ctx.rowKey])) {
            if (block.dataLoadingMode === 'manual') {
              return block.clearData();
            }
            delete storedFilter[uid];
          } else {
            storedFilter[uid] = {
              $and: [
                {
                  [target.field || ctx.rowKey]: {
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
        setSelectedRow((prev) => (prev?.includes(record[ctx.rowKey]) ? [] : [record[ctx.rowKey]]));
      },
      [ctx.rowKey, fieldSchema, getDataBlocks],
    ),
    onExpand: useCallback((expanded, record) => {
      ctx?.field.onExpandClick?.(expanded, record);
    }, []),
  };
};

function getSourceKey(currentBlock: DataBlock, field: string) {
  const associationField = currentBlock?.associatedFields?.find((item) => item.foreignKey === field);
  return associationField?.sourceKey || 'id';
}
