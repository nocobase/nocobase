/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import _ from 'lodash';

/** 栅格系统常量 */
export const DEFAULT_GRID_COLUMNS = 24;

/** 最小 slot 厚度 */
export const MIN_SLOT_THICKNESS = 16;
/** 最大 slot 厚度 */
export const MAX_SLOT_THICKNESS = 48;

/** 列边缘最小宽度 */
export const COLUMN_EDGE_MIN_WIDTH = 12;
/** 列边缘最大宽度 */
export const COLUMN_EDGE_MAX_WIDTH = 28;
/** 列边缘宽度占列宽的比例（原来是 1/5） */
export const COLUMN_EDGE_WIDTH_RATIO = 0.2;

/** 插入区域厚度比例常量 */
const COLUMN_INSERT_THICKNESS_RATIO = 0.5; // 元素高度的 1/2

/** 行间隙高度比例常量 */
const ROW_GAP_HEIGHT_RATIO = 0.33; // 行高的 1/3

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface GridLayoutData {
  rows: Record<string, string[][]>;
  sizes: Record<string, number[]>;
  rowOrder?: string[];
}

export interface ColumnSlot {
  type: 'column';
  rowId: string;
  columnIndex: number;
  insertIndex: number;
  position: 'before' | 'after';
  rect: Rect;
}

export interface ColumnEdgeSlot {
  type: 'column-edge';
  rowId: string;
  columnIndex: number;
  direction: 'left' | 'right';
  rect: Rect;
}

export interface RowGapSlot {
  type: 'row-gap';
  targetRowId: string;
  position: 'above' | 'below';
  rect: Rect;
}

export interface EmptyRowSlot {
  type: 'empty-row';
  rect: Rect;
}

export interface EmptyColumnSlot {
  type: 'empty-column';
  rowId: string;
  columnIndex: number;
  rect: Rect;
}

export type LayoutSlot = ColumnSlot | ColumnEdgeSlot | RowGapSlot | EmptyRowSlot | EmptyColumnSlot;

/**
 * 列内插入的配置
 */
export interface ColumnInsertConfig {
  /** 高亮区域的高度（像素） */
  height?: number;
  /** 垂直偏移（像素），正数向下，负数向上 */
  offsetTop?: number;
}

/**
 * 列边缘的配置
 */
export interface ColumnEdgeConfig {
  /** 高亮区域的宽度（像素） */
  width?: number;
  /** 水平偏移（像素），正数向右，负数向左 */
  offsetLeft?: number;
}

/**
 * 行间隙的配置
 */
export interface RowGapConfig {
  /** 高亮区域的高度（像素） */
  height?: number;
  /** 垂直偏移（像素），正数向下，负数向上 */
  offsetTop?: number;
}

/**
 * 拖拽高亮区域的全局配置
 */
export interface DragOverlayConfig {
  /** 列内插入（before 表示在区块上方插入，after 表示在区块下方插入） */
  columnInsert?: {
    before?: ColumnInsertConfig;
    after?: ColumnInsertConfig;
  };
  /** 列边缘（left 表示在左侧新建列，right 表示在右侧新建列） */
  columnEdge?: {
    left?: ColumnEdgeConfig;
    right?: ColumnEdgeConfig;
  };
  /** 行间隙（above 表示在行上方插入，below 表示在行下方插入） */
  rowGap?: {
    above?: RowGapConfig;
    below?: RowGapConfig;
  };
}

export interface LayoutSnapshot {
  slots: LayoutSlot[];
  containerRect: Rect;
}

const deriveRowOrder = (rows: Record<string, string[][]>, provided?: string[]) => {
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
};

const normalizeRowsWithOrder = (rows: Record<string, string[][]>, order: string[]) => {
  const next: Record<string, string[][]> = {};
  order.forEach((rowId) => {
    if (rows[rowId]) {
      next[rowId] = rows[rowId];
    }
  });
  Object.keys(rows).forEach((rowId) => {
    if (!next[rowId]) {
      next[rowId] = rows[rowId];
    }
  });
  return next;
};

const ensureRowOrder = (layout: GridLayoutData) => {
  const order = deriveRowOrder(layout.rows, layout.rowOrder);
  layout.rowOrder = order;
  layout.rows = normalizeRowsWithOrder(layout.rows, order);
  return order;
};

export interface BuildLayoutSnapshotOptions {
  container: HTMLElement | null;
}

const toRect = (domRect: DOMRect): Rect => ({
  top: domRect.top,
  left: domRect.left,
  width: domRect.width,
  height: domRect.height,
});

const clampSlotHeight = (value: number) => Math.max(MIN_SLOT_THICKNESS, Math.min(MAX_SLOT_THICKNESS, value));

const createRect = ({ top, left, width, height }: Rect): Rect => ({
  top,
  left,
  width,
  height,
});

const offsetRect = (rect: Rect, offsets: Partial<Rect>): Rect => ({
  top: offsets.top ?? rect.top,
  left: offsets.left ?? rect.left,
  width: offsets.width ?? rect.width,
  height: offsets.height ?? rect.height,
});

const createRowGapRect = (source: Rect, position: 'above' | 'below', containerRect: Rect): Rect => {
  const baseHeight = clampSlotHeight(source.height * ROW_GAP_HEIGHT_RATIO);
  if (position === 'above') {
    const available = source.top - containerRect.top;
    const height = clampSlotHeight(Math.max(baseHeight, available));
    return createRect({
      top: source.top - height,
      left: containerRect.left,
      width: containerRect.width,
      height,
    });
  }

  const available = containerRect.top + containerRect.height - (source.top + source.height);
  const height = clampSlotHeight(Math.max(baseHeight, available));
  return createRect({
    top: source.top + source.height,
    left: containerRect.left,
    width: containerRect.width,
    height,
  });
};

const createColumnEdgeRect = (source: Rect, side: 'left' | 'right'): Rect => {
  const width = Math.min(
    Math.max(COLUMN_EDGE_MIN_WIDTH, source.width * COLUMN_EDGE_WIDTH_RATIO),
    COLUMN_EDGE_MAX_WIDTH,
  );
  return createRect({
    top: source.top,
    left: side === 'left' ? source.left : source.left + source.width - width,
    width,
    height: source.height,
  });
};

const createColumnInsertRect = (itemRect: Rect, position: 'before' | 'after'): Rect => {
  const thickness = clampSlotHeight(itemRect.height * COLUMN_INSERT_THICKNESS_RATIO);
  if (position === 'before') {
    return createRect({
      top: itemRect.top,
      left: itemRect.left,
      width: itemRect.width,
      height: thickness,
    });
  }
  return createRect({
    top: itemRect.top + itemRect.height - thickness,
    left: itemRect.left,
    width: itemRect.width,
    height: thickness,
  });
};

const expandColumnRect = (columnRect: Rect): Rect => ({
  top: columnRect.top,
  left: columnRect.left,
  width: columnRect.width,
  height: Math.max(columnRect.height, MIN_SLOT_THICKNESS),
});

export const buildLayoutSnapshot = ({ container }: BuildLayoutSnapshotOptions): LayoutSnapshot => {
  if (!container) {
    return {
      slots: [],
      containerRect: { top: 0, left: 0, width: 0, height: 0 },
    };
  }

  const containerRect = toRect(container.getBoundingClientRect());
  const slots: LayoutSlot[] = [];

  // 获取所有行元素，但只保留直接属于当前容器的（不在子 Grid 中的）
  const allRowElements = Array.from(container.querySelectorAll('[data-grid-row-id]'));
  const rowElements = allRowElements.filter((el) => {
    const htmlEl = el as HTMLElement;
    // 查找该元素最近的带 data-grid-row-id 的祖先容器
    let parent = htmlEl.parentElement;
    while (parent && parent !== container) {
      if (parent.hasAttribute('data-grid-row-id')) {
        // 说明这个元素在另一个 Grid 行内，是嵌套的
        return false;
      }
      parent = parent.parentElement;
    }
    // 如果遍历到 container 都没遇到其他 grid-row，说明是直接子元素
    return true;
  }) as HTMLElement[];

  if (rowElements.length === 0) {
    slots.push({
      type: 'empty-row',
      rect: createRect({
        top: containerRect.top,
        left: containerRect.left,
        width: containerRect.width,
        height: Math.max(containerRect.height, MIN_SLOT_THICKNESS),
      }),
    });
    return { slots, containerRect };
  }

  rowElements.forEach((rowElement, rowIndex) => {
    const rowId = rowElement.dataset.gridRowId;
    if (!rowId) {
      return;
    }
    const rowRect = toRect(rowElement.getBoundingClientRect());

    if (rowIndex === 0) {
      slots.push({
        type: 'row-gap',
        targetRowId: rowId,
        position: 'above',
        rect: createRowGapRect(rowRect, 'above', containerRect),
      });
    }

    const columnElements = Array.from(
      container.querySelectorAll(`[data-grid-column-row-id="${rowId}"][data-grid-column-index]`),
    ) as HTMLElement[];

    const sortedColumns = columnElements.sort((a, b) => {
      const indexA = Number(a.dataset.gridColumnIndex || 0);
      const indexB = Number(b.dataset.gridColumnIndex || 0);
      return indexA - indexB;
    });

    sortedColumns.forEach((columnElement) => {
      const columnIndex = Number(columnElement.dataset.gridColumnIndex || 0);
      const columnRect = toRect(columnElement.getBoundingClientRect());

      slots.push({
        type: 'column-edge',
        rowId,
        columnIndex,
        direction: 'left',
        rect: createColumnEdgeRect(columnRect, 'left'),
      });

      slots.push({
        type: 'column-edge',
        rowId,
        columnIndex,
        direction: 'right',
        rect: createColumnEdgeRect(columnRect, 'right'),
      });

      const itemElements = Array.from(
        columnElement.querySelectorAll(`[data-grid-item-row-id="${rowId}"][data-grid-column-index="${columnIndex}"]`),
      ) as HTMLElement[];

      const sortedItems = itemElements.sort((a, b) => {
        const indexA = Number(a.dataset.gridItemIndex || 0);
        const indexB = Number(b.dataset.gridItemIndex || 0);
        return indexA - indexB;
      });

      if (sortedItems.length === 0) {
        slots.push({
          type: 'empty-column',
          rowId,
          columnIndex,
          rect: expandColumnRect(columnRect),
        });
        return;
      }

      const firstItemRect = toRect(sortedItems[0].getBoundingClientRect());
      slots.push({
        type: 'column',
        rowId,
        columnIndex,
        insertIndex: 0,
        position: 'before',
        rect: createColumnInsertRect(firstItemRect, 'before'),
      });

      sortedItems.forEach((itemElement, itemIndex) => {
        const itemRect = toRect(itemElement.getBoundingClientRect());
        slots.push({
          type: 'column',
          rowId,
          columnIndex,
          insertIndex: itemIndex + 1,
          position: 'after',
          rect: createColumnInsertRect(itemRect, 'after'),
        });
      });
    });

    slots.push({
      type: 'row-gap',
      targetRowId: rowId,
      position: 'below',
      rect: createRowGapRect(rowRect, 'below', containerRect),
    });
  });

  return {
    slots,
    containerRect,
  };
};

export const getSlotKey = (slot: LayoutSlot): string => {
  switch (slot.type) {
    case 'column':
      return `${slot.type}:${slot.rowId}:${slot.columnIndex}:${slot.insertIndex}:${slot.position}`;
    case 'column-edge':
      return `${slot.type}:${slot.rowId}:${slot.columnIndex}:${slot.direction}`;
    case 'row-gap':
      return `${slot.type}:${slot.targetRowId}:${slot.position}`;
    case 'empty-row':
      return `${slot.type}`;
    case 'empty-column':
      return `${slot.type}:${slot.rowId}:${slot.columnIndex}`;
  }
};

const isPointInsideRect = (point: Point, rect: Rect): boolean => {
  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  );
};

const distanceToRect = (point: Point, rect: Rect): number => {
  const dx = Math.max(rect.left - point.x, 0, point.x - (rect.left + rect.width));
  const dy = Math.max(rect.top - point.y, 0, point.y - (rect.top + rect.height));
  return Math.sqrt(dx * dx + dy * dy);
};

export const resolveDropIntent = (point: Point, slots: LayoutSlot[]): LayoutSlot | null => {
  if (!slots.length) {
    return null;
  }

  const insideSlot = slots.find((slot) => isPointInsideRect(point, slot.rect));
  if (insideSlot) {
    return insideSlot;
  }

  let closest: LayoutSlot | null = null;
  let minDistance = Number.POSITIVE_INFINITY;
  slots.forEach((slot) => {
    const distance = distanceToRect(point, slot.rect);
    if (distance < minDistance) {
      minDistance = distance;
      closest = slot;
    }
  });

  return closest;
};

const findUidPosition = (rows: Record<string, string[][]>, uidValue: string) => {
  for (const [rowId, columns] of Object.entries(rows)) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex];
      const itemIndex = column.indexOf(uidValue);
      if (itemIndex !== -1) {
        return { rowId, columnIndex, itemIndex };
      }
    }
  }
  return null;
};

const removeItemFromLayout = (layout: GridLayoutData, uidValue: string) => {
  const position = findUidPosition(layout.rows, uidValue);
  if (!position) {
    return;
  }

  const { rowId, columnIndex, itemIndex } = position;
  const columns = layout.rows[rowId];
  const column = columns?.[columnIndex];
  if (!column) {
    return;
  }

  column.splice(itemIndex, 1);

  if (column.length === 0) {
    columns.splice(columnIndex, 1);
    if (layout.sizes[rowId]) {
      layout.sizes[rowId].splice(columnIndex, 1);
    }
  }

  if (columns.length === 0) {
    delete layout.rows[rowId];
    delete layout.sizes[rowId];
    ensureRowOrder(layout);
    return;
  }

  normalizeRowSizes(rowId, layout);
  ensureRowOrder(layout);
};

const toIntSizes = (weights: number[], count: number): number[] => {
  if (count === 0) {
    return [];
  }

  const normalizedWeights = weights.map((weight) => (Number.isFinite(weight) && weight > 0 ? weight : 1));
  const total = normalizedWeights.reduce((sum, weight) => sum + weight, 0) || count;
  const ratios = normalizedWeights.map((weight) => weight / total);
  const raw = ratios.map((ratio) => ratio * DEFAULT_GRID_COLUMNS);
  const floors = raw.map((value) => Math.max(1, Math.floor(value)));
  let remainder = DEFAULT_GRID_COLUMNS - floors.reduce((sum, value) => sum + value, 0);

  if (remainder > 0) {
    const decimals = raw
      .map((value, index) => ({ index, decimal: value - Math.floor(value) }))
      .sort((a, b) => b.decimal - a.decimal);
    let pointer = 0;
    while (remainder > 0 && decimals.length) {
      const target = decimals[pointer % decimals.length].index;
      floors[target] += 1;
      remainder -= 1;
      pointer += 1;
    }
  } else if (remainder < 0) {
    const decimals = raw
      .map((value, index) => ({ index, decimal: value - Math.floor(value) }))
      .sort((a, b) => a.decimal - b.decimal);
    let pointer = 0;
    while (remainder < 0 && decimals.length) {
      const target = decimals[pointer % decimals.length].index;
      if (floors[target] > 1) {
        floors[target] -= 1;
        remainder += 1;
      }
      pointer += 1;
    }
  }

  const diff = DEFAULT_GRID_COLUMNS - floors.reduce((sum, value) => sum + value, 0);
  if (diff !== 0 && floors.length) {
    floors[floors.length - 1] += diff;
  }

  return floors;
};

const normalizeRowSizes = (rowId: string, layout: GridLayoutData) => {
  const columns = layout.rows[rowId];
  if (!columns || columns.length === 0) {
    delete layout.sizes[rowId];
    return;
  }

  const current = layout.sizes[rowId] || new Array(columns.length).fill(DEFAULT_GRID_COLUMNS / columns.length);
  const weights =
    current.length === columns.length ? current : new Array(columns.length).fill(DEFAULT_GRID_COLUMNS / columns.length);
  layout.sizes[rowId] = toIntSizes(weights, columns.length);
};

const insertRow = (
  rows: Record<string, string[][]>,
  referenceRowId: string,
  newRowId: string,
  position: 'before' | 'after',
  value: string[][],
): Record<string, string[][]> => {
  const entries = Object.entries(rows);
  const result: Record<string, string[][]> = {};
  let inserted = false;
  entries.forEach(([rowId, rowValue]) => {
    if (!inserted && position === 'before' && rowId === referenceRowId) {
      result[newRowId] = value;
      inserted = true;
    }
    result[rowId] = rowValue;
    if (!inserted && position === 'after' && rowId === referenceRowId) {
      result[newRowId] = value;
      inserted = true;
    }
  });

  if (!inserted) {
    result[newRowId] = value;
  }

  return result;
};

const distributeSizesWithNewColumn = (
  sizes: number[] | undefined,
  insertIndex: number,
  columnCount: number,
): number[] => {
  if (!sizes || sizes.length === 0) {
    return toIntSizes(new Array(columnCount).fill(1), columnCount);
  }

  const normalized = sizes.map((size) => (Number.isFinite(size) && size > 0 ? size : 1));
  const referenceIndex = Math.max(0, Math.min(insertIndex, normalized.length - 1));
  const reference = normalized[referenceIndex] ?? 1;
  const weights = [...normalized];
  weights.splice(insertIndex, 0, reference);
  return toIntSizes(weights, columnCount);
};

export interface SimulateLayoutOptions {
  slot: LayoutSlot;
  sourceUid: string;
  layout: GridLayoutData;
  generateRowId?: () => string;
}

export const simulateLayoutForSlot = ({
  slot,
  sourceUid,
  layout,
  generateRowId,
}: SimulateLayoutOptions): GridLayoutData => {
  const cloned: GridLayoutData = {
    rows: _.cloneDeep(layout.rows),
    sizes: _.cloneDeep(layout.sizes),
    rowOrder: layout.rowOrder ? [...layout.rowOrder] : undefined,
  };

  ensureRowOrder(cloned);
  removeItemFromLayout(cloned, sourceUid);

  const createRowId = generateRowId ?? uid;

  switch (slot.type) {
    case 'column': {
      const columns = cloned.rows[slot.rowId] || [];
      if (!cloned.rows[slot.rowId]) {
        cloned.rows[slot.rowId] = columns;
      }
      if (!columns[slot.columnIndex]) {
        columns[slot.columnIndex] = [];
      }
      const targetColumn = columns[slot.columnIndex];
      targetColumn.splice(slot.insertIndex, 0, sourceUid);
      normalizeRowSizes(slot.rowId, cloned);
      break;
    }
    case 'empty-column': {
      const columns = cloned.rows[slot.rowId] || [];
      if (!cloned.rows[slot.rowId]) {
        cloned.rows[slot.rowId] = columns;
      }
      if (!columns[slot.columnIndex]) {
        columns[slot.columnIndex] = [];
      }
      columns[slot.columnIndex] = [sourceUid];
      normalizeRowSizes(slot.rowId, cloned);
      break;
    }
    case 'column-edge': {
      const columns = cloned.rows[slot.rowId] || [];
      if (!cloned.rows[slot.rowId]) {
        cloned.rows[slot.rowId] = columns;
      }
      const insertIndex = slot.direction === 'left' ? slot.columnIndex : slot.columnIndex + 1;
      columns.splice(insertIndex, 0, [sourceUid]);
      cloned.sizes[slot.rowId] = distributeSizesWithNewColumn(cloned.sizes[slot.rowId], insertIndex, columns.length);
      normalizeRowSizes(slot.rowId, cloned);
      break;
    }
    case 'row-gap': {
      const newRowId = createRowId();
      const rowPosition: 'before' | 'after' = slot.position === 'above' ? 'before' : 'after';
      const currentOrder = deriveRowOrder(cloned.rows, cloned.rowOrder);
      cloned.rows = insertRow(cloned.rows, slot.targetRowId, newRowId, rowPosition, [[sourceUid]]);
      cloned.sizes[newRowId] = [DEFAULT_GRID_COLUMNS];
      const targetIndex = currentOrder.indexOf(slot.targetRowId);
      const insertIndex =
        targetIndex === -1 ? currentOrder.length : rowPosition === 'before' ? targetIndex : targetIndex + 1;
      const nextOrder = [...currentOrder];
      nextOrder.splice(insertIndex, 0, newRowId);
      cloned.rowOrder = nextOrder;
      cloned.rows = normalizeRowsWithOrder(cloned.rows, nextOrder);
      break;
    }
    case 'empty-row': {
      const newRowId = createRowId();
      cloned.rows = {
        ...cloned.rows,
        [newRowId]: [[sourceUid]],
      };
      cloned.sizes[newRowId] = [DEFAULT_GRID_COLUMNS];
      const currentOrder = deriveRowOrder(cloned.rows, cloned.rowOrder);
      cloned.rowOrder = [...currentOrder.filter((id) => id !== newRowId), newRowId];
      cloned.rows = normalizeRowsWithOrder(cloned.rows, cloned.rowOrder);
      break;
    }
    default:
      break;
  }

  ensureRowOrder(cloned);
  return cloned;
};
