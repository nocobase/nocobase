/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { tval } from '@nocobase/utils';
import { namespace } from '.';
import { PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT } from '../constants';
import { VerificationManager } from './verification-manager';
import { SMSOTPProviderManager, SMSOTPVerification } from './otp-verification/sms';
import { SMS_OTP_VERIFICATION_TYPE } from '../constants';
import verificatorsActions from './actions/verificators';
import smsAliyun from './otp-verification/sms/providers/sms-aliyun';
import smsTencent from './otp-verification/sms/providers/sms-tencent';
import smsOTPProviders from './otp-verification/sms/resource/sms-otp-providers';
import smsOTP from './otp-verification/sms/resource/sms-otp';

export default class PluginVerficationServer extends Plugin {
  verificationManager = new VerificationManager({ db: this.db });
  smsOTPProviderManager = new SMSOTPProviderManager();

  async load() {
    // add middleware to action
    this.app.resourceManager.use(this.verificationManager.middleware());
    this.app.resourceManager.define(smsOTPProviders);
    this.app.resourceManager.define(smsOTP);

    Object.entries(verificatorsActions).forEach(([action, handler]) =>
      this.app.resourceManager.registerActionHandler(`verificators:${action}`, handler),
    );

    this.app.acl.allow('smsOTP', 'create', 'public');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.verificators`,
      actions: ['verificators:*', 'smsOTPProviders:*'],
    });

    this.verificationManager.registerVerificationType(SMS_OTP_VERIFICATION_TYPE, {
      title: tval('SMS OTP', { ns: namespace }),
      scenes: ['auth-sms'],
      verification: SMSOTPVerification,
    });
    this.smsOTPProviderManager.registerProvider(PROVIDER_TYPE_SMS_ALIYUN, {
      title: tval('Aliyun SMS', { ns: namespace }),
      provider: smsAliyun,
    });
    this.smsOTPProviderManager.registerProvider(PROVIDER_TYPE_SMS_TENCENT, {
      title: tval('Tencent SMS', { ns: namespace }),
      provider: smsTencent,
    });
  }

  async install() {
    const {
      DEFAULT_SMS_VERIFY_CODE_PROVIDER,
      INIT_ALI_SMS_ACCESS_KEY,
      INIT_ALI_SMS_ACCESS_KEY_SECRET,
      INIT_ALI_SMS_ENDPOINT = 'dysmsapi.aliyuncs.com',
      INIT_ALI_SMS_VERIFY_CODE_TEMPLATE,
      INIT_ALI_SMS_VERIFY_CODE_SIGN,
    } = process.env;

    if (
      DEFAULT_SMS_VERIFY_CODE_PROVIDER &&
      INIT_ALI_SMS_ACCESS_KEY &&
      INIT_ALI_SMS_ACCESS_KEY_SECRET &&
      INIT_ALI_SMS_VERIFY_CODE_TEMPLATE &&
      INIT_ALI_SMS_VERIFY_CODE_SIGN
    ) {
      const ProviderRepo = this.db.getRepository('verifications_providers');
      const existed = await ProviderRepo.count({
        filterByTk: DEFAULT_SMS_VERIFY_CODE_PROVIDER,
      });
      if (existed) {
        return;
      }
      await ProviderRepo.create({
        values: {
          id: DEFAULT_SMS_VERIFY_CODE_PROVIDER,
          type: PROVIDER_TYPE_SMS_ALIYUN,
          title: 'Default SMS sender',
          options: {
            accessKeyId: INIT_ALI_SMS_ACCESS_KEY,
            accessKeySecret: INIT_ALI_SMS_ACCESS_KEY_SECRET,
            endpoint: INIT_ALI_SMS_ENDPOINT,
            sign: INIT_ALI_SMS_VERIFY_CODE_SIGN,
            template: INIT_ALI_SMS_VERIFY_CODE_TEMPLATE,
          },
          default: true,
        },
      });
    }
  }
}
