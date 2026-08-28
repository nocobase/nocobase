/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  displayBindings: [] as Array<{
    model: string;
    config: {
      when?: (ctx: any, fieldInstance: any) => boolean;
    };
  }>,
  editableBindings: [] as Array<unknown>,
  filterableBindings: [] as Array<{
    model: string;
    config: {
      when?: (ctx: any, fieldInstance: any) => boolean;
    };
  }>,
  flows: [] as Array<any>,
}));

vi.mock('@nocobase/client-v2', () => ({
  FieldModel: class FieldModel {
    static registerFlow(flow: unknown) {
      mocks.flows.push(flow);
    }
  },
  getDisplayNumber: ({ value }: { value: unknown }) => String(value ?? ''),
  resolveDynamicNamePath: (path: unknown) => path,
}));

vi.mock('@nocobase/flow-engine', () => ({
  DisplayItemModel: {
    bindModelToInterface: (model: string, _interfaces: string[], config: any) => {
      mocks.displayBindings.push({ model, config });
    },
  },
  EditableItemModel: {
    bindModelToInterface: (...args: unknown[]) => {
      mocks.editableBindings.push(args);
    },
  },
  FilterableItemModel: {
    bindModelToInterface: (model: string, _interfaces: string[], config: any) => {
      mocks.filterableBindings.push({ model, config });
    },
  },
}));

vi.mock('@nocobase/evaluators/client', () => ({
  evaluators: {
    get: () => ({
      evaluate: () => null,
    }),
  },
}));

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
}));

describe('FormulaFieldModel bindings', () => {
  it('registers display, filterable and settings conditions by formula data type', async () => {
    await import('../models/FormulaFieldModel');

    expect(mocks.editableBindings).toHaveLength(1);
    expect(mocks.flows[0].steps.format.hideInSettings({ collectionField: { dataType: 'double' } })).toBe(false);
    expect(mocks.flows[0].steps.format.hideInSettings({ collectionField: { dataType: 'string' } })).toBe(true);
    expect(mocks.flows[0].steps.dateFormat.hideInSettings({ collectionField: { dataType: 'date' } })).toBe(false);
    expect(mocks.flows[0].steps.dateFormat.hideInSettings({ collectionField: { dataType: 'integer' } })).toBe(true);

    const checkboxDisplay = mocks.displayBindings.find((binding) => binding.model === 'DisplayCheckboxFieldModel');
    const dateDisplay = mocks.displayBindings.find((binding) => binding.model === 'DisplayDateTimeFieldModel');
    const textDisplay = mocks.displayBindings.find((binding) => binding.model === 'DisplayTextFieldModel');
    const numberDisplay = mocks.displayBindings.find((binding) => binding.model === 'DisplayNumberFieldModel');

    expect(checkboxDisplay?.config.when?.({}, { type: 'formula', dataType: 'boolean' })).toBe(true);
    expect(checkboxDisplay?.config.when?.({}, { type: 'formula', dataType: 'string' })).toBe(false);
    expect(checkboxDisplay?.config.when?.({}, { type: 'checkbox', dataType: 'string' })).toBe(true);
    expect(dateDisplay?.config.when?.({}, { type: 'formula', dataType: 'date' })).toBe(true);
    expect(dateDisplay?.config.when?.({}, { type: 'date', dataType: 'string' })).toBe(true);
    expect(textDisplay?.config.when?.({}, { type: 'formula', dataType: 'string' })).toBe(true);
    expect(textDisplay?.config.when?.({}, { type: 'input', dataType: 'boolean' })).toBe(true);
    expect(numberDisplay?.config.when?.({}, { type: 'formula', dataType: 'integer' })).toBe(true);
    expect(numberDisplay?.config.when?.({}, { type: 'formula', dataType: 'string' })).toBe(false);
    expect(numberDisplay?.config.when?.({}, { type: 'number', dataType: 'string' })).toBe(true);

    const formulaFilter = mocks.filterableBindings.find((binding) => binding.model === 'FormulaFieldModel');
    const inputFilter = mocks.filterableBindings.find((binding) => binding.model === 'InputFieldModel');
    const dateFilter = mocks.filterableBindings.find((binding) => binding.model === 'DateTimeFilterFieldModel');
    const checkboxFilter = mocks.filterableBindings.find((binding) => binding.model === 'CheckboxFieldModel');

    expect(formulaFilter?.config.when?.({ flags: { isInSetDefaultValueDialog: true } }, {})).toBe(true);
    expect(formulaFilter?.config.when?.({ flags: { isInFilterFormBlock: true } }, {})).toBe(false);
    expect(inputFilter?.config.when?.({ flags: { isInFilterAction: true } }, { dataType: 'string' })).toBe(true);
    expect(inputFilter?.config.when?.({ flags: { isInFilterAction: true } }, { dataType: 'date' })).toBe(false);
    expect(dateFilter?.config.when?.({ flags: { isInFilterAction: true } }, { dataType: 'date' })).toBe(true);
    expect(checkboxFilter?.config.when?.({ flags: { isInFilterAction: true } }, { dataType: 'boolean' })).toBe(true);
  });
});
