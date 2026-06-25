/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DragEndEvent } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { DndProvider } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';
import type { TableBlockModel } from '../TableBlockModel';
import { getRowKey } from '../utils';
import { SortableRow } from './dragSortComponents';

export function useDragSortBodyWrapper(
  model: TableBlockModel,
  dataSourceRef: React.MutableRefObject<any>,
  getRowKeyFunc: (record: any) => string | number,
  dragSortFieldName?: string,
) {
  const expandedRowKeys = model.props.expandedRowKeys;
  const defaultExpandAllRows = model.props.defaultExpandAllRows;
  const resource = model.resource;
  const filterTargetKey = model.collection.filterTargetKey;
  const message = (model as { ctx?: { message?: { error?: (content: string) => void } } }).ctx?.message;

  return useMemo(() => {
    if (!dragSortFieldName) {
      return (props) => <tbody {...props} />;
    }

    const flattenTreeData = (data: any[]) => {
      const result: any[] = [];
      const expandedKeys = new Set((expandedRowKeys || []).map((key) => (key == null ? key : String(key))));
      const includeAll = !!defaultExpandAllRows;

      const walk = (nodes: any[]) => {
        if (!nodes?.length) return;
        nodes.forEach((node) => {
          result.push(node);
          const children = node?.children;
          const nodeKey = getRowKeyFunc(node);
          const isExpanded = includeAll || expandedKeys.has(String(nodeKey));
          if (children?.length && isExpanded) {
            walk(children);
          }
        });
      };

      walk(data || []);
      return result;
    };

    return (props) => {
      const rawData = dataSourceRef.current || [];
      const isTreeData = rawData?.some?.((record) => Array.isArray(record?.children) && record.children.length > 0);
      const flatDataSource = isTreeData ? flattenTreeData(rawData) : rawData;

      const onDragEndCallback = (e: DragEndEvent) => {
        if (!e.active || !e.over) {
          console.warn('move cancel');
          return;
        }
        const fromIndex = e.active?.data.current?.sortable?.index;
        const toIndex = e.over?.data.current?.sortable?.index;

        let from = flatDataSource?.[fromIndex];
        let to = flatDataSource?.[toIndex];

        if (!from || !to) {
          const activeId = e.active?.id != null ? String(e.active.id) : undefined;
          const overId = e.over?.id != null ? String(e.over.id) : undefined;
          if (activeId && overId) {
            from = flatDataSource?.find?.((record) => String(getRowKeyFunc(record)) === activeId);
            to = flatDataSource?.find?.((record) => String(getRowKeyFunc(record)) === overId);
          }
        }

        if (from && to) {
          resource
            .runAction('move', {
              method: 'post',
              params: {
                sourceId: getRowKey(from, filterTargetKey),
                targetId: getRowKey(to, filterTargetKey),
                sortField: dragSortFieldName,
              },
            })
            .then(() => {
              resource.refresh();
            })
            .catch((error) => {
              console.error('Move failed:', error);
              // Show a user-facing error message if the message system is available
              message?.error?.(error?.message || 'Move failed');
            });
        }
      };

      const items = flatDataSource?.map?.((record) => String(getRowKeyFunc(record))) || [];

      return (
        <DndProvider onDragEnd={onDragEndCallback}>
          <SortableContext items={items}>
            <tbody {...props} />
          </SortableContext>
        </DndProvider>
      );
    };
  }, [
    dataSourceRef,
    defaultExpandAllRows,
    dragSortFieldName,
    expandedRowKeys,
    filterTargetKey,
    getRowKeyFunc,
    message,
    resource,
  ]);
}

export function useDragSortRowComponent(dragSort: boolean) {
  return useMemo(() => {
    if (!dragSort) {
      return (props) => <tr {...props} />;
    }
    return SortableRow;
  }, [dragSort]);
}

export function initDragSortParams(model: TableBlockModel) {
  const dragSortFieldName = model.getDragSortFieldName();
  if (dragSortFieldName) {
    model.resource.setSort([dragSortFieldName]);
  } else if (model.props.dragSort && model.props.dragSortBy) {
    model.resource.setSort(Array.isArray(model.props.globalSort) ? model.props.globalSort : []);
  }
}
