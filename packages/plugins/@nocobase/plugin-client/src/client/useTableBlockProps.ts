/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { useDataBlockRequest, useDataBlockResource, useTableBlockContextBasicValue } from '@nocobase/client';
import { ArrayField } from '@nocobase/database';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { getRouteNodeByRouteId } from './utils';

export const useTableBlockProps = () => {
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const resource = useDataBlockResource();
  const service = useDataBlockRequest() as any;
  const tableBlockContextBasicValue = useTableBlockContextBasicValue();

  const ctxRef = useRef(null);
  ctxRef.current = { service, resource };
  const meta = service?.data?.meta || {};
  const pagination = useMemo(
    () => ({
      pageSize: meta?.pageSize,
      total: meta?.count,
      current: meta?.page,
    }),
    [meta?.count, meta?.page, meta?.pageSize],
  );

  const data = service?.data?.data || [];

  useEffect(() => {
    if (!service?.loading) {
      const selectedRowKeys = tableBlockContextBasicValue.field?.data?.selectedRowKeys;

      field.data = field.data || {};

      if (!_.isEqual(field.data.selectedRowKeys, selectedRowKeys)) {
        field.data.selectedRowKeys = selectedRowKeys;
      }
    }
  }, [field, service?.data, service?.loading, tableBlockContextBasicValue.field?.data?.selectedRowKeys]);

  return {
    optimizeTextCellRender: false,
    value: data,
    loading: service?.loading,
    showIndex: true,
    dragSort: false,
    rowKey: 'id',
    pagination: fieldSchema?.['x-component-props']?.pagination === false ? false : pagination,
    onRowSelectionChange: useCallback(
      (selectedRowKeys, selectedRows, setSelectedRowKeys) => {
        if (tableBlockContextBasicValue) {
          tableBlockContextBasicValue.field.data = tableBlockContextBasicValue.field?.data || {};
          const selectedRecord = tableBlockContextBasicValue.field.data.selectedRecord;
          const selected = tableBlockContextBasicValue.field.data.selected;

          tableBlockContextBasicValue.field.data.selectedRowKeys = getAllSelectedRowKeys(
            selectedRowKeys,
            selectedRecord,
            selected,
            service?.data?.data || [],
          );
          setSelectedRowKeys(tableBlockContextBasicValue.field.data.selectedRowKeys);
          tableBlockContextBasicValue.field.onRowSelect?.(tableBlockContextBasicValue.field.data.selectedRowKeys);
        }
      },
      [service?.data?.data, tableBlockContextBasicValue],
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
  };
};

function getAllSelectedRowKeys(selectedRowKeys: number[], selectedRecord: any, selected: boolean, treeArray: any[]) {
  let result = [...selectedRowKeys];

  if (result.length === 0) {
    return result;
  }

  if (selected) {
    result.push(...getAllChildrenId(selectedRecord?.children));

    // // 当父节点的所有子节点都被选中时，把该父节点也选中
    // const parent = getRouteNodeByRouteId(selectedRecord?.parentId, treeArray);
    // if (parent) {
    //   const allChildrenId = getAllChildrenId(parent.children);
    //   const shouldSelectParent = allChildrenId.every((id) => result.includes(id));
    //   if (shouldSelectParent) {
    //     result.push(parent.id);
    //   }
    // }
  } else {
    // 取消选中时，把所有父节点都取消选中
    const allParentId = [];
    let selected = selectedRecord;
    while (selected?.parentId) {
      allParentId.push(selected.parentId);
      selected = getRouteNodeByRouteId(selected.parentId, treeArray);
    }
    for (const parentId of allParentId) {
      const parent = getRouteNodeByRouteId(parentId, treeArray);
      if (parent) {
        const allChildrenId = getAllChildrenId(parent.children);
        const shouldSelectParent = allChildrenId.every((id) => result.includes(id));
        if (!shouldSelectParent) {
          result = result.filter((id) => id !== parent.id);
        }
      }
    }

    // 过滤掉父节点中的所有子节点
    const allChildrenId = getAllChildrenId(selectedRecord?.children);
    result = result.filter((id) => !allChildrenId.includes(id));
  }

  return _.uniq(result);
}

function getAllChildrenId(children: any[] = []) {
  const result = [];
  for (const child of children) {
    result.push(child.id);
    result.push(...getAllChildrenId(child.children));
  }
  return result;
}

function getAllParentId(parentId: number, treeArray: any[]) {
  const result = [];
  const node = getRouteNodeByRouteId(parentId, treeArray);
  if (node) {
    result.push(node.id);
    result.push(...getAllParentId(node.parentId, treeArray));
  }
  return result;
}
