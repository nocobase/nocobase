/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSEditorProvider } from './types';

class RunJSEditorProviderRegistry {
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

  clear() {
    this.providers.clear();
  }
}

export const RunJSEditorRegistry = new RunJSEditorProviderRegistry();
