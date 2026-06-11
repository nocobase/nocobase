/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  resolveLegacyTriggerConfigRenderMode,
  resolveLegacyTriggerExecuteRenderMode,
  resolveLegacyTriggerPresetRenderMode,
} from '..';

const loader = async () => ({ default: () => null });

describe('trigger render dispatch', () => {
  it('keeps legacy preset fieldsets before falling through to v2 loaders', () => {
    expect(resolveLegacyTriggerPresetRenderMode({ presetFieldset: { mode: {} }, PresetFieldsetLoader: loader })).toBe(
      'legacy-fieldset',
    );
    expect(resolveLegacyTriggerPresetRenderMode({ presetFieldset: {}, PresetFieldsetLoader: loader })).toBe(
      'modern-loader',
    );
    expect(resolveLegacyTriggerPresetRenderMode({ PresetFieldsetLoader: loader })).toBe('modern-loader');
    expect(resolveLegacyTriggerPresetRenderMode({})).toBe('none');
  });

  it('keeps legacy config fieldsets before falling through to v2 loaders', () => {
    expect(resolveLegacyTriggerConfigRenderMode({ fieldset: { config: {} }, FieldsetLoader: loader })).toBe(
      'legacy-fieldset',
    );
    expect(resolveLegacyTriggerConfigRenderMode({ fieldset: {}, FieldsetLoader: loader })).toBe('modern-loader');
    expect(resolveLegacyTriggerConfigRenderMode({ FieldsetLoader: loader })).toBe('modern-loader');
    expect(resolveLegacyTriggerConfigRenderMode({})).toBe('none');
  });

  it('keeps legacy manual-execute fieldsets before falling through to v2 loaders', () => {
    expect(
      resolveLegacyTriggerExecuteRenderMode({
        triggerFieldset: { data: {} },
        TriggerFieldsetLoader: loader,
      }),
    ).toBe('legacy-fieldset');
    expect(resolveLegacyTriggerExecuteRenderMode({ triggerFieldset: {}, TriggerFieldsetLoader: loader })).toBe(
      'modern-loader',
    );
    expect(resolveLegacyTriggerExecuteRenderMode({ TriggerFieldsetLoader: loader })).toBe('modern-loader');
    expect(resolveLegacyTriggerExecuteRenderMode({})).toBe('none');
  });
});
