/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * NocoBase officially recommended models for each LLM provider.
 * These models are tested to ensure quality and compatibility.
 * Updated: January 2026
 */
export const recommendedModels: Record<string, { label: string; value: string }[]> = {
  'google-genai': [
    { label: 'Gemini 3 Pro Preview', value: 'models/gemini-3-pro-preview' },
    { label: 'Gemini 3 Flash Preview', value: 'models/gemini-3-flash-preview' },
  ],
  openai: [
    { label: 'GPT-5.2-Codex', value: 'gpt-5.2-codex' },
    { label: 'GPT-5.2', value: 'gpt-5.2' },
  ],
  anthropic: [
    { label: 'Claude Opus 4.5', value: 'claude-opus-4-5' },
    { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5' },
  ],
  dashscope: [
    { label: 'Qwen3 Max', value: 'qwen3-max-2026-01-23' },
    { label: 'Kimi K2 Thinking', value: 'kimi-k2-thinking' },
  ],
  deepseek: [
    { label: 'DeepSeek Chat', value: 'deepseek-chat' },
    { label: 'DeepSeek Reasoner', value: 'deepseek-reasoner' },
  ],
  ollama: [],
};

/**
 * Check if a model is recommended for a given provider
 */
export const isRecommendedModel = (provider: string, modelId: string): boolean => {
  const models = recommendedModels[provider] || [];
  return models.some((m) => modelId.toLowerCase().startsWith(m.value.toLowerCase()));
};

/**
 * Get recommended models for a provider
 */
export const getRecommendedModels = (provider: string): { label: string; value: string }[] => {
  return recommendedModels[provider] || [];
};
