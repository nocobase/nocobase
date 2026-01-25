/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import VerificationPlugin from '@nocobase/plugin-verification';
import { InstallOptions, Plugin } from '@nocobase/server';
import { authType, namespace } from '../constants';
import { EmailAuth } from './email-auth';
import { tval } from '@nocobase/utils';
import { EmailOTPProviderManager, EmailOTPVerification } from './email-otp';
import emailOTPProviders from './email-otp/resource/email-otp-providers';
import emailOTP from './email-otp/resource/email-otp';
import { SMTPProvider } from './email-otp/providers/smtp';

const EMAIL_OTP_VERIFICATION_TYPE = 'email-otp';

export class PluginAuthEmailServer extends Plugin {
  emailOTPProviderManager = new EmailOTPProviderManager();

  afterAdd() {}

  async load() {
    const verificationPlugin: VerificationPlugin = this.app.getPlugin('verification');
    if (!verificationPlugin) {
      this.app.logger.warn('auth-email: @nocobase/plugin-verification is required');
      return;
    }
    // Register email signIn action with unique key to avoid overriding other plugins
    verificationPlugin.verificationManager.registerAction('auth:signIn:email', {
      manual: true,
      getBoundInfoFromCtx: (ctx) => {
        return ctx.action.params.values || {};
      },
    });

    this.app.authManager.registerTypes(authType, {
      auth: EmailAuth,
      title: tval('Email', { ns: namespace }),
    });

    // Register email OTP verification
    verificationPlugin.verificationManager.registerVerificationType(EMAIL_OTP_VERIFICATION_TYPE, {
      title: tval('Email OTP', { ns: namespace }),
      description: tval('Get one-time codes sent to your email to complete authentication requests.', {
        ns: namespace,
      }),
      bindingRequired: true,
      verification: EmailOTPVerification,
    });
    verificationPlugin.verificationManager.addSceneRule(
      (scene, verificationType) =>
        ['auth-email', 'unbind-verifier'].includes(scene) && verificationType === EMAIL_OTP_VERIFICATION_TYPE,
    );

    // Register SMTP provider
    this.emailOTPProviderManager.registerProvider('smtp', {
      title: tval('SMTP', { ns: namespace }),
      provider: SMTPProvider,
    });

    // Define resources
    this.app.resourceManager.define(emailOTPProviders);
    this.app.resourceManager.define(emailOTP);

    this.app.acl.allow('emailOTP', 'create', 'loggedIn');
    this.app.acl.allow('emailOTP', 'publicCreate');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {
    const verificationPlugin: VerificationPlugin = this.app.getPlugin('verification');
    if (!verificationPlugin) {
      return;
    }
    // Check whether any verifiers of our email OTP type still exist
    const verifiers = await this.app.db.getRepository('verifiers').find({
      filter: {
        verificationType: [EMAIL_OTP_VERIFICATION_TYPE],
      },
    });
    if (verifiers && verifiers.length) {
      const names = verifiers.map((v: any) => v.name).join(', ');
      // Prevent disabling while verifiers still reference this verification type
      throw new Error(
        `Cannot disable plugin ${this.name}: found verifiers still using '${EMAIL_OTP_VERIFICATION_TYPE}': ${names}. Please remove them first.`,
      );
    }
  }

  async remove() {}
}

export default PluginAuthEmailServer;
