/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GridModel, transformRowsToSingleColumn } from '../GridModel';

const createMockRect = ({ top, left, width, height }: { top: number; left: number; width: number; height: number }) => {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
};

const mockRect = (
  element: Element,
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  },
) => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => createMockRect(rect),
  });
};

const createGridContainer = () => {
  const container = document.createElement('div');
  const row = document.createElement('div');
  row.setAttribute('data-grid-row-id', 'row-1');
  container.appendChild(row);

  const col = document.createElement('div');
  col.setAttribute('data-grid-column-row-id', 'row-1');
  col.setAttribute('data-grid-column-index', '0');
  row.appendChild(col);

  const item = document.createElement('div');
  item.setAttribute('data-grid-item-row-id', 'row-1');
  item.setAttribute('data-grid-column-index', '0');
  item.setAttribute('data-grid-item-index', '0');
  item.setAttribute('data-grid-item-uid', 'item-1');
  col.appendChild(item);

  mockRect(container, { top: 0, left: 0, width: 480, height: 280 });
  mockRect(row, { top: 20, left: 20, width: 440, height: 120 });
  mockRect(col, { top: 20, left: 20, width: 440, height: 120 });
  mockRect(item, { top: 30, left: 30, width: 420, height: 100 });
  return container;
};

const createGridContainerWithEmptyColumn = () => {
  const container = document.createElement('div');
  container.setAttribute('data-grid-root', '');
  const row = document.createElement('div');
  row.setAttribute('data-grid-row-id', 'row-1');
  container.appendChild(row);

  const firstColumn = document.createElement('div');
  firstColumn.setAttribute('data-grid-column-row-id', 'row-1');
  firstColumn.setAttribute('data-grid-column-index', '0');
  row.appendChild(firstColumn);

  const item = document.createElement('div');
  item.setAttribute('data-grid-item-row-id', 'row-1');
  item.setAttribute('data-grid-column-index', '0');
  item.setAttribute('data-grid-item-index', '0');
  item.setAttribute('data-grid-item-uid', 'item-1');
  firstColumn.appendChild(item);

  const secondColumn = document.createElement('div');
  secondColumn.setAttribute('data-grid-column-row-id', 'row-1');
  secondColumn.setAttribute('data-grid-column-index', '1');
  row.appendChild(secondColumn);

  mockRect(container, { top: 0, left: 0, width: 480, height: 280 });
  mockRect(row, { top: 20, left: 20, width: 440, height: 120 });
  mockRect(firstColumn, { top: 20, left: 20, width: 220, height: 120 });
  mockRect(item, { top: 30, left: 30, width: 200, height: 100 });
  mockRect(secondColumn, { top: 20, left: 260, width: 200, height: 120 });
  return container;
};

const createProjectedMobileGridContainer = (rows: Record<string, string[][]>) => {
  const container = document.createElement('div');
  container.setAttribute('data-grid-root', '');
  mockRect(container, { top: 0, left: 0, width: 480, height: 320 });

  let top = 20;
  Object.entries(transformRowsToSingleColumn(rows)).forEach(([rowId, columns]) => {
    const row = document.createElement('div');
    row.setAttribute('data-grid-row-id', rowId);
    container.appendChild(row);

    const column = document.createElement('div');
    column.setAttribute('data-grid-column-row-id', rowId);
    column.setAttribute('data-grid-column-index', '0');
    row.appendChild(column);

    const items = columns[0] || [];
    items.forEach((itemUid, itemIndex) => {
      const item = document.createElement('div');
      item.setAttribute('data-grid-item-row-id', rowId);
      item.setAttribute('data-grid-column-index', '0');
      item.setAttribute('data-grid-item-index', String(itemIndex));
      item.setAttribute('data-grid-item-uid', itemUid);
      column.appendChild(item);
      mockRect(item, { top: top + 10 + itemIndex * 36, left: 30, width: 420, height: 32 });
    });

    mockRect(row, { top, left: 20, width: 440, height: 52 });
    mockRect(column, { top, left: 20, width: 440, height: 52 });
    top += 72;
  });

  return container;
};

const setMobileGridItems = (engine: FlowEngine, model: GridModel, itemUids: string[]) => {
  (model as any).subModels = {
    items: itemUids.map((itemUid) => engine.createModel({ use: 'FlowModel', uid: itemUid })),
  };
};

const getSavedTopLevelItemOrder = (model: GridModel) => {
  return Object.values(model.props.rows || {}).map((columns: string[][]) => columns[0]?.[0]);
};

describe('GridModel drag snapshot container', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ GridModel });
  });

  it('keeps snapshot slots available when gridContainerRef object is replaced during dragging', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-drag-ref',
      props: {
        rows: {
          'row-1': [['item-1']],
        },
        sizes: {
          'row-1': [24],
        },
      },
      structure: {} as any,
    });

    const container = createGridContainer();
    (model.gridContainerRef as any).current = container;

    model.handleDragStart({
      active: { id: 'item-1' },
      activatorEvent: { clientX: 80, clientY: 80 },
    } as any);

    expect((model as any).dragState?.slots?.length).toBeGreaterThan(0);

    model.gridContainerRef = React.createRef<HTMLDivElement>();
    (model as any).updateLayoutSnapshot();

    expect((model as any).dragState?.slots?.length).toBeGreaterThan(0);
    model.handleDragCancel({} as any);
  });

  it('filters multi-column drop slots from mobile drag snapshots', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-mobile-drag-slots',
      props: {
        rows: {
          'row-1': [['item-1'], []],
        },
        sizes: {
          'row-1': [12, 12],
        },
      },
      structure: {} as any,
    });
    model.context.defineProperty('isMobileLayout', { value: true });

    const container = createGridContainerWithEmptyColumn();
    (model.gridContainerRef as any).current = container;

    model.handleDragStart({
      active: { id: 'item-1' },
      activatorEvent: { clientX: 80, clientY: 80 },
    } as any);

    const slotTypes = ((model as any).dragState?.slots || []).map((slot) => slot.type);
    expect(slotTypes).toContain('column');
    expect(slotTypes).toContain('row-gap');
    expect(slotTypes).not.toContain('column-edge');
    expect(slotTypes).not.toContain('item-edge');
    expect(slotTypes).not.toContain('empty-column');
    model.handleDragCancel({} as any);
  });

  it('keeps empty-row slot available for the first mobile grid item', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-mobile-empty-drag-slots',
      props: {},
      structure: {} as any,
    });
    model.context.defineProperty('isMobileLayout', { value: true });

    const container = document.createElement('div');
    mockRect(container, { top: 0, left: 0, width: 480, height: 280 });
    (model.gridContainerRef as any).current = container;

    model.handleDragStart({
      active: { id: 'item-1' },
      activatorEvent: { clientX: 80, clientY: 80 },
    } as any);

    expect(((model as any).dragState?.slots || []).map((slot) => slot.type)).toEqual(['empty-row']);
    model.handleDragCancel({} as any);
  });

  it('saves mobile vertical sorting when moving the second item above the first one', () => {
    const rows = {
      'row-a': [['item-a']],
      'row-b': [['item-b']],
    };
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-mobile-sort-second-above-first',
      props: {
        rows,
        sizes: {
          'row-a': [24],
          'row-b': [24],
        },
        rowOrder: ['row-a', 'row-b'],
      },
      structure: {} as any,
    });
    model.context.defineProperty('isMobileLayout', { value: true });
    setMobileGridItems(engine, model, ['item-a', 'item-b']);
    (model as any).saveStepParams = vi.fn();

    const container = createProjectedMobileGridContainer(rows);
    (model.gridContainerRef as any).current = container;

    model.handleDragStart({
      active: { id: 'item-b' },
      activatorEvent: { clientX: 240, clientY: 118 },
    } as any);
    model.handleDragEnd({
      delta: { x: 0, y: -112 },
    } as any);

    expect(getSavedTopLevelItemOrder(model)).toEqual(['item-b', 'item-a']);
  });

  it('saves mobile vertical sorting when moving the first item below the last one', () => {
    const rows = {
      'row-a': [['item-a']],
      'row-b': [['item-b']],
      'row-c': [['item-c']],
    };
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-mobile-sort-first-below-last',
      props: {
        rows,
        sizes: {
          'row-a': [24],
          'row-b': [24],
          'row-c': [24],
        },
        rowOrder: ['row-a', 'row-b', 'row-c'],
      },
      structure: {} as any,
    });
    model.context.defineProperty('isMobileLayout', { value: true });
    setMobileGridItems(engine, model, ['item-a', 'item-b', 'item-c']);
    (model as any).saveStepParams = vi.fn();

    const container = createProjectedMobileGridContainer(rows);
    (model.gridContainerRef as any).current = container;

    model.handleDragStart({
      active: { id: 'item-a' },
      activatorEvent: { clientX: 240, clientY: 46 },
    } as any);
    model.handleDragEnd({
      delta: { x: 0, y: 184 },
    } as any);

    expect(getSavedTopLevelItemOrder(model)).toEqual(['item-b', 'item-c', 'item-a']);
  });

  it('does not filter multi-column drop slots from desktop drag snapshots', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-desktop-drag-slots',
      props: {
        rows: {
          'row-1': [['item-1'], []],
        },
        sizes: {
          'row-1': [12, 12],
        },
      },
      structure: {} as any,
    });

    const container = createGridContainerWithEmptyColumn();
    (model.gridContainerRef as any).current = container;

    model.handleDragStart({
      active: { id: 'item-1' },
      activatorEvent: { clientX: 80, clientY: 80 },
    } as any);

    const slotTypes = ((model as any).dragState?.slots || []).map((slot) => slot.type);
    expect(slotTypes).toContain('column');
    expect(slotTypes).toContain('row-gap');
    expect(slotTypes).toContain('column-edge');
    expect(slotTypes).toContain('item-edge');
    expect(slotTypes).toContain('empty-column');
    model.handleDragCancel({} as any);
  });

  it('uses native pointer position instead of scroll-adjusted drag delta', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-drag-pointer-position',
      props: {},
      structure: {} as any,
    });

    (model as any).dragState = {
      sourceUid: 'item-1',
      snapshot: { rows: {}, sizes: {} },
      slots: [],
      containerEl: null,
      containerRect: { top: 0, left: 0, width: 0, height: 0 },
      pointerOrigin: { x: 100, y: 100 },
      pointerPosition: { x: 120, y: 180 },
      activeSlotKey: null,
      previewLayout: undefined,
      refreshTimer: null,
    };

    const point = (model as any).computePointerPosition({
      delta: { x: 0, y: 600 },
      over: null,
    });

    expect(point).toEqual({ x: 120, y: 180 });
  });

  it('removes drag document listeners when dragging finishes', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-drag-cleanup',
      props: {},
      structure: {} as any,
    });
    const cleanupListeners = vi.fn();

    (model as any).dragState = {
      sourceUid: 'item-1',
      snapshot: { rows: {}, sizes: {} },
      slots: [],
      containerEl: null,
      containerRect: { top: 0, left: 0, width: 0, height: 0 },
      activeSlotKey: null,
      previewLayout: undefined,
      refreshTimer: null,
      cleanupListeners,
    };

    model.handleDragCancel({} as any);

    expect(cleanupListeners).toHaveBeenCalledOnce();
  });

  it('refreshes drag snapshot after the page scrolls during dragging', () => {
    vi.useFakeTimers();
    try {
      const model = engine.createModel<GridModel>({
        use: 'GridModel',
        uid: 'grid-drag-scroll-refresh',
        props: {},
        structure: {} as any,
      });
      const updateLayoutSnapshot = vi.fn();
      const refreshPreviewFromPointer = vi.fn();

      (model as any).dragState = {
        sourceUid: 'item-1',
        snapshot: { rows: {}, sizes: {} },
        slots: [],
        containerEl: null,
        containerRect: { top: 0, left: 0, width: 0, height: 0 },
        pointerPosition: { x: 120, y: 180 },
        activeSlotKey: null,
        previewLayout: undefined,
        refreshTimer: null,
      };
      (model as any).updateLayoutSnapshot = updateLayoutSnapshot;
      (model as any).refreshPreviewFromPointer = refreshPreviewFromPointer;

      (model as any).handleDragScroll();
      vi.advanceTimersByTime(16);

      expect(updateLayoutSnapshot).toHaveBeenCalledOnce();
      expect(refreshPreviewFromPointer).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses overlay-sized hit area when resolving drag slot', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-drag-hit-area',
      props: {},
      structure: {} as any,
    });

    model.dragOverlayConfig = {
      columnEdge: {
        right: { width: 24, offsetLeft: 8 },
      },
    } as any;

    (model as any).dragState = {
      sourceUid: 'item-1',
      snapshot: { rows: {}, sizes: {} },
      slots: [
        {
          type: 'column-edge',
          rowId: 'row-1',
          columnIndex: 0,
          direction: 'right',
          rect: { top: 100, left: 200, width: 16, height: 120 },
        },
      ],
      containerEl: null,
      containerRect: { top: 0, left: 0, width: 0, height: 0 },
      activeSlotKey: null,
      previewLayout: undefined,
      refreshTimer: null,
    };

    const resolved = (model as any).resolveDragSlot({ x: 225, y: 140 });

    expect(resolved).toMatchObject({
      type: 'column-edge',
      rowId: 'row-1',
      columnIndex: 0,
      direction: 'right',
    });
  });

  it('keeps overlay coordinates relative to grid root when outer container is scrolled', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-drag-overlay-scroll',
      props: {},
      structure: {} as any,
    });
    const container = document.createElement('div');
    container.scrollTop = 40;
    container.scrollLeft = 12;
    (model.gridContainerRef as any).current = container;

    (model as any).dragState = {
      sourceUid: 'item-1',
      snapshot: {
        rows: { 'row-1': [['item-1', 'item-2']] },
        sizes: { 'row-1': [24] },
      },
      slots: [],
      containerEl: container,
      containerRect: { top: 100, left: 50, width: 480, height: 280 },
      activeSlotKey: null,
      previewLayout: undefined,
      refreshTimer: null,
    };

    (model as any).applyPreview({
      type: 'column',
      rowId: 'row-1',
      columnIndex: 0,
      insertIndex: 1,
      position: 'after',
      rect: { top: 130, left: 90, width: 220, height: 60 },
    });

    expect(model.props.dragOverlayRect).toMatchObject({
      top: 30,
      left: 40,
      width: 220,
      height: 60,
      type: 'column',
    });
  });

  it('clears persisted drag overlay on init', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-hidden-stale-overlay',
      props: {
        dragOverlayRect: {
          top: 10,
          left: 20,
          width: 100,
          height: 40,
          type: 'column',
        },
      },
      structure: {} as any,
    });

    expect(model.props.dragOverlayRect).toBeNull();
  });

  it('omits drag overlay rect from serialized props', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-serialize-overlay',
      props: {
        rowGap: 24,
        dragOverlayRect: {
          top: 10,
          left: 20,
          width: 100,
          height: 40,
          type: 'column',
        },
      },
      structure: {} as any,
    });

    const serialized = model.serialize();

    expect(serialized.props).toMatchObject({ rowGap: 24 });
    expect(serialized.props).not.toHaveProperty('dragOverlayRect');
  });

  it('recomputes the final slot from drag end position before saving layout', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-drag-final-slot',
      props: {},
      structure: {} as any,
    });
    const applyPreview = vi.fn((slot) => {
      (model as any).dragState.previewLayout = slot
        ? {
            rows: { 'row-final': [['item-1']] },
            sizes: { 'row-final': [24] },
          }
        : undefined;
    });
    const resolveDragSlot = vi.fn(() => ({
      type: 'row-gap',
      targetRowId: 'row-final',
      position: 'below',
      rect: { top: 200, left: 20, width: 440, height: 32 },
    }));
    const saveGridLayout = vi.fn();
    const syncLayoutProps = vi.fn();
    const finishDrag = vi.fn();

    (model as any).applyPreview = applyPreview;
    (model as any).resolveDragSlot = resolveDragSlot;
    (model as any).saveGridLayout = saveGridLayout;
    (model as any).syncLayoutProps = syncLayoutProps;
    (model as any).finishDrag = finishDrag;
    (model as any).dragState = {
      sourceUid: 'item-1',
      snapshot: { rows: {}, sizes: {} },
      slots: [],
      containerEl: null,
      containerRect: { top: 0, left: 0, width: 0, height: 0 },
      pointerOrigin: { x: 100, y: 100 },
      activeSlotKey: null,
      previewLayout: undefined,
      refreshTimer: null,
      generatedIds: new Map(),
    };

    model.handleDragEnd({
      delta: { x: 30, y: 220 },
    } as any);

    expect(resolveDragSlot).toHaveBeenCalledWith({ x: 130, y: 320 });
    expect(applyPreview).toHaveBeenCalledOnce();
    expect(saveGridLayout).toHaveBeenCalledWith({
      rows: { 'row-final': [['item-1']] },
      sizes: { 'row-final': [24] },
    });
    expect(finishDrag).toHaveBeenCalledOnce();
  });
});
