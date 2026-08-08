/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type {
  FlowSurfaceCatalogExpandFlags,
  FlowSurfaceCatalogItemOptionalFieldsOptions,
  FlowSurfaceCatalogItemOptionalFieldsProviders,
  FlowSurfaceCatalogNodeProjectInput,
  FlowSurfaceCatalogNodeProjectResult,
  FlowSurfaceCatalogProjectItemOptions,
  FlowSurfaceCatalogProjectableItem,
  FlowSurfaceCatalogProjectedItem,
  FlowSurfaceFieldCatalogProjectableItem,
  FlowSurfaceFieldCatalogLightCandidate,
} from './catalog-smart.types';
import type { FlowSurfaceNodeContract } from './types';

const LIGHT_CATALOG_ITEM_KEYS = [
  'key',
  'label',
  'use',
  'kind',
  'scope',
  'scene',
  'fieldUse',
  'wrapperUse',
  'associationPathName',
  'defaultTargetUid',
  'targetBlockUid',
  'requiredInitParams',
  'createSupported',
  'renderer',
  'type',
] as const;

function pickLightCatalogItem(item: FlowSurfaceCatalogProjectableItem): FlowSurfaceCatalogProjectedItem {
  const projected = _.pick(item, LIGHT_CATALOG_ITEM_KEYS) as FlowSurfaceCatalogProjectedItem;

  if (item.resourceBindings?.length) {
    projected.resourceBindings = item.resourceBindings;
  }

  return _.pickBy(projected, (value) => !_.isUndefined(value)) as FlowSurfaceCatalogProjectedItem;
}

function mergeCatalogNodeContracts(...contracts: FlowSurfaceNodeContract[]): FlowSurfaceNodeContract {
  return _.mergeWith({}, ...contracts, (currentValue, nextValue) => {
    if (Array.isArray(currentValue) && Array.isArray(nextValue)) {
      return _.uniq([...currentValue, ...nextValue]);
    }
    return undefined;
  }) as FlowSurfaceNodeContract;
}

function buildSettingsSchema(contract: FlowSurfaceNodeContract) {
  return Object.fromEntries(
    Object.entries(contract.domains).map(([domain, definition]) => [
      domain,
      {
        ...definition?.schema,
        'x-allowedKeys': definition?.allowedKeys || [],
        'x-wildcard': !!definition?.wildcard,
        'x-mergeStrategy': definition?.mergeStrategy || 'deep',
        'x-pathSchemas': definition?.pathSchemas,
        'x-groups': definition?.groups
          ? Object.fromEntries(
              Object.entries(definition.groups).map(([groupKey, group]) => [
                groupKey,
                {
                  allowedPaths: group.allowedPaths,
                  clearable: !!group.clearable,
                  mergeStrategy: group.mergeStrategy,
                  eventBindingSteps: group.eventBindingSteps,
                  pathSchemas: group.pathSchemas,
                },
              ]),
            )
          : undefined,
      },
    ]),
  );
}

function resolveCatalogItemContract(
  item: FlowSurfaceCatalogProjectableItem,
  options: FlowSurfaceCatalogProjectItemOptions,
) {
  const wrapperContract = options.getNodeContract(item.use);
  const isBoundJsField = item.kind === 'field' && item.renderer === 'js' && item.fieldUse && item.fieldUse !== item.use;
  if (!isBoundJsField) {
    return {
      contract: wrapperContract,
      composite: false,
    };
  }
  return {
    contract: mergeCatalogNodeContracts(wrapperContract, options.getNodeContract(item.fieldUse)),
    composite: true,
  };
}

export function buildCatalogItemOptionalFields(
  use: string | undefined,
  options: FlowSurfaceCatalogItemOptionalFieldsOptions = {},
  providers: FlowSurfaceCatalogItemOptionalFieldsProviders,
) {
  const projected: Record<string, any> = {};

  if (options.includeContracts) {
    const contract = providers.getNodeContract(use);
    projected.editableDomains = providers.getEditableDomains(use);
    projected.settingsSchema = providers.getSettingsSchema(use);
    projected.settingsContract = contract?.domains;
    projected.eventCapabilities = contract?.eventCapabilities;
    projected.layoutCapabilities = contract?.layoutCapabilities;
  }

  if (options.includeConfigureOptions) {
    projected.configureOptions = providers.getConfigureOptions(use);
  }

  return _.pickBy(projected, (value) => !_.isUndefined(value));
}

export function buildFieldCatalogLightCandidate(
  item: FlowSurfaceFieldCatalogProjectableItem,
): FlowSurfaceFieldCatalogLightCandidate {
  return pickLightCatalogItem({
    ...item,
    kind: 'field',
  });
}

export function projectCatalogItem(
  item: FlowSurfaceCatalogProjectableItem,
  expand: FlowSurfaceCatalogExpandFlags,
  options: FlowSurfaceCatalogProjectItemOptions,
): FlowSurfaceCatalogProjectedItem {
  const projected = pickLightCatalogItem(item);

  if (expand.includeItemAllowedContainerUses && item.allowedContainerUses?.length) {
    projected.allowedContainerUses = item.allowedContainerUses;
  }

  if (expand.includeItemConfigureOptions) {
    projected.configureOptions = !_.isUndefined(item.configureOptions)
      ? item.configureOptions
      : options.getConfigureOptions(item);
  }

  if (expand.includeItemContracts) {
    const resolvedContract = resolveCatalogItemContract(item, options);
    const contract = resolvedContract.contract;
    projected.editableDomains = resolvedContract.composite
      ? contract.editableDomains
      : !_.isUndefined(item.editableDomains)
        ? item.editableDomains
        : options.getEditableDomains(item.use);
    projected.settingsSchema = resolvedContract.composite
      ? buildSettingsSchema(contract)
      : !_.isUndefined(item.settingsSchema)
        ? item.settingsSchema
        : options.getSettingsSchema(item.use);
    projected.settingsContract = resolvedContract.composite
      ? contract.domains
      : !_.isUndefined(item.settingsContract)
        ? item.settingsContract
        : contract.domains;
    projected.eventCapabilities = resolvedContract.composite
      ? contract.eventCapabilities
      : !_.isUndefined(item.eventCapabilities)
        ? item.eventCapabilities
        : contract.eventCapabilities;
    projected.layoutCapabilities = resolvedContract.composite
      ? contract.layoutCapabilities
      : !_.isUndefined(item.layoutCapabilities)
        ? item.layoutCapabilities
        : contract.layoutCapabilities;
  }

  return _.pickBy(projected, (value) => !_.isUndefined(value)) as FlowSurfaceCatalogProjectedItem;
}

export function expandFieldCatalogCandidate(
  item: FlowSurfaceFieldCatalogProjectableItem,
  expand: FlowSurfaceCatalogExpandFlags,
  options: FlowSurfaceCatalogProjectItemOptions,
): FlowSurfaceCatalogProjectedItem {
  return projectCatalogItem(buildFieldCatalogLightCandidate(item), expand, options);
}
export function projectCatalogNode(
  node: any,
  resolved: FlowSurfaceCatalogNodeProjectInput['resolved'],
  expand: FlowSurfaceCatalogExpandFlags,
  options: FlowSurfaceCatalogNodeProjectInput['options'],
): FlowSurfaceCatalogNodeProjectResult;
export function projectCatalogNode(
  node: any,
  resolved: FlowSurfaceCatalogNodeProjectInput['resolved'],
  expand: FlowSurfaceCatalogExpandFlags,
  options: FlowSurfaceCatalogNodeProjectInput['options'],
): FlowSurfaceCatalogNodeProjectResult {
  const input: FlowSurfaceCatalogNodeProjectInput = {
    node,
    resolved: resolved || null,
    expand,
    options,
  };

  const projected: FlowSurfaceCatalogNodeProjectResult = {
    editableDomains: input.options.getEditableDomains(input.node?.use),
    configureOptions: input.options.getConfigureOptionsForResolvedNode({
      kind: input.resolved?.kind,
      use: input.node?.use,
    }),
  };

  if (input.expand.includeNodeContracts) {
    const contract = input.options.getNodeContract(input.node?.use);
    projected.settingsSchema = input.options.getSettingsSchema(input.node?.use);
    projected.settingsContract = contract?.domains;
    projected.eventCapabilities = contract?.eventCapabilities;
    projected.layoutCapabilities = contract?.layoutCapabilities;
  }

  return projected;
}
