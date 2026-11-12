/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default, PluginAuthEmailClientV2 } from './plugin';
export { NAMESPACE, useAuthEmailTranslation, useT } from './locale';
export { EmailOTPProviderManager } from './email-otp-provider-manager';
export type { EmailOTPProviderOptions } from './email-otp-provider-manager';
export { EmailOTPVerificationManager } from './verification-manager';
export type { VerificationFormProps, BindFormProps, VerificationTypeOptions } from './verification-manager';
export { VerificationCode } from './components/VerificationCode';
export type { VerificationCodeProps } from './components/VerificationCode';
