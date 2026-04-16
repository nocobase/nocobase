/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Alert, Button, Empty, Tag } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import type { KanbanBlockModel } from '../../KanbanBlockModel';
import { toKanbanAlphaColor } from '../../utils';
import { CardPlaceholder, DraggableKanbanCard, LazyCardRenderer } from './CardRenderer';
import {
  createColumnResource,
  createInitialColumnState,
  dedupeColumnItemsByRecordKey,
  getRuntimeRecordKey,
  normalizeKanbanRuntimeRecord,
  type ColumnState,
  type KanbanRuntimeRecord,
  type RuntimeColumn,
} from './shared';

const DEFAULT_KANBAN_BLOCK_MIN_HEIGHT = '60vh';

export const ColumnPanel = ({
  model,
  column,
  state,
  displayItems,
  setState,
  refreshToken,
  fixedHeight,
  dragEnabled,
  dragInteractionEnabled,
}: {
  model: KanbanBlockModel;
  column: RuntimeColumn;
  state: ColumnState | undefined;
  displayItems: KanbanRuntimeRecord[];
  setState: React.Dispatch<React.SetStateAction<Record<string, ColumnState>>>;
  refreshToken: number;
  fixedHeight: boolean;
  dragEnabled: boolean;
  dragInteractionEnabled: boolean;
}) => {
  const loadingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadedPageCountRef = useRef(1);
  const [autoLoadArmed, setAutoLoadArmed] = useState(false);
  const runtimeState = state || createInitialColumnState();
  const displayCount = runtimeState.count ?? displayItems.length;
  const panelBackgroundColor = toKanbanAlphaColor(column.color, column.isUnknown ? 0.08 : 0.1);
  const panelBorderColor = toKanbanAlphaColor(column.color, column.isUnknown ? 0.2 : 0.24);
  const panelHeaderBackgroundColor = toKanbanAlphaColor(column.color, column.isUnknown ? 0.14 : 0.18);

  const loadPage = useCallback(
    async (page: number, append = false) => {
      if (loadingRef.current) {
        return;
      }

      const requestedLoadedPages = Math.max(page, 1);
      const basePageSize = model.getPageSize() || 10;
      const requestPage = append ? requestedLoadedPages : 1;
      const requestPageSize = append ? basePageSize : basePageSize * requestedLoadedPages;

      loadingRef.current = true;
      setState((prev) => ({
        ...prev,
        [column.key]: {
          ...(prev[column.key] || createInitialColumnState()),
          loading: true,
          error: undefined,
        },
      }));

      try {
        const resource = createColumnResource(model, column, requestPage, requestPageSize);
        await resource.refresh();
        const nextItems = (resource.getData() || []).map((item: any) =>
          normalizeKanbanRuntimeRecord(item, model.collection),
        );
        const metaCount = Number(resource.getMeta('count') ?? nextItems.length);
        const metaPage = Number(resource.getMeta('page') ?? requestPage);
        const metaPageSize = Number(resource.getMeta('pageSize') ?? requestPageSize);
        const metaTotalPage = Number(resource.getMeta('totalPage') ?? 0);
        const metaHasNext = resource.getMeta('hasNext');
        const resolvedLoadedPages = append ? metaPage : requestedLoadedPages;
        const loadedItemCount = append ? resolvedLoadedPages * metaPageSize : nextItems.length;
        const resolvedHasNext =
          typeof metaHasNext === 'boolean'
            ? metaHasNext
            : metaTotalPage > 0
              ? loadedItemCount < metaCount
              : metaCount > loadedItemCount;

        setState((prev) => {
          const previous = prev[column.key] || createInitialColumnState();
          return {
            ...prev,
            [column.key]: {
              items: dedupeColumnItemsByRecordKey(
                append ? [...previous.items, ...nextItems] : nextItems,
                model.collection,
              ),
              page: resolvedLoadedPages,
              hasNext: resolvedHasNext,
              count: Number.isNaN(metaCount) ? nextItems.length : metaCount,
              loading: false,
              loadedRefreshToken: refreshToken,
            },
          };
        });
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          [column.key]: {
            ...(prev[column.key] || createInitialColumnState()),
            loading: false,
            error: error?.message || model.translate('Failed to load data'),
            loadedRefreshToken: refreshToken,
          },
        }));
      } finally {
        loadingRef.current = false;
      }
    },
    [column, model, refreshToken, setState],
  );

  useEffect(() => {
    loadedPageCountRef.current = Math.max(state?.page || 1, 1);
  }, [state?.page]);

  useEffect(() => {
    if (autoLoadArmed || fixedHeight) {
      return;
    }

    const handleWindowScroll = () => {
      setAutoLoadArmed(true);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [autoLoadArmed, fixedHeight]);

  useEffect(() => {
    void loadPage(loadedPageCountRef.current, false);
  }, [column.key, loadPage, refreshToken]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;

    if (!autoLoadArmed) {
      setAutoLoadArmed(true);
    }

    if (runtimeState.loading || !runtimeState.hasNext) {
      return;
    }

    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom < 120) {
      void loadPage(runtimeState.page + 1, true);
    }
  };

  useEffect(() => {
    const sentinelElement = loadMoreSentinelRef.current;
    if (
      !sentinelElement ||
      !autoLoadArmed ||
      runtimeState.loading ||
      !runtimeState.hasNext ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadingRef.current) {
          return;
        }

        void loadPage(runtimeState.page + 1, true);
      },
      {
        root: fixedHeight ? scrollContainerRef.current : null,
        rootMargin: '0px 0px 160px 0px',
        threshold: 0,
      },
    );

    observer.observe(sentinelElement);

    return () => {
      observer.disconnect();
    };
  }, [autoLoadArmed, fixedHeight, loadPage, runtimeState.hasNext, runtimeState.loading, runtimeState.page]);

  const setBodyRef = useCallback((node: HTMLDivElement | null, provided?: any) => {
    scrollContainerRef.current = node;

    if (!provided?.innerRef) {
      return;
    }

    if (typeof provided.innerRef === 'function') {
      provided.innerRef(node);
      return;
    }

    provided.innerRef.current = node;
  }, []);

  const renderColumnBody = (options?: { provided?: any; snapshot?: any }) => (
    <div
      ref={(node) => setBodyRef(node, options?.provided)}
      {...(options?.provided?.droppableProps || {})}
      onScroll={handleScroll}
      style={
        dragEnabled && options?.snapshot?.isDraggingOver
          ? {
              background: toKanbanAlphaColor(column.color, column.isUnknown ? 0.12 : 0.14),
            }
          : undefined
      }
      className={css`
        flex: 1 1 0;
        min-height: ${fixedHeight ? '0' : '180px'};
        overflow-x: hidden;
        overflow-y: ${fixedHeight ? 'auto' : 'visible'};
        padding: 12px;
        scrollbar-gutter: stable;
        transition: background 0.2s ease;
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          min-height: ${fixedHeight ? '100%' : '120px'};
        `}
      >
        {runtimeState.loading && !displayItems.length ? (
          <CardPlaceholder />
        ) : displayItems.length ? (
          displayItems.map((record, index) => {
            const recordKey = getRuntimeRecordKey(record, model.collection);
            const cardRenderKey = recordKey || `${column.key}:${index}`;

            if (!dragEnabled || !recordKey) {
              return (
                <div
                  key={`card-wrap:${cardRenderKey}`}
                  className={css`
                    margin-bottom: 12px;
                  `}
                >
                  <LazyCardRenderer model={model} record={record} index={index} columnKey={column.key} />
                </div>
              );
            }

            return (
              <DraggableKanbanCard
                key={`card-wrap:${cardRenderKey}`}
                model={model}
                record={record}
                index={index}
                columnKey={column.key}
                dragEnabled={dragEnabled}
                dragInteractionEnabled={dragInteractionEnabled}
              />
            );
          })
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={model.translate('No data')} />
        )}
        {options?.provided?.placeholder}
        {runtimeState.hasNext ? <div ref={loadMoreSentinelRef} style={{ height: 1 }} /> : null}
      </div>
      {runtimeState.hasNext ? (
        <div style={{ paddingTop: 8 }}>
          <Button block loading={runtimeState.loading} onClick={() => void loadPage(runtimeState.page + 1, true)}>
            {model.translate('Load more')}
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={css`
        width: ${model.getColumnWidth()}px;
        display: flex;
        flex-direction: column;
        min-height: ${fixedHeight ? '0' : DEFAULT_KANBAN_BLOCK_MIN_HEIGHT};
        height: ${fixedHeight ? '100%' : 'auto'};
        background: ${panelBackgroundColor};
        border-radius: 12px;
        border: 1px solid ${panelBorderColor};
        overflow: hidden;
        flex-shrink: 0;
      `}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          background: panelHeaderBackgroundColor,
          borderBottom: `1px solid ${panelBorderColor}`,
        }}
      >
        <Tag color={column.color}>{column.label}</Tag>
        <span style={{ color: 'var(--ant-colorTextDescription)', fontSize: 12 }}>{displayCount}</span>
      </div>
      {runtimeState.error ? <Alert type="error" message={runtimeState.error} showIcon /> : null}
      {dragEnabled ? (
        <Droppable droppableId={String(column.key)} isDropDisabled={!dragInteractionEnabled}>
          {(provided: any, snapshot: any) => renderColumnBody({ provided, snapshot })}
        </Droppable>
      ) : (
        renderColumnBody()
      )}
    </div>
  );
};
