/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ComponentType } from 'react';

export type EmailOTPProviderOptions = {
  components: {
    AdminSettingsFormLoader?: () => Promise<{ default: ComponentType }>;
  };
};

/**
 * Registry for email OTP providers (SMTP, etc.).
 * v2 version uses loaders instead of direct component references.
 */
export class EmailOTPProviderManager {
  providers = new Map<string, EmailOTPProviderOptions>();

  registerProvider(type: string, options: EmailOTPProviderOptions) {
    this.providers.set(type, options);
  }

  getProvider(type: string) {
    return this.providers.get(type);
  }
}
