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
export const recommendedModels: Record<string, string[]> = {
  'google-genai': ['models/gemini-3-pro-preview', 'models/gemini-3-flash-preview'],
  openai: ['gpt-5.2-codex', 'gpt-5.2'],
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5'],
  dashscope: ['qwen3-max-2026-01-23', 'kimi-k2-thinking'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  ollama: [],
};

/**
 * Check if a model is recommended for a given provider
 */
export const isRecommendedModel = (provider: string, modelId: string): boolean => {
  const models = recommendedModels[provider] || [];
  return models.some((m) => modelId.toLowerCase().startsWith(m.toLowerCase()));
};

/**
 * Get recommended models for a provider
 */
export const getRecommendedModels = (provider: string): string[] => {
  return recommendedModels[provider] || [];
};
