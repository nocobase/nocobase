/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EMPTY_COLUMN_UID, FlowEngine } from '@nocobase/flow-engine';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GridModel } from '../GridModel';

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
  container.setAttribute('data-grid-root', '');
  const row = document.createElement('div');
  row.setAttribute('data-grid-row-id', 'row-1');
  row.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'row-1' }]));
  container.appendChild(row);

  const col = document.createElement('div');
  col.setAttribute('data-grid-column-row-id', 'row-1');
  col.setAttribute('data-grid-column-index', '0');
  col.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'row-1', cellId: 'row-1:cell:0' }]));
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

  it('highlights the target row and column while dragging an item', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-drag-preview-overlay',
      props: {},
      structure: {} as any,
    });
    const container = createGridContainer();
    (model.gridContainerRef as any).current = container;

    (model as any).dragState = {
      sourceUid: 'item-2',
      snapshot: {
        rows: { 'row-1': [['item-1']] },
        sizes: { 'row-1': [24] },
      },
      slots: [],
      containerEl: container,
      containerRect: { top: 0, left: 0, width: 480, height: 280 },
      activeSlotKey: null,
      previewLayout: undefined,
      refreshTimer: null,
      generatedIds: new Map(),
    };

    (model as any).applyPreview({
      type: 'column',
      rowId: 'row-1',
      columnIndex: 0,
      insertIndex: 1,
      position: 'after',
      rect: { top: 100, left: 20, width: 440, height: 40 },
      path: [{ rowId: 'row-1', cellId: 'row-1:cell:0' }],
    });

    expect(model.props.dragPreviewOverlay).toMatchObject({
      row: { top: 20, left: 20, width: 440, height: 120 },
      column: { top: 20, left: 20, width: 440, height: 120 },
    });
  });

  it('shows resize preview for the current cell and affected neighbor', () => {
    const itemA = engine.createModel({ use: 'FlowModel', uid: 'item-a' });
    const itemB = engine.createModel({ use: 'FlowModel', uid: 'item-b' });
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-resize-preview',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'row-1',
              cells: [
                { id: 'cell-a', items: ['item-a'] },
                { id: 'cell-b', items: ['item-b'] },
              ],
              sizes: [10, 14],
            },
          ],
        },
      },
      structure: {} as any,
    });
    (model as any).subModels = { items: [itemA, itemB] };
    model.syncLayoutProps(model.getGridLayout());

    const container = document.createElement('div');
    const root = document.createElement('div');
    root.setAttribute('data-grid-root', '');
    const row = document.createElement('div');
    row.setAttribute('data-grid-row-id', 'row-1');
    row.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'row-1' }]));
    const cellA = document.createElement('div');
    cellA.setAttribute('data-grid-column-row-id', 'row-1');
    cellA.setAttribute('data-grid-column-index', '0');
    cellA.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'row-1', cellId: 'cell-a' }]));
    const cellB = document.createElement('div');
    cellB.setAttribute('data-grid-column-row-id', 'row-1');
    cellB.setAttribute('data-grid-column-index', '1');
    cellB.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'row-1', cellId: 'cell-b' }]));
    row.append(cellA, cellB);
    root.appendChild(row);
    container.appendChild(root);

    mockRect(root, { top: 100, left: 50, width: 480, height: 120 });
    mockRect(row, { top: 110, left: 60, width: 460, height: 80 });
    mockRect(cellA, { top: 110, left: 60, width: 190, height: 80 });
    mockRect(cellB, { top: 110, left: 250, width: 270, height: 80 });
    (model.gridContainerRef as any).current = container;
    model.onMount();

    model.emitter.emit('onResizePreviewStart', { direction: 'right', model: itemA });

    expect(model.props.resizePreviewOverlay).toMatchObject({
      row: { top: 10, left: 10, width: 460, height: 80 },
      currentCell: { top: 10, left: 10, width: 190, height: 80 },
      affectedCell: { top: 10, left: 200, width: 270, height: 80 },
      guideLine: { top: 10, left: 200, width: 2, height: 80 },
      direction: 'right',
      currentSize: 10,
      affectedSize: 14,
    });

    model.emitter.emit('onResizePreviewEnd');

    expect(model.props.resizePreviewOverlay).toBeNull();
  });

  it('uses the empty column width and aligns the resize guide to its boundary', () => {
    const itemA = engine.createModel({ use: 'FlowModel', uid: 'item-a' });
    const itemB = engine.createModel({ use: 'FlowModel', uid: 'item-b' });
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-resize-empty-preview',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'row-1',
              cells: [
                { id: 'cell-a', items: ['item-a'] },
                { id: 'cell-empty', items: [EMPTY_COLUMN_UID] },
                { id: 'cell-b', items: ['item-b'] },
              ],
              sizes: [8, 10, 6],
            },
          ],
        },
      },
      structure: {} as any,
    });
    (model as any).subModels = { items: [itemA, itemB] };
    model.syncLayoutProps(model.getGridLayout());

    const container = document.createElement('div');
    const root = document.createElement('div');
    root.setAttribute('data-grid-root', '');
    const row = document.createElement('div');
    row.setAttribute('data-grid-row-id', 'row-1');
    row.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'row-1' }]));
    const cellA = document.createElement('div');
    cellA.setAttribute('data-grid-column-row-id', 'row-1');
    cellA.setAttribute('data-grid-column-index', '0');
    cellA.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'row-1', cellId: 'cell-a' }]));
    const cellB = document.createElement('div');
    cellB.setAttribute('data-grid-column-row-id', 'row-1');
    cellB.setAttribute('data-grid-column-index', '2');
    cellB.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'row-1', cellId: 'cell-b' }]));
    row.append(cellA, cellB);
    root.appendChild(row);
    container.appendChild(root);

    mockRect(root, { top: 100, left: 50, width: 520, height: 120 });
    mockRect(row, { top: 110, left: 60, width: 480, height: 80 });
    mockRect(cellA, { top: 110, left: 60, width: 160, height: 80 });
    mockRect(cellB, { top: 110, left: 430, width: 130, height: 80 });
    (model.gridContainerRef as any).current = container;
    model.onMount();

    model.emitter.emit('onResizePreviewStart', { direction: 'right', model: itemA });

    expect(model.props.resizePreviewOverlay?.cells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'empty',
          rect: { top: 10, left: 170, width: 200, height: 80 },
          size: 10,
        }),
      ]),
    );
    expect(model.props.resizePreviewOverlay?.guideLine).toMatchObject({ top: 10, left: 170, width: 2, height: 80 });

    model.emitter.emit('onResizeEnd');

    expect(model.props.resizePreviewOverlay).toBeNull();
  });
});
