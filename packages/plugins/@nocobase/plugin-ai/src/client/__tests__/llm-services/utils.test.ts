/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { normalizeLLMServiceFormValues, normalizeLLMServiceOptions } from '../../llm-services/utils';

describe('LLM service utils', () => {
  it('removes blank baseURL from provider options', () => {
    expect(normalizeLLMServiceOptions({ apiKey: 'test-key', baseURL: '' })).toEqual({
      apiKey: 'test-key',
    });
    expect(normalizeLLMServiceOptions({ apiKey: 'test-key', baseURL: '   ' })).toEqual({
      apiKey: 'test-key',
    });
  });

  it('trims non-blank baseURL from provider options', () => {
    expect(normalizeLLMServiceOptions({ apiKey: 'test-key', baseURL: ' https://api.example.com/v1/ ' })).toEqual({
      apiKey: 'test-key',
      baseURL: 'https://api.example.com/v1/',
    });
  });

  it('normalizes form values without mutating the original values', () => {
    const values = {
      name: 'test-service',
      options: {
        apiKey: 'test-key',
        baseURL: '',
      },
    };

    expect(normalizeLLMServiceFormValues(values)).toEqual({
      name: 'test-service',
      options: {
        apiKey: 'test-key',
      },
    });
    expect(values.options).toEqual({
      apiKey: 'test-key',
      baseURL: '',
    });
  });
});
