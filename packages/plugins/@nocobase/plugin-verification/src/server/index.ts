/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-ignore
import { name } from '../../package.json';
export { default } from './Plugin';
export * from './constants';
export { SMSOTPVerification } from './otp-verification/sms';
export { Verification } from './verification';
export { VerificationManager } from './verification-manager';
export { SMSProvider } from './otp-verification/sms/providers';

export const namespace = name;
