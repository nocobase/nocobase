/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSValue } from '@nocobase/flow-engine';

import type { RunJSSourceLocator } from '../runjs-studio';
import type {
  RunJSSourceBinding,
  RunJSSourceContext,
  RunJSSourceSettings,
  RunJSSourceSettingsDescriptor,
} from './types';

export interface RunJSSettingsDescriptorProviderInput {
  sourceMode: string;
  sourceBinding?: RunJSSourceBinding | null;
  sourceRef?: Record<string, unknown> | null;
  settings?: RunJSSourceSettings | null;
  runJs?: RunJSValue | null;
  locator?: RunJSSourceLocator;
  context?: RunJSSourceContext;
}

export interface RunJSSettingsDescriptorProvider {
  key: string;
  priority?: number;
  canHandle?: (input: RunJSSettingsDescriptorProviderInput) => boolean;
  getSettingsDescriptor: (
    input: RunJSSettingsDescriptorProviderInput,
  ) => RunJSSourceSettingsDescriptor | undefined | Promise<RunJSSourceSettingsDescriptor | undefined>;
}

export class RunJSSettingsDescriptorProviderRegistryManager {
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

export const RunJSSettingsDescriptorProviderRegistry = new RunJSSettingsDescriptorProviderRegistryManager();
