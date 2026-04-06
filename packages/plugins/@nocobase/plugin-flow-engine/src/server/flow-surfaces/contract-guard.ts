/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { transformFilter } from '@nocobase/utils';
import { getNodeContract } from './catalog';
import { throwBadRequest } from './errors';
import type { FlowSurfaceDomainContract, FlowSurfaceDomainGroupContract, FlowSurfaceNodeDomain } from './types';

const EMPTY_GRID_ITEM_UID = '__EMPTY__';
const EMPTY_FILTER_GROUP = {
  logic: '$and',
  items: [],
};
const FILTER_GROUP_EXAMPLE = JSON.stringify(EMPTY_FILTER_GROUP);

export class FlowSurfaceContractGuard {
  mergeDomainValue(
    domain: FlowSurfaceNodeDomain,
    currentValue: any,
    nextValue: any,
    contract: FlowSurfaceDomainContract,
    use: string,
  ) {
    if (!_.isPlainObject(nextValue)) {
      throwBadRequest(`flowSurfaces updateSettings domain '${domain}' on '${use}' requires an object payload`);
    }
    if (contract.wildcard) {
      if (!Object.keys(nextValue).length) {
        return {};
      }
      return contract.mergeStrategy === 'replace' ? _.cloneDeep(nextValue) : _.merge({}, currentValue || {}, nextValue);
    }
    if (contract.groups) {
      const unknownGroups = Object.keys(nextValue).filter((key) => !contract.allowedKeys.includes(key));
      if (unknownGroups.length) {
        throwBadRequest(
          `flowSurfaces updateSettings domain '${domain}' on '${use}' does not allow groups: ${unknownGroups.join(
            ', ',
          )}`,
        );
      }
      const next = _.cloneDeep(currentValue || {});
      Object.entries(nextValue).forEach(([groupKey, value]) => {
        const groupContract = contract.groups?.[groupKey];
        if (!groupContract) {
          return;
        }
        if (value === null || (_.isPlainObject(value) && !Object.keys(value).length)) {
          if (!groupContract.clearable) {
            throwBadRequest(
              `flowSurfaces updateSettings domain '${domain}.${groupKey}' on '${use}' does not support clearing`,
            );
          }
          next[groupKey] = {};
          return;
        }
        if (!_.isPlainObject(value)) {
          throwBadRequest(
            `flowSurfaces updateSettings domain '${domain}.${groupKey}' on '${use}' requires an object payload`,
          );
        }
        const normalizedValue = normalizeGroupValue(value, groupContract, {
          domain,
          groupKey,
          use,
        });
        const invalidPaths = collectLeafPaths(normalizedValue).filter(
          (path) => !isAllowedGroupPath(groupContract, path),
        );
        if (invalidPaths.length) {
          throwBadRequest(
            `flowSurfaces updateSettings domain '${domain}.${groupKey}' on '${use}' does not allow paths: ${invalidPaths.join(
              ', ',
            )}`,
          );
        }
        const invalidValueTypes = collectTypedValueErrors(normalizedValue, groupContract.pathSchemas || {});
        if (invalidValueTypes.length) {
          throwBadRequest(
            `flowSurfaces updateSettings domain '${domain}.${groupKey}' on '${use}' has invalid values: ${invalidValueTypes.join(
              ', ',
            )}`,
          );
        }
        next[groupKey] =
          groupContract.mergeStrategy === 'replace'
            ? _.cloneDeep(normalizedValue)
            : _.merge({}, currentValue?.[groupKey] || {}, normalizedValue);
      });
      return next;
    }
    const unknownKeys = Object.keys(nextValue).filter((key) => !contract.allowedKeys.includes(key));
    if (unknownKeys.length) {
      throwBadRequest(
        `flowSurfaces updateSettings domain '${domain}' on '${use}' does not allow keys: ${unknownKeys.join(', ')}`,
      );
    }
    if (!Object.keys(nextValue).length) {
      return {};
    }
    const next = _.cloneDeep(currentValue || {});
    Object.entries(nextValue).forEach(([key, value]) => {
      next[key] =
        contract.mergeStrategy === 'replace' || !_.isPlainObject(value) || !Object.keys(value).length
          ? _.cloneDeep(value)
          : _.merge({}, currentValue?.[key] || {}, value);
    });
    return next;
  }

  validateFlowRegistry(node: any, flowRegistry: Record<string, any>) {
    if (!_.isPlainObject(flowRegistry)) {
      throwBadRequest('flowSurfaces setEventFlows requires an object flowRegistry');
    }
    const contract = getNodeContract(node?.use);
    const allowedDirectEvents = new Set(contract.eventCapabilities?.direct || []);
    const allowedObjectEvents = new Set(contract.eventCapabilities?.object || []);
    const stepParamGroups = contract.domains.stepParams?.groups || {};
    Object.entries(flowRegistry).forEach(([key, flow]) => {
      if (!_.isPlainObject(flow)) {
        throwBadRequest(`flowSurfaces flow '${key}' must be an object`);
      }
      const on = flow.on;
      if (!on) {
        return;
      }
      const onObj = typeof on === 'string' ? { eventName: on } : on;
      const eventName = onObj?.eventName;
      if (!eventName || typeof eventName !== 'string') {
        throwBadRequest(`flowSurfaces flow '${key}' has invalid eventName`);
      }
      if (typeof on === 'string' && !allowedDirectEvents.has(eventName)) {
        throwBadRequest(`flowSurfaces flow '${key}' event '${eventName}' is not allowed on '${node?.use}'`);
      }
      if (typeof on !== 'string' && !allowedObjectEvents.has(eventName)) {
        throwBadRequest(`flowSurfaces flow '${key}' event '${eventName}' is not allowed on '${node?.use}'`);
      }
      const phase = onObj?.phase;
      const allowedPhases = ['beforeAllFlows', 'afterAllFlows', 'beforeFlow', 'afterFlow', 'beforeStep', 'afterStep'];
      if (phase && !allowedPhases.includes(phase)) {
        throwBadRequest(`flowSurfaces flow '${key}' has invalid phase '${phase}'`);
      }
      if (['beforeFlow', 'afterFlow', 'beforeStep', 'afterStep'].includes(phase) && !onObj.flowKey) {
        throwBadRequest(`flowSurfaces flow '${key}' requires flowKey for phase '${phase}'`);
      }
      if (['beforeStep', 'afterStep'].includes(phase) && !onObj.stepKey) {
        throwBadRequest(`flowSurfaces flow '${key}' requires stepKey for phase '${phase}'`);
      }
      if (onObj.flowKey && !stepParamGroups[onObj.flowKey]) {
        throwBadRequest(`flowSurfaces flow '${key}' references unknown flowKey '${onObj.flowKey}' on '${node?.use}'`);
      }
      const allowedStepKeys = stepParamGroups[onObj.flowKey]?.eventBindingSteps;
      if (
        onObj.stepKey &&
        allowedStepKeys !== '*' &&
        Array.isArray(allowedStepKeys) &&
        !allowedStepKeys.includes(onObj.stepKey)
      ) {
        throwBadRequest(
          `flowSurfaces flow '${key}' references unknown stepKey '${onObj.stepKey}' for flowKey '${onObj.flowKey}' on '${node?.use}'`,
        );
      }
      if (onObj.flowKey) {
        const flowGroupContract = stepParamGroups[onObj.flowKey];
        const flowGroup = node?.stepParams?.[onObj.flowKey];
        const contractDefinesFlow = isContractDefinedFlowGroup(flowGroupContract);
        const implicitStepAvailable = isImplicitContractStep(flowGroupContract, onObj.stepKey);
        if ((!_.isPlainObject(flowGroup) || !Object.keys(flowGroup).length) && !contractDefinesFlow) {
          throwBadRequest(
            `flowSurfaces flow '${key}' references unavailable flowKey '${onObj.flowKey}' on '${node?.use}'`,
          );
        }
        if (onObj.stepKey && _.isNil(flowGroup?.[onObj.stepKey]) && !implicitStepAvailable) {
          throwBadRequest(
            `flowSurfaces flow '${key}' references unavailable stepKey '${onObj.stepKey}' for flowKey '${onObj.flowKey}' on '${node?.use}'`,
          );
        }
      }
    });
  }

  validateLayout(
    grid: any,
    layout: { rows: Record<string, string[][]>; sizes: Record<string, number[]>; rowOrder: string[] },
  ) {
    const itemUids = new Set(_.castArray(grid?.subModels?.items || []).map((item) => item.uid));
    const seen = new Set<string>();
    Object.entries(layout.rows || {}).forEach(([rowId, cells]) => {
      _.castArray(cells).forEach((cell) => {
        _.castArray(cell).forEach((itemUid) => {
          if (itemUid === EMPTY_GRID_ITEM_UID) {
            return;
          }
          if (!itemUids.has(itemUid)) {
            throwBadRequest(`flowSurfaces layout item '${itemUid}' does not exist under grid '${grid.uid}'`);
          }
          if (seen.has(itemUid)) {
            throwBadRequest(`flowSurfaces layout item '${itemUid}' is duplicated under grid '${grid.uid}'`);
          }
          seen.add(itemUid);
        });
      });

      const sizeArray = layout.sizes?.[rowId];
      if (!sizeArray) {
        throwBadRequest(`flowSurfaces layout row '${rowId}' requires sizes definition`);
      }
      if (sizeArray.length !== _.castArray(cells).length) {
        throwBadRequest(`flowSurfaces layout sizes length of row '${rowId}' does not match columns length`);
      }
    });

    const declaredRows = Object.keys(layout.rows || {});
    if (
      _.difference(declaredRows, layout.rowOrder || []).length ||
      _.difference(layout.rowOrder || [], declaredRows).length
    ) {
      throwBadRequest('flowSurfaces layout rowOrder must match rows');
    }
    if ((layout.rowOrder || []).length !== new Set(layout.rowOrder || []).size) {
      throwBadRequest('flowSurfaces layout rowOrder contains duplicate row ids');
    }
    if (seen.size !== itemUids.size) {
      const missing = Array.from(itemUids).filter((uid) => !seen.has(uid));
      throwBadRequest(`flowSurfaces layout must cover all grid children, missing: ${missing.join(', ')}`);
    }
  }

  validateNodeTreeAgainstContract(node: any) {
    if (!node?.use) {
      return;
    }

    const contract = getNodeContract(node.use);
    (['props', 'decoratorProps', 'stepParams', 'flowRegistry'] as FlowSurfaceNodeDomain[]).forEach((domain) => {
      if (_.isUndefined(node[domain])) {
        return;
      }
      if (_.isPlainObject(node[domain]) && !Object.keys(node[domain]).length) {
        return;
      }
      if (!contract.editableDomains.includes(domain)) {
        throwBadRequest(`flowSurfaces create tree domain '${domain}' is not editable on '${node.use}'`);
      }
      const domainContract = contract.domains[domain];
      if (!domainContract) {
        throwBadRequest(`flowSurfaces create tree domain '${domain}' is not supported by '${node.use}'`);
      }
      node[domain] = this.mergeDomainValue(domain, undefined, node[domain], domainContract, node.use);
    });

    if (_.isPlainObject(node.flowRegistry) && Object.keys(node.flowRegistry).length) {
      this.validateFlowRegistry(node, node.flowRegistry);
    }

    Object.values(node.subModels || {}).forEach((value) => {
      _.castArray(value as any).forEach((child) => this.validateNodeTreeAgainstContract(child));
    });
  }
}

function matchesContractPath(pattern: string, path: string) {
  if (pattern === '*') {
    return true;
  }
  if (pattern === path) {
    return true;
  }
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return path === prefix || path.startsWith(`${prefix}.`);
  }
  return false;
}

function isAllowedGroupPath(groupContract: FlowSurfaceDomainGroupContract, path: string) {
  return groupContract.allowedPaths.some((pattern) => {
    if (matchesContractPath(pattern, path)) {
      return true;
    }
    const schema = groupContract.pathSchemas?.[pattern];
    return schema?.type === 'object' && path.startsWith(`${pattern}.`);
  });
}

function collectLeafPaths(value: any, prefix = ''): string[] {
  if (!_.isPlainObject(value) || !Object.keys(value).length) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(value).flatMap(([key, nested]) => collectLeafPaths(nested, prefix ? `${prefix}.${key}` : key));
}

function collectTypedValueErrors(value: any, pathSchemas: Record<string, Record<string, any>>): string[] {
  return Object.entries(pathSchemas).flatMap(([path, schema]) => {
    if (!_.has(value, path)) {
      return [];
    }
    const candidate = _.get(value, path);
    return matchesValueSchema(candidate, schema) ? [] : [`${path} expected ${schema.type}`];
  });
}

function normalizeGroupValue(
  value: Record<string, any>,
  groupContract: FlowSurfaceDomainGroupContract,
  context: { domain: FlowSurfaceNodeDomain; groupKey: string; use: string },
) {
  const normalized = _.cloneDeep(value);
  Object.entries(groupContract.pathSchemas || {}).forEach(([path, schema]) => {
    if (!_.has(normalized, path) || !isFilterGroupSchema(schema)) {
      return;
    }
    _.set(normalized, path, normalizeFilterGroupValue(_.get(normalized, path), context, path));
  });
  return normalized;
}

function matchesValueSchema(value: any, schema: Record<string, any>) {
  if (value === null) {
    return schema?.nullable === true;
  }
  switch (schema?.type) {
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'object':
      return _.isPlainObject(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
}

function isFilterGroupSchema(schema: Record<string, any> | undefined) {
  return schema?.['x-flowSurfaceFormat'] === 'filter-group';
}

function normalizeFilterGroupValue(
  value: any,
  context: { domain: FlowSurfaceNodeDomain; groupKey: string; use: string },
  path: string,
) {
  if (value === null || (_.isPlainObject(value) && !Object.keys(value).length)) {
    return _.cloneDeep(EMPTY_FILTER_GROUP);
  }

  try {
    assertFilterGroupShape(value);
    transformFilter(value);
    return _.cloneDeep(value);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throwBadRequest(
      `flowSurfaces updateSettings domain '${context.domain}.${context.groupKey}.${path}' on '${context.use}' expects FilterGroup like ${FILTER_GROUP_EXAMPLE}: ${reason}`,
    );
  }
}

function assertFilterGroupShape(filter: any) {
  if (!_.isPlainObject(filter)) {
    throwBadRequest('Invalid filter: filter must be an object');
  }
  if (!('logic' in filter) || !('items' in filter)) {
    throwBadRequest('Invalid filter: filter must have logic and items properties');
  }
  if (filter.logic !== '$and' && filter.logic !== '$or') {
    throwBadRequest("Invalid filter: logic must be '$and' or '$or'");
  }
  if (!Array.isArray(filter.items)) {
    throwBadRequest('Invalid filter: items must be an array');
  }
  filter.items.forEach((item) => {
    if (_.isPlainObject(item) && 'logic' in item && 'items' in item) {
      assertFilterGroupShape(item);
      return;
    }
    if (_.isPlainObject(item) && typeof item.path === 'string' && typeof item.operator === 'string') {
      return;
    }
    throwBadRequest('Invalid filter item type');
  });
}

function isContractDefinedFlowGroup(groupContract: FlowSurfaceDomainGroupContract | undefined) {
  if (!groupContract) {
    return false;
  }
  if (!Array.isArray(groupContract.allowedPaths) || groupContract.allowedPaths.length === 0) {
    return true;
  }
  return hasImplicitContractSteps(groupContract);
}

function hasImplicitContractSteps(groupContract: FlowSurfaceDomainGroupContract) {
  if (groupContract.eventBindingSteps === '*') {
    return false;
  }
  return _.castArray(groupContract.eventBindingSteps || []).some((stepKey) =>
    isImplicitContractStep(groupContract, stepKey),
  );
}

function isImplicitContractStep(
  groupContract: FlowSurfaceDomainGroupContract | undefined,
  stepKey: string | undefined,
) {
  if (!groupContract || !stepKey) {
    return false;
  }
  if (
    groupContract.eventBindingSteps !== '*' &&
    !_.castArray(groupContract.eventBindingSteps || []).includes(stepKey)
  ) {
    return false;
  }
  return !_.castArray(groupContract.allowedPaths || []).some(
    (pattern) => pattern === stepKey || pattern === `${stepKey}.*` || pattern.startsWith(`${stepKey}.`),
  );
}
