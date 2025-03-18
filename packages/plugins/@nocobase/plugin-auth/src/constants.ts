/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const tokenPolicyRecordKey = 'token-policy-config';
export const tokenPolicyCacheKey = 'auth:' + tokenPolicyRecordKey;
export const tokenPolicyCollectionName = 'tokenControlConfig';
export const issuedTokensCollectionName = 'issuedTokens';
export const RENEWED_JTI_CACHE_MS = 10000;
