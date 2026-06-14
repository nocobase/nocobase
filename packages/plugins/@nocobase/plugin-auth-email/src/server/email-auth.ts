/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { AuthModel } from '@nocobase/plugin-auth';
import VerificationPlugin from '@nocobase/plugin-verification';
import { namespace } from '../constants';

export class EmailAuth extends BaseAuth {
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
      ctx.log.error('auth-email: @nocobase/plugin-verification is required', { method: 'validate' });
      ctx.throw(500);
    }
    let user: any;
    // 发送验证码使用的是 'auth:signIn:email'，但登录请求走 /api/auth:signIn
    // 临时将 ctx.action.actionName 改为 'signIn:email'，并设置 params.values.action 为 'auth:signIn:email'
    ctx.action.mergeParams({
      values: {
        verifier: this.options.public?.verifier,
        action: 'auth:signIn:email',
      },
    });
    const originalActionName = ctx.action.actionName;
    try {
      ctx.action.actionName = 'signIn:email';
      await verificationPlugin.verificationManager.verify(ctx, async () => {
        const {
          values: { uuid: email },
        } = ctx.action.params;
        try {
          // History data compatible processing
          user = await this.userRepository.findOne({
            filter: { email },
          });
          if (user) {
            await this.authenticator.addUser(user, {
              through: {
                uuid: email,
              },
            });
            return;
          }
          // New data
          const { autoSignup } = this.authenticator.options?.public || {};
          const authenticator = this.authenticator as AuthModel;
          if (autoSignup) {
            user = await authenticator.findOrCreateUser(email, {
              nickname: email,
              email,
            });
            return;
          }
          user = await authenticator.findUser(email);
          if (!user) {
            throw new Error(ctx.t('The email is not registered, please register first', { ns: namespace }));
          }
        } catch (err) {
          ctx.log.error(err, { method: 'validate' });
          throw new Error(err.message);
        }
      });
    } finally {
      ctx.action.actionName = originalActionName;
    }
    return user;
  }
}
