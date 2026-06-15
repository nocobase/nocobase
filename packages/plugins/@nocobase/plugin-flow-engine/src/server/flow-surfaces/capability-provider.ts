/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceCapabilitiesProvider } from './types';

export type FlowSurfaceCapabilityProviderRegistryWarning = {
  code: 'invalid-provider' | 'duplicate-provider';
  ownerPlugin?: string;
  message: string;
};

export class FlowSurfaceCapabilityProviderRegistry {
  private readonly providers = new Map<string, FlowSurfaceCapabilitiesProvider>();
  private readonly warnings: FlowSurfaceCapabilityProviderRegistryWarning[] = [];
  private revision = 0;

  registerProvider(provider: FlowSurfaceCapabilitiesProvider) {
    const ownerPlugin = normalizeOwnerPlugin(provider?.ownerPlugin);
    if (!ownerPlugin) {
      this.addWarning({
        code: 'invalid-provider',
        message: 'Flow surface capability provider was skipped because ownerPlugin is empty.',
      });
      return;
    }
    if (typeof provider?.getCapabilities !== 'function') {
      this.addWarning({
        code: 'invalid-provider',
        ownerPlugin,
        message: `Flow surface capability provider "${ownerPlugin}" was skipped because getCapabilities is missing.`,
      });
      return;
    }
    if (this.providers.has(ownerPlugin)) {
      this.addWarning({
        code: 'duplicate-provider',
        ownerPlugin,
        message: `Flow surface capability provider "${ownerPlugin}" was replaced by a later registration.`,
      });
    }
    this.providers.set(ownerPlugin, {
      ...provider,
      ownerPlugin,
    });
    this.revision += 1;
  }

  unregisterProvider(ownerPlugin: string) {
    if (this.providers.delete(normalizeOwnerPlugin(ownerPlugin))) {
      this.revision += 1;
    }
  }

  listProviders() {
    return Array.from(this.providers.values());
  }

  listWarnings() {
    return [...this.warnings];
  }

  getRevision() {
    return String(this.revision);
  }

  getVersion() {
    return this.getRevision();
  }

  private addWarning(warning: FlowSurfaceCapabilityProviderRegistryWarning) {
    this.warnings.push(warning);
  }
}

function normalizeOwnerPlugin(ownerPlugin: unknown) {
  return String(ownerPlugin || '').trim();
}
