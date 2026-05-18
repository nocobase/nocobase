/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import type { ComponentType } from 'react';

export type VerificationFormProps = {
  verifier: string;
  actionType: string;
  boundInfo?: { bound?: boolean; publicInfo?: any };
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

/**
 * Plain registry: a type-name → option-bundle map. Used by SMS / TOTP /
 * 2FA / future verifiers to surface a type-specific Bind form, verify
 * form, and admin settings form. No React or Formily dependencies — the
 * v2 manager is byte-for-byte equivalent to v1's, only the import path
 * to `Registry` differs.
 */
export class VerificationManager {
  verifications = new Registry<VerificationTypeOptions>();

  registerVerificationType(type: string, options: VerificationTypeOptions) {
    this.verifications.register(type, options);
  }

  getVerification(type: string) {
    return this.verifications.get(type);
  }
}
