/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
// import { VerificationProviders } from './VerificationProviders';
import { lazy } from '@nocobase/client';
const { VerificationProviders } = lazy(() => import('./VerificationProviders'), 'VerificationProviders');
const { SMSVerification } = lazy(() => import('./otp-verification/SMSVerification'), 'SMSVerification');
import { NAMESPACE } from './locale';
import { Registry } from '@nocobase/utils/client';
import { SMS_OTP_VERIFICATION_TYPE } from '../constants';
import { ComponentType } from 'react';

type VerficationTypeOptions = {
  components: {
    VerificationForm: ComponentType<any>;
  };
};

export class PluginVerificationClient extends Plugin {
  verifications = new Registry<VerficationTypeOptions>();

  registerVerificationType(type: string, options: VerficationTypeOptions) {
    this.verifications.register(type, options);
  }

  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'CheckCircleOutlined',
      title: `{{t("Verification", { ns: "${NAMESPACE}" })}}`,
      Component: VerificationProviders,
      aclSnippet: 'pm.verification.providers',
    });

    this.registerVerificationType(SMS_OTP_VERIFICATION_TYPE, {
      components: {
        VerificationForm: SMSVerification,
      },
    });
  }
}

export { SMS_OTP_VERIFICATION_TYPE };
export default PluginVerificationClient;
