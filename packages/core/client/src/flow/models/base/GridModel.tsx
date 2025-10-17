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
import {
  DndProvider,
  DragHandler,
  Droppable,
  DragOverlayConfig,
  EMPTY_COLUMN_UID,
  escapeT,
  findModelUidPosition,
  FlowModel,
  MemoFlowModelRenderer,
  buildLayoutSnapshot,
  getSlotKey,
  GridLayoutData,
  LayoutSlot,
  Rect,
  resolveDropIntent,
  simulateLayoutForSlot,
} from '@nocobase/flow-engine';
import type { FlowModelRendererProps } from '@nocobase/flow-engine';
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
  containerRect: Rect;
  pointerOrigin?: { x: number; y: number };
  activeSlotKey: string | null;
  previewLayout?: GridLayoutData;
  refreshTimer?: ReturnType<typeof setTimeout> | null;
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
  private readonly itemFallback = (<SkeletonFallback />);
  private readonly itemExtraToolbarItems = [
    {
      key: 'drag-handler',
      component: DragHandler,
      sort: 1,
    },
  ];
  private dragState?: DragState;
  private _memoItemFlowSettings?: Exclude<FlowModelRendererProps['showFlowSettings'], boolean>;
  private getItemFlowSettings(): Exclude<FlowModelRendererProps['showFlowSettings'], boolean> {
    if (!this._memoItemFlowSettings) {
      this._memoItemFlowSettings = { showBackground: false, showDragHandle: true, ...this.itemFlowSettings };
    }
    return this._memoItemFlowSettings;
  }

  onInit(options: any): void {
    super.onInit(options);
    this.emitter.on('onSubModelAdded', (model: FlowModel) => {
      if (!model.isNew) {
        return;
      }
      this.resetRows(true);

      // 在 sizes 中新加一行
      // 1. 获取当前 modelUid 所在的位置
      const position = findModelUidPosition(model.uid, this.props.rows || {});
      // 2. 根据位置，在 sizes 中添加一行
      if (position) {
        const newSizes = _.cloneDeep(this.props.sizes || {});
        newSizes[position.rowId] = [24]; // 默认新行宽度为 24
        this.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
          rows: this.props.rows || {},
          sizes: newSizes,
        });

        this.setProps('sizes', newSizes);
      }
    });
    this.emitter.on('onSubModelRemoved', (model: FlowModel) => {
      const modelUid = model.uid;

      // 1. 获取当前 modelUid 所在的位置
      const position = findModelUidPosition(modelUid, this.props.rows || {});

      // 2. 重置 rows
      this.resetRows(true);

      // 3. 根据位置清空 sizes 中对应的值
      if (position) {
        const rows = this.props.rows || {};
        const newSizes = _.cloneDeep(this.props.sizes || {});

        // 如果列变空了，移除该列
        if (rows[position.rowId]?.[position.columnIndex] === undefined) {
          newSizes[position.rowId]?.splice(position.columnIndex, 1);
        }

        // 如果行变空了，移除该行
        if (rows[position.rowId] === undefined) {
          delete newSizes[position.rowId];
        }

        this.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
          rows,
          sizes: newSizes,
        });

        this.setProps('sizes', newSizes);
      }

      // 删除筛选配置
      this.context.filterManager?.removeFilterConfig({ targetId: modelUid });
      this.context.filterManager?.removeFilterConfig({ filterId: modelUid });

      this.saveStepParams();
    });
    this.emitter.on('onSubModelMoved', () => {
      this.resetRows(true);
    });

    this.emitter.on('onResizeLeft', ({ resizeDistance, model }) => {
      const position = findModelUidPosition(model.uid, this.props.rows || {});
      const gridContainerWidth = this.gridContainerRef.current?.clientWidth || 0;
      const { newRows, newSizes, moveDistance } = recalculateGridSizes({
        position,
        direction: 'left',
        resizeDistance,
        prevMoveDistance: this.prevMoveDistance,
        oldRows: this.props.rows || {},
        oldSizes: this.props.sizes || {},
        gutter: this.context.themeToken.marginBlock,
        gridContainerWidth,
      });
      this.prevMoveDistance = moveDistance;
      this.setProps('rows', newRows);
      this.setProps('sizes', newSizes);
    });
    this.emitter.on('onResizeRight', ({ resizeDistance, model }) => {
      const position = findModelUidPosition(model.uid, this.props.rows || {});
      const gridContainerWidth = this.gridContainerRef.current?.clientWidth || 0;
      const { newRows, newSizes, moveDistance } = recalculateGridSizes({
        position,
        direction: 'right',
        resizeDistance,
        prevMoveDistance: this.prevMoveDistance,
        oldRows: this.props.rows || {},
        oldSizes: this.props.sizes || {},
        gutter: this.context.themeToken.marginBlock,
        gridContainerWidth,
      });
      this.prevMoveDistance = moveDistance;
      this.setProps('rows', newRows);
      this.setProps('sizes', newSizes);
    });
    this.emitter.on('onResizeBottom', ({ resizeDistance, model }) => {});
    this.emitter.on('onResizeEnd', () => {
      this.prevMoveDistance = 0;
      this.saveGridLayout();
    });
  }

  saveGridLayout(layout?: GridLayoutData) {
    const rows = layout?.rows ?? this.props.rows ?? {};
    const sizes = layout?.sizes ?? this.props.sizes ?? {};
    this.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      rows,
      sizes,
    });
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
    const mergedRows = this.mergeRowsWithItems(params.rows || {});
    this.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      rows: mergedRows,
      sizes: params.sizes || {},
    });

    if (syncProps) {
      this.setProps('rows', mergedRows);
    }
  }

  private computePointerPosition(event: DragMoveEvent | DragEndEvent): { x: number; y: number } | null {
    if (!this.dragState) {
      return null;
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

  private updateLayoutSnapshot() {
    if (!this.dragState) {
      return;
    }
    const snapshot = buildLayoutSnapshot({ container: this.gridContainerRef.current });
    this.dragState.slots = snapshot.slots;
    this.dragState.containerRect = snapshot.containerRect;
  }

  private scheduleSnapshotRefresh() {
    if (!this.dragState) {
      return;
    }
    if (this.dragState.refreshTimer) {
      clearTimeout(this.dragState.refreshTimer);
    }
    this.dragState.refreshTimer = setTimeout(() => {
      if (!this.dragState) {
        return;
      }
      this.dragState.refreshTimer = null;
      this.updateLayoutSnapshot();
    }, 16);
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
    });

    this.dragState.previewLayout = {
      rows: _.cloneDeep(preview.rows),
      sizes: _.cloneDeep(preview.sizes),
    };

    const container = this.gridContainerRef.current;
    const scrollTop = container?.scrollTop ?? 0;
    const scrollLeft = container?.scrollLeft ?? 0;

    // 计算最终的 overlay 矩形
    const rect = this.computeOverlayRect(slot);

    const overlay: DragOverlayState = {
      top: rect.top - this.dragState.containerRect.top + scrollTop,
      left: rect.left - this.dragState.containerRect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
      type: slot.type,
    };
    this.setProps('dragOverlayRect', overlay);
    this.dragState.activeSlotKey = slotKey;
  }

  handleDragStart(event: DragStartEvent) {
    const sourceUid = event.active.id as string;
    this.dragState = {
      sourceUid,
      snapshot: {
        rows: _.cloneDeep(this.props.rows || {}),
        sizes: _.cloneDeep(this.props.sizes || {}),
      },
      slots: [],
      containerRect: { top: 0, left: 0, width: 0, height: 0 },
      pointerOrigin: getClientPoint((event as any).activatorEvent) ?? undefined,
      activeSlotKey: null,
      previewLayout: undefined,
      refreshTimer: null,
    };
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

    const slot = resolveDropIntent(point, this.dragState.slots);
    this.applyPreview(slot);
  }

  private finishDrag() {
    if (!this.dragState) {
      return;
    }

    if (this.dragState.refreshTimer) {
      clearTimeout(this.dragState.refreshTimer);
    }

    this.dragState = undefined;
    this.setProps('dragOverlayRect', null);
  }

  handleDragEnd(_event: DragEndEvent) {
    if (!this.dragState) {
      return;
    }

    const previewLayout = this.dragState.previewLayout;
    if (previewLayout) {
      this.setProps('rows', _.cloneDeep(previewLayout.rows));
      this.setProps('sizes', _.cloneDeep(previewLayout.sizes));
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

  getRows() {
    if (this.context.isMobileLayout) {
      return transformRowsToSingleColumn(this.props.rows || {});
    }
    return this.props.rows || {};
  }

  getSizes() {
    if (this.context.isMobileLayout) {
      return {};
    }

    return this.props.sizes || {};
  }

  render() {
    return (
      <>
        {this.subModels.items?.length > 0 && (
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
                rows={this.getRows()}
                sizes={this.getSizes()}
                dragOverlayRect={this.props.dragOverlayRect}
                renderItem={(uid) => {
                  const baseItem = this.flowEngine.getModel(uid);
                  const rowIndex = this.context.fieldIndex;
                  // 在数组子表单场景下，为每个子项创建行内 fork，并透传当前行索引
                  const item =
                    rowIndex == null
                      ? baseItem
                      : (() => {
                          const fork = baseItem.createFork({}, `${rowIndex}:${uid}`);
                          fork.context.defineProperty('fieldIndex', {
                            get: () => rowIndex,
                          });
                          fork.setProps({ disabled: this.props.disabled });
                          return fork;
                        })();
                  return (
                    <Droppable model={item}>
                      <MemoFlowModelRenderer
                        model={item}
                        key={`${item.uid}:${rowIndex}:${(item as any)?.use || (item as any)?.constructor?.name || 'm'}`}
                        fallback={this.itemFallback}
                        showFlowSettings={this.flowEngine.flowSettings.enabled ? this.getItemFlowSettings() : false}
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
        {this.flowEngine.flowSettings.enabled && (
          <div style={{ marginBottom: 16 }}>{this.renderAddSubModelButton()}</div>
        )}
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
        rows: {
          title: escapeT('Rows'),
          'x-decorator': 'FormItem',
          'x-component': JsonEditor,
          'x-component-props': {
            autoSize: { minRows: 10, maxRows: 20 },
            description: escapeT('Configure the rows and columns of the grid.'),
          },
        },
        sizes: {
          title: escapeT('Sizes'),
          'x-decorator': 'FormItem',
          'x-component': JsonEditor,
          'x-component-props': {
            rows: 5,
          },
          description: escapeT(
            'Configure the sizes of each row. The value is an array of numbers representing the width of each column in the row.',
          ),
        },
      },
      async handler(ctx, params) {
        const mergedRows = ctx.model.mergeRowsWithItems(params.rows || {});
        ctx.model.setProps('rows', mergedRows);
        ctx.model.setProps('sizes', params.sizes || {});
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

function recalculateGridSizes({
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
  const currentMoveDistance = Math.floor((resizeDistance / (gridContainerWidth - totalGutter)) * columnCount);

  if (currentMoveDistance === prevMoveDistance) {
    return { newRows, newSizes, moveDistance: currentMoveDistance };
  }

  newSizes[position.rowId] ??= [columnCount];

  newSizes[position.rowId][position.columnIndex] += currentMoveDistance - prevMoveDistance;

  if (direction === 'left' && position.columnIndex > 0) {
    // 如果是左侧拖动，左侧的列宽度需要相应的减少或增加
    newSizes[position.rowId][position.columnIndex - 1] -= currentMoveDistance - prevMoveDistance;

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
    newSizes[position.rowId][position.columnIndex + 1] -= currentMoveDistance - prevMoveDistance;

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
