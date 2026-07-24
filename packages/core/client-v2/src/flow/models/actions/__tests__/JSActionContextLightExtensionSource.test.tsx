/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import { FilterFormJSActionModel } from '../../blocks/filter-form/FilterFormJSActionModel';
import { JSFormActionModel } from '../../blocks/form/JSFormActionModel';
import { JSCollectionActionModel } from '../JSCollectionActionModel';
import { JSRecordActionModel } from '../JSRecordActionModel';
import { createActionModel, JS_ACTION_SOURCE_BINDING } from './jsActionLightExtensionTestUtils';

type ActionContextCase = {
  name: string;
  ModelClass: typeof FlowModel;
  use: string;
  code: string;
  settings: { successMessage: string };
  setup: (model: FlowModel, state: Record<string, unknown>) => void;
  expectedState: Record<string, unknown>;
  expectedMessage: string;
};

const cases: ActionContextCase[] = [
  {
    name: 'form values and refresh',
    ModelClass: JSFormActionModel,
    use: 'JSFormActionModel',
    code: `
const values = ctx.form.getFieldsValue();
ctx.__testState.formStatus = values.status;
await ctx.refresh();
ctx.message.success(ctx.settings.successMessage + ':' + values.amount);
    `,
    settings: { successMessage: 'Form approved' },
    setup: (model, state) => {
      model.context.defineProperty('form', {
        value: { getFieldsValue: () => ({ status: 'pending', amount: 30 }) },
      });
      model.context.defineProperty('blockModel', {
        value: {
          resource: {
            refresh: async () => {
              state.refreshed = true;
            },
          },
        },
      });
    },
    expectedState: { formStatus: 'pending', refreshed: true },
    expectedMessage: 'Form approved:30',
  },
  {
    name: 'selected collection rows',
    ModelClass: JSCollectionActionModel,
    use: 'JSCollectionActionModel',
    code: `
const rows = ctx.resource.getSelectedRows();
ctx.__testState.resourceRowCount = rows.length;
ctx.__testState.selectedRecordCount = ctx.selectedRecords.length;
ctx.message.success(ctx.settings.successMessage + ':' + rows.map((row) => row.id).join(','));
    `,
    settings: { successMessage: 'Batch approved' },
    setup: (model) => {
      const selectedRecords = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'pending' },
      ];
      model.context.defineProperty('resource', { value: { getSelectedRows: () => selectedRecords } });
      model.context.defineProperty('selectedRecords', { value: selectedRecords });
    },
    expectedState: { resourceRowCount: 2, selectedRecordCount: 2 },
    expectedMessage: 'Batch approved:1,2',
  },
  {
    name: 'current record and filterByTk',
    ModelClass: JSRecordActionModel,
    use: 'JSRecordActionModel',
    code: `
ctx.__testState.recordName = ctx.record.name;
ctx.__testState.filterByTk = ctx.filterByTk;
ctx.message.success(ctx.settings.successMessage + ':' + ctx.record.id);
    `,
    settings: { successMessage: 'Row approved' },
    setup: (model) => {
      model.context.defineProperty('record', { value: { id: 7, name: 'Ada', status: 'pending' } });
      model.context.defineProperty('filterByTk', { value: 7 });
    },
    expectedState: { recordName: 'Ada', filterByTk: 7 },
    expectedMessage: 'Row approved:7',
  },
  {
    name: 'filter form values',
    ModelClass: FilterFormJSActionModel,
    use: 'FilterFormJSActionModel',
    code: `
const values = ctx.form.getFieldsValue();
ctx.__testState.filterStatus = values.status;
ctx.message.success(ctx.settings.successMessage + ':' + values.status);
    `,
    settings: { successMessage: 'Filter read' },
    setup: (model) => {
      model.context.defineProperty('form', { value: { getFieldsValue: () => ({ status: 'pending' }) } });
    },
    expectedState: { filterStatus: 'pending' },
    expectedMessage: 'Filter read:pending',
  },
];

describe('JS Action context light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it.each(cases)('resolves $name for $use', async (testCase) => {
    const resolve = vi.fn(() => ({ code: testCase.code, version: 'v2', settings: testCase.settings }));
    RunJSSourceResolverRegistry.registerResolver({ sourceMode: 'light-extension', resolve });
    const { model, state, message } = createActionModel<FlowModel>({
      ModelClass: testCase.ModelClass,
      use: testCase.use,
      uid: `${testCase.use}-run`,
    });
    testCase.setup(model, state);

    await model.applyFlow('clickSettings');

    expect(state).toMatchObject(testCase.expectedState);
    expect(message.success).toHaveBeenCalledWith(testCase.expectedMessage);
    expect(model.props.loading).toBe(false);
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceBinding: JS_ACTION_SOURCE_BINDING,
        context: expect.objectContaining({
          ownerKind: 'flowModel.actionSettings',
          ownerLocator: expect.objectContaining({ use: testCase.use }),
        }),
      }),
    );
  });
});
