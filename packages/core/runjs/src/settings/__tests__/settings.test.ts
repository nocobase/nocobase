/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getLightExtensionSettingStepKey,
  normalizeLightExtensionEntrySelection,
  normalizeLightExtensionSettings,
  setLightExtensionTopLevelSetting,
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
      normalizeLightExtensionSettings(descriptor, {
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
    const currentBinding = { entryId: 'entry-sales' };
    expect(
      normalizeLightExtensionEntrySelection({
        currentBinding,
        currentSettings: { mode: 2 },
        nextBinding: { entryId: 'entry-sales' },
        descriptor,
      }),
    ).toMatchObject({ mode: 2 });

    expect(
      normalizeLightExtensionEntrySelection({
        currentBinding,
        currentSettings: {
          mode: 2,
          removedSetting: true,
          displayOptions: { pageSize: 50, color: 'red', removedNested: true },
        },
        submittedSettings: { displayOptions: { pageSize: 60 }, anotherRemovedSetting: true },
        nextBinding: { entryId: 'entry-sales' },
        descriptor,
      }),
    ).toEqual({
      mode: 2,
      displayOptions: { pageSize: 60, color: 'red' },
    });

    expect(
      normalizeLightExtensionEntrySelection({
        currentBinding,
        currentSettings: { mode: 2 },
        nextBinding: { entryId: 'entry-orders' },
        descriptor: { ...descriptor, entryId: 'entry-orders' },
      }),
    ).toEqual({});
  });

  it('keeps descriptor defaults out of Host overrides so later default changes remain effective', () => {
    const overrides = normalizeLightExtensionEntrySelection({
      currentBinding: { entryId: 'entry-sales' },
      currentSettings: { mode: 2 },
      nextBinding: { entryId: 'entry-orders' },
      descriptor: { ...descriptor, entryId: 'entry-orders' },
    });

    expect(overrides).toEqual({});
    expect(normalizeLightExtensionSettings(descriptor, overrides)).toMatchObject({ mode: 1 });
    expect(
      normalizeLightExtensionSettings(
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
      normalizeLightExtensionEntrySelection({
        currentBinding: { entryId: 'entry-sales' },
        currentSettings: {
          displayOptions: { pageSize: 50, removedNested: true },
          removedSetting: true,
        },
        nextBinding: { entryId: 'entry-sales' },
        descriptor,
      }),
    ).toEqual({
      displayOptions: { pageSize: 50 },
    });
  });

  it('saves scalar and object top-level settings without mutating the input', () => {
    const current = { mode: 1 };
    const next = setLightExtensionTopLevelSetting(current, 'displayOptions', { pageSize: 30 });
    expect(next).toEqual({ mode: 1, displayOptions: { pageSize: 30 } });
    expect(current).toEqual({ mode: 1 });
  });

  it('removes a cleared override so the descriptor default becomes effective again', () => {
    const cleared = setLightExtensionTopLevelSetting({ mode: 2 }, 'mode', undefined);

    expect(cleared).toEqual({});
    expect(normalizeLightExtensionSettings(descriptor, cleared)).toMatchObject({ mode: 1 });
  });

  it('keeps step identity stable for schema changes and changes it for another entry', () => {
    expect(getLightExtensionSettingStepKey('entry-sales', 'displayOptions')).toBe(
      getLightExtensionSettingStepKey('entry-sales', 'displayOptions'),
    );
    expect(getLightExtensionSettingStepKey('entry-sales', 'displayOptions')).not.toBe(
      getLightExtensionSettingStepKey('entry-orders', 'displayOptions'),
    );
  });
});
