/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { BasicAuth } from './basic-auth';
export { AuthModel } from './model/authenticator';
export { presetAuthType } from '../preset';
export { defaultTokenPolicyConfig } from '../constants';
export { buildRedirectPath, getModernClientPrefix, resolveSigninPrefix } from './utils/buildRedirectPath';
export type { BuildRedirectPathOptions, ResolveSigninPrefixOptions } from './utils/buildRedirectPath';
export { resolveSubAppSegment } from './utils/resolveSubAppSegment';

export { default } from './plugin';
export * from '../constants';
