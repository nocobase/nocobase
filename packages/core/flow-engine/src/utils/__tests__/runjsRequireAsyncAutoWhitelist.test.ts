/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { runjsRequireAsync } from '../runjsModuleLoader';
import { __resetRunJSSafeGlobalsRegistryForTests, createSafeWindow } from '../safeGlobals';

beforeEach(() => {
  __resetRunJSSafeGlobalsRegistryForTests();
});

describe('runjsRequireAsync auto whitelist', () => {
  it('should allow safeWindow to access globals introduced during requireAsync', async () => {
    const key = '__nb_require_async_added_global__';
    delete (window as any)[key];

    const safeWin: any = createSafeWindow();
    expect(() => safeWin[key]).toThrow(/not allowed/);

    const requirejs: any = (deps: string[], onLoad: (...args: any[]) => void) => {
      // Simulate a remote library attaching itself to the real window.
      (window as any)[key] = { ok: true };
      onLoad(undefined);
    };

    await runjsRequireAsync(requirejs, 'https://example.com/fake-lib.js');

    expect(safeWin[key]).toEqual({ ok: true });

    delete (window as any)[key];
  });
});
