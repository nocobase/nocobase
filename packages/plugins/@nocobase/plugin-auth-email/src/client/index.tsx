/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { SigninPage } from './SigninPage';
import { Options } from './Options';
import { authType } from '../constants';
import PluginVerificationClient from '@nocobase/plugin-verification/client';
import { emailOTPVerificationOptions } from './email-otp';
import { EmailOTPProviderManager } from './email-otp/provider-manager';
import { SMTPSettings } from './email-otp/providers/SMTPSettings';

const EMAIL_OTP_VERIFICATION_TYPE = 'email-otp';

export class PluginAuthEmailClient extends Plugin {
  emailOTPProviderManager = new EmailOTPProviderManager();

  async load() {
    const auth = this.app.pm.get(AuthPlugin) as any;
    auth.registerType(authType, {
      components: {
        SignInForm: SigninPage,
        AdminSettingsForm: Options,
      },
    });

    const verification = this.app.pm.get('verification') as any;
    verification.verificationManager.registerVerificationType(EMAIL_OTP_VERIFICATION_TYPE, emailOTPVerificationOptions);
    this.emailOTPProviderManager.registerProvider('smtp', {
      components: {
        AdminSettingsForm: SMTPSettings,
      },
    });
  }
}

export default PluginAuthEmailClient;
