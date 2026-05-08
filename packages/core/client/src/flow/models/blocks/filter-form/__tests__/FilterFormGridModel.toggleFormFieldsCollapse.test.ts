/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { FlowEngine, projectLayoutToLegacyRows } from '@nocobase/flow-engine';
import '@nocobase/client';
import { GRID_FLOW_KEY, GRID_STEP } from '../../../base';
import { FilterFormGridModel } from '../FilterFormGridModel';

describe('FilterFormGridModel.toggleFormFieldsCollapse', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ FilterFormGridModel });
  });

  it('uses rowOrder from the full layout when collapsing after reorder', () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-collapse-order',
      use: 'FilterFormGridModel',
      props: {
        rows: {
          second: [['field-2']],
          first: [['field-1']],
          third: [['field-3']],
        },
        rowOrder: ['first', 'second', 'third'],
      },
      structure: {} as any,
    });
    (model as any).subModels = {
      items: [
        engine.createModel({ use: 'FlowModel', uid: 'field-1' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-2' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-3' }),
      ],
    };

    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      rows: {
        second: [['field-2']],
        first: [['field-1']],
        third: [['field-3']],
      },
      rowOrder: ['first', 'second', 'third'],
    });

    model.toggleFormFieldsCollapse(true, 1);

    expect(model.props.rows).toEqual({
      first: [['field-1']],
    });
    expect(model.props.rowOrder).toEqual(['first', 'second', 'third']);
  });

  it('collapses stacked items inside the same cell by visible field rows', () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-collapse-stacked-cell',
      use: 'FilterFormGridModel',
      props: {
        rows: {
          first: [['field-1', 'field-2', 'field-3']],
        },
        rowOrder: ['first'],
      },
      structure: {} as any,
    });
    (model as any).subModels = {
      items: [
        engine.createModel({ use: 'FlowModel', uid: 'field-1' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-2' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-3' }),
      ],
    };

    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      rows: {
        first: [['field-1', 'field-2', 'field-3']],
      },
      rowOrder: ['first'],
    });

    model.toggleFormFieldsCollapse(true, 1);

    expect(model.props.rows).toEqual({
      first: [['field-1']],
    });
    expect(model.props.rowOrder).toEqual(['first']);

    model.toggleFormFieldsCollapse(false, 1);

    expect(model.props.rows).toEqual({
      first: [['field-1', 'field-2', 'field-3']],
    });
    expect(model.props.rowOrder).toEqual(['first']);
  });

  it('updates render layout when collapsing a v2 layout', () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-collapse-v2',
      use: 'FilterFormGridModel',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'first',
              cells: [{ id: 'first-cell', items: ['field-1', 'field-2', 'field-3'] }],
              sizes: [24],
            },
          ],
        },
      },
      structure: {} as any,
    });
    (model as any).subModels = {
      items: [
        engine.createModel({ use: 'FlowModel', uid: 'field-1' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-2' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-3' }),
      ],
    };

    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      layout: model.props.layout,
    });

    model.toggleFormFieldsCollapse(true, 1);

    expect(model.props.rows).toEqual({
      first: [['field-1']],
    });
    expect(model.props.layout.rows[0].cells[0].items).toEqual(['field-1']);

    model.toggleFormFieldsCollapse(false, 1);

    expect(model.props.rows).toEqual({
      first: [['field-1', 'field-2', 'field-3']],
    });
    expect(model.props.layout.rows[0].cells[0].items).toEqual(['field-1', 'field-2', 'field-3']);
  });

  it('keeps nested columns inside the first visible row when collapsing a v2 layout', () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-collapse-nested-v2',
      use: 'FilterFormGridModel',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'first',
              cells: [
                {
                  id: 'first-cell',
                  rows: [
                    {
                      id: 'first-nested-row',
                      cells: [
                        { id: 'first-nested-cell-1', items: ['field-1'] },
                        { id: 'first-nested-cell-2', items: ['field-2'] },
                      ],
                      sizes: [12, 12],
                    },
                  ],
                },
              ],
              sizes: [24],
            },
            {
              id: 'second',
              cells: [{ id: 'second-cell', items: ['field-3'] }],
              sizes: [24],
            },
          ],
        },
      },
      structure: {} as any,
    });
    (model as any).subModels = {
      items: [
        engine.createModel({ use: 'FlowModel', uid: 'field-1' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-2' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-3' }),
      ],
    };

    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      layout: model.props.layout,
    });

    model.toggleFormFieldsCollapse(true, 1);

    const collapsedNestedRow = model.props.layout.rows[0].cells[0].rows?.[0];
    expect(collapsedNestedRow?.cells.map((cell) => cell.items)).toEqual([['field-1'], ['field-2']]);
    expect(collapsedNestedRow?.sizes).toEqual([12, 12]);
    expect(model.props.layout.rows).toHaveLength(1);

    model.toggleFormFieldsCollapse(false, 1);

    expect(model.props.layout.rows).toHaveLength(2);
    expect(model.props.layout.rows[0].cells[0].rows?.[0].cells.map((cell) => cell.items)).toEqual([
      ['field-1'],
      ['field-2'],
    ]);
  });

  it('restores the persisted full layout when current props rows were already truncated', () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-collapse-restore',
      use: 'FilterFormGridModel',
      props: {
        rows: {
          first: [['field-1']],
        },
        rowOrder: ['first'],
      },
      structure: {} as any,
    });
    (model as any).subModels = {
      items: [
        engine.createModel({ use: 'FlowModel', uid: 'field-1' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-2' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-3' }),
      ],
    };

    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      rows: {
        first: [['field-1']],
        second: [['field-2']],
        third: [['field-3']],
      },
      rowOrder: ['first', 'second', 'third'],
    });

    model.toggleFormFieldsCollapse(false, 1);

    expect(model.props.rows).toEqual({
      first: [['field-1']],
      second: [['field-2']],
      third: [['field-3']],
    });
    expect(model.props.rowOrder).toEqual(['first', 'second', 'third']);
  });

  it('does not reinsert collapsed items when the render layout is normalized again', () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-collapse-visible-item-uids',
      use: 'FilterFormGridModel',
      props: {
        rows: {
          first: [['field-1']],
          second: [['field-2']],
          third: [['field-3']],
        },
        rowOrder: ['first', 'second', 'third'],
      },
      structure: {} as any,
    });
    (model as any).subModels = {
      items: [
        engine.createModel({ use: 'FlowModel', uid: 'field-1' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-2' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-3' }),
      ],
    };

    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      rows: {
        first: [['field-1']],
        second: [['field-2']],
        third: [['field-3']],
      },
      rowOrder: ['first', 'second', 'third'],
    });

    model.toggleFormFieldsCollapse(true, 1);

    expect(projectLayoutToLegacyRows(model.getGridLayout()).rows).toEqual({
      first: [['field-1']],
    });

    model.toggleFormFieldsCollapse(false, 1);

    expect(projectLayoutToLegacyRows(model.getGridLayout()).rows).toEqual({
      first: [['field-1']],
      second: [['field-2']],
      third: [['field-3']],
    });
  });

  it('keeps the persisted layout intact when resetRows runs during collapsed mode', () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-collapse-reset-rows',
      use: 'FilterFormGridModel',
      props: {
        rows: {
          first: [['field-1']],
          second: [['field-2']],
          third: [['field-3']],
        },
        rowOrder: ['first', 'second', 'third'],
      },
      structure: {} as any,
    });
    (model as any).subModels = {
      items: [
        engine.createModel({ use: 'FlowModel', uid: 'field-1' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-2' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-3' }),
      ],
    };

    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      rows: {
        first: [['field-1']],
        second: [['field-2']],
        third: [['field-3']],
      },
      rowOrder: ['first', 'second', 'third'],
    });

    model.toggleFormFieldsCollapse(true, 1);
    model.resetRows(true);

    const persistedLayout = model.getStepParams(GRID_FLOW_KEY, GRID_STEP).layout;
    const persistedRows = projectLayoutToLegacyRows(persistedLayout).rows;
    const persistedItems = Object.values(persistedRows).flat().flat().sort();
    expect(persistedItems).toEqual(['field-1', 'field-2', 'field-3']);
    expect(projectLayoutToLegacyRows(model.getGridLayout()).rows).toEqual({
      first: [['field-1']],
    });
  });

  it('uses the full layout for flow-settings layout reads during collapsed mode', () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-collapse-settings-full-layout',
      use: 'FilterFormGridModel',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'first',
              cells: [{ id: 'first-cell', items: ['field-1'] }],
              sizes: [24],
            },
            {
              id: 'second',
              cells: [
                { id: 'second-cell-1', items: ['field-2'] },
                { id: 'second-cell-2', items: ['field-3'] },
              ],
              sizes: [12, 12],
            },
          ],
        },
      },
      structure: {} as any,
    });
    (model as any).subModels = {
      items: [
        engine.createModel({ use: 'FlowModel', uid: 'field-1' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-2' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-3' }),
      ],
    };
    (model.context as any).flowSettingsEnabled = true;

    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      layout: model.props.layout,
    });

    model.toggleFormFieldsCollapse(true, 1);

    expect(projectLayoutToLegacyRows((model as any).normalizeLayoutFromSource()).rows).toEqual({
      first: [['field-1']],
    });
    expect(projectLayoutToLegacyRows(model.getGridLayout()).rows).toEqual({
      first: [['field-1']],
      second: [['field-2'], ['field-3']],
    });

    model.saveGridLayout(model.getGridLayout());

    expect(projectLayoutToLegacyRows(model.getStepParams(GRID_FLOW_KEY, GRID_STEP).layout).rows).toEqual({
      first: [['field-1']],
      second: [['field-2'], ['field-3']],
    });
  });

  it('restores the latest saved full layout after editing while collapsed in flow settings', () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-collapse-settings-latest-layout',
      use: 'FilterFormGridModel',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'first',
              cells: [{ id: 'first-cell', items: ['field-1'] }],
              sizes: [24],
            },
            {
              id: 'second',
              cells: [{ id: 'second-cell', items: ['field-2'] }],
              sizes: [24],
            },
          ],
        },
      },
      structure: {} as any,
    });
    (model as any).subModels = {
      items: [
        engine.createModel({ use: 'FlowModel', uid: 'field-1' }),
        engine.createModel({ use: 'FlowModel', uid: 'field-2' }),
      ],
    };
    (model.context as any).flowSettingsEnabled = true;

    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, {
      layout: model.props.layout,
    });
    model.toggleFormFieldsCollapse(true, 1);

    const editedLayout = {
      version: 2 as const,
      rows: [
        {
          id: 'first',
          cells: [
            { id: 'first-cell-1', items: ['field-1'] },
            { id: 'first-cell-2', items: ['field-2'] },
          ],
          sizes: [12, 12],
        },
      ],
    };

    model.saveGridLayout(editedLayout);
    model.toggleFormFieldsCollapse(false, 1);

    expect(projectLayoutToLegacyRows(model.props.layout).rows).toEqual({
      first: [['field-1'], ['field-2']],
    });
  });
});
