/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface IAccessControlConfig {
  tokenExpirationTime: string;
  maxTokenLifetime: string;
  maxInactiveInterval: string;
}

export type JTIStatus = 'valid' | 'idle' | 'revoked' | 'missing' | 'renewed' | 'unrenewable' | 'renewed';
export interface IAccessControlService<AccessInfo = any> {
  getConfig(): Promise<IAccessControlConfig>;
  setConfig(config: IAccessControlConfig): Promise<any>;
  renew(accessId: string): Promise<{ status: 'renewed'; id: string } | { status: 'missing' | 'unrenewable' }>;
  addAccess(): Promise<string>;
  updateAccess(id: string, value: Partial<AccessInfo>): Promise<void>;
  check(accessId: string): Promise<{ status: JTIStatus }>;
}
