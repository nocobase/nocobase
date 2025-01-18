/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { lazy } from '@nocobase/client';
const { Verificators } = lazy(() => import('./verificators/Verificators'), 'Verificators');
const { VerificatorSelect } = lazy(() => import('./verificators/VerificatorSelect'), 'VerificatorSelect');
const { VerificationMenuProvider } = lazy(() => import('./VerificationMenuProvider'), 'VerificationMenuProvider');
import { NAMESPACE } from './locale';
import { PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT, SMS_OTP_VERIFICATION_TYPE } from '../constants';
import { VerificationManager } from './verification-manager';
import { smsAliyunProviderOptions, smsOTPVerificationOptions, smsTencentProviderOptions } from './otp-verification/sms';
import { SMSOTPProviderManager } from './otp-verification/sms/provider-manager';

export class PluginVerificationClient extends Plugin {
  verificationManager = new VerificationManager();
  smsOTPProviderManager = new SMSOTPProviderManager();

  async load() {
    this.app.use(VerificationMenuProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'CheckCircleOutlined',
      title: `{{t("Verification", { ns: "${NAMESPACE}" })}}`,
      Component: Verificators,
      aclSnippet: 'pm.verification.verificators',
    });

    this.app.addComponents({
      VerificatorSelect,
    });

    this.verificationManager.registerVerificationType(SMS_OTP_VERIFICATION_TYPE, smsOTPVerificationOptions);
    this.smsOTPProviderManager.registerProvider(PROVIDER_TYPE_SMS_ALIYUN, smsAliyunProviderOptions);
    this.smsOTPProviderManager.registerProvider(PROVIDER_TYPE_SMS_TENCENT, smsTencentProviderOptions);
  }
}

export { SMS_OTP_VERIFICATION_TYPE };
export { UserVerificatorsContext } from './VerificationMenuProvider';
export default PluginVerificationClient;
