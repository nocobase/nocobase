/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import PluginAuthClientV2 from '@nocobase/plugin-auth/client-v2';
import PluginVerificationClientV2 from '@nocobase/plugin-verification/client-v2';
import { authType, namespace } from '../constants';
import { NAMESPACE } from './locale';
import { emailOTPVerificationOptions, smtpProviderOptions } from './otp-email';
import { EmailOTPProviderManager } from './email-otp-provider-manager';

const EMAIL_OTP_VERIFICATION_TYPE = 'email-otp';

/**
 * v2 entry for the Auth Email plugin. Mirrors the v1 surface
 * (`emailOTPProviderManager` instance exposed to downstream plugins) but
 * plugs into the v2 lifecycle.
 *
 * - Registers the `Email` auth type with the v2 auth plugin so v2 sign-in
 *   pages can display the email-OTP form.
 * - Registers the email-OTP verification type with the v2 verification
 *   plugin so verifiers of this type can be configured.
 * - The legacy `src/client/` entry is intentionally left in place so
 *   downstream v1-only plugins keep working until they migrate independently.
 */
export class PluginAuthEmailClientV2 extends Plugin {
  emailOTPProviderManager = new EmailOTPProviderManager();

  async load() {
    // i18n resources are auto-loaded by v2 buildin `LocalePlugin.afterAdd`.
    this.registerEmailAuthType();
    this.registerEmailOTPVerification();
  }

  private registerEmailAuthType() {
    const authPlugin = this.app.pm.get(PluginAuthClientV2);
    if (!authPlugin) {
      console.warn('auth-email: @nocobase/plugin-auth is required');
      return;
    }
    authPlugin.registerType(authType, {
      signInFormLoader: () => import('./forms/EmailSignInForm'),
      adminSettingsFormLoader: () => import('./forms/EmailAuthAdminSettings'),
    });
  }

  private registerEmailOTPVerification() {
    const verificationPlugin = this.app.pm.get(PluginVerificationClientV2);
    if (!verificationPlugin) {
      console.warn('auth-email: @nocobase/plugin-verification is required');
      return;
    }

    // Register Email OTP verification type
    verificationPlugin.verificationManager.registerVerificationType(
      EMAIL_OTP_VERIFICATION_TYPE,
      emailOTPVerificationOptions,
    );

    // Register SMTP provider
    this.emailOTPProviderManager.registerProvider('smtp', smtpProviderOptions);
  }
}

export default PluginAuthEmailClientV2;
