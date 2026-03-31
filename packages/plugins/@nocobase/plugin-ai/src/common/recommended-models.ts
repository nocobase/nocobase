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
 */
export const recommendedModels: Record<string, { label: string; value: string }[]> = {
  'google-genai': [
    { label: 'Gemini 3 Pro Preview', value: 'models/gemini-3-pro-preview' },
    { label: 'Gemini 3 Flash Preview', value: 'models/gemini-3-flash-preview' },
  ],
  openai: [
    { label: 'GPT-5.3-Codex', value: 'gpt-5.3-codex' },
    { label: 'GPT-5.2', value: 'gpt-5.2' },
  ],
  anthropic: [
    { label: 'Claude Opus 4.6', value: 'claude-opus-4-6' },
    { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5' },
  ],
  dashscope: [{ label: 'Qwen3 Max', value: 'qwen3-max-2026-01-23' }],
  deepseek: [
    { label: 'DeepSeek Chat', value: 'deepseek-chat' },
    { label: 'DeepSeek Reasoner', value: 'deepseek-reasoner' },
  ],
  kimi: [
    { label: 'Kimi K2.5', value: 'kimi-k2.5' },
    { label: 'Kimi K2', value: 'kimi-k2-0905-Preview' },
    { label: 'Kimi K2 Turbo', value: 'kimi-k2-turbo-preview' },
  ],
  ollama: [],
};

/**
 * Check if a model is recommended for a given provider
 */
export const isRecommendedModel = (provider: string, modelId: string): boolean => {
  const models = recommendedModels[provider] || [];
  return models.some((m) => modelId.toLowerCase() === m.value.toLowerCase());
};

/**
 * Get recommended models for a provider
 */
export const getRecommendedModels = (provider: string): { label: string; value: string }[] => {
  return recommendedModels[provider] || [];
};
