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
export const recommendedModels: Record<string, { label: string; value: string }[]> = {};

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
