/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { OTPVerification } from '@nocobase/plugin-verification/src/server/otp-verification';
import { EmailProvider } from './providers';
import PluginAuthEmailServer from '../plugin';

type EmailProviderOptions = {
  title: string;
  provider: typeof EmailProvider;
};

export class EmailOTPProviderManager {
  providers = new Registry<EmailProviderOptions>();

  registerProvider(type: string, options: EmailProviderOptions) {
    this.providers.register(type, options);
  }

  listProviders() {
    return Array.from(this.providers.getEntities()).map(([providerType, options]) => ({
      name: providerType,
      title: options.title,
    }));
  }
}

export class EmailOTPVerification extends OTPVerification {
  codeLength = 6;
  codeType = 'numeric'; // 'numeric', 'alpha', 'alphanumeric'
  expiresIn = 120;

  constructor(props) {
    super(props);
    const { options } = props;
    this.codeLength = options.codeLength || this.codeLength;
    this.codeType = options.codeType || this.codeType;
    this.expiresIn = options.expiresIn || this.expiresIn;
  }

  generateCode(): string {
    const length = this.codeLength;
    const type = this.codeType;

    let charset = '0123456789';
    if (type === 'alpha') {
      charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    } else if (type === 'alphanumeric') {
      charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    }

    let code = '';
    for (let i = 0; i < length; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return code;
  }
  async getProvider() {
    const { provider: providerType, settings } = this.options;
    if (!providerType) {
      return null;
    }
    const plugin = this.ctx.app.pm.get('@moonship1011/plugin-auth-email') as PluginAuthEmailServer;
    const providerOptions = plugin.emailOTPProviderManager.providers.get(providerType);
    if (!providerOptions) {
      return null;
    }
    const Provider = providerOptions.provider;
    if (!Provider) {
      return null;
    }
    const options = this.ctx.app.environment.renderJsonTemplate(settings);
    return new Provider(options);
  }

  async getPublicBoundInfo(userId: number) {
    const boundInfo = await this.getBoundInfo(userId);
    if (!boundInfo) {
      return { bound: false };
    }
    const { uuid: email } = boundInfo;
    const [local, domain] = email.split('@');
    return {
      bound: true,
      publicInfo: local.slice(0, 2) + '*'.repeat(local.length - 2) + '@' + domain,
    };
  }

  async validateBoundInfo({ uuid: email }): Promise<boolean> {
    if (!email) {
      throw new Error(this.ctx.t('Not a valid email address, please re-enter'));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(this.ctx.t('Not a valid email address, please re-enter'));
    }
    return true;
  }
}
