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
  opTimeoutControlEnabled: boolean;
}

export interface IAccessControlService<AccessInfo = any> {
  getConfig(): Promise<IAccessControlConfig>;
  setConfig(config: IAccessControlConfig): Promise<any>;
  refreshAccess(
    accessId: string,
  ): Promise<
    { status: 'success'; id: string } | { status: 'failed'; reason: 'access_id_not_exist' | 'access_id_resigned' }
  >;
  addAccess(): Promise<string>;
  updateAccess(id: string, value: Partial<AccessInfo>): Promise<void>;
  canAccess(accessId: string): Promise<
    | { allow: true }
    | {
        allow: false;
        reason: 'access_id_not_exist' | 'access_id_resigned' | 'action_timeout' | 'ip_baned' | 'access_expired';
      }
  >;
}
