/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { LegacyRunJSEditorRegistry } from '..';

const props = {
  value: {
    code: 'return 1;',
    version: 'v2',
  },
};

describe('LegacyRunJSEditorRegistry', () => {
  afterEach(() => {
    LegacyRunJSEditorRegistry.clear();
  });

  it('uses the most recently registered matching provider', () => {
    const first = { key: 'first', renderEditor: vi.fn(() => null) };
    const second = { key: 'second', canHandle: vi.fn(() => false), renderEditor: vi.fn(() => null) };
    const third = { key: 'third', renderEditor: vi.fn(() => null) };

    LegacyRunJSEditorRegistry.registerProvider(first);
    LegacyRunJSEditorRegistry.registerProvider(second);
    const unregister = LegacyRunJSEditorRegistry.registerProvider(third);

    expect(LegacyRunJSEditorRegistry.getProvider(props)).toBe(third);
    unregister();
    expect(LegacyRunJSEditorRegistry.getProvider(props)).toBe(first);
  });
});
