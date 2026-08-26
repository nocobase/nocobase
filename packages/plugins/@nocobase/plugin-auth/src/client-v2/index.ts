/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default } from './plugin';
export * from './plugin';
export * from './authenticator';
export * from './locale';
export * from './hooks';
export { default as AuthLayout } from './pages/AuthLayout';
export { default as SignInPage } from './pages/SignInPage';
export { default as SignUpPage } from './pages/SignUpPage';
export { default as ForgotPasswordPage } from './pages/ForgotPasswordPage';
export { default as ResetPasswordPage } from './pages/ResetPasswordPage';
export { default as AuthProvider } from './providers/AuthProvider';
export { default as AuthenticatorsContextProvider } from './providers/AuthenticatorsContextProvider';
