/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import { AuthModel } from '@nocobase/plugin-auth';
import VerificationPlugin from '@nocobase/plugin-verification';
import { namespace } from '../constants';

export class SMSAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
  }

  async validate() {
    const ctx = this.ctx;
    const verificationPlugin: VerificationPlugin = ctx.app.getPlugin('verification');
    if (!verificationPlugin) {
      ctx.log.error('auth-sms: @nocobase/plugin-verification is required', { method: 'validate' });
      ctx.throw(500);
    }
    let user: Model;
    ctx.action.mergeParams({
      values: {
        verifier: this.options.public?.verifier,
      },
    });
    await verificationPlugin.verificationManager.verify(ctx, async () => {
      const {
        values: { uuid: phone },
      } = ctx.action.params;
      try {
        // History data compatible processing
        user = await this.userRepository.findOne({
          filter: { phone },
        });
        if (user) {
          await this.authenticator.addUser(user, {
            through: {
              uuid: phone,
            },
          });
          return;
        }
        // New data
        const { autoSignup } = this.authenticator.options?.public || {};
        const authenticator = this.authenticator as AuthModel;
        if (autoSignup) {
          user = await authenticator.findOrCreateUser(phone, {
            nickname: phone,
            phone,
          });
          return;
        }
        user = await authenticator.findUser(phone);
        if (!user) {
          throw new Error(ctx.t('The phone number is not registered, please register first', { ns: namespace }));
        }
      } catch (err) {
        ctx.log.error(err, { method: 'validate' });
        throw new Error(err.message);
      }
    });
    return user;
  }
}
