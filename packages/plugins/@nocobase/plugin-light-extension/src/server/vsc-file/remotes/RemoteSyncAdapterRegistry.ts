/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vscRemoteProviders } from '../../../shared/vsc-file/remote-sync-types';
import type { VscRemoteNormalizedConfig, VscRemoteProvider } from '../../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError, type RemoteSyncAdapter, type RemoteSyncAdapterCapabilities } from './RemoteSyncAdapter';

export interface RemoteSyncAdapterSummary {
  provider: VscRemoteProvider;
  title: string;
  capabilities: RemoteSyncAdapterCapabilities;
}

function isRemoteProvider(value: unknown): value is VscRemoteProvider {
  return typeof value === 'string' && vscRemoteProviders.includes(value as VscRemoteProvider);
}

const sensitiveConfigKeyPattern = /(token|authorization|password|secret|credential|privatekey)/i;

export class RemoteSyncAdapterRegistry {
  private readonly adapters = new Map<VscRemoteProvider, RemoteSyncAdapter>();

  register(adapter: RemoteSyncAdapter): () => void {
    if (!adapter || !isRemoteProvider(adapter.provider)) {
      throw new RemoteSyncError('UNSUPPORTED_PROVIDER', 'Remote adapter provider must be registered', {
        details: { provider: String(adapter?.provider || '') },
      });
    }

    const registered = this.adapters.get(adapter.provider);
    if (registered && registered !== adapter) {
      throw new RemoteSyncError('CONFIG_INVALID', `Remote provider "${adapter.provider}" is already registered`, {
        details: { provider: adapter.provider, reasonCode: 'provider-already-registered' },
      });
    }

    this.adapters.set(adapter.provider, adapter);
    return () => {
      if (this.adapters.get(adapter.provider) === adapter) {
        this.adapters.delete(adapter.provider);
      }
    };
  }

  get(provider: VscRemoteProvider): RemoteSyncAdapter | null {
    return this.adapters.get(provider) || null;
  }

  require(provider: VscRemoteProvider): RemoteSyncAdapter {
    if (!isRemoteProvider(provider)) {
      throw new RemoteSyncError('UNSUPPORTED_PROVIDER', `Remote provider "${String(provider)}" is not supported`, {
        details: { provider: String(provider) },
      });
    }

    const adapter = this.get(provider);
    if (!adapter) {
      throw new RemoteSyncError('UNSUPPORTED_PROVIDER', `Remote provider "${provider}" is not registered`, {
        details: { provider },
      });
    }
    return adapter;
  }

  list(): RemoteSyncAdapterSummary[] {
    return Array.from(this.adapters.values())
      .map((adapter) => ({
        provider: adapter.provider,
        title: adapter.title,
        capabilities: { ...adapter.capabilities },
      }))
      .sort((left, right) => left.provider.localeCompare(right.provider));
  }

  normalizeConfig(provider: VscRemoteProvider, input: unknown): VscRemoteNormalizedConfig {
    const adapter = this.require(provider);
    if (typeof adapter.normalizeConfig !== 'function') {
      throw new RemoteSyncError('CONFIG_INVALID', `Remote provider "${provider}" has no config parser`, {
        details: { provider, reasonCode: 'config-parser-unavailable' },
      });
    }

    let adapterResult: VscRemoteNormalizedConfig;
    try {
      adapterResult = adapter.normalizeConfig(input);
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        throw error;
      }
      throw new RemoteSyncError('CONFIG_INVALID', `Remote provider "${provider}" rejected its config`, {
        details: { provider, reasonCode: 'config-parser-failed' },
      });
    }

    assertSafeNormalizedConfig(adapterResult, provider);

    let canonicalResult: VscRemoteNormalizedConfig;
    try {
      canonicalResult = adapter.normalizeConfig(adapterResult);
    } catch {
      throw new RemoteSyncError('CONFIG_INVALID', `Remote provider "${provider}" returned an invalid config`, {
        details: { provider, reasonCode: 'non-canonical-config' },
      });
    }
    assertSafeNormalizedConfig(canonicalResult, provider);
    if (stableSerialize(adapterResult) !== stableSerialize(canonicalResult)) {
      throw new RemoteSyncError('CONFIG_INVALID', `Remote provider "${provider}" returned a non-canonical config`, {
        details: { provider, reasonCode: 'non-canonical-config' },
      });
    }
    return canonicalResult;
  }
}

function assertSafeNormalizedConfig(
  value: unknown,
  provider: VscRemoteProvider,
): asserts value is VscRemoteNormalizedConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RemoteSyncError('CONFIG_INVALID', `Remote provider "${provider}" returned an invalid config`, {
      details: { provider, reasonCode: 'invalid-normalized-config' },
    });
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = key.replace(/[^A-Za-z0-9]/g, '');
    if (sensitiveConfigKeyPattern.test(normalizedKey)) {
      throw new RemoteSyncError('CONFIG_INVALID', `Remote provider "${provider}" returned an unsafe config`, {
        details: { provider, reasonCode: 'sensitive-config-key' },
      });
    }
    assertSafeConfigValue(nestedValue, provider);
  }
}

function assertSafeConfigValue(value: unknown, provider: VscRemoteProvider): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => assertSafeConfigValue(item, provider));
    return;
  }
  if (value && typeof value === 'object') {
    assertSafeNormalizedConfig(value, provider);
    return;
  }
  throw new RemoteSyncError('CONFIG_INVALID', `Remote provider "${provider}" returned an invalid config`, {
    details: { provider, reasonCode: 'invalid-normalized-config' },
  });
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableSerialize(nestedValue)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}
