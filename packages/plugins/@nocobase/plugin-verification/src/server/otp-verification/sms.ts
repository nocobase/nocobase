/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT } from '../constants';
import { OTPVerification } from './opt-verification';
import smsAliyun from './providers/sms-aliyun';
import smsTencent from './providers/sms-tencent';

export class SMSOTPVerification extends OTPVerification {
  constructor({ ctx }) {
    super({ ctx });
    this.providers.register(PROVIDER_TYPE_SMS_ALIYUN, smsAliyun);
    this.providers.register(PROVIDER_TYPE_SMS_TENCENT, smsTencent);
  }

  async getDefaultProvider() {
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
    return {
      provider: new Provider(provider.options),
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
