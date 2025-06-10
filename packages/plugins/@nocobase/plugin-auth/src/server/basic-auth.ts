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
import crypto from 'crypto';
import { namespace } from '../preset';
import _ from 'lodash';

export class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
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
      if (email && !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(email)) {
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

  /* istanbul ignore next -- @preserve */
  async lostPassword() {
    const ctx = this.ctx;
    const {
      values: { email },
    } = ctx.action.params;
    if (!email) {
      ctx.throw(400, ctx.t('Please fill in your email address', { ns: namespace }));
    }
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      ctx.throw(401, ctx.t('The email is incorrect, please re-enter', { ns: namespace }));
    }
    user.resetToken = crypto.randomBytes(20).toString('hex');
    await user.save();
    return user;
  }

  /* istanbul ignore next -- @preserve */
  async resetPassword() {
    const ctx = this.ctx;
    const {
      values: { email, password, resetToken },
    } = ctx.action.params;
    const user = await this.userRepository.findOne({
      where: {
        email,
        resetToken,
      },
    });
    if (!user) {
      ctx.throw(404);
    }
    user.token = null;
    user.resetToken = null;
    user.password = password;
    await user.save();
    return user;
  }

  /* istanbul ignore next -- @preserve */
  async getUserByResetToken() {
    const ctx = this.ctx;
    const { token } = ctx.action.params;
    const user = await this.userRepository.findOne({
      where: {
        resetToken: token,
      },
    });
    if (!user) {
      ctx.throw(401);
    }
    return user;
  }
}
