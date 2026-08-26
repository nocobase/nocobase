/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { GridModel } from '../GridModel';

describe('GridModel resize layout', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ GridModel });
  });

  it('updates v2 layout sizes during resize so the saved layout keeps the new width', () => {
    const itemA = engine.createModel({ use: 'FlowModel', uid: 'a' });
    const itemB = engine.createModel({ use: 'FlowModel', uid: 'b' });
    const model = engine.createModel<GridModel>({
      uid: 'grid-resize-layout',
      use: 'GridModel',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'rowA',
              cells: [
                { id: 'cellA', items: ['a'] },
                { id: 'cellB', items: ['b'] },
              ],
              sizes: [12, 12],
            },
          ],
        },
      },
      structure: {} as any,
    });
    (model as any).subModels = { items: [itemA, itemB] };
    model.syncLayoutProps(model.getGridLayout());

    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      value: 240,
    });
    (model.gridContainerRef as any).current = container;
    model.onMount();

    model.emitter.emit('onResizeRight', { resizeDistance: 60, model: itemA });
    model.emitter.emit('onResizeEnd');

    expect(model.props.layout.rows[0].sizes).toEqual([18, 6]);
    expect(model.getStepParams('gridSettings', 'grid').layout.rows[0].sizes).toEqual([18, 6]);
  });

  it('uses the nested row container width when resizing v2 nested layouts', () => {
    const itemA = engine.createModel({ use: 'FlowModel', uid: 'a' });
    const itemB = engine.createModel({ use: 'FlowModel', uid: 'b' });
    const model = engine.createModel<GridModel>({
      uid: 'grid-resize-nested-layout',
      use: 'GridModel',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'outer',
              cells: [
                {
                  id: 'outer-cell',
                  rows: [
                    {
                      id: 'nested',
                      cells: [
                        { id: 'nested-a', items: ['a'] },
                        { id: 'nested-b', items: ['b'] },
                      ],
                      sizes: [12, 12],
                    },
                  ],
                },
              ],
              sizes: [24],
            },
          ],
        },
      },
      structure: {} as any,
    });
    (model as any).subModels = { items: [itemA, itemB] };
    model.syncLayoutProps(model.getGridLayout());

    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      value: 240,
    });
    const nestedRowParent = document.createElement('div');
    Object.defineProperty(nestedRowParent, 'clientWidth', {
      configurable: true,
      value: 120,
    });
    const nestedRowElement = document.createElement('div');
    nestedRowElement.dataset.gridRowId = 'nested';
    nestedRowElement.dataset.gridPath = JSON.stringify([{ rowId: 'outer', cellId: 'outer-cell' }, { rowId: 'nested' }]);
    nestedRowParent.appendChild(nestedRowElement);
    container.appendChild(nestedRowParent);
    (model.gridContainerRef as any).current = container;
    model.onMount();

    model.emitter.emit('onResizeRight', { resizeDistance: 30, model: itemA });
    model.emitter.emit('onResizeEnd');

    const nestedRow = model.props.layout.rows[0].cells[0].rows![0];
    expect(nestedRow.sizes).toEqual([18, 6]);
  });
});
