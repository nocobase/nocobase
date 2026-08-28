/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Protocol fixture frozen from https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
 * and https://api-docs.deepseek.com/zh-cn/guides/responses_api.
 */
export const deepSeekThinkingModeFixture = {
  responsesModels: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  chatCompletionsModels: ['deepseek-chat', 'deepseek-reasoner'],
  responsesThinkingEnabled: {
    reasoning: { effort: 'high' },
  },
  responsesThinkingDisabled: {
    reasoning: { effort: 'none' },
  },
  unsupportedThinkingFields: ['temperature', 'top_p', 'presence_penalty', 'frequency_penalty'],
  responsesEfforts: ['none', 'low', 'high', 'max'],
  streamEvents: {
    reasoningDelta: 'response.reasoning_text.delta',
    textDelta: 'response.output_text.delta',
    webSearchSearching: 'response.web_search_call.searching',
    completed: 'response.completed',
  },
} as const;
