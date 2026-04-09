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

function createNodeContractResolver(
  item: Pick<FlowSurfaceCatalogProjectableItem, 'use'>,
  options: Pick<FlowSurfaceCatalogProjectItemOptions, 'getNodeContract'>,
) {
  let loaded = false;
  let cached: ReturnType<FlowSurfaceCatalogProjectItemOptions['getNodeContract']> | undefined;

  return () => {
    if (!loaded) {
      cached = options.getNodeContract(item.use);
      loaded = true;
    }
    return cached;
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
    const resolveContract = createNodeContractResolver(item, options);
    projected.editableDomains = !_.isUndefined(item.editableDomains)
      ? item.editableDomains
      : options.getEditableDomains(item.use);
    projected.settingsSchema = !_.isUndefined(item.settingsSchema)
      ? item.settingsSchema
      : options.getSettingsSchema(item.use);
    projected.settingsContract = !_.isUndefined(item.settingsContract)
      ? item.settingsContract
      : resolveContract()?.domains;
    projected.eventCapabilities = !_.isUndefined(item.eventCapabilities)
      ? item.eventCapabilities
      : resolveContract()?.eventCapabilities;
    projected.layoutCapabilities = !_.isUndefined(item.layoutCapabilities)
      ? item.layoutCapabilities
      : resolveContract()?.layoutCapabilities;
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
