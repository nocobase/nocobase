/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { createSafeDocument, createSafeWindow } from '../safeGlobals';

describe('safeGlobals', () => {
  it('createSafeWindow exposes only allowed globals and extras', () => {
    const win: any = createSafeWindow({ foo: 123 });
    expect(typeof win.setTimeout).toBe('function');
    expect(win.console).toBeDefined();
    expect(win.foo).toBe(123);
    // access to location proxy is allowed, but sensitive props throw
    expect(() => win.location.href).toThrow(/not allowed/);
  });

  it('createSafeDocument exposes whitelisted methods and extras', () => {
    const doc: any = createSafeDocument({ bar: true });
    expect(typeof doc.createElement).toBe('function');
    expect(doc.bar).toBe(true);
    expect(() => doc.cookie).toThrow(/not allowed/);
  });
});
