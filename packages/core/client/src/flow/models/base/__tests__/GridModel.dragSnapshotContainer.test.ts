/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
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
  });
});
