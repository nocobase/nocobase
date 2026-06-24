/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlowRuntimeContext } from '../../flowContext';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';
import type { FlowSettingsBeforeParamsSaveStructured } from '../../types';
import { formatRunJSSettingsJSONTextAreaValue, RunJSSettingsJSONTextArea } from '../adapters';
import { normalizeRunJSSettingsSchema } from '../normalize';
import { runtimeSettingsRegistry } from '../registry';
import {
  buildRunJSSettingsStepDefinitions,
  extractRunJSSettingsSchemaFromCode,
  RUNJS_SETTINGS_CONFIGURE_STEP_KEY,
  RUNJS_SETTINGS_FLOW_KEY,
} from '../steps';
import { toFlowUISchema } from '../toFlowUISchema';
import {
  activeFieldKeysForItem,
  applyDefaults,
  mergeActiveValuesPreserveInactiveUnknown,
  normalizeJsonTextValue,
  normalizeSettingDraftValueByFieldType,
  normalizeSettingValueByFieldType,
} from '../values';

describe('runjs settings values', () => {
  afterEach(() => {
    cleanup();
  });

  it('normalizes supported schema and rejects invalid public schema shapes', () => {
    const schema = normalizeRunJSSettingsSchema({
      version: 1,
      fields: {
        title: { type: 'string', default: 'Sales' },
        chartType: {
          type: 'select',
          options: [
            { label: 'Bar', value: 'bar' },
            { label: 'Pie', value: 'pie' },
          ],
        },
        field: { type: 'collectionField', collection: '$collection' },
      },
      order: ['chartType', 'title'],
    });

    expect(Object.keys(schema.fields)).toEqual(['title', 'chartType', 'field']);
    expect(schema.order).toEqual(['chartType', 'title']);
    expect(() =>
      normalizeRunJSSettingsSchema({
        fields: {
          bad: { type: 'select', options: [{ label: 'Object', value: { nested: true } }] },
        },
      }),
    ).toThrow(/value must be/);
    expect(() =>
      normalizeRunJSSettingsSchema({
        fields: {
          field: { type: 'collectionField' },
        },
      }),
    ).toThrow(/collection is required/);
  });

  it('normalizes direct settings objects and maps one config item to ui schema', () => {
    const schema = normalizeRunJSSettingsSchema({
      basic: {
        type: 'object',
        title: 'Basic',
        properties: {
          title: { type: 'string', title: 'Title', default: 'Sales' },
          status: {
            type: 'select',
            title: 'Status',
            default: 'active',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Paused', value: 'paused' },
            ],
          },
        },
      },
      metrics: {
        type: 'object',
        title: 'Metrics',
        properties: {
          amount: { type: 'number', title: 'Amount', default: 10 },
          target: { type: 'number', title: 'Target', default: 20 },
        },
      },
      accentColor: { type: 'color', title: 'Accent color', default: '#1677ff' },
    });

    expect(Object.keys(schema.fields)).toEqual(['basic', 'metrics', 'accentColor']);
    expect(activeFieldKeysForItem(schema, 'metrics')).toEqual(['metrics']);
    expect(
      toFlowUISchema(schema, { fieldKeys: activeFieldKeysForItem(schema, 'basic') }).basic.properties,
    ).toHaveProperty('title');
    expect(applyDefaults(schema)).toEqual({
      basic: { title: 'Sales', status: 'active' },
      metrics: { amount: 10, target: 20 },
      accentColor: '#1677FF',
    });
    expect(() =>
      normalizeRunJSSettingsSchema({
        basic: { type: 'object', properties: { bad: { type: 'select' } } },
      }),
    ).toThrow(/options is required/);
  });

  it('saves one runtime settings item without dropping other config values', async () => {
    class TestFlowModel extends FlowModel {}

    const engine = new FlowEngine();
    const model = new TestFlowModel({ uid: 'model-runjs-settings-items-save', flowEngine: engine });
    const previousParams = {
      basic: {
        title: 'Old title',
        hiddenNestedValue: 'keep nested',
      },
      metrics: {
        amount: 10,
        target: 20,
      },
      unknownValue: 'keep me',
    };

    model.setStepParams(RUNJS_SETTINGS_FLOW_KEY, RUNJS_SETTINGS_CONFIGURE_STEP_KEY, previousParams);
    const run = runtimeSettingsRegistry.beginRun(model, 'ctx.useSettings({ basic: { type: "object" } })');
    runtimeSettingsRegistry.register(
      model,
      'default',
      {
        basic: {
          type: 'object',
          title: 'Basic',
          properties: {
            title: { type: 'string' },
          },
        },
        metrics: {
          type: 'object',
          title: 'Metrics',
          properties: {
            amount: { type: 'number' },
            target: { type: 'number' },
          },
        },
      },
      run,
    );

    const steps = buildRunJSSettingsStepDefinitions(model);
    const beforeParamsSave = steps?.basic.beforeParamsSave as FlowSettingsBeforeParamsSaveStructured;
    const saved = await beforeParamsSave({
      ctx: new FlowRuntimeContext(model, RUNJS_SETTINGS_FLOW_KEY, 'settings'),
      flowKey: RUNJS_SETTINGS_FLOW_KEY,
      stepKey: 'basic',
      previousParams,
      currentParams: {
        title: 'New title',
      },
    });

    expect(saved).toEqual({
      metrics: {
        amount: 10,
        target: 20,
      },
      unknownValue: 'keep me',
      basic: {
        hiddenNestedValue: 'keep nested',
        title: 'New title',
      },
    });
    runtimeSettingsRegistry.clearModel(model.uid);
  });

  it('discovers direct settings schema from stored RunJS code before execution', () => {
    class TestFlowModel extends FlowModel {}

    const engine = new FlowEngine();
    const model = new TestFlowModel({ uid: 'model-runjs-settings-discovery', flowEngine: engine });
    model.setStepParams('clickSettings', 'runJs', {
      version: 'v2',
      code: `
const config = ctx.useSettings({
  action: {
    type: 'object',
    title: 'Action behavior',
    properties: {
      label: { type: 'string', default: 'Preview selected rows' },
      severity: {
        type: 'select',
        default: 'success',
        options: [
          { label: 'Success', value: 'success' },
          { label: 'Info', value: 'info' },
        ],
      },
    },
  },
  confirmation: {
    type: 'object',
    title: 'Confirmation',
    properties: {
      enabled: { type: 'boolean', default: true },
    },
  },
});

ctx.message[config.action.severity](config.action.label);
`,
    });

    const runJsParams = model.getStepParams('clickSettings', 'runJs') as { code: string };
    const schema = extractRunJSSettingsSchemaFromCode(runJsParams.code);
    expect(schema).toMatchObject({
      action: { type: 'object', title: 'Action behavior' },
      confirmation: { type: 'object', title: 'Confirmation' },
    });

    const steps = buildRunJSSettingsStepDefinitions(model);
    expect(Object.keys(steps || {})).toEqual(['action', 'confirmation']);
    expect(steps?.action.title).toBe('Action behavior');
    expect(steps?.confirmation.title).toBe('Confirmation');
    runtimeSettingsRegistry.clearModel(model.uid);
  });

  it('returns active config only and preserves inactive or unknown values on save', () => {
    const schema = normalizeRunJSSettingsSchema({
      fields: {
        title: { type: 'string', default: 'Default title' },
        threshold: { type: 'number', default: 80 },
        hiddenValue: { type: 'string', visible: false },
      },
    });

    expect(
      applyDefaults(schema, {
        title: 'Custom title',
        threshold: 'bad number',
        hiddenValue: 'keep me',
        collection: { $type: 'collection', dataSource: 'main', name: 'orders' },
        customJson: { value: { $type: 'custom', foo: 1 } },
        unknownValue: 'also keep me',
      }),
    ).toEqual({
      title: 'Custom title',
      threshold: 80,
    });

    expect(
      mergeActiveValuesPreserveInactiveUnknown({
        schema,
        previousParams: {
          title: 'Old title',
          hiddenValue: 'keep me',
          collection: { $type: 'collection', dataSource: 'main', name: 'orders' },
          customJson: { value: { $type: 'custom', foo: 1 } },
          unknownValue: 'also keep me',
        },
        draftParams: {
          threshold: 90,
        },
      }),
    ).toEqual({
      hiddenValue: 'keep me',
      collection: { $type: 'collection', dataSource: 'main', name: 'orders' },
      customJson: { value: { $type: 'custom', foo: 1 } },
      unknownValue: 'also keep me',
      threshold: 90,
    });
  });

  it('maps scalar adapters and normalizes their serialized values', () => {
    const schema = normalizeRunJSSettingsSchema({
      fields: {
        publishDate: { type: 'date' },
        publishAt: { type: 'datetime' },
        accentColor: { type: 'color' },
        payload: { type: 'json' },
      },
    });
    const uiSchema = toFlowUISchema(schema);

    expect(uiSchema.publishDate['x-component']).toBe('RunJSSettingsDatePicker');
    expect(uiSchema.publishAt['x-component']).toBe('RunJSSettingsDateTimePicker');
    expect(uiSchema.accentColor['x-component']).toBe('RunJSSettingsColorPicker');
    expect(uiSchema.payload['x-component']).toBe('RunJSSettingsJSONTextArea');
    expect(normalizeSettingValueByFieldType(schema.fields.publishDate, '2026-06-23')).toBe('2026-06-23');
    expect(normalizeSettingValueByFieldType(schema.fields.publishAt, '2026-06-23T12:30:00.000Z')).toBe(
      '2026-06-23T12:30:00.000Z',
    );
    expect(normalizeSettingValueByFieldType(schema.fields.accentColor, '#52c41a')).toBe('#52C41A');
    expect(normalizeSettingValueByFieldType(schema.fields.payload, '{"enabled":true}')).toBe('{"enabled":true}');
    expect(normalizeJsonTextValue('{"enabled":true}')).toEqual({ enabled: true });
    expect(normalizeSettingDraftValueByFieldType(schema.fields.payload, '{"enabled":true}')).toEqual({ enabled: true });
    expect(normalizeSettingDraftValueByFieldType(schema.fields.payload, '"hello"')).toBe('hello');
    expect(
      normalizeSettingDraftValueByFieldType(schema.fields.payload, 'hello', 'settings.payload', {
        hasPreviousValue: true,
        previousValue: 'hello',
      }),
    ).toBe('hello');
    expect(formatRunJSSettingsJSONTextAreaValue('hello')).toBe('"hello"');
    expect(formatRunJSSettingsJSONTextAreaValue(null)).toBe('null');
    expect(() => normalizeJsonTextValue('{bad json')).toThrow(/valid JSON/);
  });

  it('saves corrected active draft values without validating old active values first', () => {
    const schema = normalizeRunJSSettingsSchema({
      fields: {
        threshold: { type: 'number' },
        accentColor: { type: 'color' },
        payload: { type: 'json' },
        hiddenValue: { type: 'string', visible: false },
      },
    });

    expect(
      mergeActiveValuesPreserveInactiveUnknown({
        schema,
        previousParams: {
          threshold: 'not-a-number',
          accentColor: 'not-a-color',
          payload: 'hello',
          hiddenValue: { value: { $type: 'custom', nested: true } },
        },
        draftParams: {
          threshold: 90,
          accentColor: '#52c41a',
          payload: 'hello',
        },
      }),
    ).toEqual({
      threshold: 90,
      accentColor: '#52C41A',
      payload: 'hello',
      hiddenValue: { value: { $type: 'custom', nested: true } },
    });
  });

  it('keeps raw JSON textarea text while editing', () => {
    const onChange = vi.fn();
    const view = render(
      React.createElement(RunJSSettingsJSONTextArea, {
        value: { enabled: true },
        onChange,
      }),
    );
    const textarea = view.container.querySelector('textarea');
    expect(textarea).not.toBeNull();
    if (!textarea) {
      throw new Error('JSON settings textarea was not rendered');
    }
    expect(textarea.value).toBe('{\n  "enabled": true\n}');

    fireEvent.change(textarea, { target: { value: '{"enabled":false}' } });
    expect(onChange).toHaveBeenLastCalledWith('{"enabled":false}');
    expect(textarea.value).toBe('{"enabled":false}');

    view.rerender(
      React.createElement(RunJSSettingsJSONTextArea, {
        value: '{"enabled":false}',
        onChange,
      }),
    );
    expect(textarea.value).toBe('{"enabled":false}');

    view.rerender(
      React.createElement(RunJSSettingsJSONTextArea, {
        value: 'hello',
        onChange,
      }),
    );
    expect(textarea.value).toBe('"hello"');
  });

  it('does not return stale schemas after a new JS run omits useSettings', () => {
    const model = {
      uid: 'model-a',
      use: 'JSBlockModel',
      getStepParams: () => ({}),
    };
    const firstRun = runtimeSettingsRegistry.beginRun(model, 'ctx.useSettings({ fields: {} })');
    runtimeSettingsRegistry.register(
      model,
      'default',
      {
        fields: {
          title: { type: 'string' },
        },
      },
      firstRun,
    );
    expect(runtimeSettingsRegistry.get(model, 'default')).toBeTruthy();

    runtimeSettingsRegistry.beginRun(model, 'ctx.render("no settings")');
    expect(runtimeSettingsRegistry.get(model, 'default')).toBeUndefined();
    runtimeSettingsRegistry.clearModel(model.uid);
  });
});
