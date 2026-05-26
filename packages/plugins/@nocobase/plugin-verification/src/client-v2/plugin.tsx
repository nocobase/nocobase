/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT, SMS_OTP_VERIFICATION_TYPE } from '../constants';
import { NAMESPACE } from './locale';
import { smsAliyunProviderOptions, smsOTPVerificationOptions, smsTencentProviderOptions } from './otp-verification/sms';
import { SMSOTPProviderManager } from './otp-sms-provider-manager';
import { VerificationUserCenterItemModel } from './user-center/VerificationUserCenterItemModel';
import { VerificationManager } from './verification-manager';

/**
 * v2 entry for the Verification plugin. Mirrors the v1 surface (`verificationManager` and `smsOTPProviderManager` instances exposed to downstream plugins) but plugs into the v2 lifecycle:
 *
 * - `pluginSettingsManager.addMenuItem` / `addPageTabItem` register the admin settings page with a lazy `componentLoader`.
 * - `flowEngine.registerModels` contributes the User Center entry.
 * - The legacy `src/client/` entry is intentionally left in place so downstream v1-only plugins (TOTP authenticator, 2FA pro plugin) keep working until they migrate independently.
 */
export class PluginVerificationClientV2 extends Plugin {
  verificationManager = new VerificationManager();
  smsOTPProviderManager = new SMSOTPProviderManager();

  async load() {
    // i18n resources are auto-loaded by v2 buildin `LocalePlugin.afterAdd`; see plugin-password-policy/locale.ts for the full rationale.
    this.app.flowEngine.registerModels({ VerificationUserCenterItemModel });

    this.registerSettingsPages();

    // Built-in SMS-OTP verification type and its two stock providers. Third-party providers can call `smsOTPProviderManager.registerProvider` after `app.pm.get(...)` to slot in additional vendors.
    this.verificationManager.registerVerificationType(SMS_OTP_VERIFICATION_TYPE, smsOTPVerificationOptions);
    this.smsOTPProviderManager.registerProvider(PROVIDER_TYPE_SMS_ALIYUN, smsAliyunProviderOptions);
    this.smsOTPProviderManager.registerProvider(PROVIDER_TYPE_SMS_TENCENT, smsTencentProviderOptions);
  }

  private registerSettingsPages() {
    const t = (key: string) => this.app.i18n.t(key, { ns: NAMESPACE });
    this.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title: t('Verification'),
      icon: 'CheckCircleOutlined',
      aclSnippet: 'pm.verification',
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'index',
      title: t('Verifiers'),
      icon: 'CheckCircleOutlined',
      aclSnippet: 'pm.verification.verifiers',
      sort: 1,
      componentLoader: () => import('./pages/VerifiersPage'),
    });
  }
}

export default PluginVerificationClientV2;
