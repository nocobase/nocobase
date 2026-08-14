/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearRunJSRuntimeHosts,
  registerRunJSRuntimeHost,
  resolveRunJSSourceBinding,
  resolveRuntimeRunJS,
} from '@nocobase/client-v2';
import { createRunJSTestRuntimeHost } from '@nocobase/test/client-v2';

describe('RunJS source runtime host', () => {
  afterEach(() => {
    clearRunJSRuntimeHosts();
  });

  it('delegates source binding resolution to the active runtime host', async () => {
    const resolved = {
      code: 'return "compiled";',
      version: 'v2',
      sourceMode: 'js-template',
      settings: {},
    };
    const resolveSourceBinding = vi.fn(async () => resolved);
    registerRunJSRuntimeHost(createRunJSTestRuntimeHost({ resolveSourceBinding }));
    const input = {
      sourceMode: 'js-template',
      sourceBinding: { templateId: 'template-1' },
      settings: { region: 'APAC' },
    };

    await expect(resolveRunJSSourceBinding(input)).resolves.toBe(resolved);
    expect(resolveSourceBinding).toHaveBeenCalledWith(input);
  });

  it('delegates runtime resolution to the active runtime host', async () => {
    const resolved = {
      code: 'return 1;',
      version: 'v2',
      sourceMode: 'inline',
      settings: {},
    };
    const resolveRuntime = vi.fn(async () => resolved);
    registerRunJSRuntimeHost(createRunJSTestRuntimeHost({ resolveRuntime }));
    const input = { runJs: { code: 'return 1;', version: 'v2' } };

    await expect(resolveRuntimeRunJS(input)).resolves.toBe(resolved);
    expect(resolveRuntime).toHaveBeenCalledWith(input);
  });

  it('uses the most recently registered runtime host', async () => {
    const first = vi.fn(async () => ({ code: 'first', version: 'v2', sourceMode: 'inline', settings: {} }));
    const second = vi.fn(async () => ({ code: 'second', version: 'v2', sourceMode: 'inline', settings: {} }));
    registerRunJSRuntimeHost(createRunJSTestRuntimeHost({ resolveRuntime: first }));
    const disposeSecond = registerRunJSRuntimeHost(createRunJSTestRuntimeHost({ resolveRuntime: second }));

    await expect(resolveRuntimeRunJS({ runJs: { code: '' } })).resolves.toMatchObject({ code: 'second' });
    disposeSecond();
    await expect(resolveRuntimeRunJS({ runJs: { code: '' } })).resolves.toMatchObject({ code: 'first' });
  });
});
