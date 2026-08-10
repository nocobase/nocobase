/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { setupRunJSTestHosts } from '@nocobase/test/client-v2';
import { readRunJSRuntimeError } from '../runJSRuntimeError';

setupRunJSTestHosts();

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
                code: 'JS_TEMPLATE_BINDING_OUTDATED',
                message: 'Refresh required',
                details: { reasonCode: 'binding_changed' },
              },
            ],
          },
        },
      }),
    ).toEqual({
      code: 'JS_TEMPLATE_BINDING_OUTDATED',
      status: 409,
      reasonCode: 'binding_changed',
      message: 'Refresh required',
      details: { reasonCode: 'binding_changed' },
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
      details: { reasonCode: 'settings_invalid' },
    });
  });

  it('keeps local and server settings paths for actionable runtime errors', () => {
    expect(
      readRunJSRuntimeError({
        code: 'JS_TEMPLATE_SETTINGS_INVALID',
        message: 'Settings invalid',
        paths: ['count'],
      }),
    ).toEqual({
      code: 'JS_TEMPLATE_SETTINGS_INVALID',
      message: 'Settings invalid',
      paths: ['count'],
    });

    expect(
      readRunJSRuntimeError({
        response: {
          status: 422,
          data: {
            errors: [
              {
                code: 'JS_TEMPLATE_SETTINGS_INVALID',
                details: {
                  reasonCode: 'settings_invalid',
                  issues: [{ path: '$.count', code: 'settings_type_mismatch' }],
                },
              },
            ],
          },
        },
      }),
    ).toMatchObject({
      code: 'JS_TEMPLATE_SETTINGS_INVALID',
      paths: ['$.count'],
    });
  });
});
