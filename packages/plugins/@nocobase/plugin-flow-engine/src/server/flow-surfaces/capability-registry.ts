/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeFlowSurfaceCapabilityManifestItem } from './capability-manifest';
import { callFlowSurfaceProvider } from './capability-provider-executor';
import type { NormalizedFlowSurfaceProviderCapability } from './capability-manifest';
import type { FlowSurfaceCapabilityProviderRegistry } from './capability-provider';
import type {
  FlowSurfaceCapabilitiesProvider,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCatalogItem,
  FlowSurfacePublicCapabilityItem,
} from './types';

const FLOW_SURFACE_PROVIDER_DISCOVERY_CONCURRENCY = 4;

export type FlowSurfaceCapabilityRegistryLike = Pick<FlowSurfaceCapabilityProviderRegistry, 'listProviders'>;

type FlowSurfaceProviderRegistryProjectionOptions = {
  providerRegistry?: FlowSurfaceCapabilityRegistryLike;
  enabledPackages: ReadonlySet<string>;
  providerTimeoutMs?: number;
};

export type FlowSurfaceCollectedProviderCapability = NormalizedFlowSurfaceProviderCapability & {
  provider: FlowSurfaceCapabilitiesProvider;
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

export async function collectNormalizedProviderCapabilities(
  options: FlowSurfaceProviderRegistryProjectionOptions,
): Promise<FlowSurfaceCollectedProviderCapability[]> {
  const providers = options.providerRegistry?.listProviders() || [];
  const results: FlowSurfaceCollectedProviderCapability[] = [];
  const enabledProviders = providers.flatMap((provider) => {
    const ownerPlugin = normalizeOwnerPlugin(provider.ownerPlugin);
    if (!ownerPlugin || !options.enabledPackages.has(ownerPlugin)) {
      return [];
    }
    return [
      {
        ownerPlugin,
        provider,
      },
    ];
  });
  for (let index = 0; index < enabledProviders.length; index += FLOW_SURFACE_PROVIDER_DISCOVERY_CONCURRENCY) {
    const batch = enabledProviders.slice(index, index + FLOW_SURFACE_PROVIDER_DISCOVERY_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(({ provider, ownerPlugin }) => collectOneProviderCapabilities(provider, ownerPlugin, options)),
    );
    results.push(...batchResults.flat());
  }
  return results;
}

async function collectOneProviderCapabilities(
  provider: FlowSurfaceCapabilitiesProvider,
  ownerPlugin: string,
  options: FlowSurfaceProviderRegistryProjectionOptions,
): Promise<FlowSurfaceCollectedProviderCapability[]> {
  const capabilities = await loadProviderCapabilities(provider, options.enabledPackages, options.providerTimeoutMs);
  return capabilities.flatMap((item) => {
    const normalized = normalizeFlowSurfaceCapabilityManifestItem({
      item,
      ownerPlugin,
      source: ownerPlugin === '@nocobase/plugin-gantt' ? 'canaryOverlay' : 'provider',
      provider,
    });
    if (!normalized) {
      return [];
    }
    return [
      {
        ...normalized,
        provider,
      },
    ];
  });
}

async function loadProviderCapabilities(
  provider: FlowSurfaceCapabilitiesProvider,
  enabledPlugins: ReadonlySet<string>,
  timeoutMs?: number,
) {
  const result = await callFlowSurfaceProvider({
    provider,
    method: 'getCapabilities',
    timeoutMs,
    run: () =>
      provider.getCapabilities({
        enabledPlugins,
      }),
  });
  if (result.ok === false) {
    return [];
  }
  return result.value;
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
