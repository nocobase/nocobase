/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getErrorMessage, getResponseErrorMessage, isFormValidationError } from '../error';

describe('data source manager error helpers', () => {
  it('detects Ant Design form validation errors', () => {
    expect(
      isFormValidationError({
        errorFields: [{ name: ['title'], errors: ['Title is required'] }],
      }),
    ).toBe(true);
    expect(isFormValidationError({ errorFields: null })).toBe(false);
  });

  it('prefers form validation messages before response errors', () => {
    expect(
      getErrorMessage(
        {
          errorFields: [{ name: ['title'], errors: ['Title is required'] }],
          response: {
            data: {
              errors: [{ message: 'Response failed' }],
            },
          },
        },
        'Fallback',
      ),
    ).toBe('Title is required');
  });

  it('normalizes common error payload shapes', () => {
    expect(getErrorMessage('Plain error')).toBe('Plain error');
    expect(
      getErrorMessage({
        response: {
          data: {
            errors: [{ message: 'First error' }, { message: '' }, { message: 'Second error' }],
          },
        },
      }),
    ).toBe('First error\nSecond error');
    expect(
      getErrorMessage({
        response: {
          data: {
            messages: [{ message: 'Message object' }, 'Message text', { message: 123 }],
          },
        },
      }),
    ).toBe('Message object\nMessage text');
    expect(
      getErrorMessage({
        response: {
          data: {
            error: {
              message: 'Nested message',
            },
          },
        },
      }),
    ).toBe('Nested message');
    expect(
      getErrorMessage({
        response: {
          data: {
            message: 'Response message',
          },
        },
      }),
    ).toBe('Response message');
    expect(
      getErrorMessage({
        message: 'Error instance message',
      }),
    ).toBe('Error instance message');
    expect(getErrorMessage({ response: { data: {} } }, 'Fallback')).toBe('Fallback');
  });

  it('reads error messages from raw responses', () => {
    expect(
      getResponseErrorMessage({
        data: {
          errors: [{ message: 'Response error' }],
        },
      }),
    ).toBe('Response error');
    expect(
      getResponseErrorMessage({
        data: {
          messages: ['Message text'],
        },
      }),
    ).toBe('Message text');
    expect(
      getResponseErrorMessage({
        data: {
          error: {
            message: 'Nested response message',
          },
        },
      }),
    ).toBe('Nested response message');
    expect(
      getResponseErrorMessage({
        data: {
          message: 'Response message',
        },
      }),
    ).toBe('Response message');
    expect(getResponseErrorMessage({ data: {} })).toBeUndefined();
  });
});
