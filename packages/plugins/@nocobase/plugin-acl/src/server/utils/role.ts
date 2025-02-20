/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';

export function mergeRole(roles) {
  const result: Record<string, any> = {
    roles: [],
    strategy: {
      actions: [],
    },
    actions: null,
    snippets: [],
    resources: null,
  };
  for (const role of roles) {
    const jsonRole = role.toJSON();
    result.roles = mergeRoleNames(result.roles, jsonRole.role);
    result.strategy = mergeRoleStrategy(result.strategy, jsonRole.strategy);
    result.actions = mergeRoleActions(result.actions, jsonRole.actions);
    result.snippets = mergeRoleSnippets(result.snippets, jsonRole.snippets);
    result.resources = mergeRoleResources(result.resources, [...role.resources.keys()]);
  }
  return result;
}

function mergeRoleNames(sourceRoleNames, newRoleName) {
  return newRoleName ? sourceRoleNames.concat(newRoleName) : sourceRoleNames;
}

function mergeRoleStrategy(sourceStrategy, newStrategy) {
  const actions = sourceStrategy.actions.concat(newStrategy.actions);
  return {
    ...sourceStrategy,
    actions: [...new Set(actions)],
  };
}

function mergeRoleActions(sourceActions, newActions = {}) {
  // {} 为最大权限，两者合并取最大权限
  const isObjectEmpty = (value) => {
    return _.isObject(value) && Object.keys(value).length === 0;
  };
  if (isObjectEmpty(sourceActions) || isObjectEmpty(newActions)) {
    return {};
  }
  // 不同参数的合并策略不一样，先简单处理
  return _.merge(sourceActions, newActions);
}

function mergeRoleSnippets(sourceSnippets, newSnippets = []) {
  const allSnippets = Array.from(new Set([...sourceSnippets, ...newSnippets]));

  return allSnippets
    .map((snippet) => {
      const isExclusion = snippet.startsWith('!');
      const newSnippet = isExclusion ? snippet.slice(1) : snippet;
      // 如果同时出现包含和排除，选择包含，如 ['!a', 'a'] 最后选择 ['a']
      if (isExclusion && allSnippets.includes(newSnippet)) {
        return undefined;
      }
      return newSnippet;
    })
    .filter((x) => Boolean(x));
}

function mergeRoleResources(sourceResources, newResources) {
  if (sourceResources === null) {
    return newResources;
  }

  const isEmptyArray = (value) => {
    return _.isArray(value) && value.length === 0;
  };
  if (isEmptyArray(sourceResources) || isEmptyArray(newResources)) {
    return [];
  }
  return [...new Set(sourceResources.concat(newResources))];
}
