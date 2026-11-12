/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { PasswordField } from '@nocobase/database';
import _ from 'lodash';
import { namespace } from '../preset';
import { parsedValue } from '@nocobase/utils';
import { getPasswordResetDestination, getPasswordResetPage } from './utils/passwordResetUrl';

export class BasicAuth extends BaseAuth {
  static readonly optionsKeysNotAllowedInEnv = ['emailContentText', 'emailContentHTML', 'emailSubject'];

  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  private isEmail(value: string) {
    return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(value);
  }

  async validate() {
    const ctx = this.ctx;
    const {
      account, // Username or email
      email, // Old parameter, compatible with old api
      password,
    } = ctx.action.params.values || {};

    if (!account && !email) {
      ctx.throw(400, ctx.t('Please enter your username or email', { ns: namespace }));
    }
    const filter = email
      ? { email }
      : {
          $or: [{ username: account }, { email: account }],
        };
    const user = await this.userRepository.findOne({
      filter,
    });

    if (!user) {
      ctx.throw(401, ctx.t('The username/email or password is incorrect, please re-enter', { ns: namespace }));
    }

    const field = this.userCollection.getField<PasswordField>('password');
    const valid = await field.verify(password, user.password);
    if (!valid) {
      ctx.throw(401, ctx.t('The username/email or password is incorrect, please re-enter', { ns: namespace }), {
        internalCode: 'INCORRECT_PASSWORD',
        user,
      });
    }
    return user;
  }

  private getSignupFormSettings() {
    const options = this.authenticator.options?.public || {};
    let { signupForm = [] } = options;
    signupForm = signupForm.filter((item: { show: boolean }) => item.show);
    if (
      !(
        signupForm.length &&
        signupForm.some(
          (item: { field: string; show: boolean; required: boolean }) =>
            ['username', 'email'].includes(item.field) && item.show && item.required,
        )
      )
    ) {
      // At least one of the username or email fields is required
      signupForm.push({ field: 'username', show: true, required: true });
    }
    return signupForm;
  }

  private verfiySignupParams(
    signupFormSettings: {
      field: string;
      show: boolean;
      required: boolean;
    }[],
    values: any,
  ) {
    const { username, email } = values;
    const usernameSetting = signupFormSettings.find((item: any) => item.field === 'username');
    if (usernameSetting && usernameSetting.show) {
      if ((username && !this.validateUsername(username)) || (usernameSetting.required && !username)) {
        throw new Error('Please enter a valid username');
      }
    }
    const emailSetting = signupFormSettings.find((item: any) => item.field === 'email');
    if (emailSetting && emailSetting.show) {
      if (email && !this.isEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      if (emailSetting.required && !email) {
        throw new Error('Please enter a valid email address');
      }
    }

    const requiredFields = signupFormSettings.filter((item: any) => item.show && item.required);
    requiredFields.forEach((item: { field: string }) => {
      if (!values[item.field]) {
        throw new Error(`Please enter ${item.field}`);
      }
    });
  }

  async signUp() {
    const ctx = this.ctx;
    const options = this.authenticator.options?.public || {};
    if (!options.allowSignUp) {
      ctx.throw(403, ctx.t('Not allowed to sign up', { ns: namespace }));
    }
    const User = ctx.db.getRepository('users');
    const { values } = ctx.action.params;
    const { password, confirm_password } = values;
    const signupFormSettings = this.getSignupFormSettings();
    try {
      this.verfiySignupParams(signupFormSettings, values);
    } catch (error) {
      ctx.throw(400, this.ctx.t(error.message, { ns: namespace }));
    }
    if (!password) {
      ctx.throw(400, ctx.t('Please enter a password', { ns: namespace }));
    }
    if (password !== confirm_password) {
      ctx.throw(400, ctx.t('The password is inconsistent, please re-enter', { ns: namespace }));
    }
    const fields = signupFormSettings.map((item: { field: string }) => item.field);
    const userValues = _.pick(values, fields);
    const user = await User.create({ values: { ...userValues, password } });
    return user;
  }

  private getEmailConfig() {
    const options = _.omit(this.authenticator.options, 'public') || {};
    return { ...options, enableResetPassword: this.authenticator.options?.public?.enableResetPassword } as {
      enableResetPassword: boolean;
      notificationChannel: string;
      emailSubject: string;
      emailContentType: string;
      emailContentText?: string;
      emailContentHTML?: string;
      resetTokenExpiresIn: number;
    };
  }

  async lostPassword() {
    const ctx = this.ctx;
    const {
      values: { email, baseURL },
    } = ctx.action.params;
    const authenticatorName = ctx.get('X-Authenticator');

    if (!authenticatorName) {
      ctx.throw(400, ctx.t('Missing X-Authenticator in request header', { ns: namespace }));
    }

    if (!email) {
      ctx.throw(400, ctx.t('Please fill in your email address', { ns: namespace }));
    }

    if (!this.isEmail(email)) {
      ctx.throw(400, ctx.t('Incorrect email format', { ns: namespace }));
    }

    // 通过用户认证的接口获取邮件渠道、主题、内容等
    const {
      notificationChannel,
      emailContentType,
      emailContentHTML,
      emailContentText,
      emailSubject,
      enableResetPassword,
      resetTokenExpiresIn,
    } = this.getEmailConfig();

    if (!enableResetPassword) {
      ctx.throw(403, ctx.t('Not allowed to reset password', { ns: namespace }));
    }

    const destination = await getPasswordResetDestination(ctx.app.name);
    if ('error' in destination) {
      ctx.logger.warn(destination.error);
      return ctx.throw(503, ctx.t('Email password recovery is temporarily unavailable.', { ns: namespace }));
    }

    const notificationManager = ctx.app.getPlugin('notification-manager');
    if (!notificationManager) {
      ctx.throw(500, ctx.t('Notification manager plugin not found', { ns: namespace }));
    }
    if (!(await notificationManager.manager.findChannel(notificationChannel))) {
      ctx.throw(400, ctx.t('Email channel not found', { ns: namespace }));
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    // Once the request is accepted, delivery errors must not disclose whether the account exists.
    try {
      const resetToken = await ctx.app.authManager.jwt.sign(
        { resetPasswordUserId: user.id },
        { expiresIn: resetTokenExpiresIn * 60 },
      );
      const resetPage = getPasswordResetPage(destination, baseURL);
      resetPage.searchParams.set('resetToken', resetToken);
      resetPage.searchParams.set('name', authenticatorName);
      const resetLink = resetPage.href;
      const variables = {
        $user: user,
        $resetLink: resetLink,
        $env: ctx.app.environment.getVariables(),
        $resetLinkExpiration: resetTokenExpiresIn,
        $systemSettings: (await ctx.db.getRepository('systemSettings')?.findOne()) || {},
      };
      const content = parsedValue(emailContentType === 'html' ? emailContentHTML : emailContentText, variables);
      await notificationManager.send({
        channelName: notificationChannel,
        message: {
          to: [email],
          subject: parsedValue(emailSubject, variables),
          contentType: emailContentType,
          ...(emailContentType === 'html' ? { html: content } : { text: content }),
        },
      });
    } catch (error) {
      ctx.logger.error('Failed to prepare or dispatch password reset email', {
        notificationChannel,
        errorName: error instanceof Error ? error.name : undefined,
      });
    }

    return null;
  }

  async resetPassword() {
    const ctx = this.ctx;
    const {
      values: { password, resetToken },
    } = ctx.action.params;

    // 验证 resetToken 是否存在
    if (!resetToken) {
      ctx.throw(401, ctx.t('Token expired', { ns: namespace }));
    }

    // 先检查令牌有效性
    try {
      await this.checkResetToken(resetToken);
    } catch (error) {
      // 保持原始错误抛出
      throw error;
    }

    // 解析 Token
    let decodedToken;
    try {
      decodedToken = await ctx.app.authManager.jwt.decode(resetToken);
    } catch (error) {
      ctx.throw(401, ctx.t('Token expired', { ns: namespace }));
    }

    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: {
        id: decodedToken.resetPasswordUserId,
      },
    });

    if (!user) {
      ctx.throw(404, ctx.t('User not found', { ns: namespace }));
    }

    user.password = password;
    await user.save();

    // 将使用过的令牌加入黑名单
    await ctx.app.authManager.jwt.block(resetToken);

    ctx.logger.info(`Password for user ${user.id} has been reset`);

    return null;
  }

  /**
   * 检查重置密码的 Token 是否有效
   */
  async checkResetToken(resetToken: string) {
    if (!resetToken) {
      this.ctx.throw(401, this.ctx.t('Token expired', { ns: namespace }));
    }

    const blocked = await this.jwt.blacklist.has(resetToken);

    if (blocked) {
      this.ctx.throw(401, this.ctx.t('Token expired', { ns: namespace }));
    }

    try {
      await this.ctx.app.authManager.jwt.decode(resetToken);
      return true;
    } catch (err) {
      this.ctx.throw(401, this.ctx.t('Token expired', { ns: namespace }));
    }
  }
}
