/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import { ComponentType } from 'react';

export type SMSOTPProviderOptions = {
  components: {
    AdminSettingsForm: ComponentType;
  };
};

export class SMSOTPProviderManager {
  providers = new Registry<SMSOTPProviderOptions>();

  registerProvider(type: string, options: SMSOTPProviderOptions) {
    this.providers.register(type, options);
  }

  getProvider(type: string) {
    return this.providers.get(type);
  }
}
