/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cx } from '@emotion/css';
import { DndProvider } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Table as AntdTable, type TableProps as AntdTableProps } from 'antd';
import type { ColumnsType, ColumnType, GetRowKey } from 'antd/es/table/interface';
import type { RenderedCell } from 'rc-table/lib/interface';
import React, { useMemo, useState } from 'react';
import { SortableRow, SortHandle } from './dnd/SortableRow';
import { RowOverlayPreview } from './RowOverlayPreview';
import { SelectionCell } from './SelectionCell';
import { indexSwapClassName, selectionGutterClassName, tableScrollClassName } from './styles';
import { readRowKey, snapshotSourceRow, type RowKey, type RowSnapshot } from './utils';

type RowSelectionRenderCellResult<RecordType> = React.ReactNode | RenderedCell<RecordType>;

/**
 * Default initial page size for `Table`. Exposed so consumers can seed their
 * controlled `pageSize` state with the same value the component would use if
 * they relied purely on the built-in pagination defaults.
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Default `pageSizeOptions` injected into the pagination config. Matches the
 * v1 settings-page table so users see the same choices across versions.
 * Consumers can override by passing their own `pageSizeOptions` in
 * `pagination`.
 */
export const PAGE_SIZE_OPTIONS: readonly number[] = [5, 10, 20, 50, 100, 200];

/**
 * antd's `rowSelection.renderCell` can return either a `ReactNode` or a
 * `RenderedCell` (the `{ children, props }` shape used to drive colSpan /
 * rowSpan). `SelectionCell` only paints inside an existing selection cell —
 * cell-spanning isn't supported here — so this guard unwraps to the inner
 * children when a `RenderedCell` slips through.
 */
function isRenderedCell<RecordType>(value: unknown): value is RenderedCell<RecordType> {
  return typeof value === 'object' && value !== null && !React.isValidElement(value) && 'children' in value;
}

export interface TableProps<RecordType extends object = any> extends AntdTableProps<RecordType> {
  /**
   * Required so drag-sort, hover-swap and row identity work. Accepts the same
   * shape as antd `Table.rowKey`. When passed as a function it gets the
   * record + index and must return a serializable id.
   */
  rowKey: RowKey<RecordType>;
  /**
   * Show row index (1, 2, 3, …) in the rowSelection column by default; hovering
   * a row or selecting it reveals the checkbox in the same cell. Requires
   * `rowSelection` — the index lives in the selection column. Defaults to
   * `true`.
   */
  showIndex?: boolean;
  /**
   * Enable vertical drag-and-drop row reordering. When true, rows show a drag
   * handle on the left and `onSortEnd` fires after each drop. Defaults to
   * `false`; the rest of the table behaves like a plain antd Table.
   */
  isDraggable?: boolean;
  /**
   * Called after a row is dropped onto another. Only used when `isDraggable`
   * is true. The caller persists the move (e.g. `resource.move(...)`) and
   * refreshes `dataSource` — this component does NOT mutate the data array.
   */
  onSortEnd?: (from: RecordType, to: RecordType) => void | Promise<void>;
  /**
   * Hide the drag handle entirely while still keeping `isDraggable` on. Useful
   * when the caller wants to embed `<SortHandle />` inside a custom column.
   * Defaults to `true`.
   */
  showSortHandle?: boolean;
  /**
   * Override the width of the auto-inserted handle column when `rowSelection`
   * is absent. When `rowSelection` is provided the handle is rendered inside
   * the selection column instead, so this prop is ignored.
   */
  sortHandleColumnWidth?: number;
}

/**
 * Generic v2 settings-page table primitive. Built on antd's `Table` and adds:
 *
 * - Row-index ↔ checkbox swap inside the selection column (`showIndex`,
 *   on by default): index visible at rest, checkbox shows on hover or when
 *   selected. Both elements are absolutely positioned inside the cell so
 *   they share the same center anchor and never compete for layout space.
 * - Optional vertical drag-and-drop reordering (`isDraggable`): handle is
 *   absolute-positioned in a 32px left gutter so the checkbox column stays
 *   visually centered. The drag overlay renders an `outerHTML` clone of the
 *   source `<tr>`; the index is suppressed inside the clone so the row
 *   being moved doesn't display a stale ordinal.
 *
 * Use this in place of antd `Table` for any settings-page list. When
 * `isDraggable` is false the component is a thin pass-through to antd Table
 * plus the index swap, so it is safe as the default table on any page.
 */
export function Table<RecordType extends object = any>(props: TableProps<RecordType>) {
  const {
    rowKey,
    showIndex = true,
    isDraggable = false,
    onSortEnd,
    showSortHandle = true,
    sortHandleColumnWidth = 40,
    components,
    columns,
    dataSource,
    rowSelection,
    className,
    pagination,
    ...rest
  } = props;

  // Apply opinionated pagination defaults (showSizeChanger + a v1-aligned set
  // of pageSizeOptions). `pagination === false` is preserved verbatim so
  // callers can still disable pagination outright; for any other value (object
  // or undefined) we spread caller-provided keys last so explicit overrides
  // win.
  const mergedPagination = useMemo<AntdTableProps<RecordType>['pagination']>(() => {
    if (pagination === false) {
      return false;
    }
    return {
      showSizeChanger: true,
      pageSizeOptions: [...PAGE_SIZE_OPTIONS],
      ...(pagination ?? {}),
    };
  }, [pagination]);

  const showHandleInSelection = isDraggable && showSortHandle && !!rowSelection;
  const showStandaloneHandleColumn = isDraggable && showSortHandle && !rowSelection;

  const itemKeys = useMemo<string[]>(() => {
    if (!isDraggable || !dataSource) return [];
    return dataSource
      .map((record, index) => readRowKey(record, rowKey, index))
      .filter((key): key is React.Key => key != null)
      .map((key) => String(key));
  }, [dataSource, isDraggable, rowKey]);

  // Snapshot of the source `<tr>` at drag start. Cleared on drag end / cancel.
  const [activeSnapshot, setActiveSnapshot] = useState<RowSnapshot | null>(null);

  const handleDragStart = useMemoizedFn((event: DragStartEvent) => {
    setActiveSnapshot(snapshotSourceRow(String(event.active.id)));
  });

  const handleDragCancel = useMemoizedFn(() => {
    setActiveSnapshot(null);
  });

  const handleDragEnd = useMemoizedFn(async (event: DragEndEvent) => {
    setActiveSnapshot(null);
    const { active, over } = event;
    if (!active || !over || !onSortEnd) return;
    if (String(active.id) === String(over.id)) return;
    if (!dataSource) return;
    const fromIndex = dataSource.findIndex(
      (record, index) => String(readRowKey(record, rowKey, index)) === String(active.id),
    );
    const toIndex = dataSource.findIndex(
      (record, index) => String(readRowKey(record, rowKey, index)) === String(over.id),
    );
    if (fromIndex < 0 || toIndex < 0) return;
    const from = dataSource[fromIndex];
    const to = dataSource[toIndex];
    if (!from || !to) return;
    await onSortEnd(from, to);
  });

  const tableComponents = useMemo(() => {
    if (!isDraggable) return components;
    return { ...components, body: { ...components?.body, row: SortableRow } };
  }, [components, isDraggable]);

  // When dragging without rowSelection, prepend a standalone column for the
  // handle. When rowSelection is present, the handle lives inside the
  // selection cell — see `augmentedRowSelection` below.
  const augmentedColumns = useMemo<ColumnsType<RecordType>>(() => {
    const baseColumns: ColumnsType<RecordType> = columns ?? [];
    if (!showStandaloneHandleColumn) return baseColumns;
    const handleColumn: ColumnType<RecordType> = {
      key: '__sort__',
      width: sortHandleColumnWidth,
      align: 'center',
      render: () => <SortHandle />,
    };
    return [handleColumn, ...baseColumns];
  }, [columns, showStandaloneHandleColumn, sortHandleColumnWidth]);

  const augmentedRowSelection = useMemo(() => {
    if (!rowSelection) return rowSelection;
    if (!showHandleInSelection && !showIndex) return rowSelection;
    const originalRenderCell = rowSelection.renderCell;
    return {
      ...rowSelection,
      renderCell: (checked: boolean, record: RecordType, index: number, originalNode: React.ReactNode) => {
        const result: RowSelectionRenderCellResult<RecordType> = originalRenderCell
          ? originalRenderCell(checked, record, index, originalNode)
          : originalNode;
        const node: React.ReactNode = isRenderedCell<RecordType>(result) ? result.children ?? null : result;
        return (
          <SelectionCell
            checked={checked}
            index={index}
            showHandle={showHandleInSelection}
            showIndex={showIndex}
            originalNode={node}
          />
        );
      },
    };
  }, [rowSelection, showHandleInSelection, showIndex]);

  const tableClassName = cx(
    className,
    tableScrollClassName,
    showHandleInSelection && selectionGutterClassName,
    showIndex && rowSelection && indexSwapClassName,
  );

  // antd's `rowKey` accepts `string | GetRowKey<RecordType>`. Our `RowKey`
  // alias is narrower (keyof RecordType for string keys), but TS doesn't infer
  // that `keyof T & string` is assignable to `string` without help — express
  // the narrowing explicitly at the antd boundary.
  const antdRowKey: string | GetRowKey<RecordType> = typeof rowKey === 'function' ? rowKey : String(rowKey);

  const tableBody = (
    <AntdTable<RecordType>
      {...rest}
      rowKey={antdRowKey}
      dataSource={dataSource}
      columns={augmentedColumns}
      components={tableComponents}
      rowSelection={augmentedRowSelection}
      className={tableClassName}
      pagination={mergedPagination}
    />
  );

  if (!isDraggable || !onSortEnd || !itemKeys.length) {
    return tableBody;
  }

  return (
    <DndProvider
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      showDragOverlay={false}
    >
      <SortableContext items={itemKeys} strategy={verticalListSortingStrategy}>
        {tableBody}
      </SortableContext>
      {/* dropAnimation={null}: skip the default tween that snaps the overlay
          back to the source `<tr>` on drop. Our source row hasn't moved yet
          (the server `move` + refetch is async) so the tween reads as the
          row "bouncing back" to its original position, which contradicts the
          successful drop the user just performed. */}
      <DragOverlay dropAnimation={null}>
        {activeSnapshot ? <RowOverlayPreview snapshot={activeSnapshot} /> : null}
      </DragOverlay>
    </DndProvider>
  );
}

export default Table;
