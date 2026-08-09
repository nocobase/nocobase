/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getJsTemplateSettingStepKey,
  normalizeJsTemplateSelection,
  normalizeJsTemplateSettings,
  setJsTemplateTopLevelSetting,
} from '..';

const descriptor = {
  entryId: 'entry-sales',
  settingsSchemaHash: 'schema-1',
  defaults: {
    mode: 1,
    displayOptions: {
      pageSize: 20,
      color: 'blue',
    },
  },
  schema: {
    type: 'object',
    properties: {
      mode: { type: 'integer' },
      displayOptions: {
        type: 'object',
        properties: {
          pageSize: { type: 'integer' },
          color: { type: 'string' },
        },
      },
    },
  },
};

describe('@nocobase/runjs/settings', () => {
  it('deeply fills missing defaults without replacing saved values', () => {
    expect(
      normalizeJsTemplateSettings(descriptor, {
        displayOptions: {
          pageSize: 50,
        },
        removedSetting: true,
      }),
    ).toEqual({
      mode: 1,
      displayOptions: {
        pageSize: 50,
        color: 'blue',
      },
    });
  });

  it('preserves settings for the same entry and resets them for another entry', () => {
    const currentBinding = { templateId: 'entry-sales' };
    expect(
      normalizeJsTemplateSelection({
        currentBinding,
        currentSettings: { mode: 2 },
        nextBinding: { templateId: 'entry-sales' },
        descriptor,
      }),
    ).toMatchObject({ mode: 2 });

    expect(
      normalizeJsTemplateSelection({
        currentBinding,
        currentSettings: {
          mode: 2,
          removedSetting: true,
          displayOptions: { pageSize: 50, color: 'red', removedNested: true },
        },
        submittedSettings: { displayOptions: { pageSize: 60 }, anotherRemovedSetting: true },
        nextBinding: { templateId: 'entry-sales' },
        descriptor,
      }),
    ).toEqual({
      mode: 2,
      displayOptions: { pageSize: 60, color: 'red' },
    });

    expect(
      normalizeJsTemplateSelection({
        currentBinding,
        currentSettings: { mode: 2 },
        nextBinding: { templateId: 'entry-orders' },
        descriptor: { ...descriptor, entryId: 'entry-orders' },
      }),
    ).toEqual({});
  });

  it('keeps descriptor defaults out of Host overrides so later default changes remain effective', () => {
    const overrides = normalizeJsTemplateSelection({
      currentBinding: { templateId: 'entry-sales' },
      currentSettings: { mode: 2 },
      nextBinding: { templateId: 'entry-orders' },
      descriptor: { ...descriptor, entryId: 'entry-orders' },
    });

    expect(overrides).toEqual({});
    expect(normalizeJsTemplateSettings(descriptor, overrides)).toMatchObject({ mode: 1 });
    expect(
      normalizeJsTemplateSettings(
        {
          ...descriptor,
          defaults: { ...descriptor.defaults, mode: 3 },
          schema: {
            ...descriptor.schema,
            properties: {
              ...descriptor.schema.properties,
              mode: { type: 'number', default: 3 },
            },
          },
        },
        overrides,
      ),
    ).toMatchObject({ mode: 3 });
  });

  it('prunes same-entry overrides against the current schema without materializing defaults', () => {
    expect(
      normalizeJsTemplateSelection({
        currentBinding: { templateId: 'entry-sales' },
        currentSettings: {
          displayOptions: { pageSize: 50, removedNested: true },
          removedSetting: true,
        },
        nextBinding: { templateId: 'entry-sales' },
        descriptor,
      }),
    ).toEqual({
      displayOptions: { pageSize: 50 },
    });
  });

  it('saves scalar and object top-level settings without mutating the input', () => {
    const current = { mode: 1 };
    const next = setJsTemplateTopLevelSetting(current, 'displayOptions', { pageSize: 30 });
    expect(next).toEqual({ mode: 1, displayOptions: { pageSize: 30 } });
    expect(current).toEqual({ mode: 1 });
  });

  it('removes a cleared override so the descriptor default becomes effective again', () => {
    const cleared = setJsTemplateTopLevelSetting({ mode: 2 }, 'mode', undefined);

    expect(cleared).toEqual({});
    expect(normalizeJsTemplateSettings(descriptor, cleared)).toMatchObject({ mode: 1 });
  });

  it('keeps step identity stable for schema changes and changes it for another entry', () => {
    expect(getJsTemplateSettingStepKey('entry-sales', 'displayOptions')).toBe(
      getJsTemplateSettingStepKey('entry-sales', 'displayOptions'),
    );
    expect(getJsTemplateSettingStepKey('entry-sales', 'displayOptions')).not.toBe(
      getJsTemplateSettingStepKey('entry-orders', 'displayOptions'),
    );
  });
});
