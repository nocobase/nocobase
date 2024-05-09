/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

interface TLSOptions {
  key?: string;
  cert?: string;
  ca?: string;
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
}

export interface LDAPOption {
  username: string;
  password: string;
  ldapUrl: string;
  baseDN: string;
  reconnect?: boolean;
  connectTimeout?: number;
  tlsOptions?: TLSOptions;
}
