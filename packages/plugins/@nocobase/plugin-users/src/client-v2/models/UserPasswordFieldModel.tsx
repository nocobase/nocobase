/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PasswordFieldModel, PasswordInput } from '@nocobase/client-v2';
import React from 'react';
import { PluginUsersClientV2 } from '../plugin';

type PasswordValidationRule = {
  validator?: (_rule: unknown, value: unknown) => Promise<void>;
  required?: boolean;
  message?: string;
  __pluginUsersPasswordPolicy?: boolean;
};

export class UserPasswordFieldModel extends PasswordFieldModel {
  private readonly validatePassword = async (_rule: unknown, value: unknown) => {
    if (typeof value !== 'string' || !value) {
      return;
    }
    const plugin = this.context.app?.pm?.get?.(PluginUsersClientV2) as PluginUsersClientV2 | undefined;
    const validators = plugin?.getPasswordValidators?.() ?? [];
    const username = this.getUsernameForValidation();
    for (const validator of validators) {
      const message = await validator(value, { username });
      if (message) {
        throw new Error(message);
      }
    }
  };

  private getUsernameForValidation() {
    const username = this.context.form?.getFieldValue?.('username');
    return typeof username === 'string' && username ? username : undefined;
  }

  private ensurePasswordValidationRule() {
    const parent = this.parent;
    if (!parent) {
      return;
    }
    const currentRules = (
      Array.isArray(parent.getProps()?.rules) ? parent.getProps()?.rules : []
    ) as PasswordValidationRule[];
    if (currentRules.some((rule) => rule.__pluginUsersPasswordPolicy)) {
      return;
    }
    parent.setProps({
      rules: [
        ...currentRules,
        {
          validator: this.validatePassword,
          __pluginUsersPasswordPolicy: true,
        },
      ],
    });
  }

  render() {
    this.ensurePasswordValidationRule();
    return <PasswordInput {...this.props} checkStrength={this.props.checkStrength ?? false} />;
  }
}
