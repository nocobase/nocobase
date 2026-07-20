/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import type { LLMServiceItem } from '../../../../repositories/AIConfigRepository';
import { getVisibleModelServices } from '../ModelSwitcher';

const services: LLMServiceItem[] = [
  {
    llmService: 'openai',
    llmServiceTitle: 'OpenAI',
    enabledModels: [
      { label: 'GPT 5', value: 'gpt-5' },
      { label: 'GPT 4.1', value: 'gpt-4.1' },
    ],
  },
  {
    llmService: 'qwen',
    llmServiceTitle: 'Qwen',
    enabledModels: [{ label: 'Qwen Max', value: 'qwen-max' }],
  },
];

describe('ModelSwitcher helpers', () => {
  it('filters allowed models for draft conversations', () => {
    expect(getVisibleModelServices(services, ['openai:gpt-5'])).toEqual([
      {
        llmService: 'openai',
        llmServiceTitle: 'OpenAI',
        enabledModels: [{ label: 'GPT 5', value: 'gpt-5' }],
      },
    ]);
  });

  it('keeps the current conversation model visible while preserving restrictions', () => {
    expect(getVisibleModelServices(services, ['openai:gpt-5'], { llmService: 'qwen', model: 'qwen-max' })).toEqual([
      {
        llmService: 'openai',
        llmServiceTitle: 'OpenAI',
        enabledModels: [{ label: 'GPT 5', value: 'gpt-5' }],
      },
      {
        llmService: 'qwen',
        llmServiceTitle: 'Qwen',
        enabledModels: [{ label: 'Qwen Max', value: 'qwen-max' }],
      },
    ]);
  });
});
