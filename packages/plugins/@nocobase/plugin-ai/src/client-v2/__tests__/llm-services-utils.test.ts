/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getCustomModelIdIssues } from '../../common/llm-service-models';
import { normalizeLLMServiceFormValues, normalizeLLMServiceOptions } from '../llm-services/utils';

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

  it('trims custom model IDs and display names without changing their case', () => {
    const values = {
      enabledModels: {
        mode: 'custom',
        models: [
          { value: ' gpt-4o ', label: ' GPT 4o ' },
          { value: 'GPT-4O', label: ' ' },
        ],
      },
    };

    expect(normalizeLLMServiceFormValues(values)).toEqual({
      enabledModels: {
        mode: 'custom',
        models: [
          { value: 'gpt-4o', label: 'GPT 4o' },
          { value: 'GPT-4O', label: '' },
        ],
      },
    });
    expect(values.enabledModels.models[0].value).toBe(' gpt-4o ');
  });

  it('validates custom model IDs with case-sensitive uniqueness after trimming', () => {
    expect(
      getCustomModelIdIssues({
        mode: 'custom',
        models: [{ value: 'gpt-4o' }, { value: ' gpt-4o ' }, { value: 'GPT-4O' }, { value: '   ' }],
      }),
    ).toEqual([
      { index: 1, type: 'duplicate' },
      { index: 3, type: 'required' },
    ]);
  });
});
