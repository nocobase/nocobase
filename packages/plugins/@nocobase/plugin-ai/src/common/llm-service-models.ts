/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type ModelIdIssueType = 'required' | 'duplicate';

export type ModelIdIssue = {
  index: number;
  type: ModelIdIssueType;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const getCustomModels = (enabledModels: unknown): unknown[] | undefined => {
  if (!isRecord(enabledModels) || enabledModels.mode !== 'custom' || !Array.isArray(enabledModels.models)) {
    return undefined;
  }
  return enabledModels.models;
};

export const normalizeCustomModelIds = (enabledModels: unknown): unknown => {
  const models = getCustomModels(enabledModels);
  if (!models || !isRecord(enabledModels)) {
    return enabledModels;
  }

  return {
    ...enabledModels,
    models: models.map((model) => {
      if (!isRecord(model)) {
        return model;
      }
      return {
        ...model,
        label: typeof model.label === 'string' ? model.label.trim() : model.label,
        value: typeof model.value === 'string' ? model.value.trim() : model.value,
      };
    }),
  };
};

export const getCustomModelIdIssues = (enabledModels: unknown): ModelIdIssue[] => {
  const models = getCustomModels(enabledModels);
  if (!models) {
    return [];
  }

  const seenModelIds = new Set<string>();
  const issues: ModelIdIssue[] = [];
  models.forEach((model, index) => {
    const modelId = isRecord(model) && typeof model.value === 'string' ? model.value.trim() : '';
    if (!modelId) {
      issues.push({ index, type: 'required' });
      return;
    }
    if (seenModelIds.has(modelId)) {
      issues.push({ index, type: 'duplicate' });
      return;
    }
    seenModelIds.add(modelId);
  });
  return issues;
};
