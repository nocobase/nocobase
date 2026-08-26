/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import type { ComponentType } from 'react';

type LoaderOf<P = Record<string, never>> = () => Promise<{ default: ComponentType<P> }>;

export type SMSOTPProviderOptions = {
  components: {
    /**
     * Loader for the provider-specific admin-settings form. Stored as an
     * async `() => import(...)` so third-party SMS providers contributed
     * via `registerProvider()` come in as their own webpack chunk,
     * fetched only when the corresponding provider is picked in the
     * verifier configuration drawer.
     */
    AdminSettingsFormLoader: LoaderOf;
  };
};

/**
 * Registry of SMS OTP providers (Aliyun, Tencent, …). Each entry only
 * needs to contribute its admin settings form — the runtime side is
 * handled server-side.
 */
export class SMSOTPProviderManager {
  providers = new Registry<SMSOTPProviderOptions>();

  registerProvider(type: string, options: SMSOTPProviderOptions) {
    this.providers.register(type, options);
  }

  getProvider(type: string) {
    return this.providers.get(type);
  }
}
