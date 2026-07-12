/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LegacyRunJSEditorProvider, LegacyRunJSEditorProviderRenderProps } from './types';

class LegacyRunJSEditorProviderRegistry {
  private readonly providers = new Map<string, LegacyRunJSEditorProvider>();

  registerProvider(provider: LegacyRunJSEditorProvider): () => void {
    this.providers.set(provider.key, provider);

    return () => {
      if (this.providers.get(provider.key) === provider) {
        this.providers.delete(provider.key);
      }
    };
  }

  getProvider(props: LegacyRunJSEditorProviderRenderProps): LegacyRunJSEditorProvider | null {
    const providers = Array.from(this.providers.values()).reverse();
    return providers.find((provider) => provider.canHandle?.(props) ?? true) || null;
  }

  getProviders(): LegacyRunJSEditorProvider[] {
    return Array.from(this.providers.values());
  }

  clear() {
    this.providers.clear();
  }
}

export const LegacyRunJSEditorRegistry = new LegacyRunJSEditorProviderRegistry();
