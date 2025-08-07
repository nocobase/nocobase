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
    const authenticatorName = ctx.headers['x-authenticator'];

    if (!authenticatorName) {
      ctx.throw(400, ctx.t('Missing X-Authenticator in request header', { ns: namespace }));
    }

    if (!email) {
      ctx.throw(400, ctx.t('Please fill in your email address', { ns: namespace }));
    }

    if (!this.isEmail(email)) {
      ctx.throw(400, ctx.t('Incorrect email format', { ns: namespace }));
    }

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      ctx.throw(401, ctx.t('The email is incorrect, please re-enter', { ns: namespace }));
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

    // 生成重置密码的 token
    const resetToken = await ctx.app.authManager.jwt.sign(
      {
        resetPasswordUserId: user.id,
      },
      {
        expiresIn: resetTokenExpiresIn * 60, // 配置的过期时间，单位分钟，需要转成秒
      },
    );

    // 构建重置密码链接
    const resetLink = `${baseURL}/reset-password?resetToken=${resetToken}&name=${authenticatorName}`;

    const systemSettings = (await ctx.db.getRepository('systemSettings')?.findOne()) || {};

    // 通过通知管理插件发送邮件
    const notificationManager = ctx.app.getPlugin('notification-manager');
    if (notificationManager) {
      const emailer = await notificationManager.manager.findChannel(notificationChannel);
      if (emailer) {
        try {
          const parsedSubject = parsedValue(emailSubject, {
            $user: user,
            $resetLink: resetLink,
            $env: ctx.app.environment.getVariables(),
            $resetLinkExpiration: resetTokenExpiresIn,
            $systemSettings: systemSettings,
          });

          const parsedContent = parsedValue(emailContentType === 'html' ? emailContentHTML : emailContentText, {
            $user: user,
            $resetLink: resetLink,
            $env: ctx.app.environment.getVariables(),
            $resetLinkExpiration: resetTokenExpiresIn,
            $systemSettings: systemSettings,
          });

          const content = emailContentType === 'html' ? { html: parsedContent } : { text: parsedContent };

          try {
            await notificationManager.send({
              channelName: notificationChannel,
              message: {
                to: [email],
                subject: parsedSubject,
                contentType: emailContentType,
                ...content,
              },
            });

            ctx.logger.info(`Password reset email sent to ${email}`);
          } catch (error) {
            ctx.logger.error(`Failed to send reset password email: ${error.message}`, {
              error,
              email,
              notificationChannel,
            });
            ctx.throw(
              500,
              ctx.t('Failed to send email. Error: {{error}}', {
                ns: namespace,
                error: error.message,
              }),
            );
          }
        } catch (error) {
          ctx.logger.error(`Error parsing email template variables: ${error.message}`, {
            error,
            emailSubject,
            emailContentType,
          });
          ctx.throw(
            500,
            ctx.t('Error parsing email template. Error: {{error}}', {
              ns: namespace,
              error: error.message,
            }),
          );
        }
      } else {
        ctx.throw(400, ctx.t('Email channel not found', { ns: namespace }));
      }
    } else {
      ctx.throw(500, ctx.t('Notification manager plugin not found', { ns: namespace }));
    }

    ctx.logger.info(`Password reset email sent to ${email}`);

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
