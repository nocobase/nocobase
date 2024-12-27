/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IAccessControlService, IAccessControlConfig } from '@nocobase/auth';
import { Cache } from '@nocobase/cache';
import { randomUUID } from 'crypto';
import ms from 'ms';
import Application from '@nocobase/server';

type AccessInfo = {
  id: string;
  lastAccessTime: EpochTimeStamp;
  signInTime: EpochTimeStamp;
  resigned: boolean;
};
type AccessService = IAccessControlService<AccessInfo>;
export class AccessController implements AccessService {
  cache: Cache;
  app: Application;
  private accessMap: Map<string, AccessInfo> = new Map();
  constructor({ cache, app }: { cache: Cache; app: Application }) {
    this.cache = cache;
    this.app = app;
  }

  getConfig() {
    return this.cache.get<IAccessControlConfig>('config');
  }
  setConfig(config: Partial<IAccessControlConfig>) {
    return this.cache.set('config', config);
  }
  addAccess() {
    const id = randomUUID();
    const currTS = Date.now();
    this.accessMap.set(id, {
      id,
      lastAccessTime: currTS,
      signInTime: currTS,
      resigned: false,
    });
    return id;
  }
  updateAccess(id: string, value: Partial<AccessInfo>) {
    const accessInfo = this.accessMap.get(id);
    if (!accessInfo) throw new Error('Access not found');
    this.accessMap.set(id, { ...accessInfo, ...value });
  }

  refreshAccess: AccessService['refreshAccess'] = async (id) => {
    const lockKey = `plugin-auth:access-controller:refreshAccess:${id}`;
    const release = await this.app.lockManager.acquire(lockKey, 1000);
    try {
      const access = this.accessMap.get(id);
      if (!access) return { status: 'failed', reason: 'access_id_not_exist' };
      if (access.resigned) return { status: 'failed', reason: 'access_id_resigned' };
      const preAccessInfo = this.accessMap.get(id);
      const newId = randomUUID();
      this.updateAccess(id, { resigned: true });
      const accessInfo = {
        id: newId,
        lastAccessTime: Date.now(),
        resigned: false,
        signInTime: preAccessInfo.signInTime,
      };
      this.accessMap.set(newId, accessInfo);
      return { status: 'success', id: newId };
    } finally {
      release();
    }
  };
  canAccess: AccessService['canAccess'] = async (id) => {
    const accessInfo = this.accessMap.get(id);
    const signInTime = accessInfo.signInTime;
    const config = await this.getConfig();
    if (!accessInfo) return { allow: false, reason: 'access_id_not_exist' };
    const currTS = Date.now();
    if (currTS - accessInfo.lastAccessTime > ms(config.maxInactiveInterval)) {
      return { allow: false, reason: 'action_timeout' };
    }
    if (Date.now() - signInTime > ms(config.maxTokenLifetime)) {
      return { allow: false, reason: 'access_expired' };
    }
    return { allow: true };
  };
}
