/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface ITokenControlConfig {
  tokenExpirationTime: string;
  maxTokenLifetime: string;
  maxInactiveInterval: string;
}

export type JTIStatus = 'valid' | 'inactive' | 'blocked' | 'missing' | 'renewed' | 'login-timeout';
export interface ITokenControlService<TokenInfo = any> {
  getConfig(): Promise<ITokenControlConfig>;
  setConfig(config: ITokenControlConfig): Promise<any>;
  renew(jti: string): Promise<{ status: 'renewed'; id: string } | { status: 'missing' | 'unrenewable' }>;
  add(): Promise<string>;
  set(id: string, value: Partial<TokenInfo>): Promise<void>;
  check(jti: string): Promise<{ status: JTIStatus }>;
}
