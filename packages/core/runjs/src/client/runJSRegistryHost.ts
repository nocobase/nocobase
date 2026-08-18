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
  type RunJSContributionPort,
  type RunJSEditorProviderPort,
  type RunJSEditorRegistryPort,
  type RunJSRegistryHostPort,
  type RunJSSettingsDescriptorProviderInput,
  type RunJSSettingsDescriptorProviderPort,
  type RunJSSettingsDescriptorProviderRegistryPort,
  type RunJSSourceResolverPort,
  type RunJSSourceResolverRegistryPort,
  type RunJSSourceSettingsDescriptor,
} from '../workspace/shared/client-ports';

export class RunJSEditorProviderRegistry<TProvider extends RunJSContributionPort = RunJSEditorProviderPort>
  implements RunJSEditorRegistryPort<TProvider>
{
  private readonly providers = new Map<string, TProvider>();

  registerProvider(provider: TProvider): () => void {
    this.providers.set(provider.key, provider);

    return () => {
      if (this.providers.get(provider.key) === provider) {
        this.providers.delete(provider.key);
      }
    };
  }

  getProviders(): TProvider[] {
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

export class RunJSSourceResolverRegistryManager<TResolver extends RunJSSourceResolverPort = RunJSSourceResolverPort>
  implements RunJSSourceResolverRegistryPort<TResolver>
{
  private readonly resolvers = new Map<string, TResolver>();

  registerResolver(resolver: TResolver): () => void {
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

  getResolver(sourceMode: unknown): TResolver | null {
    const normalizedSourceMode = normalizeSourceMode(sourceMode);
    return normalizedSourceMode ? this.resolvers.get(normalizedSourceMode) || null : null;
  }

  getResolvers(): TResolver[] {
    return Array.from(this.resolvers.values());
  }

  clear(): void {
    this.resolvers.clear();
  }
}

export class RunJSSettingsDescriptorProviderRegistryManager<
  TProvider extends RunJSSettingsDescriptorProviderPort = RunJSSettingsDescriptorProviderPort,
> implements RunJSSettingsDescriptorProviderRegistryPort<TProvider>
{
  private readonly providers = new Map<string, TProvider>();

  registerProvider(provider: TProvider): () => void {
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

  getProviders(): TProvider[] {
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

export function createRunJSRegistryHost<
  TEditorProvider extends RunJSContributionPort = RunJSEditorProviderPort,
  TSettingsProvider extends RunJSSettingsDescriptorProviderPort = RunJSSettingsDescriptorProviderPort,
  TResolver extends RunJSSourceResolverPort = RunJSSourceResolverPort,
>(): RunJSRegistryHostPort<TEditorProvider, TSettingsProvider, TResolver> {
  return {
    editors: new RunJSEditorProviderRegistry<TEditorProvider>(),
    settingsDescriptors: new RunJSSettingsDescriptorProviderRegistryManager<TSettingsProvider>(),
    sourceResolvers: new RunJSSourceResolverRegistryManager<TResolver>(),
  };
}

function normalizeSourceMode(sourceMode: unknown): string {
  return typeof sourceMode === 'string' ? sourceMode.trim() : '';
}
