/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMServiceItem } from './LLMServicesRepository';

export type ModelWithLabel = {
  llmService: string;
  model: string;
  label: string;
  value: string;
};

export type ProviderOption = {
  value: string;
  label: string;
};

export const getServiceByOverride = (services: LLMServiceItem[], override?: { llmService?: string } | null) => {
  if (!override?.llmService) {
    return undefined;
  }
  return services.find((service) => service.llmService === override.llmService);
};

export const getAllModelsWithLabel = (services: LLMServiceItem[]): ModelWithLabel[] =>
  services.flatMap((service) =>
    service.enabledModels.map((model) => ({
      llmService: service.llmService,
      model: model.value,
      label: model.label,
      value: model.value,
    })),
  );

export const buildProviderGroupedModelOptions = (
  services: LLMServiceItem[],
  providers: ProviderOption[],
  compileLabel?: (label: string) => string,
) => {
  if (!services.length) {
    return [];
  }
  const providerLabelMap = new Map<string, string>();
  providers.forEach((provider) => providerLabelMap.set(provider.value, provider.label));

  const providerTitleMap = new Map<string, string>();
  services.forEach((service) => {
    if (service.provider && service.providerTitle) {
      providerTitleMap.set(service.provider, service.providerTitle);
    }
  });

  const providerServiceCounts = new Map<string, number>();
  services.forEach((service) => {
    const providerKey = service.provider || service.llmService;
    providerServiceCounts.set(providerKey, (providerServiceCounts.get(providerKey) || 0) + 1);
  });

  const grouped = new Map<string, { label: string; options: { label: string; value: string }[] }>();
  services.forEach((service) => {
    const providerKey = service.provider || service.llmService;
    const rawTitle = providerTitleMap.get(providerKey);
    const compiledTitle = rawTitle && compileLabel ? compileLabel(rawTitle) : rawTitle;
    const providerLabel = providerLabelMap.get(providerKey) || compiledTitle || rawTitle || providerKey;
    if (!grouped.has(providerKey)) {
      grouped.set(providerKey, { label: providerLabel, options: [] });
    }
    const group = grouped.get(providerKey);
    const needsServiceLabel = (providerServiceCounts.get(providerKey) || 0) > 1;
    service.enabledModels.forEach((model) => {
      const label = needsServiceLabel ? `${model.label} (${service.llmServiceTitle})` : model.label;
      group?.options.push({
        label,
        value: `${service.llmService}:${model.value}`,
      });
    });
  });

  return Array.from(grouped.values());
};
