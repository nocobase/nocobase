/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { getNodeContract } from './catalog';
import { throwBadRequest } from './errors';
import { FLOW_SURFACE_FILTER_GROUP_EXAMPLE, normalizeFlowSurfaceFilterGroupValue } from './filter-group';
import type { FlowSurfaceDomainContract, FlowSurfaceDomainGroupContract, FlowSurfaceNodeDomain } from './types';

const EMPTY_GRID_ITEM_UID = '__EMPTY__';

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
      return contract.mergeStrategy === 'replace'
        ? _.cloneDeep(nextValue)
        : mergeFlowSurfaceSettingsValue(currentValue || {}, nextValue);
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
            : mergeFlowSurfaceSettingsValue(currentValue?.[groupKey] || {}, normalizedValue);
      });
      return next;
    }
    const unknownKeys = Object.keys(nextValue).filter((key) => !contract.allowedKeys.includes(key));
    if (unknownKeys.length) {
      throwBadRequest(
        `flowSurfaces updateSettings domain '${domain}' on '${use}' does not allow keys: ${unknownKeys.join(', ')}`,
      );
    }
    const normalizedValue = normalizeDomainValue(nextValue, contract, {
      domain,
      use,
    });
    if (!Object.keys(normalizedValue).length) {
      return {};
    }
    const invalidValueTypes = collectTypedValueErrors(normalizedValue, contract.pathSchemas || {});
    if (invalidValueTypes.length) {
      throwBadRequest(
        `flowSurfaces updateSettings domain '${domain}' on '${use}' has invalid values: ${invalidValueTypes.join(
          ', ',
        )}`,
      );
    }
    const next = _.cloneDeep(currentValue || {});
    Object.entries(normalizedValue).forEach(([key, value]) => {
      next[key] =
        contract.mergeStrategy === 'replace' || !_.isPlainObject(value) || !Object.keys(value).length
          ? _.cloneDeep(value)
          : mergeFlowSurfaceSettingsValue(currentValue?.[key] || {}, value);
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

function mergeFlowSurfaceSettingsValue(currentValue: any, nextValue: any) {
  return _.mergeWith({}, currentValue || {}, nextValue, (_current, next) => {
    if (Array.isArray(next)) {
      return _.cloneDeep(next);
    }
    return undefined;
  });
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
    return collectSchemaValueErrors(candidate, schema, path);
  });
}

function collectSchemaValueErrors(value: any, schema: Record<string, any>, path: string): string[] {
  if (value === null) {
    return schema?.nullable === true ? [] : [`${path} expected ${schema?.type || 'value'}`];
  }
  switch (schema?.type) {
    case 'string':
      return typeof value === 'string' ? [] : [`${path} expected string`];
    case 'boolean':
      return typeof value === 'boolean' ? [] : [`${path} expected boolean`];
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? [] : [`${path} expected number`];
    case 'object':
      return _.isPlainObject(value) ? [] : [`${path} expected object`];
    case 'array':
      if (!Array.isArray(value)) {
        return [`${path} expected array`];
      }
      if (!schema.items) {
        return [];
      }
      return value.flatMap((item, index) => collectSchemaValueErrors(item, schema.items, `${path}[${index}]`));
    default:
      return [];
  }
}

function normalizeDomainValue(
  value: Record<string, any>,
  contract: FlowSurfaceDomainContract,
  context: { domain: FlowSurfaceNodeDomain; use: string },
) {
  const normalized = _.cloneDeep(value);
  Object.entries(contract.pathSchemas || {}).forEach(([path, schema]) => {
    if (!_.has(normalized, path) || !isFilterGroupSchema(schema)) {
      return;
    }
    _.set(normalized, path, normalizeFilterGroupValue(_.get(normalized, path), context, path));
  });
  return normalized;
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

function isFilterGroupSchema(schema: Record<string, any> | undefined) {
  return schema?.['x-flowSurfaceFormat'] === 'filter-group';
}

function normalizeFilterGroupValue(
  value: any,
  context: { domain: FlowSurfaceNodeDomain; groupKey?: string; use: string },
  path: string,
) {
  const domainPath = context.groupKey ? `${context.domain}.${context.groupKey}.${path}` : `${context.domain}.${path}`;
  return normalizeFlowSurfaceFilterGroupValue(
    value,
    `flowSurfaces updateSettings domain '${domainPath}' on '${context.use}' expects FilterGroup like ${FLOW_SURFACE_FILTER_GROUP_EXAMPLE}`,
  );
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
