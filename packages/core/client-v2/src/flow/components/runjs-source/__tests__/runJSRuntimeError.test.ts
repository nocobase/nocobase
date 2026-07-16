/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { readRunJSRuntimeError } from '../runJSRuntimeError';

describe('readRunJSRuntimeError', () => {
  it('reads a normal Error', () => {
    expect(readRunJSRuntimeError(new Error('failed'))).toEqual({
      message: 'failed',
    });
  });

  it('reads an Axios server error envelope including details.reasonCode', () => {
    expect(
      readRunJSRuntimeError({
        response: {
          status: 409,
          data: {
            errors: [
              {
                code: 'LIGHT_EXTENSION_BINDING_OUTDATED',
                message: 'Refresh required',
                details: { reasonCode: 'binding_changed' },
              },
            ],
          },
        },
      }),
    ).toEqual({
      code: 'LIGHT_EXTENSION_BINDING_OUTDATED',
      status: 409,
      reasonCode: 'binding_changed',
      message: 'Refresh required',
    });
  });

  it('keeps top-level code and status when the nested error only has details', () => {
    expect(
      readRunJSRuntimeError({
        code: 'REQUEST_FAILED',
        status: 422,
        response: {
          data: {
            errors: [{ details: { reasonCode: 'settings_invalid' } }],
          },
        },
      }),
    ).toEqual({
      code: 'REQUEST_FAILED',
      status: 422,
      reasonCode: 'settings_invalid',
    });
  });
});
