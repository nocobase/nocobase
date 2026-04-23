/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { PlusOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Empty, Tooltip } from 'antd';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import type { KanbanBlockModel } from '../../KanbanBlockModel';
import { toKanbanAlphaColor } from '../../utils';
import { CardPlaceholder, DraggableKanbanCard, LazyCardRenderer } from './CardRenderer';
import {
  type ColumnRefreshMeta,
  createColumnResource,
  createInitialColumnState,
  dedupeColumnItemsByRecordKey,
  getRuntimeRecordKey,
  normalizeKanbanRuntimeRecord,
  reuseKanbanRecordReferences,
  type ColumnState,
  type KanbanDesignSettingsHost,
  type KanbanRuntimeRecord,
  type RuntimeColumn,
} from './shared';

const DEFAULT_KANBAN_BLOCK_MIN_HEIGHT = '60vh';

type ColumnPanelProps = {
  model: KanbanBlockModel;
  column: RuntimeColumn;
  state: ColumnState | undefined;
  displayItems: KanbanRuntimeRecord[];
  setState: React.Dispatch<React.SetStateAction<Record<string, ColumnState>>>;
  refreshMeta?: ColumnRefreshMeta;
  designSettingsHost?: KanbanDesignSettingsHost | null;
  fixedHeight: boolean;
  dragEnabled: boolean;
  dragInteractionEnabled: boolean;
  hidden?: boolean;
};

const ColumnPanelComponent = ({
  model,
  column,
  state,
  displayItems,
  setState,
  refreshMeta,
  designSettingsHost,
  fixedHeight,
  dragEnabled,
  dragInteractionEnabled,
  hidden,
}: ColumnPanelProps) => {
  const loadingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadedPageCountRef = useRef(1);
  const [autoLoadArmed, setAutoLoadArmed] = useState(false);
  const runtimeState = state || createInitialColumnState();
  const displayCount = runtimeState.count ?? displayItems.length;
  const styleVariant = model.getStyleVariant();
  const isColorStyle = styleVariant === 'filled';
  const hasColumnColor = Boolean(column.color);
  const panelBackgroundColor = isColorStyle
    ? hasColumnColor
      ? toKanbanAlphaColor(column.color, column.isUnknown ? 0.08 : 0.1)
      : 'var(--colorBgLayout)'
    : 'var(--colorBgLayout)';
  const panelBorderColor = isColorStyle
    ? hasColumnColor
      ? toKanbanAlphaColor(column.color, column.isUnknown ? 0.2 : 0.24)
      : 'var(--colorBgContainer)'
    : 'var(--colorBgContainer)';
  const panelHeaderBackgroundColor = isColorStyle
    ? hasColumnColor
      ? toKanbanAlphaColor(column.color, column.isUnknown ? 0.14 : 0.18)
      : 'var(--colorBgLayout)'
    : 'var(--colorBgLayout)';

  const loadPage = useCallback(
    async (page: number, append = false) => {
      if (loadingRef.current) {
        return;
      }

      const requestedLoadedPages = Math.max(page, 1);
      const basePageSize = model.getPageSize() || 10;
      const requestPage = append ? requestedLoadedPages : 1;
      const requestPageSize = append ? basePageSize : basePageSize * requestedLoadedPages;

      // Save scroll position before reload so we can restore it after
      const scrollContainer = scrollContainerRef.current;
      const savedScrollTop = scrollContainer?.scrollTop ?? 0;

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
          const resolvedItems = append
            ? [...previous.items, ...nextItems]
            : refreshMeta?.reason === 'drag'
              ? reuseKanbanRecordReferences({
                  previousItems: previous.items,
                  nextItems,
                  collection: model.collection,
                  skipRecordKeys: [refreshMeta.activeRecordKey],
                })
              : nextItems;

          return {
            ...prev,
            [column.key]: {
              items: dedupeColumnItemsByRecordKey(resolvedItems, model.collection),
              page: resolvedLoadedPages,
              hasNext: resolvedHasNext,
              count: Number.isNaN(metaCount) ? nextItems.length : metaCount,
              loading: false,
              loadedRefreshToken: refreshMeta?.token || 0,
            },
          };
        });

        // Restore scroll position after non-append reload
        if (!append && savedScrollTop > 0 && scrollContainer) {
          requestAnimationFrame(() => {
            scrollContainer.scrollTop = savedScrollTop;
          });
        }
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          [column.key]: {
            ...(prev[column.key] || createInitialColumnState()),
            loading: false,
            error: error?.message || model.translate('Failed to load data'),
            loadedRefreshToken: refreshMeta?.token || 0,
          },
        }));
      } finally {
        loadingRef.current = false;
      }
    },
    [column, model, refreshMeta, setState],
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
  }, [column.key, loadPage, refreshMeta?.token]);

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
        dragEnabled && options?.snapshot?.isDraggingOver && hasColumnColor
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
            const enableDesignSettings = Boolean(model.context.flowSettingsEnabled);

            if (!dragEnabled || !recordKey) {
              return (
                <div
                  key={`card-wrap:${cardRenderKey}`}
                  className={css`
                    margin-bottom: 12px;
                  `}
                >
                  <LazyCardRenderer
                    model={model}
                    record={record}
                    index={index}
                    columnKey={column.key}
                    enableDesignSettings={enableDesignSettings}
                  />
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
                enableDesignSettings={enableDesignSettings}
              />
            );
          })
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={model.translate('No data')} />
        )}
        {options?.provided?.placeholder}
        {runtimeState.hasNext ? <div ref={loadMoreSentinelRef} style={{ height: 1 }} /> : null}
      </div>
      {/* {runtimeState.hasNext ? (
        <div style={{ paddingTop: 8 }}>
          <Button block loading={runtimeState.loading} onClick={() => void loadPage(runtimeState.page + 1, true)}>
            {model.translate('Load more')}
          </Button>
        </div>
      ) : null} */}
    </div>
  );

  return (
    <div
      className={css`
        display: ${hidden ? 'none' : 'flex'};
        width: ${model.getColumnWidth()}px;
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
          gap: 8,
          padding: '12px 14px',
          background: panelHeaderBackgroundColor,
          borderBottom: `1px solid ${panelBorderColor}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 0 }}>
          <Badge color={column.color}></Badge>
          <span
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}
          >
            {`${column.label}（${displayCount}）`}
          </span>
        </div>
        {model.getQuickCreateEnabled() ? (
          <Tooltip title={model.translate('Add new')}>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void model.openQuickCreate(column);
              }}
            />
          </Tooltip>
        ) : null}
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

export const ColumnPanel = memo(ColumnPanelComponent, areColumnPanelPropsEqual);
ColumnPanel.displayName = 'ColumnPanel';

function areColumnPanelPropsEqual(prev: ColumnPanelProps, next: ColumnPanelProps) {
  return (
    prev.model === next.model &&
    prev.column === next.column &&
    prev.state === next.state &&
    prev.displayItems === next.displayItems &&
    prev.setState === next.setState &&
    prev.refreshMeta === next.refreshMeta &&
    prev.fixedHeight === next.fixedHeight &&
    prev.dragEnabled === next.dragEnabled &&
    prev.dragInteractionEnabled === next.dragInteractionEnabled &&
    prev.hidden === next.hidden &&
    !isDesignSettingsHostChangeRelevant(prev.designSettingsHost, next.designSettingsHost, prev.column.key)
  );
}

function isDesignSettingsHostChangeRelevant(
  prevHost: KanbanDesignSettingsHost | null | undefined,
  nextHost: KanbanDesignSettingsHost | null | undefined,
  columnKey: string,
) {
  const prevRelevant = prevHost?.columnKey === columnKey ? prevHost : undefined;
  const nextRelevant = nextHost?.columnKey === columnKey ? nextHost : undefined;

  return (
    prevRelevant?.columnKey !== nextRelevant?.columnKey ||
    prevRelevant?.recordKey !== nextRelevant?.recordKey ||
    prevRelevant?.index !== nextRelevant?.index
  );
}
