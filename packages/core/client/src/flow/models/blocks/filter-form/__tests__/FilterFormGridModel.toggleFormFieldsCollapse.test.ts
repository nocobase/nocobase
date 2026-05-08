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
import { FilterFormCollapseActionModel } from '../FilterFormCollapseActionModel';
import { FilterFormGridModel } from '../FilterFormGridModel';

describe('FilterFormGridModel.toggleFormFieldsCollapse', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ FilterFormGridModel, FilterFormCollapseActionModel });
  });

  const createGridModel = () => {
    const model = engine.createModel<FilterFormGridModel>({
      uid: 'filter-grid-shared',
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
    return model;
  };

  const createCollapseActionModel = (gridModel: FilterFormGridModel, flowSettingsEnabled = false) => {
    const model = engine.createModel<FilterFormCollapseActionModel>({
      uid: `collapse-action-${flowSettingsEnabled ? 'settings' : 'runtime'}`,
      use: 'FilterFormCollapseActionModel',
      stepParams: {
        collapseSettings: {
          toggle: {
            collapsedRows: 1,
          },
          defaultCollapsed: {
            value: true,
          },
        },
      },
      structure: {} as any,
    });
    Object.assign(model.context as any, {
      flowSettingsEnabled,
      filterFormGridModel: gridModel,
    });
    return model;
  };

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
    const model = createGridModel();

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

  it('always expands the grid in flow settings mode even if defaultCollapsed is enabled', () => {
    const gridModel = createGridModel();
    gridModel.toggleFormFieldsCollapse(true, 1);

    const collapseActionModel = createCollapseActionModel(gridModel, true);
    collapseActionModel.onMount();

    expect(projectLayoutToLegacyRows(gridModel.getGridLayout()).rows).toEqual({
      first: [['field-1']],
      second: [['field-2']],
      third: [['field-3']],
    });
    expect(gridModel.props.rows).toEqual({
      first: [['field-1']],
      second: [['field-2']],
      third: [['field-3']],
    });
  });

  it('does not collapse the grid from collapse settings while flow settings are enabled', async () => {
    const gridModel = createGridModel();
    const collapseActionModel = createCollapseActionModel(gridModel, true);
    const collapseFlow = collapseActionModel.getFlow('collapseSettings');
    expect(collapseFlow).toBeDefined();
    const defaultCollapsedStep = collapseFlow.steps.defaultCollapsed as any;
    const toggleStep = collapseFlow.steps.toggle as any;

    defaultCollapsedStep.beforeParamsSave({ model: collapseActionModel }, { value: true });
    await toggleStep.handler({ model: collapseActionModel }, { collapsedRows: 1 });

    expect(projectLayoutToLegacyRows(gridModel.getGridLayout()).rows).toEqual({
      first: [['field-1']],
      second: [['field-2']],
      third: [['field-3']],
    });
  });
});
