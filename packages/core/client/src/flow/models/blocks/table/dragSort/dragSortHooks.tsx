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
import React, { useCallback, useMemo } from 'react';
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

    return (props) => {
      const onDragEndCallback = (e: DragEndEvent) => {
        if (!e.active || !e.over) {
          console.warn('move cancel');
          return;
        }
        const fromIndex = e.active?.data.current?.sortable?.index;
        const toIndex = e.over?.data.current?.sortable?.index;
        const from = dataSourceRef.current?.[fromIndex];
        const to = dataSourceRef.current?.[toIndex];

        if (from && to) {
          model.resource
            .runAction('move', {
              method: 'post',
              params: {
                sourceId: getRowKey(from, model.collection.filterTargetKey),
                targetId: getRowKey(to, model.collection.filterTargetKey),
                sortField: model.props.dragSort && model.props.dragSortBy,
              },
            })
            .then(() => {
              model.resource.refresh();
            })
            .catch((error) => {
              console.error('Move failed:', error);
            });
        }
      };

      const items = dataSourceRef.current?.map?.(getRowKeyFunc) || [];

      return (
        <DndProvider onDragEnd={onDragEndCallback}>
          <SortableContext items={items}>
            <tbody {...props} />
          </SortableContext>
        </DndProvider>
      );
    };
  }, [model.props.dragSort, model.props.dragSortBy, model.resource, model.collection.filterTargetKey, getRowKeyFunc]);
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
