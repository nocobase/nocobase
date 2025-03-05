/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import _ from 'lodash';

export function mergeOptions(fieldOptions, modelOptions) {
  const newOptions = {
    ...fieldOptions,
    ...modelOptions,
  };

  for (const key of Object.keys(modelOptions)) {
    if (modelOptions[key] === null && fieldOptions[key]) {
      newOptions[key] = fieldOptions[key];
    }
  }
  return newOptions;
}

export function mergeRole(roles) {
  const result: Record<string, any> = {
    strategy: {},
    actions: null,
    resources: null,
  };
  for (const role of roles) {
    const jsonRole = role.toJSON();
    result.strategy = mergeRoleStrategy(result.strategy, jsonRole.strategy);
    result.actions = mergeRoleActions(result.actions, jsonRole.actions);
    result.resources = mergeRoleResources(result.resources, [...role.resources.keys()]);
  }
  return result;
}

function mergeRoleResources(sourceResources, newResources) {
  if (sourceResources === null) {
    return newResources;
  }

  return [...new Set(sourceResources.concat(newResources))];
}

function mergeRoleActions(sourceActions, newActions) {
  // 不同参数的合并策略不一样，先简单处理
  return _.merge(sourceActions, newActions);
}

function mergeRoleStrategy(sourceStrategy, newStrategy) {
  if (!newStrategy) {
    return sourceStrategy;
  }
  if (_.isArray(newStrategy.actions)) {
    if (!sourceStrategy.actions) {
      sourceStrategy.actions = newStrategy.actions;
    } else {
      const actions = sourceStrategy.actions.concat(newStrategy.actions);
      return {
        ...sourceStrategy,
        actions: [...new Set(actions)],
      };
    }
  }
  return sourceStrategy;
}
