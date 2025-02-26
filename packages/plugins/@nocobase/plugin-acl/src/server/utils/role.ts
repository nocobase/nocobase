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
    strategy: {},
    actions: null,
    snippets: [],
    resources: null,
  };
  const allSnippets: string[][] = [];
  for (const role of roles) {
    const jsonRole = role.toJSON();
    result.roles = mergeRoleNames(result.roles, jsonRole.role);
    result.strategy = mergeRoleStrategy(result.strategy, jsonRole.strategy);
    result.actions = mergeRoleActions(result.actions, jsonRole.actions);
    result.resources = mergeRoleResources(result.resources, [...role.resources.keys()]);
    if (_.isArray(jsonRole.snippets)) {
      allSnippets.push(jsonRole.snippets);
    }
  }
  result.snippets = mergeRoleSnippets(allSnippets);
  return result;
}

function mergeRoleNames(sourceRoleNames, newRoleName) {
  return newRoleName ? sourceRoleNames.concat(newRoleName) : sourceRoleNames;
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

function mergeRoleActions(sourceActions, newActions) {
  // 不同参数的合并策略不一样，先简单处理
  return _.merge(sourceActions, newActions);
}

function mergeRoleSnippets(allRoleSnippets: string[][]): string[] {
  if (!allRoleSnippets.length) {
    return [];
  }

  const allSnippets = allRoleSnippets.flat();
  const isExclusion = (value) => value.startsWith('!');
  const includes = new Set(allSnippets.filter((x) => !isExclusion(x)));
  const excludes = new Set(allSnippets.filter((x) => isExclusion(x)));

  // 处理黑名单的交集：比如 ['a.*', '!a.b.*'] 和 ['a.*', '!a.b.*', '!a.c.*']，最终取 ['a.*', '!a.b.*']
  const excludesSet = new Set<string>();
  excludes.forEach((snippet) => {
    // 取交集：所有角色都有这个黑名单
    const allHas = allRoleSnippets.every((x) => x.includes(snippet));
    if (allHas) {
      excludesSet.add(snippet);
    }
  });

  // 处理冲突项，比如 ['a'] 和 ['!a']，最终取 ['a']
  excludesSet.forEach((x) => includes.has(x.slice(1)) && excludesSet.delete(x));

  const result = [...includes];
  excludesSet.forEach((x) => result.push(x));

  return result;
}

function mergeRoleResources(sourceResources, newResources) {
  if (sourceResources === null) {
    return newResources;
  }

  return [...new Set(sourceResources.concat(newResources))];
}
