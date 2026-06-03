/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeFlowSurfaceCapabilityManifestItem } from './capability-manifest';
import type { FlowSurfaceCapabilityProviderRegistry } from './capability-provider';
import type {
  FlowSurfaceCapabilitiesProvider,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCatalogItem,
  FlowSurfacePublicCapabilityItem,
} from './types';

export type FlowSurfaceCapabilityRegistryLike = Pick<FlowSurfaceCapabilityProviderRegistry, 'listProviders'>;

type FlowSurfaceProviderRegistryProjectionOptions = {
  providerRegistry?: FlowSurfaceCapabilityRegistryLike;
  enabledPackages: ReadonlySet<string>;
};

export async function collectProviderPublicCapabilities(
  options: FlowSurfaceProviderRegistryProjectionOptions,
): Promise<FlowSurfacePublicCapabilityItem[]> {
  const normalized = await collectNormalizedProviderCapabilities(options);
  return normalized.map((item) => item.publicItem);
}

export async function collectProviderCatalogItems(
  options: FlowSurfaceProviderRegistryProjectionOptions,
): Promise<FlowSurfaceCatalogItem[]> {
  const normalized = await collectNormalizedProviderCapabilities(options);
  return normalized.map((item) => item.catalogItem);
}

export function filterProviderCatalogItemsForCatalog(input: {
  providerItems: FlowSurfaceCatalogItem[];
  existingItems: FlowSurfaceCatalogItem[];
}) {
  const seen = new Set(input.existingItems.map((item) => getCatalogPublicTypeConflictKey(item)).filter(Boolean));
  return input.providerItems.filter((item) => {
    const key = getCatalogPublicTypeConflictKey(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function collectNormalizedProviderCapabilities(options: FlowSurfaceProviderRegistryProjectionOptions) {
  const providers = options.providerRegistry?.listProviders() || [];
  const results: NonNullable<ReturnType<typeof normalizeFlowSurfaceCapabilityManifestItem>>[] = [];
  for (const provider of providers) {
    const ownerPlugin = normalizeOwnerPlugin(provider.ownerPlugin);
    if (!ownerPlugin || !options.enabledPackages.has(ownerPlugin)) {
      continue;
    }
    const capabilities = await loadProviderCapabilities(provider, options.enabledPackages);
    capabilities.forEach((item) => {
      const normalized = normalizeFlowSurfaceCapabilityManifestItem({
        item,
        ownerPlugin,
        source: ownerPlugin === '@nocobase/plugin-gantt' ? 'canaryOverlay' : 'provider',
        provider,
      });
      if (normalized) {
        results.push(normalized);
      }
    });
  }
  return results;
}

async function loadProviderCapabilities(
  provider: FlowSurfaceCapabilitiesProvider,
  enabledPlugins: ReadonlySet<string>,
) {
  try {
    return await provider.getCapabilities({
      enabledPlugins,
    });
  } catch {
    return [];
  }
}

function normalizeOwnerPlugin(ownerPlugin: string) {
  return String(ownerPlugin || '').trim();
}

function getCatalogPublicTypeConflictKey(item: FlowSurfaceCatalogItem) {
  const publicType = String(item.publicType || item.type || item.key || '').trim();
  if (!publicType) {
    return '';
  }
  return [toCapabilityKind(item.kind), publicType].join('::');
}

function toCapabilityKind(kind: FlowSurfaceCatalogItem['kind']): FlowSurfaceCapabilityKind {
  switch (kind) {
    case 'action':
    case 'block':
      return kind;
    case 'field':
      return 'fieldComponent';
    default:
      return 'block';
  }
}
