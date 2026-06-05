/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIConfigRepository, LLMServiceItem } from '../../repositories/AIConfigRepository';
import { ModelRef } from './stores/chat-box';

export const MODEL_PREFERENCE_STORAGE_KEY = 'ai_model_preference_';

export const getAllModels = (services: LLMServiceItem[]): ModelRef[] =>
  services.flatMap((service) =>
    service.enabledModels.map((model) => ({
      llmService: service.llmService,
      model: model.value,
    })),
  );

export const isValidModel = (value: ModelRef | null | undefined, allModels: ModelRef[]) =>
  !!value && allModels.some((item) => item.llmService === value.llmService && item.model === value.model);

export const isSameModel = (a?: ModelRef | null, b?: ModelRef | null) =>
  a?.llmService === b?.llmService && a?.model === b?.model;

export const resolveModel = (api: any, username: string, allModels: ModelRef[], currentOverride?: ModelRef | null) => {
  if (isValidModel(currentOverride, allModels)) {
    return currentOverride;
  }
  let cachedId: string | null = null;
  try {
    cachedId = api?.storage.getItem(MODEL_PREFERENCE_STORAGE_KEY + username);
  } catch (err) {
    console.log(err);
  }
  if (cachedId) {
    if (cachedId.includes(':')) {
      const [cachedService, cachedModelId] = cachedId.split(':');
      const cached = allModels.find((item) => item.llmService === cachedService && item.model === cachedModelId);
      if (cached) {
        return cached;
      }
    } else {
      const cached = allModels.find((item) => item.model === cachedId);
      if (cached) {
        return cached;
      }
    }
  }
  return allModels[0] || null;
};

export const ensureModel = async ({
  api,
  aiConfigRepository,
  username,
  currentOverride,
  onResolved,
}: {
  api: any;
  aiConfigRepository: AIConfigRepository;
  username: string;
  currentOverride?: ModelRef | null;
  onResolved?: (override: ModelRef | null) => void;
}): Promise<ModelRef | null> => {
  const allModels = getAllModels(await aiConfigRepository.getLLMServices());
  const resolvedOverride = resolveModel(api, username, allModels, currentOverride);
  if (!isSameModel(currentOverride, resolvedOverride)) {
    onResolved?.(resolvedOverride);
  }
  return resolvedOverride;
};
