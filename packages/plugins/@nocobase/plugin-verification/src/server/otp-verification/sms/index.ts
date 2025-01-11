/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { OTPVerification } from '..';
import { SMSProvider } from './providers';

type SMSProviderOptions = {
  title: string;
  provider: typeof SMSProvider;
};

export class SMSOTPProviderManager {
  providers = new Registry<SMSProviderOptions>();

  registerProvider(type: string, options: SMSProviderOptions) {
    this.providers.register(type, options);
  }

  listProviders() {
    return Array.from(this.providers.getEntities()).map(([providerType, options]) => ({
      name: providerType,
      title: options.title,
    }));
  }
}

export class SMSOTPVerification extends OTPVerification {
  constructor({ ctx }) {
    super({ ctx });
  }

  async getDefaultProvider() {
    return null;
    const repo = this.ctx.db.getRepository('verifications_providers');
    const provider = await repo.findOne({
      filter: {
        default: true,
      },
    });
    if (!provider) {
      return null;
    }
    const Provider = this.providers.get(provider.type);
    if (!Provider) {
      return null;
    }
    const options = this.ctx.app.environment.renderJsonTemplate(provider.options);
    return {
      provider: new Provider(options),
      model: provider,
    };
  }

  async getUserVerificationInfo(userInfo?: { phone?: string }) {
    return userInfo?.phone;
  }

  async getUserPublicInfo(userInfo?: { phone?: string }): Promise<any> {
    const { phone } = userInfo || {};
    if (!phone) {
      return {};
    }
    return {
      phone: '*'.repeat(phone.length - 4) + phone.slice(-4),
    };
  }

  async validateUserInfo(userInfo: Record<string, any>): Promise<boolean> {
    if (!userInfo?.phone) {
      throw new Error(this.ctx.t('Not a valid cellphone number, please re-enter'));
    }
    return true;
  }
}
