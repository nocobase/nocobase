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
  verifier: string;
  actionType: string;
  boundInfo: any;
  isLogged?: boolean;
};

export type BindFormProps = {
  verifier: string;
  actionType: string;
  isLogged?: boolean;
};

export type VerificationTypeOptions = {
  components: {
    AdminSettingsForm?: ComponentType;
    VerificationForm: ComponentType<VerificationFormProps>;
    BindForm?: ComponentType<BindFormProps>;
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
