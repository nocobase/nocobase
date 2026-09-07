/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, waitFor, cleanup } from '@testing-library/react';
import { Form, Input } from 'antd';
import { afterEach, expect, it, vi } from 'vitest';
import { FlowEngine, SingleRecordResource } from '@nocobase/flow-engine';
import { generateFlowModelRdFromToken } from '@nocobase/utils/client';
import { CreateFormModel, EditFormModel, FormGridModel, FormItemModel, FormComponent } from '../../../..';
import { fieldLinkageRules, linkageAssignField } from '../../../../actions/linkageRules';

afterEach(cleanup);

it.each([
  { use: 'CreateFormModel', mode: 'default', expected: 'STAFF-001' },
  { use: 'EditFormModel', mode: 'default', expected: '' },
  { use: 'EditFormModel', mode: 'override', expected: 'STAFF-001' },
])('$use applies $mode linkage after a delayed popup variable response', async ({ use, mode, expected }) => {
  const engine = new FlowEngine();
  engine.registerModels({ CreateFormModel, EditFormModel, FormGridModel, FormItemModel });
  engine.registerActions({ fieldLinkageRules, linkageAssignField });
  engine.context.dataSourceManager.getDataSource('main').addCollection({
    name: 't1_user', filterTargetKey: 'id', fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'staffseq', type: 'string', interface: 'input' },
      { name: 'staffname', type: 'string', interface: 'input' },
    ],
  });
  const form = engine.createModel<CreateFormModel | EditFormModel>({
    uid: 'popup-form', use,
    stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 't1_user', filterByTk: 1 } } },
    subModels: { grid: { uid: 'popup-grid', use: 'FormGridModel', subModels: { items: [{
      uid: 'staffname-field', use: 'FormItemModel', props: { name: 'staffname' },
      stepParams: { fieldSettings: { init: { dataSourceKey: 'main', collectionName: 't1_user', fieldPath: 'staffname' } } },
    }] } } },
  });
  const configured = '{{ ctx.popup.record.staffseq }}';
  const rules = { value: [{ key: 'rule', title: 'Rule', enable: true, condition: { logic: '$and', items: [] },
    actions: [{ key: 'assign', name: 'linkageAssignField', params: { value: [{ key: 'field', enable: true,
      mode, condition: { logic: '$and', items: [] }, targetPath: 'staffname', value: configured }] } }] }] };
  form.setStepParams('eventSettings', 'linkageRules', rules);
  const saved = JSON.parse(JSON.stringify(form.serialize()));
  expect(saved.subModels.grid.stepParams.eventSettings.linkageRules).toEqual(rules);
  expect(saved.stepParams.eventSettings?.linkageRules).toBeUndefined();

  const token = `test.${Buffer.from(JSON.stringify({ userId: 2, signInTime: 'member-form' })).toString('base64url')}.sig`;
  type Item = { id: string; rd: string; template: unknown; contextParams: unknown };
  let resolveResponse: (() => void) | undefined;
  const responseReady = new Promise<void>((resolve) => { resolveResponse = resolve; });
  const request = vi.fn(async ({ data }: { data: { values: { batch: Item[] } } }) => {
    const batch = data.values.batch;
    expect(batch[0].rd).toBe(generateFlowModelRdFromToken(form.uid, token));
    expect(batch[0].contextParams).toEqual({ 'popup.record': { collection: 't1_user', dataSourceKey: 'main', filterByTk: '1' } });
    await responseReady;
    return { data: { data: { results: batch.map((item) => ({ id: item.id,
      data: JSON.parse(JSON.stringify(item.template).replaceAll(configured, 'STAFF-001')) })) } } };
  });
  engine.context.defineProperty('api', { value: { auth: { token, role: 'member' }, request } });
  form.context.defineProperty('popup', { value: { record: { id: 1 } }, resolveOnServer: true,
    meta: { type: 'object', buildVariablesParams: () => ({ record: { collection: 't1_user', dataSourceKey: 'main', filterByTk: '1' } }) } });
  const resource = form.resource as SingleRecordResource;
  resource.setData(use === 'EditFormModel' ? { id: 1, staffname: null } : {});
  function View() {
    form.useHooksBeforeRender();
    return <FormComponent model={form}><Form.Item name="staffname"><Input aria-label="staffname" /></Form.Item></FormComponent>;
  }
  const view = render(<View />);
  try {
    form.formValueRuntime?.mount({ sync: true });
    // Simulate the field mounting, without involving the page layout and field-renderer plugins.
    engine.emitter.emit('model:mounted', { model: form.subModels.grid.subModels.items[0] });
    let pending: Promise<unknown> | undefined;
    await act(async () => { pending = form.applyFlow('eventSettings'); });
    await waitFor(() => expect(request).toHaveBeenCalled());
    await act(async () => { resolveResponse?.(); await pending; });
    if (mode === 'default') {
      // Server resolution succeeded even when edit-mode default rules intentionally do not write existing records.
      expect(form.subModels.grid.subModels.items[0].props.initialValue).toBe('STAFF-001');
    }
    await waitFor(() => expect((screen.getByLabelText('staffname') as HTMLInputElement).value).toBe(expected));
    expect(form.form.getFieldValue('staffname')).toBe(expected || null);
  } finally {
    resolveResponse?.();
    view.unmount();
    form.formValueRuntime?.dispose();
  }
});
