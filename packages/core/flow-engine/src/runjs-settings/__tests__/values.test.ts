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
import { formatRunJSSettingsJSONTextAreaValue, RunJSSettingsJSONTextArea } from '../adapters';
import { normalizeRunJSSettingsSchema } from '../normalize';
import { runtimeSettingsRegistry } from '../registry';
import { toFlowUISchema } from '../toFlowUISchema';
import {
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
