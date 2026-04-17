/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { MultiRecordResource, observer } from '@nocobase/flow-engine';
import { Alert } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import type { KanbanBlockModel } from '../KanbanBlockModel';
import {
  buildKanbanBoardDisplayItems,
  getKanbanCrossColumnMoveParams,
  getKanbanRecordKeyValue,
  getKanbanCollectionFilterTargetKey,
  getKanbanCollectionTitleField,
  getKanbanFieldScopeKey,
  getEnabledKanbanGroupOptions,
  getKanbanMoveParamsFromPreviewOrder,
  KANBAN_UNKNOWN_COLUMN_KEY,
  normalizeKanbanGroupOptions,
  type KanbanGroupOption,
} from '../utils';
import { ColumnPanel } from './kanban-block/ColumnPanel';
import { CardPlaceholder } from './kanban-block/CardRenderer';
import {
  applyKanbanColumnOverride,
  areKanbanRecordListsEqual,
  type ColumnRefreshMeta,
  createInitialColumnState,
  getRuntimeRecordKey,
  moveKanbanRecordByCoordinates,
  type ColumnState,
  type DropResult,
  type KanbanRuntimeRecord,
  type RuntimeColumn,
} from './kanban-block/shared';

const DEFAULT_KANBAN_BLOCK_MIN_HEIGHT = '60vh';

const loadRelationGroupOptions = async (model: KanbanBlockModel, field: any): Promise<KanbanGroupOption[]> => {
  const targetCollection = field?.targetCollection;
  if (!targetCollection) {
    return [];
  }

  const params = model.getResourceSettingsInitParams();
  const resource = model.context.createResource(MultiRecordResource);
  const sortField = getKanbanCollectionTitleField(targetCollection);
  const filterTargetKey = getKanbanCollectionFilterTargetKey(targetCollection);
  resource.setDataSourceKey(params.dataSourceKey);
  resource.setResourceName(targetCollection.name);
  resource.setPage(1);
  resource.setPageSize(200);
  resource.setSort([sortField]);
  await resource.refresh();

  return normalizeKanbanGroupOptions(
    (resource.getData() || []).map((item: any) => ({
      label: item?.[sortField] || item?.[filterTargetKey],
      value: item?.[filterTargetKey],
    })),
    model.props.groupOptions || [],
  );
};

export const KanbanBlockView = observer(({ model }: { model: KanbanBlockModel }) => {
  const [groupOptions, setGroupOptions] = useState<KanbanGroupOption[]>(() => model.getConfiguredGroupOptions());
  const [groupOptionsLoading, setGroupOptionsLoading] = useState(false);
  const [groupOptionsError, setGroupOptionsError] = useState<string>();
  const [columnStates, setColumnStates] = useState<Record<string, ColumnState>>({});
  const [columnRefreshMetaByColumn, setColumnRefreshMetaByColumn] = useState<Record<string, ColumnRefreshMeta>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsContainerRef = useRef<HTMLDivElement>(null);
  const errorContainerRef = useRef<HTMLDivElement>(null);
  const columnStatesRef = useRef<Record<string, ColumnState>>({});
  const boardDisplayItemsRef = useRef<Record<string, KanbanRuntimeRecord[]>>({});
  const suppressGlobalRefreshUntilRef = useRef(0);
  const dragPersistingRef = useRef(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [actionsHeight, setActionsHeight] = useState(0);
  const [errorHeight, setErrorHeight] = useState(0);
  const groupField = model.getGroupField();
  const groupFieldName = groupField?.name;
  const groupFieldScopeKey = getKanbanFieldScopeKey(groupField);
  const showActionsBar = !!model.context.flowSettingsEnabled || model.hasSubModel('actions');
  const heightMode = model.decoratorProps?.heightMode;
  const isFixedHeight = heightMode === 'specifyValue' || heightMode === 'fullHeight';
  const dragEnabled = model.canDragSort();
  const dragInteractionEnabled = dragEnabled;
  const crossColumnDragEnabled = model.canCrossColumnDrag();

  useEffect(() => {
    columnStatesRef.current = columnStates;
  }, [columnStates]);

  const columns = useMemo<RuntimeColumn[]>(() => {
    const enabledOptions = getEnabledKanbanGroupOptions(groupOptions);
    const runtimeColumns: RuntimeColumn[] = [
      {
        key: KANBAN_UNKNOWN_COLUMN_KEY,
        value: KANBAN_UNKNOWN_COLUMN_KEY,
        label: model.translate('Unknown'),
        color: 'default',
        isUnknown: true,
      },
      ...enabledOptions.map((item) => ({
        key: item.value,
        value: item.value,
        label: item.label,
        color: item.color,
      })),
    ];
    return runtimeColumns;
  }, [groupOptions, model]);

  const triggerColumnRefresh = useCallback(
    (
      columnKeys: Array<string | undefined>,
      options: {
        reason: 'global' | 'drag';
        activeRecordKey?: string;
      } = { reason: 'global' },
    ) => {
      const uniqueColumnKeys = [...new Set(columnKeys.filter(Boolean) as string[])];
      if (!uniqueColumnKeys.length) {
        return;
      }

      setColumnRefreshMetaByColumn((prev) => {
        const next = { ...prev };
        uniqueColumnKeys.forEach((columnKey) => {
          const previousToken = next[columnKey]?.token || 0;
          next[columnKey] = {
            token: previousToken + 1,
            reason: options.reason,
            activeRecordKey: options.activeRecordKey,
          };
        });
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const updateMeasuredHeights = () => {
      setContainerHeight(containerRef.current?.getBoundingClientRect().height || 0);
      setActionsHeight(actionsContainerRef.current?.offsetHeight || 0);
      setErrorHeight(errorContainerRef.current?.offsetHeight || 0);
    };

    updateMeasuredHeights();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => updateMeasuredHeights());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    if (actionsContainerRef.current) {
      observer.observe(actionsContainerRef.current);
    }
    if (errorContainerRef.current) {
      observer.observe(errorContainerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [showActionsBar, groupOptionsError]);

  const contentHeight = useMemo(() => {
    if (!isFixedHeight || !containerHeight) {
      return undefined;
    }

    const gapCount =
      Number(Boolean(showActionsBar && actionsHeight)) + Number(Boolean(groupOptionsError && errorHeight));
    return Math.max(containerHeight - actionsHeight - errorHeight - gapCount * 16, 0);
  }, [actionsHeight, containerHeight, errorHeight, groupOptionsError, isFixedHeight, showActionsBar]);

  useEffect(() => {
    let cancelled = false;

    const syncGroupOptions = async () => {
      if (!groupField) {
        setGroupOptions([]);
        return;
      }

      const inlineOptions = model.getInlineGroupOptions(groupField);
      if (inlineOptions.length) {
        setGroupOptions(inlineOptions);
        return;
      }

      setGroupOptionsLoading(true);
      setGroupOptionsError(undefined);
      try {
        const relationOptions = await loadRelationGroupOptions(model, groupField);
        if (!cancelled) {
          setGroupOptions(relationOptions);
        }
      } catch (error: any) {
        if (!cancelled) {
          setGroupOptionsError(error?.message || model.translate('Failed to load group options'));
        }
      } finally {
        if (!cancelled) {
          setGroupOptionsLoading(false);
        }
      }
    };

    void syncGroupOptions();

    return () => {
      cancelled = true;
    };
  }, [groupField, groupFieldName, model, model.props.groupOptions]);

  useEffect(() => {
    const handleRefresh = () => {
      if (Date.now() < suppressGlobalRefreshUntilRef.current) {
        suppressGlobalRefreshUntilRef.current = 0;
        return;
      }

      triggerColumnRefresh(
        columns.map((column) => column.key),
        { reason: 'global' },
      );
    };

    model.emitter.on('refresh', handleRefresh);
    return () => {
      model.emitter.off('refresh', handleRefresh);
    };
  }, [columns, model, triggerColumnRefresh, model.context.flowSettingsEnabled]);

  useEffect(() => {
    setColumnStates({});
    setColumnRefreshMetaByColumn({});
  }, [groupFieldName, groupOptions]);

  const boardDisplayItemsByColumn = useMemo(() => {
    const nextBoardDisplayItemsByColumn = buildKanbanBoardDisplayItems({
      columnItems: columns.map((column) => ({
        columnKey: column.key,
        items: columnStates[column.key]?.items || [],
      })),
      collection: model.collection,
      groupField,
      groupOptions,
    });

    const previousBoardDisplayItemsByColumn = boardDisplayItemsRef.current;
    const stabilizedBoardDisplayItemsByColumn = Object.fromEntries(
      columns.map((column) => {
        const nextItems = (nextBoardDisplayItemsByColumn[column.key] || []) as KanbanRuntimeRecord[];
        const previousItems = (previousBoardDisplayItemsByColumn[column.key] || []) as KanbanRuntimeRecord[];

        return [
          column.key,
          areKanbanRecordListsEqual(previousItems, nextItems, model.collection) ? previousItems : nextItems,
        ];
      }),
    ) as Record<string, KanbanRuntimeRecord[]>;

    boardDisplayItemsRef.current = stabilizedBoardDisplayItemsByColumn;
    return stabilizedBoardDisplayItemsByColumn;
  }, [columnStates, columns, groupField, groupOptions, model.collection]);

  const visibleColumns = useMemo(() => {
    return columns.filter((column) => {
      if (!column.isUnknown) {
        return true;
      }

      const state = columnStates[column.key];
      const refreshToken = columnRefreshMetaByColumn[column.key]?.token || 0;
      if (!state) {
        return true;
      }

      if (refreshToken > state.loadedRefreshToken) {
        return true;
      }

      if (state.loading || state.error) {
        return true;
      }

      return (boardDisplayItemsByColumn[column.key] || []).length > 0;
    });
  }, [boardDisplayItemsByColumn, columnRefreshMetaByColumn, columnStates, columns]);

  const applyPreviewToColumnStates = useCallback(
    (options: {
      previewItemsByColumn: Record<string, KanbanRuntimeRecord[]>;
      sourceColumnKey: string;
      targetColumnKey: string;
      activeRecordKey: string;
    }) => {
      const { previewItemsByColumn, sourceColumnKey, targetColumnKey, activeRecordKey } = options;
      const affectedColumnKeys = [...new Set([sourceColumnKey, targetColumnKey])];

      setColumnStates((prev) => {
        const next = { ...prev };

        affectedColumnKeys.forEach((columnKey) => {
          const previous = prev[columnKey] || createInitialColumnState(false);
          const previousItems = previous.items || [];
          const nextItems = (previewItemsByColumn[columnKey] || []).map((item) => {
            if (getRuntimeRecordKey(item, model.collection) !== activeRecordKey) {
              return item;
            }

            return applyKanbanColumnOverride({
              record: item,
              sourceColumnKey,
              targetColumnKey,
            });
          });

          next[columnKey] = {
            ...previous,
            error: undefined,
            items: nextItems,
            count:
              typeof previous.count === 'number'
                ? Math.max(previous.count + (nextItems.length - previousItems.length), 0)
                : previous.count,
          };
        });

        return next;
      });
    },
    [model.collection],
  );

  const setMoveError = useCallback((columnKeys: string[], message: string) => {
    setColumnStates((prev) => {
      const next = { ...prev };

      columnKeys.forEach((columnKey) => {
        next[columnKey] = {
          ...(next[columnKey] || createInitialColumnState(false)),
          error: message,
        };
      });

      return next;
    });
  }, []);

  const shouldRefreshColumnsAfterMove = useCallback((columnKeys: string[]) => {
    return columnKeys.some((columnKey) => {
      const state = columnStatesRef.current[columnKey];
      if (!state) {
        return false;
      }

      return state.hasNext || state.page > 1;
    });
  }, []);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination } = result;

      if (dragPersistingRef.current) {
        return;
      }

      if (!destination) {
        return;
      }

      const sourceColumnKey = source.droppableId;
      const targetColumnKey = destination.droppableId;
      const sourceIndex = source.index;
      const targetIndex = destination.index;

      if (!crossColumnDragEnabled && targetColumnKey !== sourceColumnKey) {
        return;
      }

      if (sourceColumnKey === targetColumnKey && sourceIndex === targetIndex) {
        return;
      }

      const sortField = model.getSortFieldName();
      const sourceItems = boardDisplayItemsByColumn[sourceColumnKey] || [];
      const sourceRecord = sourceItems[sourceIndex];
      const sourceId = getKanbanRecordKeyValue(sourceRecord, model.collection);

      if (!sortField || sourceId === undefined || sourceId === null || !sourceRecord) {
        return;
      }

      const previewItemsByColumn = moveKanbanRecordByCoordinates({
        itemsByColumn: boardDisplayItemsByColumn,
        sourceColumnKey,
        sourceIndex,
        targetColumnKey,
        targetIndex,
      });

      const targetItems = previewItemsByColumn[targetColumnKey] || [];
      const targetItemsExcludingActive = targetItems.filter(
        (item) => getRuntimeRecordKey(item, model.collection) !== getRuntimeRecordKey(sourceRecord, model.collection),
      );

      let moveParams: Record<string, any> = {};
      if (!targetItemsExcludingActive.length && targetColumnKey !== sourceColumnKey) {
        moveParams = getKanbanCrossColumnMoveParams({
          overType: 'column',
          targetColumnKey,
          groupFieldName,
          groupFieldScopeKey,
          collection: model.collection,
        });
      } else {
        moveParams = getKanbanMoveParamsFromPreviewOrder({
          items: targetItems,
          activeRecord: sourceRecord,
          collection: model.collection,
        });
      }

      const previousColumnStates = columnStatesRef.current;
      const affectedColumnKeys = [...new Set([sourceColumnKey, targetColumnKey])];
      const activeRecordKey = getRuntimeRecordKey(sourceRecord, model.collection) || String(sourceId);

      applyPreviewToColumnStates({
        previewItemsByColumn,
        sourceColumnKey,
        targetColumnKey,
        activeRecordKey,
      });
      dragPersistingRef.current = true;

      try {
        await model.resource.runAction('move', {
          method: 'post',
          params: {
            sourceId,
            sortField,
            ...moveParams,
          },
        });
        suppressGlobalRefreshUntilRef.current = Date.now() + 1500;

        if (shouldRefreshColumnsAfterMove(affectedColumnKeys)) {
          triggerColumnRefresh(affectedColumnKeys, {
            reason: 'drag',
            activeRecordKey,
          });
        }
      } catch (error: any) {
        setColumnStates(previousColumnStates);
        setMoveError(affectedColumnKeys, error?.message || model.translate('Failed to save drag sort'));
      } finally {
        dragPersistingRef.current = false;
      }
    },
    [
      applyPreviewToColumnStates,
      boardDisplayItemsByColumn,
      groupFieldName,
      groupFieldScopeKey,
      model,
      setMoveError,
      shouldRefreshColumnsAfterMove,
      triggerColumnRefresh,
      crossColumnDragEnabled,
    ],
  );

  if (!groupField) {
    return <Alert type="warning" showIcon message={model.translate('Grouping field is required')} />;
  }

  const boardColumns = (
    <div
      className={css`
        ${contentHeight ? 'flex: 1 1 0;' : ''}
        min-height: 0;
        overflow-x: auto;
        overflow-y: ${contentHeight ? 'hidden' : 'visible'};
        display: flex;
        align-items: stretch;
        gap: 16px;
        width: 100%;
      `}
      style={{ height: contentHeight }}
    >
      {groupOptionsLoading && !groupOptions.length ? <CardPlaceholder /> : null}
      {visibleColumns.map((column) => {
        return (
          <ColumnPanel
            key={column.key}
            model={model}
            column={column}
            state={columnStates[column.key]}
            displayItems={boardDisplayItemsByColumn[column.key] || []}
            setState={setColumnStates}
            refreshMeta={columnRefreshMetaByColumn[column.key]}
            fixedHeight={Boolean(contentHeight)}
            dragEnabled={dragEnabled}
            dragInteractionEnabled={dragInteractionEnabled}
          />
        );
      })}
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: isFixedHeight ? 0 : DEFAULT_KANBAN_BLOCK_MIN_HEIGHT,
        gap: 16,
        height: isFixedHeight ? '100%' : 'auto',
      }}
    >
      {showActionsBar ? <div ref={actionsContainerRef}>{model.renderActions()}</div> : null}
      {groupOptionsError ? (
        <div ref={errorContainerRef}>
          <Alert type="error" showIcon message={groupOptionsError} />
        </div>
      ) : null}

      {dragEnabled ? <DragDropContext onDragEnd={handleDragEnd}>{boardColumns}</DragDropContext> : boardColumns}
    </div>
  );
});

KanbanBlockView.displayName = 'KanbanBlockView';
