/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceCapabilitiesProvider } from './types';

export class FlowSurfaceCapabilityProviderRegistry {
  private readonly providers = new Map<string, FlowSurfaceCapabilitiesProvider>();
  private version = 0;

  registerProvider(provider: FlowSurfaceCapabilitiesProvider) {
    const ownerPlugin = normalizeOwnerPlugin(provider.ownerPlugin);
    if (!ownerPlugin || typeof provider.getCapabilities !== 'function') {
      return;
    }
    this.providers.set(ownerPlugin, {
      ...provider,
      ownerPlugin,
    });
    this.version += 1;
  }

  unregisterProvider(ownerPlugin: string) {
    if (this.providers.delete(normalizeOwnerPlugin(ownerPlugin))) {
      this.version += 1;
    }
  }

  listProviders() {
    return Array.from(this.providers.values());
  }

  getVersion() {
    return String(this.version);
  }
}

function normalizeOwnerPlugin(ownerPlugin: string) {
  return String(ownerPlugin || '').trim();
}
