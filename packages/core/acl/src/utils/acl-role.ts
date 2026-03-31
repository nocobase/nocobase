/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { assign } from '@nocobase/utils';
import _ from 'lodash';
import { ACLRole } from '../acl-role';

export function mergeRole(roles: ACLRole[]) {
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
  adjustActionByStrategy(roles, result);
  return result;
}

/**
 * When merging permissions from multiple roles, if strategy.actions allows certain actions, then those actions have higher priority.
 * For example, [
 * {
 *  actions: {
 *    'users:view': {...},
 *    'users:create': {...}
 *  },
 *  strategy: {
 *    actions: ['view']
 *  }
 * }]
 * finally result: [{
 *  actions: {
 *    'users:create': {...},
 *    'users:view': {} // all view
 * },
 * {
 *  strategy: {
 *    actions: ['view']
 * }]
 **/
function adjustActionByStrategy(
  roles,
  result: {
    actions?: Record<string, object>;
    strategy?: { actions?: string[] };
    resources?: string[];
  },
) {
  const { actions, strategy } = result;
  const actionSet = getAdjustActions(roles);
  if (!_.isEmpty(actions) && !_.isEmpty(strategy?.actions) && !_.isEmpty(result.resources)) {
    for (const resource of result.resources) {
      for (const action of strategy.actions) {
        if (actionSet.has(action)) {
          actions[`${resource}:${action}`] = {};
        }
      }
    }
  }
}

function getAdjustActions(roles: ACLRole[]) {
  const actionSet = new Set<string>();
  for (const role of roles) {
    const jsonRole = role.toJSON();
    // Within the same role, actions have higher priority than strategy.actions.
    if (!_.isEmpty(jsonRole.strategy?.['actions']) && _.isEmpty(jsonRole.actions)) {
      jsonRole.strategy['actions'].forEach((x) => !x.includes('own') && actionSet.add(x));
    }
  }
  return actionSet;
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
  if (_.isEmpty(sourceActions)) return newActions;
  if (_.isEmpty(newActions)) return sourceActions;

  const result = {};
  [...new Set(Reflect.ownKeys(sourceActions).concat(Reflect.ownKeys(newActions)))].forEach((key) => {
    if (_.has(sourceActions, key) && _.has(newActions, key)) {
      result[key] = mergeAclActionParams(sourceActions[key], newActions[key]);
      return;
    }
    result[key] = _.has(sourceActions, key) ? sourceActions[key] : newActions[key];
  });

  return result;
}

function mergeRoleSnippets(allRoleSnippets: string[][]): string[] {
  if (!allRoleSnippets.length) {
    return [];
  }

  const allSnippets = allRoleSnippets.flat();
  const isExclusion = (value) => value.startsWith('!');
  const includes = new Set(allSnippets.filter((x) => !isExclusion(x)));
  const excludes = new Set(allSnippets.filter(isExclusion));

  // 统计 xxx.* 在多少个角色中存在
  const domainRoleMap = new Map<string, Set<number>>();
  allRoleSnippets.forEach((roleSnippets, i) => {
    roleSnippets
      .filter((x) => x.endsWith('.*') && !isExclusion(x))
      .forEach((include) => {
        const domain = include.slice(0, -1);
        if (!domainRoleMap.has(domain)) {
          domainRoleMap.set(domain, new Set());
        }
        domainRoleMap.get(domain).add(i);
      });
  });

  // 处理黑名单交集（只有所有角色都有 `!xxx` 才保留）
  const excludesSet = new Set<string>();
  for (const snippet of excludes) {
    if (allRoleSnippets.every((x) => x.includes(snippet))) {
      excludesSet.add(snippet);
    }
  }

  for (const [domain, indexes] of domainRoleMap.entries()) {
    const fullDomain = `${domain}.*`;

    // xxx.* 存在时，覆盖 !xxx.*
    if (includes.has(fullDomain)) {
      excludesSet.delete(`!${fullDomain}`);
    }

    // 计算 !xxx.yyy，当所有 xxx.* 角色都包含 !xxx.yyy 时才保留
    for (const roleIndex of indexes) {
      for (const exclude of allRoleSnippets[roleIndex]) {
        if (exclude.startsWith(`!${domain}`) && exclude !== `!${fullDomain}`) {
          if ([...indexes].every((i) => allRoleSnippets[i].includes(exclude))) {
            excludesSet.add(exclude);
          }
        }
      }
    }
  }

  // 确保 !xxx.yyy 只有在 xxx.* 存在时才有效，同时解决 [xxx] 和 [!xxx] 冲突
  if (includes.size > 0) {
    for (const x of [...excludesSet]) {
      const exactMatch = x.slice(1);
      const segments = exactMatch.split('.');
      if (segments.length > 1 && segments[1] !== '*') {
        const parentDomain = segments[0] + '.*';
        if (!includes.has(parentDomain)) {
          excludesSet.delete(x);
        }
      }
    }
  }

  return [...includes, ...excludesSet];
}

function mergeRoleResources(sourceResources, newResources) {
  if (sourceResources === null) {
    return newResources;
  }

  return [...new Set(sourceResources.concat(newResources))];
}

export function mergeAclActionParams(sourceParams, targetParams) {
  if (_.isEmpty(sourceParams) || _.isEmpty(targetParams)) {
    return {};
  }

  // source 和 target 其中之一没有 fields 字段时, 最终希望没有此字段
  removeUnmatchedParams(sourceParams, targetParams, ['fields', 'whitelist', 'appends']);

  const andMerge = (x, y) => {
    if (_.isEmpty(x) || _.isEmpty(y)) {
      return [];
    }
    return _.uniq(x.concat(y)).filter(Boolean);
  };

  const mergedParams = assign(targetParams, sourceParams, {
    own: (x, y) => x || y,
    filter: (x, y) => {
      if (_.isEmpty(x) || _.isEmpty(y)) {
        return {};
      }
      const xHasOr = _.has(x, '$or'),
        yHasOr = _.has(y, '$or');
      let $or = [x, y];
      if (xHasOr && !yHasOr) {
        $or = [...x.$or, y];
      } else if (!xHasOr && yHasOr) {
        $or = [x, ...y.$or];
      } else if (xHasOr && yHasOr) {
        $or = [...x.$or, ...y.$or];
      }

      return { $or: _.uniqWith($or, _.isEqual) };
    },
    fields: andMerge,
    whitelist: andMerge,
    appends: 'union',
  });
  removeEmptyParams(mergedParams);
  return mergedParams;
}

export function removeEmptyParams(params) {
  if (!_.isObject(params)) {
    return;
  }
  Object.keys(params).forEach((key) => {
    if (_.isEmpty(params[key])) {
      delete params[key];
    }
  });
}

function removeUnmatchedParams(source, target, keys: string[]) {
  for (const key of keys) {
    if (_.has(source, key) && !_.has(target, key)) {
      delete source[key];
    }
    if (!_.has(source, key) && _.has(target, key)) {
      delete target[key];
    }
  }
}
