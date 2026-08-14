/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearRunJSRuntimeHosts, registerRunJSRuntimeHost } from '@nocobase/client-v2';
import { createRunJSTestRuntimeHost } from '@nocobase/test/client-v2';

import { readRunJSRuntimeError } from '../runJSRuntimeError';

describe('RunJS runtime error host', () => {
  afterEach(() => {
    clearRunJSRuntimeHosts();
  });

  it('delegates error normalization to the active runtime host', () => {
    const normalized = {
      code: 'JS_TEMPLATE_SETTINGS_INVALID',
      status: 422,
      reasonCode: 'settings_invalid',
      paths: ['$.count'],
    };
    const readRuntimeError = vi.fn(() => normalized);
    registerRunJSRuntimeHost(createRunJSTestRuntimeHost({ readRuntimeError }));
    const error = new Error('unsafe implementation detail');

    expect(readRunJSRuntimeError(error)).toBe(normalized);
    expect(readRuntimeError).toHaveBeenCalledWith(error);
  });
});
