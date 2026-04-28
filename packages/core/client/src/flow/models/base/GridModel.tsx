/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DragCancelEvent, DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { uid } from '@formily/shared';
import type { FlowModelRendererProps } from '@nocobase/flow-engine';
import {
  buildLayoutSnapshot,
  DndProvider,
  DragHandler,
  DragOverlayConfig,
  Droppable,
  EMPTY_COLUMN_UID,
  findModelUidLayoutPosition,
  FlowModel,
  getSlotKey,
  GridCellV2,
  GridLayoutData,
  GridLayoutPath,
  GridLayoutV2,
  GridRowV2,
  isSameGridLayout,
  LayoutSlot,
  MemoFlowModelRenderer,
  normalizeGridLayout,
  projectLayoutToLegacyRows,
  Rect,
  resolveDropIntent,
  simulateLayoutForSlot,
  tExpr,
} from '@nocobase/flow-engine';
import { Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { Grid } from '../../components/Grid';
import JsonEditor from '../../components/JsonEditor';
import { SkeletonFallback } from '../../components/SkeletonFallback';

export const GRID_FLOW_KEY = 'gridSettings';
export const GRID_STEP = 'grid';

interface DefaultStructure {
  parent?: FlowModel;
  subModels: {
    items: FlowModel[];
  };
}

interface DragOverlayState {
  top: number;
  left: number;
  width: number;
  height: number;
  type: LayoutSlot['type'];
}

interface DragState {
  sourceUid: string;
  snapshot: GridLayoutData;
  slots: LayoutSlot[];
  containerEl: HTMLDivElement | null;
  containerRect: Rect;
  pointerOrigin?: { x: number; y: number };
  pointerPosition?: { x: number; y: number };
  activeSlotKey: string | null;
  previewLayout?: GridLayoutData;
  refreshTimer?: ReturnType<typeof setTimeout> | null;
  cleanupListeners?: () => void;
  generatedIds: Map<string, string>;
}

const getClientPoint = (event: any): { x: number; y: number } | null => {
  if (!event) {
    return null;
  }

  if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
    return { x: event.clientX, y: event.clientY };
  }

  if (event.touches && event.touches.length > 0) {
    const touch = event.touches[0];
    return { x: touch.clientX, y: touch.clientY };
  }

  if (event.changedTouches && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }

  return null;
};

export class GridModel<T extends { subModels: { items: FlowModel[] } } = DefaultStructure> extends FlowModel<T> {
  subModelBaseClass = 'BlockModel';
  gridContainerRef = React.createRef<HTMLDivElement>();
  prevMoveDistance = 0;
  // 设置项菜单的层级，默认为 1
  itemSettingsMenuLevel = 1;
  itemFlowSettings: Exclude<FlowModelRendererProps['showFlowSettings'], boolean> = {};
  // 拖拽高亮区域的配置，子类可以覆盖此属性来自定义偏移
  dragOverlayConfig?: DragOverlayConfig;
  // 通过稳定引用减少子项不必要的重渲染
  itemFallback = (<SkeletonFallback />);
  private readonly itemExtraToolbarItems = [
    {
      key: 'drag-handler',
      component: DragHandler,
      sort: 1,
    },
  ];
  private dragState?: DragState;
  private _memoItemFlowSettings?: Exclude<FlowModelRendererProps['showFlowSettings'], boolean>;

  private updateDragPointerPosition = (event: Event) => {
    if (!this.dragState) {
      return;
    }

    const point = getClientPoint(event);
    if (!point) {
      return;
    }

    this.dragState.pointerPosition = point;
  };

  private handleDragScroll = () => {
    if (!this.dragState) {
      return;
    }

    this.scheduleSnapshotRefresh();
  };

  private bindDragDocumentListeners() {
    const ownerDocument = this.getDragContainer()?.ownerDocument || (typeof document === 'undefined' ? null : document);
    if (!ownerDocument) {
      return undefined;
    }

    const options: AddEventListenerOptions = { capture: true, passive: true };
    const removeOptions: EventListenerOptions = { capture: true };
    const ownerWindow = ownerDocument.defaultView;

    ownerDocument.addEventListener('pointermove', this.updateDragPointerPosition, options);
    ownerDocument.addEventListener('mousemove', this.updateDragPointerPosition, options);
    ownerDocument.addEventListener('touchmove', this.updateDragPointerPosition, options);
    ownerDocument.addEventListener('scroll', this.handleDragScroll, options);
    ownerWindow?.addEventListener('scroll', this.handleDragScroll, options);

    return () => {
      ownerDocument.removeEventListener('pointermove', this.updateDragPointerPosition, removeOptions);
      ownerDocument.removeEventListener('mousemove', this.updateDragPointerPosition, removeOptions);
      ownerDocument.removeEventListener('touchmove', this.updateDragPointerPosition, removeOptions);
      ownerDocument.removeEventListener('scroll', this.handleDragScroll, removeOptions);
      ownerWindow?.removeEventListener('scroll', this.handleDragScroll, removeOptions);
    };
  }

  protected deriveRowOrder(rows: Record<string, string[][]>, provided?: string[]) {
    const order: string[] = [];
    const used = new Set<string>();

    (provided || Object.keys(rows)).forEach((rowId) => {
      if (rows[rowId] && !used.has(rowId)) {
        order.push(rowId);
        used.add(rowId);
      }
    });

    Object.keys(rows).forEach((rowId) => {
      if (!used.has(rowId)) {
        order.push(rowId);
        used.add(rowId);
      }
    });

    return order;
  }

  normalizeRowsWithOrder(rows: Record<string, string[][]>, provided?: string[]) {
    const rowOrder = this.deriveRowOrder(rows, provided);
    const ordered: Record<string, string[][]> = {};
    rowOrder.forEach((rowId) => {
      if (rows[rowId]) {
        ordered[rowId] = rows[rowId];
      }
    });
    Object.keys(rows).forEach((rowId) => {
      if (!ordered[rowId]) {
        ordered[rowId] = rows[rowId];
      }
    });
    return { rows: ordered, rowOrder };
  }

  orderSizesByRowOrder(sizes: Record<string, number[]>, rowOrder: string[]) {
    const ordered: Record<string, number[]> = {};
    rowOrder.forEach((rowId) => {
      if (sizes[rowId]) {
        ordered[rowId] = sizes[rowId];
      }
    });
    Object.keys(sizes).forEach((rowId) => {
      if (!ordered[rowId]) {
        ordered[rowId] = sizes[rowId];
      }
    });
    return ordered;
  }
  private getItemFlowSettings(): Exclude<FlowModelRendererProps['showFlowSettings'], boolean> {
    if (!this._memoItemFlowSettings) {
      this._memoItemFlowSettings = { showBackground: false, showDragHandle: true, ...this.itemFlowSettings };
    }
    return this._memoItemFlowSettings;
  }

  getItemUids() {
    return (this.subModels.items || []).map((item) => item.uid);
  }

  protected normalizeLayoutFromSource(source?: Partial<GridLayoutData>): GridLayoutV2 {
    const params = this.getStepParams(GRID_FLOW_KEY, GRID_STEP) || {};
    return normalizeGridLayout({
      layout: source?.layout ?? this.props.layout ?? params.layout,
      rows: source?.rows ?? this.props.rows ?? params.rows,
      sizes: source?.sizes ?? this.props.sizes ?? params.sizes,
      rowOrder: source?.rowOrder ?? this.props.rowOrder ?? params.rowOrder,
      itemUids: this.getItemUids(),
      gridUid: this.uid,
      logger: console,
    });
  }

  getGridLayout(): GridLayoutV2 {
    return this.normalizeLayoutFromSource();
  }

  syncLayoutProps(layout: GridLayoutV2) {
    const projection = projectLayoutToLegacyRows(layout);
    this.setProps('layout', layout);
    this.setProps('rows', projection.rows);
    this.setProps('sizes', projection.sizes);
    this.setProps('rowOrder', projection.rowOrder);
  }

  setGridStepLayout(layout: GridLayoutV2) {
    this.setStepParams(GRID_FLOW_KEY, {
      [GRID_STEP]: {
        layout,
      },
    });
  }

  private findLayoutRowByPath(layout: GridLayoutV2, path?: GridLayoutPath): GridRowV2 | null {
    if (!path?.length) {
      return null;
    }

    let rows = layout.rows;
    for (let index = 0; index < path.length; index += 1) {
      const entry = path[index];
      const row = rows.find((candidate) => candidate.id === entry.rowId);
      if (!row) {
        return null;
      }
      if (index === path.length - 1) {
        return row;
      }
      const cell = row.cells.find((candidate) => candidate.id === entry.cellId);
      rows = cell?.rows || [];
    }

    return null;
  }

  private collectCellItemsForResize(cell: GridCellV2): string[] {
    if (Array.isArray(cell.items)) {
      return [...cell.items];
    }
    return (cell.rows || []).flatMap((row) =>
      row.cells.flatMap((childCell) => this.collectCellItemsForResize(childCell)),
    );
  }

  private buildResizedCells(row: GridRowV2, cells: string[][]): GridCellV2[] {
    const usedCellIndexes = new Set<number>();

    return cells.map((items, index) => {
      const matchedIndex = row.cells.findIndex((cell, cellIndex) => {
        return !usedCellIndexes.has(cellIndex) && _.isEqual(this.collectCellItemsForResize(cell), items);
      });

      if (matchedIndex !== -1) {
        usedCellIndexes.add(matchedIndex);
        const matchedCell = row.cells[matchedIndex];
        if (matchedCell.rows && !matchedCell.items) {
          return _.cloneDeep(matchedCell);
        }
        return {
          id: matchedCell.id,
          items: [...items],
        };
      }

      return {
        id: `${row.id}:cell:${index}:${uid()}`,
        items: [...items],
      };
    });
  }

  private getResizeRowPath(path?: GridLayoutPath): GridLayoutPath {
    if (!path?.length) {
      return [];
    }

    const rowPath = path.map((entry) => ({ ...entry }));
    delete rowPath[rowPath.length - 1].cellId;
    return rowPath;
  }

  private getResizeContainerWidth(path?: GridLayoutPath) {
    const rowPath = this.getResizeRowPath(path);
    const fallbackWidth = this.gridContainerRef.current?.clientWidth || 0;
    if (!rowPath.length) {
      return fallbackWidth;
    }

    const rows = Array.from(this.gridContainerRef.current?.querySelectorAll<HTMLElement>('[data-grid-row-id]') || []);
    const rowElement = rows.find((element) => {
      try {
        return _.isEqual(JSON.parse(element.dataset.gridPath || '[]'), rowPath);
      } catch {
        return false;
      }
    });
    return rowElement?.parentElement?.clientWidth || fallbackWidth;
  }

  private resizeGridLayout({
    direction,
    resizeDistance,
    model,
  }: {
    direction: 'left' | 'right';
    resizeDistance: number;
    model: FlowModel;
  }): { layout: GridLayoutV2; moveDistance: number } | null {
    const layout = this.getGridLayout();
    const position = findModelUidLayoutPosition(layout, model.uid);
    if (!position) {
      return null;
    }

    const row = this.findLayoutRowByPath(layout, position.path);
    if (!row) {
      return null;
    }

    const gridContainerWidth = this.getResizeContainerWidth(position.path);
    const rowCells = row.cells.map((cell) => this.collectCellItemsForResize(cell));
    const { newRows, newSizes, moveDistance } = recalculateGridSizes({
      position: {
        rowId: row.id,
        columnIndex: position.cellIndex,
        itemIndex: position.itemIndex,
      },
      direction,
      resizeDistance,
      prevMoveDistance: this.prevMoveDistance,
      oldRows: { [row.id]: rowCells },
      oldSizes: { [row.id]: row.sizes || [] },
      gutter: this.context.themeToken?.marginBlock ?? 16,
      gridContainerWidth,
    });

    const nextLayout = _.cloneDeep(layout);
    const resizedRow = this.findLayoutRowByPath(nextLayout, position.path);
    if (!resizedRow) {
      return null;
    }

    resizedRow.cells = this.buildResizedCells(row, newRows[row.id] || []);
    resizedRow.sizes = newSizes[row.id] || [];

    return {
      layout: normalizeGridLayout({
        layout: nextLayout,
        itemUids: this.getItemUids(),
        gridUid: this.uid,
        logger: console,
      }),
      moveDistance,
    };
  }

  onMount(): void {
    super.onMount();
    this.emitter.on('onSubModelAdded', (model: FlowModel) => {
      if (!model.isNew) {
        return;
      }
      this.resetRows(true);
      this.setGridStepLayout(this.props.layout);
    });
    this.emitter.on('onSubModelDestroyed', (model: FlowModel) => {
      const modelUid = model.uid;
      this.resetRows(true);
      this.setGridStepLayout(this.props.layout);

      // 删除筛选配置
      this.context.filterManager?.removeFilterConfig({ targetId: modelUid });
      this.context.filterManager?.removeFilterConfig({ filterId: modelUid });

      this.saveStepParams();
    });
    this.emitter.on('onSubModelMoved', () => {
      this.resetRows(true);
    });

    this.emitter.on('onResizeLeft', ({ resizeDistance, model }) => {
      const resized = this.resizeGridLayout({ direction: 'left', resizeDistance, model });
      if (resized) {
        this.prevMoveDistance = resized.moveDistance;
        this.syncLayoutProps(resized.layout);
      }
    });
    this.emitter.on('onResizeRight', ({ resizeDistance, model }) => {
      const resized = this.resizeGridLayout({ direction: 'right', resizeDistance, model });
      if (resized) {
        this.prevMoveDistance = resized.moveDistance;
        this.syncLayoutProps(resized.layout);
      }
    });
    this.emitter.on('onResizeBottom', ({ resizeDistance, model }) => {});
    this.emitter.on('onResizeEnd', () => {
      this.prevMoveDistance = 0;
      this.saveGridLayout(this.props.layout);
    });
  }

  saveGridLayout(layout?: GridLayoutData | GridLayoutV2) {
    const normalizedLayout =
      layout && 'version' in layout
        ? normalizeGridLayout({ layout, itemUids: this.getItemUids(), gridUid: this.uid, logger: console })
        : this.normalizeLayoutFromSource(layout as any);
    this.setGridStepLayout(normalizedLayout);
    this.syncLayoutProps(normalizedLayout);
    this.saveStepParams();
  }

  mergeRowsWithItems(rows: Record<string, string[][]>) {
    const items = this.subModels.items || [];
    if (!items || items.length === 0) {
      return {}; // 如果没有 items，直接返回原始 rows
    }
    // 1. 收集所有 items 里的 uid
    const allUids = new Set(items.map((item) => item.uid));
    allUids.add(EMPTY_COLUMN_UID); // 确保空白列的 UID 也被包含

    // 2. 收集 rows 里已用到的 uid
    const usedUids = new Set<string>();
    const newRows: Record<string, string[][]> = {};

    // 3. 过滤 rows 里不存在于 items 的 uid
    for (const [rowKey, cells] of Object.entries(rows)) {
      const filteredCells = cells
        .map((cell) => _.castArray(cell).filter((uid) => allUids.has(uid)))
        .filter((cell) => cell.length > 0);
      if (filteredCells.length > 0) {
        newRows[rowKey] = filteredCells;
        filteredCells.forEach((cell) => cell.forEach((uid) => usedUids.add(uid)));
      }
    }

    // 4. 只把不在 rows 里的 item.uid 作为新行加到 rows 后面
    const allRowUids = new Set<string>();
    Object.values(newRows).forEach((cells) => cells.forEach((cell) => cell.forEach((uid) => allRowUids.add(uid))));
    for (const item of items) {
      if (!allRowUids.has(item.uid)) {
        newRows[uid()] = [[item.uid]];
      }
    }

    return newRows;
  }

  resetRows(syncProps = false) {
    const params = this.getStepParams(GRID_FLOW_KEY, GRID_STEP) || {};
    const layout = this.normalizeLayoutFromSource(params);
    this.setGridStepLayout(layout);

    if (syncProps) {
      this.syncLayoutProps(layout);
    }
  }

  private computePointerPosition(event: DragMoveEvent | DragEndEvent): { x: number; y: number } | null {
    if (!this.dragState) {
      return null;
    }
    if (this.dragState.pointerPosition) {
      return this.dragState.pointerPosition;
    }

    const origin = this.dragState.pointerOrigin;
    if (origin) {
      return {
        x: origin.x + event.delta.x,
        y: origin.y + event.delta.y,
      };
    }

    const activatorPoint = getClientPoint((event as any).activatorEvent);
    if (activatorPoint) {
      this.dragState.pointerOrigin = activatorPoint;
      return {
        x: activatorPoint.x + event.delta.x,
        y: activatorPoint.y + event.delta.y,
      };
    }

    const overRect = event.over?.rect;
    if (overRect) {
      return {
        x: overRect.left + overRect.width / 2,
        y: overRect.top + overRect.height / 2,
      };
    }

    return null;
  }

  private getDragContainer() {
    if (!this.dragState) {
      return this.gridContainerRef.current;
    }

    const current = this.gridContainerRef.current;
    if (current && this.dragState.containerEl !== current) {
      this.dragState.containerEl = current;
    }

    return this.dragState.containerEl || current;
  }

  private updateLayoutSnapshot() {
    if (!this.dragState) {
      return;
    }
    const snapshot = buildLayoutSnapshot({ container: this.getDragContainer() });
    this.dragState.slots = snapshot.slots;
    this.dragState.containerRect = snapshot.containerRect;
  }

  private scheduleSnapshotRefresh() {
    if (!this.dragState) {
      return;
    }
    if (this.dragState.refreshTimer) {
      return;
    }
    this.dragState.refreshTimer = setTimeout(() => {
      if (!this.dragState) {
        return;
      }
      this.dragState.refreshTimer = null;
      this.updateLayoutSnapshot();
      this.refreshPreviewFromPointer();
    }, 16);
  }

  private refreshPreviewFromPointer() {
    if (!this.dragState) {
      return;
    }

    const point = this.dragState.pointerPosition || this.dragState.pointerOrigin;
    if (!point) {
      return;
    }

    const slot = this.resolveDragSlot(point);
    this.applyPreview(slot);
  }

  /**
   * 根据 slot 类型、位置和配置计算最终的 overlay 尺寸和位置
   */
  private computeOverlayRect(slot: LayoutSlot): { top: number; left: number; width: number; height: number } {
    const config = this.dragOverlayConfig;
    const baseRect = slot.rect;

    switch (slot.type) {
      case 'column': {
        const columnConfig = config?.columnInsert?.[slot.position];
        const height = columnConfig?.height ?? baseRect.height;
        const offsetTop = columnConfig?.offsetTop ?? 0;
        return {
          top: baseRect.top + offsetTop,
          left: baseRect.left,
          width: baseRect.width,
          height,
        };
      }
      case 'column-edge': {
        const edgeConfig = config?.columnEdge?.[slot.direction];
        const width = edgeConfig?.width ?? baseRect.width;
        const offsetLeft = edgeConfig?.offsetLeft ?? 0;
        return {
          top: baseRect.top,
          left: baseRect.left + offsetLeft,
          width,
          height: baseRect.height,
        };
      }
      case 'item-edge': {
        const edgeConfig = config?.columnEdge?.[slot.direction];
        const width = edgeConfig?.width ?? baseRect.width;
        const offsetLeft = edgeConfig?.offsetLeft ?? 0;
        return {
          top: baseRect.top,
          left: baseRect.left + offsetLeft,
          width,
          height: baseRect.height,
        };
      }
      case 'row-gap': {
        const gapConfig = config?.rowGap?.[slot.position];
        const height = gapConfig?.height ?? baseRect.height;
        const offsetTop = gapConfig?.offsetTop ?? 0;
        return {
          top: baseRect.top + offsetTop,
          left: baseRect.left,
          width: baseRect.width,
          height,
        };
      }
      case 'empty-column':
      case 'empty-row': {
        // 空列和空容器不应用任何配置，使用默认尺寸
        return {
          top: baseRect.top,
          left: baseRect.left,
          width: baseRect.width,
          height: baseRect.height,
        };
      }
      default:
        return {
          top: baseRect.top,
          left: baseRect.left,
          width: baseRect.width,
          height: baseRect.height,
        };
    }
  }

  private getHitTestSlot(slot: LayoutSlot): LayoutSlot {
    return {
      ...slot,
      // 命中区域与实际显示的 overlay 保持一致，避免鼠标仍在蓝框内时命中跳走
      rect: this.computeOverlayRect(slot),
    };
  }

  private resolveDragSlot(point: { x: number; y: number }): LayoutSlot | null {
    if (!this.dragState?.slots.length) {
      return null;
    }

    return resolveDropIntent(
      point,
      this.dragState.slots.map((slot) => this.getHitTestSlot(slot)),
    );
  }

  private applyPreview(slot: LayoutSlot | null) {
    if (!this.dragState) {
      return;
    }

    if (!slot) {
      if (this.dragState.activeSlotKey !== null) {
        this.dragState.activeSlotKey = null;
        this.dragState.previewLayout = undefined;
        this.setProps('dragOverlayRect', null);
      }
      return;
    }

    const slotKey = getSlotKey(slot);
    if (this.dragState.activeSlotKey === slotKey && this.dragState.previewLayout) {
      return;
    }

    const preview = simulateLayoutForSlot({
      slot,
      sourceUid: this.dragState.sourceUid,
      layout: this.dragState.snapshot,
      generateRowId: uid,
      generatedIds: this.dragState.generatedIds,
      generateId: () => uid(),
    });

    if (
      preview.layout &&
      this.dragState.snapshot.layout &&
      isSameGridLayout(preview.layout, this.dragState.snapshot.layout)
    ) {
      this.applyPreview(null);
      return;
    }

    this.dragState.previewLayout = {
      rows: _.cloneDeep(preview.rows),
      sizes: _.cloneDeep(preview.sizes),
      rowOrder: _.cloneDeep(preview.rowOrder),
      layout: _.cloneDeep(preview.layout),
    };

    // 计算最终的 overlay 矩形
    const rect = this.computeOverlayRect(slot);

    const overlay: DragOverlayState = {
      top: rect.top - this.dragState.containerRect.top,
      left: rect.left - this.dragState.containerRect.left,
      width: rect.width,
      height: rect.height,
      type: slot.type,
    };
    this.setProps('dragOverlayRect', overlay);
    this.dragState.activeSlotKey = slotKey;
  }

  handleDragStart(event: DragStartEvent) {
    const sourceUid = event.active.id as string;
    const layout = this.normalizeLayoutFromSource();
    const projection = projectLayoutToLegacyRows(layout);
    this.dragState = {
      sourceUid,
      snapshot: {
        rows: _.cloneDeep(projection.rows),
        sizes: _.cloneDeep(projection.sizes),
        rowOrder: _.cloneDeep(projection.rowOrder),
        layout: _.cloneDeep(layout),
      },
      slots: [],
      containerEl: this.gridContainerRef.current,
      containerRect: { top: 0, left: 0, width: 0, height: 0 },
      pointerOrigin: getClientPoint((event as any).activatorEvent) ?? undefined,
      activeSlotKey: null,
      previewLayout: undefined,
      refreshTimer: null,
      generatedIds: new Map(),
    };
    this.dragState.cleanupListeners = this.bindDragDocumentListeners();
    this.setProps('dragOverlayRect', null);
    this.updateLayoutSnapshot();
    this.scheduleSnapshotRefresh();
  }

  handleDragMove(event: DragMoveEvent) {
    if (!this.dragState) {
      return;
    }

    if (!this.dragState.slots.length) {
      this.updateLayoutSnapshot();
    }

    const point = this.computePointerPosition(event);
    if (!point) {
      this.applyPreview(null);
      return;
    }

    const slot = this.resolveDragSlot(point);
    this.applyPreview(slot);
  }

  private finishDrag() {
    if (!this.dragState) {
      return;
    }

    if (this.dragState.refreshTimer) {
      clearTimeout(this.dragState.refreshTimer);
    }

    this.dragState.cleanupListeners?.();
    this.dragState = undefined;
    this.setProps('dragOverlayRect', null);
  }

  handleDragEnd(_event: DragEndEvent) {
    if (!this.dragState) {
      return;
    }

    const previewLayout = this.dragState.previewLayout;
    if (previewLayout) {
      if (previewLayout.layout) {
        this.syncLayoutProps(_.cloneDeep(previewLayout.layout));
      } else {
        this.setProps('rows', _.cloneDeep(previewLayout.rows));
        this.setProps('sizes', _.cloneDeep(previewLayout.sizes));
        if (previewLayout.rowOrder) {
          this.setProps('rowOrder', _.cloneDeep(previewLayout.rowOrder));
        }
      }
      this.saveGridLayout(previewLayout);
    }

    this.finishDrag();
  }

  handleDragCancel(_event: DragCancelEvent) {
    this.finishDrag();
  }

  renderAddSubModelButton(): JSX.Element {
    throw new Error('renderAddSubModelButton method must be implemented in subclasses of GridModel');
  }

  /**
   * 运行态按可见 block 过滤行/列，避免“整行都是 hidden block”但依然保留行间距占位。
   * - 配置态（flowSettingsEnabled）保持原始 rows/sizes 以便拖拽和布局编辑。
   * - 运行态仅在判断为“整列/整行都不可见”时做过滤，不写回 props/stepParams，布局元数据保持不变。
   */
  private getVisibleLayout() {
    const rawLayout = this.normalizeLayoutFromSource();
    const baseLayout = this.context.isMobileLayout
      ? normalizeGridLayout({
          rows: transformRowsToSingleColumn(projectLayoutToLegacyRows(rawLayout).rows),
          itemUids: this.getItemUids(),
        })
      : rawLayout;
    const baseProjection = projectLayoutToLegacyRows(baseLayout);
    const { rows: orderedBaseRows, rowOrder } = this.normalizeRowsWithOrder(
      baseProjection.rows,
      baseProjection.rowOrder,
    );
    const orderedBaseSizes = this.orderSizesByRowOrder(baseProjection.sizes, rowOrder);

    // 配置态：不做任何过滤，保持完整布局
    if (this.context.flowSettingsEnabled) {
      return { layout: baseLayout, rows: orderedBaseRows, sizes: orderedBaseSizes };
    }

    const items = this.subModels?.items || [];
    if (!items.length) {
      return { layout: baseLayout, rows: baseProjection.rows, sizes: baseProjection.sizes };
    }

    const modelByUid = new Map(items.map((m: FlowModel) => [m.uid, m]));

    const filterRows = (rows: GridLayoutV2['rows']): GridLayoutV2['rows'] => {
      return rows
        .map((row) => {
          const cells: GridLayoutV2['rows'][number]['cells'] = [];
          const keptSizes: number[] = [];

          row.cells.forEach((cell, index) => {
            const sourceSize = row.sizes?.[index];
            const keepSize = Number.isFinite(sourceSize) && sourceSize > 0 ? sourceSize : 1;
            if (cell.rows) {
              const childRows = filterRows(cell.rows);
              if (childRows.length) {
                cells.push({ ...cell, rows: childRows });
                keptSizes.push(keepSize);
              }
              return;
            }

            const cellItems = (cell.items || []).filter((uid) => {
              if (uid === EMPTY_COLUMN_UID) {
                return false;
              }
              return modelByUid.get(uid)?.hidden !== true;
            });
            const hasVisibleItem = cellItems.some((uid) => {
              const model = modelByUid.get(uid);
              return !model || !model.hidden;
            });
            if (hasVisibleItem) {
              cells.push({ ...cell, items: cellItems });
              keptSizes.push(keepSize);
            }
          });

          return cells.length
            ? {
                ...row,
                cells,
                sizes: keptSizes,
              }
            : null;
        })
        .filter(Boolean) as GridLayoutV2['rows'];
    };

    const visibleLayout = normalizeGridLayout({
      layout: {
        version: 2,
        rows: filterRows(baseLayout.rows),
      },
    });
    const projection = projectLayoutToLegacyRows(visibleLayout);

    return { layout: visibleLayout, rows: projection.rows, sizes: projection.sizes };
  }

  render() {
    const { layout, rows, sizes } = this.getVisibleLayout();
    const hasAnyVisibleRow = Object.keys(rows || {}).length > 0;

    return (
      <>
        {hasAnyVisibleRow && (
          <Space
            ref={this.gridContainerRef}
            direction={'vertical'}
            style={{ width: '100%', marginBottom: this.props.rowGap }}
            size={this.props.rowGap}
          >
            <DndProvider
              onDragStart={this.handleDragStart.bind(this)}
              onDragMove={this.handleDragMove.bind(this)}
              onDragEnd={this.handleDragEnd.bind(this)}
              onDragCancel={this.handleDragCancel.bind(this)}
            >
              <Grid
                rowGap={this.props.rowGap}
                colGap={this.props.colGap}
                layout={layout}
                rows={rows}
                sizes={sizes}
                dragOverlayRect={this.props.dragOverlayRect}
                renderItem={(uid) => {
                  const baseItem = this.flowEngine.getModel(uid);
                  if (!baseItem) {
                    return this.itemFallback;
                  }
                  const fieldKey = this.context.fieldKey;
                  const rowIndex = this.context.fieldIndex;
                  const itemOptions = this.context.getPropertyOptions('item');
                  // 注意：record/currentObject 需要保持“动态读取”，不要在 render 时捕获一次后复用，否则在子表单里
                  // 切换关联字段（Select）时会出现取值永远不更新的问题。
                  // 同时需要透传 resolveOnServer/meta 等配置，避免关联字段子路径失去后端解析能力。
                  const recordOptions = this.context.getPropertyOptions?.('record');
                  const currentObjectOptions = this.context.getPropertyOptions?.('currentObject');
                  // 在数组子表单场景下，为每个子项创建行内 fork，并透传当前行索引
                  const item =
                    rowIndex == null
                      ? baseItem
                      : (() => {
                          const fork = baseItem.createFork({}, `${fieldKey}:${uid}`);
                          fork.context.defineProperty('fieldIndex', {
                            get: () => rowIndex,
                          });
                          fork.context.defineProperty('fieldKey', {
                            get: () => fieldKey,
                          });
                          fork.context.defineProperty('record', {
                            get: () => this.context.record,
                            cache: false,
                            meta: recordOptions?.meta,
                            resolveOnServer: recordOptions?.resolveOnServer,
                            serverOnlyWhenContextParams: recordOptions?.serverOnlyWhenContextParams,
                          });
                          fork.context.defineProperty('currentObject', {
                            get: () => this.context.currentObject,
                            cache: false,
                            // meta: currentObjectOptions?.meta,
                            resolveOnServer: currentObjectOptions?.resolveOnServer,
                            serverOnlyWhenContextParams: currentObjectOptions?.serverOnlyWhenContextParams,
                          });
                          const { value: _value, ...rest } = (itemOptions || {}) as any;
                          fork.context.defineProperty('item', {
                            ...rest,
                            get: () => this.context.item,
                            cache: false,
                          });
                          return fork;
                        })();
                  return (
                    <Droppable model={item}>
                      <MemoFlowModelRenderer
                        model={item}
                        key={`${item.uid}:${fieldKey}:${(item as any)?.use || (item as any)?.constructor?.name || 'm'}`}
                        fallback={baseItem.skeleton || this.itemFallback}
                        showFlowSettings={this.context.flowSettingsEnabled ? this.getItemFlowSettings() : false}
                        showErrorFallback
                        settingsMenuLevel={(item as any)?.settingsMenuLevel ?? this.itemSettingsMenuLevel}
                        showTitle
                        extraToolbarItems={this.itemExtraToolbarItems}
                      />
                    </Droppable>
                  );
                }}
              />
            </DndProvider>
          </Space>
        )}
        {this.context.flowSettingsEnabled && <div style={{ marginBottom: 16 }}>{this.renderAddSubModelButton()}</div>}
      </>
    );
  }
}

GridModel.registerFlow({
  key: GRID_FLOW_KEY,
  steps: {
    resetRows: {
      handler(ctx) {
        ctx.model.resetRows();
      },
    },
    grid: {
      uiSchema: {
        layout: {
          title: tExpr('Layout'),
          'x-decorator': 'FormItem',
          'x-component': JsonEditor,
          'x-component-props': {
            autoSize: { minRows: 10, maxRows: 20 },
            description: tExpr('Configure the nested layout of the grid.'),
          },
        },
      },
      async handler(ctx, params) {
        const model = ctx.model as GridModel;
        const layout = normalizeGridLayout({
          layout: params.layout,
          rows: params.rows,
          sizes: params.sizes,
          rowOrder: params.rowOrder,
          itemUids: model.getItemUids(),
          gridUid: model.uid,
          logger: console,
        });
        model.setGridStepLayout(layout);
        model.syncLayoutProps(layout);
      },
    },
  },
});

/**
 * 将多列栅格 rows 转换为移动端单列 rows。
 * 遍历原 rows 的行与列顺序，把每个原列（过滤空白列后）变成一个新行（仅一列）。
 * 行 key 使用 uid() 生成，保持插入顺序即可。
 * @param rows 原始多列 rows
 * @returns 单列 rows
 */
export function transformRowsToSingleColumn(
  rows: Record<string, string[][]>,
  options?: { emptyColumnUid?: string },
): Record<string, string[][]> {
  const emptyColumnUid = options?.emptyColumnUid ?? EMPTY_COLUMN_UID;
  const singleColumnRows: Record<string, string[][]> = {};
  Object.keys(rows).forEach((rowId) => {
    const columns = rows[rowId];
    columns.forEach((column) => {
      const filtered = column.filter((id) => id !== emptyColumnUid);
      if (filtered.length > 0) {
        singleColumnRows[uid()] = [filtered];
      }
    });
  });
  return singleColumnRows;
}

export function recalculateGridSizes({
  position,
  direction,
  resizeDistance,
  prevMoveDistance,
  oldSizes,
  oldRows,
  gridContainerWidth,
  gutter = 16,
  columnCount = 24,
}: {
  position: {
    rowId: string;
    columnIndex: number;
    itemIndex: number;
  };
  direction: 'left' | 'right' | 'bottom' | 'corner';
  resizeDistance: number;
  prevMoveDistance: number;
  oldSizes: Record<string, number[]>;
  oldRows: Record<string, string[][]>;
  gridContainerWidth: number;
  // 栅格间隔
  gutter?: number;
  // 栅格列数
  // 默认是 24 列
  columnCount?: number;
}) {
  const newRows = _.cloneDeep(oldRows);
  const newSizes = _.cloneDeep(oldSizes);
  const currentRowSizes = newSizes[position.rowId] || [];
  const totalGutter = gutter * (currentRowSizes.length - 1);

  // 当前移动的距离占总宽度的多少份
  let currentMoveDistance = Math.floor((resizeDistance / (gridContainerWidth - totalGutter)) * columnCount);

  if (currentMoveDistance === prevMoveDistance) {
    return { newRows, newSizes, moveDistance: currentMoveDistance };
  }

  newSizes[position.rowId] ??= [columnCount];

  const rowSizes = newSizes[position.rowId];
  let delta = currentMoveDistance - prevMoveDistance;
  const hasLeftNeighbor = direction === 'left' && position.columnIndex > 0;
  const hasRightNeighbor = direction === 'right' && position.columnIndex < rowSizes.length - 1;

  // 如果拖动会让总宽度增加，则限制最大增量不超过 columnCount
  if (!hasLeftNeighbor && !hasRightNeighbor && delta > 0) {
    const currentTotal = rowSizes.reduce((a, b) => a + b, 0);
    const maxDelta = columnCount - currentTotal;

    if (maxDelta <= 0) {
      return { newRows, newSizes, moveDistance: prevMoveDistance };
    }

    if (delta > maxDelta) {
      currentMoveDistance = prevMoveDistance + maxDelta;
      delta = maxDelta;
    }
  }

  newSizes[position.rowId][position.columnIndex] += delta;

  if (direction === 'left' && position.columnIndex > 0) {
    // 如果是左侧拖动，左侧的列宽度需要相应的减少或增加
    newSizes[position.rowId][position.columnIndex - 1] -= delta;

    // 如果左侧列的宽度为 0，且是一个空白列，则需要删除该列
    if (newSizes[position.rowId][position.columnIndex - 1] === 0) {
      removeEmptyColumnFromRow({
        rows: newRows,
        sizes: newSizes,
        position,
        direction: 'left',
      });
    }
  }

  // 如果最左侧的列宽度小于其初始的宽度，则需要添加一个空白列，用于显示空白
  if (direction === 'left' && position.columnIndex === 0) {
    const otherColumnSize = newSizes[position.rowId].slice(1).reduce((a, b) => a + b, 0);
    const currentColumnSize = newSizes[position.rowId][0];

    if (currentColumnSize < columnCount - otherColumnSize) {
      addEmptyColumnToRow({
        rows: newRows,
        sizes: newSizes,
        position,
        direction: 'left',
      });
    }
  }

  if (direction === 'right' && position.columnIndex < newSizes[position.rowId].length - 1) {
    // 如果是右侧拖动，右侧的列宽度需要相应的减少或增加
    newSizes[position.rowId][position.columnIndex + 1] -= delta;

    // 如果右侧列的宽度为 0，且是一个空白列，则需要删除该列
    if (newSizes[position.rowId][position.columnIndex + 1] === 0) {
      removeEmptyColumnFromRow({
        rows: newRows,
        sizes: newSizes,
        position,
        direction: 'right',
      });
    }
  }

  // 如果最右侧的列宽度小于其初始的宽度，则需要添加一个空白列，用于显示空白
  if (direction === 'right' && position.columnIndex === newSizes[position.rowId].length - 1) {
    const otherColumnSize = newSizes[position.rowId].slice(0, -1).reduce((a, b) => a + b, 0);
    const currentColumnSize = newSizes[position.rowId][position.columnIndex];

    if (currentColumnSize < columnCount - otherColumnSize) {
      addEmptyColumnToRow({
        rows: newRows,
        sizes: newSizes,
        position,
        direction: 'right',
      });
    }
  }

  return { newRows, newSizes, moveDistance: currentMoveDistance };
}

// 新增一个空白列
function addEmptyColumnToRow({
  rows,
  sizes,
  position,
  direction,
}: {
  rows: Record<string, string[][]>;
  sizes: Record<string, number[]>;
  position: {
    rowId: string;
    columnIndex: number;
  };
  direction: 'left' | 'right';
}) {
  const currentRow = rows[position.rowId] || [];
  const currentRowSizes = sizes[position.rowId] || [];

  if (direction === 'left') {
    const leftColumn = currentRow[position.columnIndex - 1];
    if (leftColumn?.includes(EMPTY_COLUMN_UID)) {
      // 如果左侧已经有空白列，则不再添加
      return;
    }
    currentRow.splice(position.columnIndex, 0, [EMPTY_COLUMN_UID]);
    currentRowSizes.splice(position.columnIndex, 0, 1);
  }

  if (direction === 'right') {
    const rightColumn = currentRow[position.columnIndex + 1];
    if (rightColumn?.includes(EMPTY_COLUMN_UID)) {
      // 如果右侧已经有空白列，则不再添加
      return;
    }
    currentRow.splice(position.columnIndex + 1, 0, [EMPTY_COLUMN_UID]);
    currentRowSizes.splice(position.columnIndex + 1, 0, 1);
  }
}

// 删除一个空白列
function removeEmptyColumnFromRow({
  rows,
  sizes,
  position,
  direction,
}: {
  rows: Record<string, string[][]>;
  sizes: Record<string, number[]>;
  position: {
    rowId: string;
    columnIndex: number;
  };
  direction: 'left' | 'right';
}) {
  const currentRow = rows[position.rowId] || [];
  const currentRowSizes = sizes[position.rowId] || [];

  if (direction === 'left') {
    const leftColumn = currentRow[position.columnIndex - 1];
    if (!leftColumn?.includes(EMPTY_COLUMN_UID)) {
      // 如果左侧没有空白列，则不进行删除
      return;
    }
    currentRow.splice(position.columnIndex - 1, 1);
    currentRowSizes.splice(position.columnIndex - 1, 1);
  }

  if (direction === 'right') {
    const rightColumn = currentRow[position.columnIndex + 1];
    if (!rightColumn?.includes(EMPTY_COLUMN_UID)) {
      // 如果右侧没有空白列，则不进行删除
      return;
    }
    currentRow.splice(position.columnIndex + 1, 1);
    currentRowSizes.splice(position.columnIndex + 1, 1);
  }
}
