/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import React, { memo, useMemo, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { useInView } from 'react-intersection-observer';
import type { KanbanBlockModel } from '../../KanbanBlockModel';
import { getKanbanCardRenderKey, getRuntimeRecordKey, type KanbanRuntimeRecord } from './shared';

export const CardPlaceholder = () => {
  return (
    <div
      className={css`
        margin-bottom: 12px;
        min-height: 132px;
        border-radius: 12px;
        background: var(--ant-colorFillQuaternary);
        opacity: 0.55;
      `}
    />
  );
};

type LazyCardRendererProps = {
  model: KanbanBlockModel;
  record: any;
  index: number;
  columnKey: string;
  enableDesignSettings?: boolean;
};

export const LazyCardRenderer = memo(
  ({ model, record, index, columnKey, enableDesignSettings }: LazyCardRendererProps) => {
    const { ref, inView } = useInView({
      threshold: 0,
      triggerOnce: true,
      rootMargin: '240px 0px 240px 0px',
      fallbackInView: true,
    });
    const recordRef = useRef(record);
    const indexRef = useRef(index);
    const enableDesignSettingsRef = useRef(enableDesignSettings);
    const hasRenderedContentRef = useRef(false);
    const cardRenderKey = getKanbanCardRenderKey({ columnKey, record, index });

    recordRef.current = record;
    indexRef.current = index;
    enableDesignSettingsRef.current = enableDesignSettings;
    if (inView) {
      hasRenderedContentRef.current = true;
    }

    const shouldRenderContent = hasRenderedContentRef.current;

    const itemModel = useMemo(() => {
      if (!shouldRenderContent) {
        return null;
      }

      const nextItemModel = model.subModels.item.createFork({}, cardRenderKey);
      nextItemModel.context.defineProperty('collection', {
        get: () => model.collection,
        cache: false,
      });
      nextItemModel.context.defineProperty('record', {
        get: () => recordRef.current,
        cache: false,
      });
      nextItemModel.context.defineProperty('index', {
        get: () => indexRef.current,
        cache: false,
      });
      nextItemModel.context.defineProperty('flowSettingsEnabled', {
        get: () => !!enableDesignSettingsRef.current,
        cache: false,
      });
      nextItemModel.context.defineProperty('onCardClick', {
        get: () => () => model.openCard(recordRef.current),
        cache: false,
      });
      return nextItemModel;
    }, [cardRenderKey, model, shouldRenderContent]);

    if (!shouldRenderContent) {
      return (
        <div ref={ref}>
          <CardPlaceholder />
        </div>
      );
    }

    if (!itemModel) {
      return null;
    }

    return (
      <FlowModelRenderer
        model={itemModel}
        inputArgs={{ record, index, columnKey }}
        showFlowSettings={
          enableDesignSettings ? { showBackground: false, showBorder: false, toolbarPosition: 'inside' } : false
        }
        useCache={false}
      />
    );
  },
  areLazyCardRendererPropsEqual,
);

function areLazyCardRendererPropsEqual(prev: LazyCardRendererProps, next: LazyCardRendererProps) {
  return (
    prev.model === next.model &&
    prev.record === next.record &&
    prev.columnKey === next.columnKey &&
    prev.enableDesignSettings === next.enableDesignSettings
  );
}

type DraggableKanbanCardProps = {
  model: KanbanBlockModel;
  record: KanbanRuntimeRecord;
  index: number;
  columnKey: string;
  dragEnabled: boolean;
  dragInteractionEnabled: boolean;
  enableDesignSettings?: boolean;
};

export const DraggableKanbanCard = memo(
  ({
    model,
    record,
    index,
    columnKey,
    dragEnabled,
    dragInteractionEnabled,
    enableDesignSettings,
  }: DraggableKanbanCardProps) => {
    const recordKey = getRuntimeRecordKey(record, model.collection);
    const draggableId = String(recordKey || `${columnKey}:${index}`);

    return (
      <Draggable draggableId={draggableId} index={index} isDragDisabled={!dragInteractionEnabled || !recordKey}>
        {(provided: any, snapshot: any) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              opacity: snapshot.isDragging ? 0.4 : 1,
              cursor: dragEnabled && recordKey ? 'grab' : undefined,
              zIndex: snapshot.isDragging ? 999 : undefined,
              willChange: snapshot.isDragging ? 'transform' : undefined,
            }}
            className={css`
              margin-bottom: 12px;
              backface-visibility: hidden;
              contain: layout paint;
            `}
          >
            <LazyCardRenderer
              model={model}
              record={record}
              index={index}
              columnKey={columnKey}
              enableDesignSettings={enableDesignSettings}
            />
          </div>
        )}
      </Draggable>
    );
  },
  areDraggableKanbanCardPropsEqual,
);

function areDraggableKanbanCardPropsEqual(prev: DraggableKanbanCardProps, next: DraggableKanbanCardProps) {
  return (
    prev.model === next.model &&
    prev.record === next.record &&
    prev.index === next.index &&
    prev.columnKey === next.columnKey &&
    prev.dragEnabled === next.dragEnabled &&
    prev.dragInteractionEnabled === next.dragInteractionEnabled &&
    prev.enableDesignSettings === next.enableDesignSettings
  );
}
