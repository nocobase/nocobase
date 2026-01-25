/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { Verification, CODE_STATUS_UNUSED, CODE_STATUS_USED } from '@nocobase/plugin-verification';
import { EmailProvider } from './providers';
import PluginAuthEmailServer from '../plugin';
import dayjs from 'dayjs';

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

export class EmailOTPVerification extends Verification {
  codeLength = 6;
  codeType = 'numeric'; // 'numeric', 'alpha', 'alphanumeric'
  expiresIn = 120;
  resendInterval = 60;
  maxVerifyAttempts = 5;

  constructor(props) {
    super(props);
    const { options } = props;
    this.codeLength = options.codeLength || this.codeLength;
    this.codeType = options.codeType || this.codeType;
    this.expiresIn = options.expiresIn || this.expiresIn;
    this.resendInterval = options.resendInterval || this.resendInterval;
  }

  async verify({ resource, action, boundInfo, verifyParams }): Promise<any> {
    const { uuid: receiver } = boundInfo;
    const code = verifyParams.code;
    if (!code) {
      return this.ctx.throw(400, 'Verification code is invalid');
    }
    const verificationPlugin = this.ctx.app.getPlugin('verification') as any;
    const counter = verificationPlugin.smsOTPCounter;
    const key = `${resource}:${action}:${receiver}`;
    let attempts = 0;
    try {
      attempts = await counter.get(key);
    } catch (e) {
      this.ctx.logger.error(e.message, {
        module: 'verification',
        submodule: 'sms-otp',
        method: 'verify',
        receiver,
        action: `${resource}:${action}`,
      });
      this.ctx.throw(500, 'Internal Server Error');
    }
    if (attempts > this.maxVerifyAttempts) {
      this.ctx.throw(429, this.ctx.t('Too many failed attempts. Please request a new verification code.'));
    }

    const repo = this.ctx.db.getRepository('otpRecords');
    const item = await repo.findOne({
      filter: {
        receiver,
        action: `${resource}:${action}`,
        code,
        expiresAt: {
          $dateAfter: new Date(),
        },
        status: CODE_STATUS_UNUSED,
        verifierName: this.verifier.name,
      },
    });

    if (!item) {
      let attempts = 0;
      try {
        let ttl = this.expiresIn * 1000;
        const record = await repo.findOne({
          filter: {
            action: `${resource}:${action}`,
            receiver,
            status: CODE_STATUS_UNUSED,
            expiresAt: {
              $dateAfter: new Date(),
            },
          },
        });
        if (record) {
          ttl = dayjs(record.get('expiresAt')).diff(dayjs());
        }
        attempts = await counter.incr(key, ttl);
      } catch (e) {
        this.ctx.logger.error(e.message, {
          module: 'verification',
          submodule: 'totp-authenticator',
          method: 'verify',
          receiver,
          action: `${resource}:${action}`,
        });
        this.ctx.throw(500, 'Internal Server Error');
      }

      if (attempts > this.maxVerifyAttempts) {
        this.ctx.throw(429, this.ctx.t('Too many failed attempts. Please request a new verification code'));
      }

      return this.ctx.throw(400, {
        code: 'InvalidVerificationCode',
        message: this.ctx.t('Verification code is invalid'),
      });
    }

    await counter.reset(key);
    return { codeInfo: item };
  }

  async bind(userId: number, resource?: string, action?: string): Promise<{ uuid: string; meta?: any }> {
    const { uuid, code } = this.ctx.action.params.values || {};
    await this.verify({
      resource: resource || 'verifiers',
      action: action || 'bind',
      boundInfo: { uuid },
      verifyParams: { code },
    });
    return { uuid };
  }

  async onActionComplete({ verifyResult }) {
    const { codeInfo } = verifyResult;
    await codeInfo.update({
      status: CODE_STATUS_USED,
    });
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
    const plugin = this.ctx.app.pm.get('@nocobase/plugin-auth-email') as PluginAuthEmailServer;
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
