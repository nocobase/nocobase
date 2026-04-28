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
  layout?: GridLayoutV2;
}

export interface GridLayoutV2 {
  version: 2;
  rows: GridRowV2[];
}

export interface GridRowV2 {
  id: string;
  cells: GridCellV2[];
  sizes: number[];
}

export interface GridCellV2 {
  id: string;
  items?: string[];
  rows?: GridRowV2[];
}

export interface GridLayoutPathEntry {
  rowId: string;
  cellId?: string;
}

export type GridLayoutPath = GridLayoutPathEntry[];

export interface GridLayoutPosition {
  path: GridLayoutPath;
  rowIndex: number;
  cellIndex: number;
  itemIndex: number;
  itemUid: string;
}

export interface ColumnSlot {
  type: 'column';
  rowId: string;
  columnIndex: number;
  insertIndex: number;
  position: 'before' | 'after';
  rect: Rect;
  path?: GridLayoutPath;
}

export interface ColumnEdgeSlot {
  type: 'column-edge';
  rowId: string;
  columnIndex: number;
  direction: 'left' | 'right';
  rect: Rect;
  path?: GridLayoutPath;
}

export interface RowGapSlot {
  type: 'row-gap';
  targetRowId: string;
  position: 'above' | 'below';
  rect: Rect;
  path?: GridLayoutPath;
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
  path?: GridLayoutPath;
}

export interface ItemEdgeSlot {
  type: 'item-edge';
  rowId: string;
  columnIndex: number;
  itemIndex: number;
  itemUid: string;
  direction: 'left' | 'right';
  rect: Rect;
  path?: GridLayoutPath;
}

export type LayoutSlot = ColumnSlot | ColumnEdgeSlot | RowGapSlot | EmptyRowSlot | EmptyColumnSlot | ItemEdgeSlot;

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

const parseLayoutPath = (value?: string): GridLayoutPath | undefined => {
  if (!value) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return undefined;
    }
    const path = parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object' || typeof entry.rowId !== 'string') {
          return null;
        }
        return {
          rowId: entry.rowId,
          ...(typeof entry.cellId === 'string' ? { cellId: entry.cellId } : {}),
        };
      })
      .filter(Boolean) as GridLayoutPath;
    return path.length ? path : undefined;
  } catch (error) {
    return undefined;
  }
};

const createLegacyCellPath = (rowId: string, columnIndex: number): GridLayoutPath => [
  {
    rowId,
    cellId: `${rowId}:cell:${columnIndex}`,
  },
];

const expandColumnRect = (columnRect: Rect): Rect => ({
  top: columnRect.top,
  left: columnRect.left,
  width: columnRect.width,
  height: Math.max(columnRect.height, MIN_SLOT_THICKNESS),
});

const hasDirectNestedRows = (columnElement: HTMLElement) => {
  return Array.from(columnElement.querySelectorAll('[data-grid-row-id]')).some((rowElement) => {
    return (rowElement as HTMLElement).closest('[data-grid-column-row-id][data-grid-column-index]') === columnElement;
  });
};

export const buildLayoutSnapshot = ({ container }: BuildLayoutSnapshotOptions): LayoutSnapshot => {
  if (!container) {
    return {
      slots: [],
      containerRect: { top: 0, left: 0, width: 0, height: 0 },
    };
  }

  const scope = (
    container.hasAttribute('data-grid-root') ? container : container.querySelector('[data-grid-root]')
  ) as HTMLElement | null;
  const layoutContainer = scope || container;
  const containerRect = toRect(layoutContainer.getBoundingClientRect());
  const slots: LayoutSlot[] = [];

  // 获取所有行元素，但只保留直接属于当前容器的（不在子 Grid 中的）
  const allRowElements = Array.from(layoutContainer.querySelectorAll('[data-grid-row-id]'));
  const hasGridRootScope = layoutContainer.hasAttribute('data-grid-root');
  const rowElements = allRowElements.filter((el) => {
    const htmlEl = el as HTMLElement;
    if (hasGridRootScope) {
      return htmlEl.closest('[data-grid-root]') === layoutContainer;
    }
    // 兼容旧测试和旧 DOM：只保留当前容器的直接 Grid 行。
    let parent = htmlEl.parentElement;
    while (parent && parent !== layoutContainer) {
      if (parent.hasAttribute('data-grid-row-id')) {
        return false;
      }
      parent = parent.parentElement;
    }
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

  const getRowScopeElement = (rowElement: HTMLElement) => {
    const parent = rowElement.parentElement;
    if (!parent || !layoutContainer.contains(parent)) {
      return layoutContainer;
    }
    return parent;
  };

  const rowElementsByScope = new Map<HTMLElement, HTMLElement[]>();
  rowElements.forEach((rowElement) => {
    const rowScopeElement = getRowScopeElement(rowElement);
    rowElementsByScope.set(rowScopeElement, [...(rowElementsByScope.get(rowScopeElement) || []), rowElement]);
  });

  rowElements.forEach((rowElement) => {
    const rowId = rowElement.dataset.gridRowId;
    if (!rowId) {
      return;
    }
    const rowRect = toRect(rowElement.getBoundingClientRect());
    const rowPath = parseLayoutPath(rowElement.dataset.gridPath) || [{ rowId }];
    const rowScopeElement = getRowScopeElement(rowElement);
    const rowScopeRect = toRect(rowScopeElement.getBoundingClientRect());
    const rowElementsInScope = rowElementsByScope.get(rowScopeElement) || [];

    if (rowElementsInScope[0] === rowElement) {
      slots.push({
        type: 'row-gap',
        targetRowId: rowId,
        position: 'above',
        rect: createRowGapRect(rowRect, 'above', rowScopeRect),
        path: rowPath,
      });
    }

    const columnElements = Array.from(
      layoutContainer.querySelectorAll(`[data-grid-column-row-id="${rowId}"][data-grid-column-index]`),
    ).filter((el) => {
      // 只保留当前 row 下的直接列，避免嵌套 Grid 中相同 rowId 的列混入
      return (el as HTMLElement).closest('[data-grid-row-id]') === rowElement;
    }) as HTMLElement[];

    const sortedColumns = columnElements.sort((a, b) => {
      const indexA = Number(a.dataset.gridColumnIndex || 0);
      const indexB = Number(b.dataset.gridColumnIndex || 0);
      return indexA - indexB;
    });

    sortedColumns.forEach((columnElement) => {
      const columnIndex = Number(columnElement.dataset.gridColumnIndex || 0);
      const columnRect = toRect(columnElement.getBoundingClientRect());
      const columnPath = parseLayoutPath(columnElement.dataset.gridPath) || createLegacyCellPath(rowId, columnIndex);

      slots.push({
        type: 'column-edge',
        rowId,
        columnIndex,
        direction: 'left',
        rect: createColumnEdgeRect(columnRect, 'left'),
        path: columnPath,
      });

      slots.push({
        type: 'column-edge',
        rowId,
        columnIndex,
        direction: 'right',
        rect: createColumnEdgeRect(columnRect, 'right'),
        path: columnPath,
      });

      const itemElements = Array.from(
        columnElement.querySelectorAll(`[data-grid-item-row-id="${rowId}"][data-grid-column-index="${columnIndex}"]`),
      ).filter((el) => {
        // 只保留当前 column 下的直接 item，避免命中更深层嵌套 column 的 item
        return (el as HTMLElement).closest('[data-grid-column-row-id][data-grid-column-index]') === columnElement;
      }) as HTMLElement[];

      const sortedItems = itemElements.sort((a, b) => {
        const indexA = Number(a.dataset.gridItemIndex || 0);
        const indexB = Number(b.dataset.gridItemIndex || 0);
        return indexA - indexB;
      });

      if (sortedItems.length === 0) {
        if (hasDirectNestedRows(columnElement)) {
          return;
        }

        slots.push({
          type: 'empty-column',
          rowId,
          columnIndex,
          rect: expandColumnRect(columnRect),
          path: columnPath,
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
        path: columnPath,
      });

      sortedItems.forEach((itemElement, itemIndex) => {
        const itemRect = toRect(itemElement.getBoundingClientRect());
        const itemPath = parseLayoutPath(itemElement.dataset.gridPath) || columnPath;
        const itemUid = itemElement.dataset.gridItemUid || '';
        slots.push({
          type: 'item-edge',
          rowId,
          columnIndex,
          itemIndex,
          itemUid,
          direction: 'left',
          rect: createColumnEdgeRect(itemRect, 'left'),
          path: itemPath,
        });

        slots.push({
          type: 'item-edge',
          rowId,
          columnIndex,
          itemIndex,
          itemUid,
          direction: 'right',
          rect: createColumnEdgeRect(itemRect, 'right'),
          path: itemPath,
        });

        slots.push({
          type: 'column',
          rowId,
          columnIndex,
          insertIndex: itemIndex + 1,
          position: 'after',
          rect: createColumnInsertRect(itemRect, 'after'),
          path: itemPath,
        });
      });
    });

    slots.push({
      type: 'row-gap',
      targetRowId: rowId,
      position: 'below',
      rect: createRowGapRect(rowRect, 'below', rowScopeRect),
      path: rowPath,
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
    case 'item-edge':
      return `${slot.type}:${slot.rowId}:${slot.columnIndex}:${slot.itemUid}:${slot.direction}`;
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

const slotPriority: Record<LayoutSlot['type'], number> = {
  'item-edge': 5,
  'column-edge': 4,
  column: 3,
  'row-gap': 2,
  'empty-column': 1,
  'empty-row': 0,
};

export const resolveDropIntent = (point: Point, slots: LayoutSlot[]): LayoutSlot | null => {
  if (!slots.length) {
    return null;
  }

  let bestInsideSlot: LayoutSlot | null = null;
  let bestInsidePriority = Number.NEGATIVE_INFINITY;
  slots.forEach((slot) => {
    if (!isPointInsideRect(point, slot.rect)) {
      return;
    }
    const priority = slotPriority[slot.type];
    if (priority > bestInsidePriority) {
      bestInsidePriority = priority;
      bestInsideSlot = slot;
    }
  });

  if (bestInsideSlot) {
    return bestInsideSlot;
  }

  let closest: LayoutSlot | null = null;
  let minDistance = Number.POSITIVE_INFINITY;
  slots.forEach((slot) => {
    const distance = distanceToRect(point, slot.rect);
    if (
      distance < minDistance ||
      (distance === minDistance && closest && slotPriority[slot.type] > slotPriority[closest.type])
    ) {
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

  const normalizedWeights = Array.from({ length: count }, (_, index) => {
    const weight = weights[index];
    return Number.isFinite(weight) && weight > 0 ? weight : 1;
  });
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

const EMPTY_COLUMN_VALUE = 'EMPTY_COLUMN';

const createTopLevelRow = (itemUid: string, id: string): GridRowV2 => ({
  id,
  cells: [
    {
      id: `${id}:cell:0`,
      items: [itemUid],
    },
  ],
  sizes: [DEFAULT_GRID_COLUMNS],
});

const convertLegacyRowsToLayout = (
  rows: Record<string, string[][]> = {},
  sizes: Record<string, number[]> = {},
  rowOrder?: string[],
): GridLayoutV2 => {
  const order = deriveRowOrder(rows, rowOrder);
  return {
    version: 2,
    rows: order
      .map((rowId) => {
        const cells = (rows[rowId] || []).map((items, columnIndex) => ({
          id: `${rowId}:cell:${columnIndex}`,
          items: [...items],
        }));
        return {
          id: rowId,
          cells,
          sizes: toIntSizes(sizes[rowId] || new Array(cells.length).fill(1), cells.length),
        };
      })
      .filter((row) => row.cells.length > 0),
  };
};

const collectCellItems = (cell: GridCellV2): string[] => {
  if (Array.isArray(cell.items)) {
    return cell.items;
  }

  return (cell.rows || []).flatMap((row) => row.cells.flatMap((childCell) => collectCellItems(childCell)));
};

export const projectLayoutToLegacyRows = (layout: GridLayoutV2): GridLayoutData => {
  const rows: Record<string, string[][]> = {};
  const sizes: Record<string, number[]> = {};
  const rowOrder: string[] = [];

  const appendRows = (sourceRows: GridRowV2[], prefix = '') => {
    sourceRows.forEach((row) => {
      const rowId = prefix ? `${prefix}/${row.id}` : row.id;
      const cells = row.cells.map((cell) => collectCellItems(cell)).filter((items) => items.length > 0);
      if (cells.length > 0) {
        rows[rowId] = cells;
        sizes[rowId] = toIntSizes(row.sizes || new Array(cells.length).fill(1), cells.length);
        rowOrder.push(rowId);
      }
    });
  };

  appendRows(layout.rows || []);
  return { rows, sizes, rowOrder, layout };
};

const normalizeGridRows = (
  rows: GridRowV2[],
  options: {
    validUids?: Set<string>;
    seenUids: Set<string>;
  },
): GridRowV2[] => {
  return (Array.isArray(rows) ? rows : [])
    .map((row, rowIndex) => {
      const rawCells = Array.isArray(row?.cells) ? row.cells : [];
      const rawSizes = Array.isArray(row?.sizes) ? row.sizes : [];
      const cellsWithSizes = rawCells
        .map((cell, cellIndex) => {
          const id =
            typeof cell?.id === 'string' && cell.id ? cell.id : `${row?.id || `row:${rowIndex}`}:cell:${cellIndex}`;
          const size = rawSizes[cellIndex];
          if (Array.isArray(cell?.rows) && cell.rows.length > 0) {
            const childRows = normalizeGridRows(cell.rows, options);
            if (childRows.length > 0) {
              return { cell: { id, rows: childRows } as GridCellV2, size };
            }
          }

          const rawItems = Array.isArray(cell?.items) ? cell.items : undefined;
          const items = (rawItems || [])
            .filter((itemUid) => typeof itemUid === 'string' && itemUid)
            .filter((itemUid) => !options.validUids || options.validUids.has(itemUid) || itemUid === EMPTY_COLUMN_VALUE)
            .filter((itemUid) => {
              if (itemUid === EMPTY_COLUMN_VALUE) {
                return true;
              }
              if (options.seenUids.has(itemUid)) {
                return false;
              }
              options.seenUids.add(itemUid);
              return true;
            });

          if (rawItems && (items.length > 0 || rawItems.length === 0)) {
            return { cell: { id, items } as GridCellV2, size };
          }

          return null;
        })
        .filter(Boolean) as { cell: GridCellV2; size: number }[];
      const cells = cellsWithSizes.map((entry) => entry.cell);

      if (cells.length === 0) {
        return null;
      }

      return {
        id: typeof row?.id === 'string' && row.id ? row.id : `row:${rowIndex}`,
        cells,
        sizes: toIntSizes(
          cellsWithSizes.map((entry) => entry.size),
          cells.length,
        ),
      } as GridRowV2;
    })
    .filter(Boolean) as GridRowV2[];
};

const collapseCell = (cell: GridCellV2): GridCellV2 | null => {
  if (cell.rows?.length) {
    const rows = collapseRows(cell.rows);
    if (rows.length === 0) {
      return null;
    }
    if (rows.length === 1 && rows[0].cells.length === 1 && rows[0].sizes[0] === DEFAULT_GRID_COLUMNS) {
      return {
        id: cell.id,
        ..._.omit(rows[0].cells[0], ['id']),
      };
    }
    return { id: cell.id, rows };
  }

  if (Array.isArray(cell.items)) {
    return { id: cell.id, items: cell.items.filter(Boolean) };
  }
  return null;
};

const collapseRows = (rows: GridRowV2[]): GridRowV2[] => {
  return rows
    .map((row) => {
      const cellsWithSizes = row.cells
        .map((cell, index) => {
          const collapsed = collapseCell(cell);
          return collapsed ? { cell: collapsed, size: row.sizes?.[index] } : null;
        })
        .filter(Boolean) as { cell: GridCellV2; size: number }[];
      const cells = cellsWithSizes.map((entry) => entry.cell);
      if (cells.length === 0) {
        return null;
      }
      return {
        id: row.id,
        cells,
        sizes: toIntSizes(
          cellsWithSizes.map((entry) => entry.size),
          cells.length,
        ),
      };
    })
    .filter(Boolean) as GridRowV2[];
};

export const normalizeGridLayout = ({
  layout,
  rows,
  sizes,
  rowOrder,
  itemUids,
  generateId = uid,
  logger,
  gridUid,
}: {
  layout?: GridLayoutV2 | null;
  rows?: Record<string, string[][]>;
  sizes?: Record<string, number[]>;
  rowOrder?: string[];
  itemUids?: string[];
  generateId?: () => string;
  logger?: Pick<Console, 'warn'>;
  gridUid?: string;
}): GridLayoutV2 => {
  const validUids = itemUids ? new Set(itemUids) : undefined;
  if (validUids) {
    validUids.add(EMPTY_COLUMN_VALUE);
  }

  try {
    const source =
      layout?.version === 2
        ? _.cloneDeep(layout)
        : convertLegacyRowsToLayout(rows || {}, sizes || {}, rowOrder || Object.keys(rows || {}));
    const seenUids = new Set<string>();
    const next: GridLayoutV2 = {
      version: 2,
      rows: collapseRows(
        normalizeGridRows(source.rows || [], {
          validUids,
          seenUids,
        }),
      ),
    };

    if (itemUids?.length) {
      itemUids.forEach((itemUid) => {
        if (itemUid === EMPTY_COLUMN_VALUE || seenUids.has(itemUid)) {
          return;
        }
        const rowId = generateId();
        next.rows.push(createTopLevelRow(itemUid, rowId));
        seenUids.add(itemUid);
      });
    }

    return next;
  } catch (error) {
    logger?.warn?.(`[GridModel] Failed to normalize grid layout${gridUid ? ` (${gridUid})` : ''}.`, error);
    return {
      version: 2,
      rows: (itemUids || [])
        .filter((itemUid) => itemUid !== EMPTY_COLUMN_VALUE)
        .map((itemUid) => createTopLevelRow(itemUid, generateId())),
    };
  }
};

export const replaceUidInGridLayout = (layout: GridLayoutV2, fromUid: string, toUid: string): GridLayoutV2 => {
  const replaceRows = (rows: GridRowV2[]): GridRowV2[] =>
    rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (cell.rows) {
          return { ...cell, rows: replaceRows(cell.rows) };
        }
        return {
          ...cell,
          items: (cell.items || []).map((itemUid) => (itemUid === fromUid ? toUid : itemUid)),
        };
      }),
    }));
  return { version: 2, rows: replaceRows(_.cloneDeep(layout.rows || [])) };
};

export const findModelUidLayoutPosition = (layout: GridLayoutV2, uidValue: string): GridLayoutPosition | null => {
  const visitRows = (rows: GridRowV2[], parentPath: GridLayoutPath): GridLayoutPosition | null => {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex += 1) {
        const cell = row.cells[cellIndex];
        const path = [...parentPath, { rowId: row.id, cellId: cell.id }];
        if (cell.items) {
          const itemIndex = cell.items.indexOf(uidValue);
          if (itemIndex !== -1) {
            return {
              path,
              rowIndex,
              cellIndex,
              itemIndex,
              itemUid: uidValue,
            };
          }
        }
        if (cell.rows) {
          const result = visitRows(cell.rows, path);
          if (result) {
            return result;
          }
        }
      }
    }
    return null;
  };

  return visitRows(layout.rows || [], []);
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

const resolveCellPath = (layout: GridLayoutV2, slot: LayoutSlot): GridLayoutPath | undefined => {
  if ('path' in slot && slot.path?.length) {
    return slot.path;
  }
  if ('rowId' in slot && 'columnIndex' in slot) {
    return createLegacyCellPath(slot.rowId, slot.columnIndex);
  }
  return undefined;
};

const findRowListByPath = (layout: GridLayoutV2, path?: GridLayoutPath): GridRowV2[] => {
  if (!path || path.length <= 1) {
    return layout.rows;
  }

  let rows = layout.rows;
  for (let i = 0; i < path.length - 1; i += 1) {
    const entry = path[i];
    const row = rows.find((candidate) => candidate.id === entry.rowId);
    const cell = row?.cells.find((candidate) => candidate.id === entry.cellId);
    if (!cell?.rows) {
      return rows;
    }
    rows = cell.rows;
  }
  return rows;
};

const findCellByPath = (layout: GridLayoutV2, path?: GridLayoutPath) => {
  if (!path?.length) {
    return null;
  }

  let rows = layout.rows;
  for (let i = 0; i < path.length; i += 1) {
    const entry = path[i];
    const rowIndex = rows.findIndex((candidate) => candidate.id === entry.rowId);
    const row = rows[rowIndex];
    if (!row || !entry.cellId) {
      return null;
    }
    const cellIndex = row.cells.findIndex((candidate) => candidate.id === entry.cellId);
    const cell = row.cells[cellIndex];
    if (!cell) {
      return null;
    }
    if (i === path.length - 1) {
      return { rows, row, cell, rowIndex, cellIndex };
    }
    rows = cell.rows || [];
  }
  return null;
};

const removeItemFromGridLayout = (layout: GridLayoutV2, sourceUid: string) => {
  const removeFromRows = (rows: GridRowV2[]): GridRowV2[] =>
    rows
      .map((row) => {
        const cellsWithSizes = row.cells
          .map((cell, index) => {
            if (cell.rows) {
              const childRows = removeFromRows(cell.rows);
              return childRows.length ? { cell: { ...cell, rows: childRows }, size: row.sizes?.[index] } : null;
            }
            const currentItems = cell.items || [];
            const hadSourceUid = currentItems.includes(sourceUid);
            const items = currentItems.filter((itemUid) => itemUid !== sourceUid);
            if (hadSourceUid && !items.length) {
              return null;
            }
            return { cell: { ...cell, items }, size: row.sizes?.[index] };
          })
          .filter(Boolean) as { cell: GridCellV2; size: number }[];
        const cells = cellsWithSizes.map((entry) => entry.cell);

        return cells.length
          ? {
              ...row,
              cells,
              sizes: toIntSizes(
                cellsWithSizes.map((entry) => entry.size),
                cells.length,
              ),
            }
          : null;
      })
      .filter(Boolean) as GridRowV2[];

  layout.rows = collapseRows(removeFromRows(layout.rows));
};

const createSingleCellRow = (itemUid: string, rowId: string, cellId: string): GridRowV2 => ({
  id: rowId,
  cells: [{ id: cellId, items: [itemUid] }],
  sizes: [DEFAULT_GRID_COLUMNS],
});

const getGeneratedId = (
  key: string,
  options?: {
    generatedIds?: Map<string, string>;
    generateId?: (key: string) => string;
  },
) => {
  const existing = options?.generatedIds?.get(key);
  if (existing) {
    return existing;
  }
  const value = options?.generateId?.(key) || uid();
  options?.generatedIds?.set(key, value);
  return value;
};

const simulateGridLayoutForSlot = ({
  slot,
  sourceUid,
  layout,
  generatedIds,
  generateId,
}: SimulateLayoutOptions): GridLayoutV2 => {
  const original = normalizeGridLayout({
    layout: layout.layout,
    rows: layout.rows,
    sizes: layout.sizes,
    rowOrder: layout.rowOrder,
  });
  const cloned = _.cloneDeep(original);
  const slotKey = getSlotKey(slot);
  const sourcePosition = findModelUidLayoutPosition(cloned, sourceUid);
  if (slot.type === 'item-edge' && slot.itemUid === sourceUid) {
    return cloned;
  }

  const targetPath = resolveCellPath(cloned, slot);
  const targetItemUid = slot.type === 'item-edge' ? slot.itemUid : undefined;
  removeItemFromGridLayout(cloned, sourceUid);

  switch (slot.type) {
    case 'column': {
      const target = findCellByPath(cloned, targetPath);
      if (!target) {
        break;
      }
      if (target.cell.rows) {
        target.cell.rows.push(
          createTopLevelRow(sourceUid, getGeneratedId(`${slotKey}:row`, { generatedIds, generateId })),
        );
        break;
      }
      target.cell.items ||= [];
      const insertIndex = Math.max(0, Math.min(slot.insertIndex, target.cell.items.length));
      target.cell.items.splice(insertIndex, 0, sourceUid);
      break;
    }
    case 'empty-column': {
      const target = findCellByPath(cloned, targetPath);
      if (target) {
        delete target.cell.rows;
        target.cell.items = [sourceUid];
      }
      break;
    }
    case 'column-edge': {
      const target = findCellByPath(cloned, targetPath);
      if (!target) {
        break;
      }
      const insertIndex = slot.direction === 'left' ? target.cellIndex : target.cellIndex + 1;
      const cellId = getGeneratedId(`${slotKey}:cell`, { generatedIds, generateId });
      target.row.cells.splice(insertIndex, 0, { id: cellId, items: [sourceUid] });
      target.row.sizes = distributeSizesWithNewColumn(target.row.sizes, insertIndex, target.row.cells.length);
      break;
    }
    case 'row-gap': {
      const rows = findRowListByPath(cloned, slot.path);
      const targetIndex = rows.findIndex((row) => row.id === slot.targetRowId);
      const insertIndex = targetIndex === -1 ? rows.length : slot.position === 'above' ? targetIndex : targetIndex + 1;
      const rowId = getGeneratedId(`${slotKey}:row`, { generatedIds, generateId });
      rows.splice(insertIndex, 0, createSingleCellRow(sourceUid, rowId, `${rowId}:cell:0`));
      break;
    }
    case 'empty-row': {
      const rowId = getGeneratedId(`${slotKey}:row`, { generatedIds, generateId });
      cloned.rows.push(createSingleCellRow(sourceUid, rowId, `${rowId}:cell:0`));
      break;
    }
    case 'item-edge': {
      if (!targetItemUid) {
        break;
      }
      const target = findCellByPath(cloned, targetPath);
      if (!target?.cell.items) {
        break;
      }
      const targetIndex = target.cell.items.indexOf(targetItemUid);
      if (targetIndex === -1) {
        break;
      }

      const rows: GridRowV2[] = [];
      target.cell.items.forEach((itemUid, index) => {
        if (index === targetIndex) {
          const rowId = getGeneratedId(`${slotKey}:target-row`, { generatedIds, generateId });
          const leftItem = slot.direction === 'left' ? sourceUid : itemUid;
          const rightItem = slot.direction === 'left' ? itemUid : sourceUid;
          rows.push({
            id: rowId,
            cells: [
              { id: getGeneratedId(`${slotKey}:target-cell:0`, { generatedIds, generateId }), items: [leftItem] },
              { id: getGeneratedId(`${slotKey}:target-cell:1`, { generatedIds, generateId }), items: [rightItem] },
            ],
            sizes: [12, 12],
          });
          return;
        }

        const rowId = getGeneratedId(`${slotKey}:row:${index}`, { generatedIds, generateId });
        rows.push(createSingleCellRow(itemUid, rowId, `${rowId}:cell:0`));
      });
      delete target.cell.items;
      target.cell.rows = rows;
      break;
    }
    default:
      break;
  }

  const normalized = normalizeGridLayout({ layout: cloned });
  if (sourcePosition && isSameGridLayout(normalized, original)) {
    return original;
  }
  return normalized;
};

export const isSameGridLayout = (a: GridLayoutV2, b: GridLayoutV2): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export interface SimulateLayoutOptions {
  slot: LayoutSlot;
  sourceUid: string;
  layout: GridLayoutData;
  generateRowId?: () => string;
  generatedIds?: Map<string, string>;
  generateId?: (key: string) => string;
}

export const simulateLayoutForSlot = ({
  slot,
  sourceUid,
  layout,
  generateRowId,
  generatedIds,
  generateId,
}: SimulateLayoutOptions): GridLayoutData => {
  if (layout.layout || slot.type === 'item-edge' || ('path' in slot && slot.path?.length)) {
    const nextLayout = simulateGridLayoutForSlot({
      slot,
      sourceUid,
      layout,
      generateRowId,
      generatedIds,
      generateId,
    });
    return projectLayoutToLegacyRows(nextLayout);
  }

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
