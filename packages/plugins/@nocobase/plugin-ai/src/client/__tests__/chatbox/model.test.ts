/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { ensureModel } from '../../ai-employees/chatbox/model';

describe('chatbox model recovery', () => {
  it('resolves model when current selection is missing (historical conversation case)', async () => {
    const aiConfigRepository = {
      getLLMServices: vi.fn(() => [
        {
          llmService: 'svc-openai',
          llmServiceTitle: 'OpenAI',
          enabledModels: [{ label: 'GPT-4o', value: 'gpt-4o' }],
        },
      ]),
    };
    const api = {
      storage: {
        getItem: vi.fn(() => null),
      },
    };
    const onResolved = vi.fn();

    const result = await ensureModel({
      api,
      aiConfigRepository: aiConfigRepository as any,
      username: 'orin',
      currentOverride: null,
      onResolved,
    });

    expect(result).toEqual({ llmService: 'svc-openai', model: 'gpt-4o' });
    expect(aiConfigRepository.getLLMServices).toHaveBeenCalledTimes(1);
    expect(onResolved).toHaveBeenCalledWith({ llmService: 'svc-openai', model: 'gpt-4o' });
  });

  it('keeps current model when it is still valid', async () => {
    const aiConfigRepository = {
      getLLMServices: vi.fn(() => [
        {
          llmService: 'svc-openai',
          llmServiceTitle: 'OpenAI',
          enabledModels: [{ label: 'GPT-4o', value: 'gpt-4o' }],
        },
      ]),
    };
    const api = {
      storage: {
        getItem: vi.fn(() => null),
      },
    };
    const onResolved = vi.fn();
    const currentOverride = { llmService: 'svc-openai', model: 'gpt-4o' };

    const result = await ensureModel({
      api,
      aiConfigRepository: aiConfigRepository as any,
      username: 'orin',
      currentOverride,
      onResolved,
    });

    expect(result).toEqual(currentOverride);
    expect(onResolved).not.toHaveBeenCalled();
  });
});
