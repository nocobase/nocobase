/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const AuthErrorCode = {
  EMPTY_TOKEN: 'EMPTY_TOKEN' as const,
  EXPIRED_TOKEN: 'EXPIRED_TOKEN' as const,
  INVALID_TOKEN: 'INVALID_TOKEN' as const,
  TOKEN_RENEW_FAILED: 'TOKEN_RENEW_FAILED' as const,
  BLOCKED_TOKEN: 'BLOCKED_TOKEN' as const,
  EXPIRED_SESSION: 'EXPIRED_SESSION' as const,
  NOT_EXIST_USER: 'NOT_EXIST_USER' as const,
  SKIP_TOKEN_RENEW: 'SKIP_TOKEN_RENEW' as const,
  USER_HAS_NO_ROLES_ERR: 'USER_HAS_NO_ROLES_ERR' as const,
};
