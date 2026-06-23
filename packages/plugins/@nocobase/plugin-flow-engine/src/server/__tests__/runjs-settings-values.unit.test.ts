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
  normalizeRunJSSettingsConfigureValues,
  normalizeRunJSSettingsUnsetKeys,
} from '../flow-surfaces/runjs-settings-values';

describe('runjs settings public values validation', () => {
  it('accepts generic JSON values and typed envelopes without scalar schema validation', () => {
    expect(
      normalizeRunJSSettingsConfigureValues(
        {
          title: '2026-99-99',
          color: 'not-a-color',
          collection: { $type: 'collection', dataSource: 'main', name: 'orders' },
          customJson: { value: { $type: 'custom', foo: 1 } },
        },
        'settings.values',
      ),
    ).toEqual({
      title: '2026-99-99',
      color: 'not-a-color',
      collection: { $type: 'collection', dataSource: 'main', name: 'orders' },
      customJson: { value: { $type: 'custom', foo: 1 } },
    });
  });

  it('rejects unsafe top-level keys and invalid top-level envelopes', () => {
    expect(() => normalizeRunJSSettingsConfigureValues({ constructor: 'bad' }, 'settings.values')).toThrow(
      /not allowed/,
    );
    expect(() => normalizeRunJSSettingsConfigureValues({ title: undefined }, 'settings.values')).toThrow(/JSON value/);
    expect(() => normalizeRunJSSettingsConfigureValues({ ref: { $type: 'unknown' } }, 'settings.values')).toThrow(
      /not supported/,
    );
    expect(() =>
      normalizeRunJSSettingsConfigureValues(
        { ref: { $type: 'collection', dataSource: 'main', name: 'orders', extra: true } },
        'settings.values',
      ),
    ).toThrow(/unsupported keys/);
  });

  it('normalizes unset keys through the same top-level key rules', () => {
    expect(normalizeRunJSSettingsUnsetKeys(['oldField'], 'settings.unset')).toEqual(['oldField']);
    expect(() => normalizeRunJSSettingsUnsetKeys(['user.name'], 'settings.unset')).toThrow(/not allowed/);
  });
});
