/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const enum LICENSE_TIPS {
  INVALID_LICENSE_KEY = 'Invalid license key, please go to NocoBase Service to obtain a new license key.',
  ENV_NOT_MATCH = 'The licensed environment does not match the current environment. Please go to NocoBase Service to obtain a new license key.',
  DOMAIN_NOT_MATCH = 'The licensed domain does not match the current domain {{domain}}. Please go to NocoBase Service to obtain a new license key.',
  PKG_CONNECTION_ERROR = 'The current environment cannot connect to NocoBase Service, only manual installation of commercial plugins is supported.',
  PKG_LOGIN_ERROR = 'The current environment cannot log in to NocoBase Service, only manual installation of commercial plugins is supported.',
}
