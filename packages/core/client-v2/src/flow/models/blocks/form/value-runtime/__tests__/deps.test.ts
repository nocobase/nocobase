/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { collectStaticDepsFromRunJSValue, createFormValuesProxy, type DepCollector } from '../deps';

describe('createFormValuesProxy', () => {
  it('does not proxy Date values (keeps Date prototype methods working)', () => {
    const date = new Date('2025-01-01T00:00:00.000Z');
    const valuesMirror = { a: date };

    const proxy = createFormValuesProxy({
      valuesMirror,
      basePath: [],
      getFormValuesSnapshot: () => valuesMirror,
      getFormValueAtPath: () => undefined,
    });

    expect(proxy.a).toBe(date);
    expect(() => proxy.a.getTime()).not.toThrow();
  });
});

describe('collectStaticDepsFromRunJSValue', () => {
  const createCollector = (): DepCollector => ({ deps: new Set(), wildcard: false });

  it('extracts dependencies from cached inline code even with stale external metadata', () => {
    const collector = createCollector();

    collectStaticDepsFromRunJSValue(
      {
        code: 'return ctx.formValues.user.name + ctx.record.status;',
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: { entryId: 'legacy_entry' },
      },
      collector,
    );

    expect(collector.wildcard).toBe(false);
    expect(collector.deps).toEqual(new Set(['fv:user', 'fv:user.name', 'ctx:record:status']));
  });

  it('does not create dependencies for empty cached inline code', () => {
    const collector = createCollector();

    collectStaticDepsFromRunJSValue(
      {
        code: '',
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: { entryId: 'legacy_entry' },
      },
      collector,
    );

    expect(collector).toEqual({ deps: new Set(), wildcard: false });
  });
});
