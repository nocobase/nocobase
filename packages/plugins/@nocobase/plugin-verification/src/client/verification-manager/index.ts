/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import { ComponentType } from 'react';

export type VerificationFormProps = {
  verificator: string;
  actionType: string;
  publicInfo: any;
  getUserVerifyInfo: (form: any) => Record<string, any>;
  useVerifyActionProps: any;
};

export type VerificationTypeOptions = {
  components: {
    VerificationForm: ComponentType<VerificationFormProps>;
    AdminSettingsForm: ComponentType;
  };
};

export class VerificationManager {
  verifications = new Registry<VerificationTypeOptions>();

  registerVerificationType(type: string, options: VerificationTypeOptions) {
    this.verifications.register(type, options);
  }

  getVerification(type: string) {
    return this.verifications.get(type);
  }
}
