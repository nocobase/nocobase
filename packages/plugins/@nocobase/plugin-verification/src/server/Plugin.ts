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
import verifiersActions from './actions/verifiers';
import smsAliyun from './otp-verification/sms/providers/sms-aliyun';
import smsTencent from './otp-verification/sms/providers/sms-tencent';
import smsOTPProviders from './otp-verification/sms/resource/sms-otp-providers';
import smsOTP from './otp-verification/sms/resource/sms-otp';
import { Counter } from '@nocobase/cache';

export default class PluginVerficationServer extends Plugin {
  verificationManager = new VerificationManager({ db: this.db });
  smsOTPProviderManager = new SMSOTPProviderManager();
  smsOTPCounter: Counter;

  async afterAdd() {
    this.app.on('afterLoad', async () => {
      this.smsOTPCounter = await this.app.cacheManager.createCounter(
        {
          name: 'smsOTPCounter',
          prefix: 'sms-otp:attempts',
        },
        this.app.lockManager,
      );
    });
  }

  async load() {
    // add middleware to action
    this.app.dataSourceManager.use(this.verificationManager.middleware());
    this.app.resourceManager.define(smsOTPProviders);
    this.app.resourceManager.define(smsOTP);

    Object.entries(verifiersActions).forEach(([action, handler]) =>
      this.app.resourceManager.registerActionHandler(`verifiers:${action}`, handler),
    );

    this.app.acl.allow('verifiers', 'listByUser', 'loggedIn');
    this.app.acl.allow('verifiers', 'listForVerify', 'loggedIn');
    this.app.acl.allow('verifiers', 'bind', 'loggedIn');
    this.app.acl.allow('verifiers', 'unbind', 'loggedIn');
    this.app.acl.allow('smsOTP', 'create', 'loggedIn');
    this.app.acl.allow('smsOTP', 'publicCreate');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.verifiers`,
      actions: ['verifiers:*', 'smsOTPProviders:*'],
    });

    this.verificationManager.registerVerificationType(SMS_OTP_VERIFICATION_TYPE, {
      title: tval('SMS OTP', { ns: namespace }),
      description: tval('Get one-time codes sent to your phone via SMS to complete authentication requests.', {
        ns: namespace,
      }),
      bindingRequired: true,
      verification: SMSOTPVerification,
    });
    this.verificationManager.addSceneRule(
      (scene, verificationType) =>
        ['auth-sms', 'unbind-verifier'].includes(scene) && verificationType === SMS_OTP_VERIFICATION_TYPE,
    );
    this.verificationManager.registerAction('verifiers:bind', {
      manual: true,
      getBoundInfoFromCtx: (ctx) => {
        return ctx.action.params.values || {};
      },
    });
    this.verificationManager.registerScene('unbind-verifier', {
      actions: {
        'verifiers:unbind': {},
      },
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
