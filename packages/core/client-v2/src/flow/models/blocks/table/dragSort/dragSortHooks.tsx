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
) {
  return useMemo(() => {
    if (!model.props.dragSort) {
      return (props) => <tbody {...props} />;
    }

    const flattenTreeData = (data: any[]) => {
      const result: any[] = [];
      const expandedKeys = new Set((model.props.expandedRowKeys || []).map((key) => (key == null ? key : String(key))));
      const includeAll = !!model.props.defaultExpandAllRows;

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
          model.resource
            .runAction('move', {
              method: 'post',
              params: {
                sourceId: getRowKey(from, model.collection.filterTargetKey),
                targetId: getRowKey(to, model.collection.filterTargetKey),
                sortField: model.props.dragSort ? model.props.dragSortBy : undefined,
              },
            })
            .then(() => {
              model.resource.refresh();
            })
            .catch((error) => {
              console.error('Move failed:', error);
              // Show a user-facing error message if the message system is available
              (model as any)?.ctx?.message?.error?.(error?.message || 'Move failed');
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
    model.props.dragSort,
    model.props.dragSortBy,
    model.props.expandedRowKeys,
    model.props.defaultExpandAllRows,
    model.resource,
    model.collection.filterTargetKey,
    getRowKeyFunc,
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
  if (model.props.dragSort && model.props.dragSortBy) {
    model.resource.setSort([model.props.dragSortBy]);
  }
}
