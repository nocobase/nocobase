/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  INLINE_RUNJS_SOURCE_MODE,
  RunJSSourceResolverError,
  type RunJSEditorProvider,
  type RunJSEditorRegistryHost,
  type RunJSRegistryHost,
  type RunJSSettingsDescriptorProvider,
  type RunJSSettingsDescriptorProviderInput,
  type RunJSSettingsDescriptorProviderRegistryHost,
  type RunJSSourceResolver,
  type RunJSSourceResolverRegistryHost,
  type RunJSSourceSettingsDescriptor,
} from '@nocobase/client-v2';

export class RunJSEditorProviderRegistry implements RunJSEditorRegistryHost {
  private readonly providers = new Map<string, RunJSEditorProvider>();

  registerProvider(provider: RunJSEditorProvider): () => void {
    this.providers.set(provider.key, provider);

    return () => {
      if (this.providers.get(provider.key) === provider) {
        this.providers.delete(provider.key);
      }
    };
  }

  getProviders(): RunJSEditorProvider[] {
    return Array.from(this.providers.values())
      .map((provider, registrationIndex) => ({ provider, registrationIndex }))
      .sort(
        (left, right) =>
          (right.provider.priority ?? 0) - (left.provider.priority ?? 0) ||
          right.registrationIndex - left.registrationIndex,
      )
      .map(({ provider }) => provider);
  }

  clear(): void {
    this.providers.clear();
  }
}

export class RunJSSourceResolverRegistryManager implements RunJSSourceResolverRegistryHost {
  private readonly resolvers = new Map<string, RunJSSourceResolver>();

  registerResolver(resolver: RunJSSourceResolver): () => void {
    const sourceMode = normalizeSourceMode(resolver?.sourceMode);
    if (!sourceMode || sourceMode === INLINE_RUNJS_SOURCE_MODE || typeof resolver?.resolve !== 'function') {
      throw new RunJSSourceResolverError('RunJS source resolver requires a non-inline sourceMode and resolve()', {
        code: 'RUNJS_SOURCE_RESOLVER_REQUIRED',
        sourceMode,
      });
    }

    const normalizedResolver = {
      ...resolver,
      sourceMode,
    };
    this.resolvers.set(sourceMode, normalizedResolver);

    return () => {
      if (this.resolvers.get(sourceMode) === normalizedResolver) {
        this.resolvers.delete(sourceMode);
      }
    };
  }

  getResolver(sourceMode: unknown): RunJSSourceResolver | null {
    const normalizedSourceMode = normalizeSourceMode(sourceMode);
    return normalizedSourceMode ? this.resolvers.get(normalizedSourceMode) || null : null;
  }

  getResolvers(): RunJSSourceResolver[] {
    return Array.from(this.resolvers.values());
  }

  clear(): void {
    this.resolvers.clear();
  }
}

export class RunJSSettingsDescriptorProviderRegistryManager implements RunJSSettingsDescriptorProviderRegistryHost {
  private readonly providers = new Map<string, RunJSSettingsDescriptorProvider>();

  registerProvider(provider: RunJSSettingsDescriptorProvider): () => void {
    const normalizedProvider = {
      ...provider,
      key: provider.key.trim(),
    };
    if (!normalizedProvider.key || typeof normalizedProvider.getSettingsDescriptor !== 'function') {
      throw new TypeError('RunJS settings descriptor provider requires key and getSettingsDescriptor()');
    }
    this.providers.set(normalizedProvider.key, normalizedProvider);

    return () => {
      if (this.providers.get(normalizedProvider.key) === normalizedProvider) {
        this.providers.delete(normalizedProvider.key);
      }
    };
  }

  getProviders(): RunJSSettingsDescriptorProvider[] {
    return Array.from(this.providers.values())
      .map((provider, registrationIndex) => ({ provider, registrationIndex }))
      .sort(
        (left, right) =>
          (right.provider.priority ?? 0) - (left.provider.priority ?? 0) ||
          right.registrationIndex - left.registrationIndex,
      )
      .map(({ provider }) => provider);
  }

  async getSettingsDescriptor(
    input: RunJSSettingsDescriptorProviderInput,
  ): Promise<RunJSSourceSettingsDescriptor | undefined> {
    for (const provider of this.getProviders()) {
      if (!(provider.canHandle?.(input) ?? true)) {
        continue;
      }
      const descriptor = await provider.getSettingsDescriptor(input);
      if (descriptor) {
        return descriptor;
      }
    }
    return undefined;
  }

  clear(): void {
    this.providers.clear();
  }
}

function normalizeSourceMode(sourceMode: unknown): string {
  return typeof sourceMode === 'string' ? sourceMode.trim() : '';
}

export const RunJSEditorRegistry = new RunJSEditorProviderRegistry();
export const RunJSSettingsDescriptorProviderRegistry = new RunJSSettingsDescriptorProviderRegistryManager();
export const RunJSSourceResolverRegistry = new RunJSSourceResolverRegistryManager();

export const runJSRegistryHost: RunJSRegistryHost = {
  editors: RunJSEditorRegistry,
  settingsDescriptors: RunJSSettingsDescriptorProviderRegistry,
  sourceResolvers: RunJSSourceResolverRegistry,
};
