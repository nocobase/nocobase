/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT, SMS_OTP_VERIFICATION_TYPE } from '../constants';
export { default, PluginVerificationClientV2 } from './plugin';
export { NAMESPACE, useT, useVerificationTranslation } from './locale';
export { VerificationManager } from './verification-manager';
export type { BindFormProps, VerificationFormProps, VerificationTypeOptions } from './verification-manager';
export { SMSOTPProviderManager } from './otp-sms-provider-manager';
export type { SMSOTPProviderOptions } from './otp-sms-provider-manager';
export { VerifierSelect } from './components/VerifierSelect';
export type { VerifierSelectProps } from './components/VerifierSelect';
export { VerificationCode } from './components/VerificationCode';
export type { VerificationCodeProps } from './components/VerificationCode';
