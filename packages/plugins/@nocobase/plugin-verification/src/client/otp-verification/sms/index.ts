/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AliyunSettings } from './providers/AliyunSettings';
import { TencentSettings } from './providers/TencentSettings';
import { VerificationForm } from './VerificationForm';
import { AdminSettingsForm } from './AdminSettingsForm';
import { BindForm } from './BindForm';

export const smsOTPVerificationOptions = {
  components: {
    VerificationForm,
    AdminSettingsForm,
    BindForm,
  },
};

export const smsAliyunProviderOptions = {
  components: {
    AdminSettingsForm: AliyunSettings,
  },
};

export const smsTencentProviderOptions = {
  components: {
    AdminSettingsForm: TencentSettings,
  },
};
