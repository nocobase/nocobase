/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { runjsImportAsync } from '../utils/runjsModuleLoader';

describe('RunJS module loader', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('temporarily patches define.amd during dynamic import and restores it afterwards', async () => {
    const define = function define() {};
    const amd = { vendor: 'requirejs' };
    Object.defineProperty(define, 'amd', {
      value: amd,
      configurable: true,
      writable: true,
    });
    vi.stubGlobal('define', define);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('fetch', undefined);

    const mod = await runjsImportAsync(
      'data:text/javascript,export%20const%20amdDuringImport%20%3D%20globalThis.define%20%26%26%20globalThis.define.amd%3B',
    );

    expect(mod.amdDuringImport).toBeUndefined();
    expect((globalThis as any).define.amd).toBe(amd);
  });
});
