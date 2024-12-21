/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IAccessControlService, IAccessControlConfig } from '@nocobase/auth';
import { randomUUID } from 'crypto';
import { Mutex } from 'async-mutex';
const mutexMap = new Map<string, Mutex>();
type AccessInfo = {
  id: string;
  lastAccessTime: EpochTimeStamp;
  resigned: boolean;
};
type AccessService = IAccessControlService<AccessInfo>;
export class AccessController implements AccessService {
  public config: IAccessControlConfig;
  private accessMap: Map<string, AccessInfo> = new Map();
  getConfig() {
    return this.config;
  }
  setConfig(config: Partial<IAccessControlConfig>): void {
    this.config = { ...this.config, ...config };
  }
  addAccess() {
    const id = randomUUID();
    this.accessMap.set(id, {
      id,
      lastAccessTime: Date.now(),
      resigned: false,
    });
  }
  updateAccess(id: string, value: Partial<AccessInfo>) {
    const accessInfo = this.accessMap.get(id);
    if (!accessInfo) throw new Error('Access not found');
    this.accessMap.set(id, { ...accessInfo, ...value });
  }

  refreshAccess: AccessService['refreshAccess'] = async (id) => {
    const checkAccess = () => {
      const access = this.accessMap.get(id);
      if (!access) return { status: 'failed', reason: 'access_id_not_exist' };
      if (access.resigned) return { status: 'failed', reason: 'access_id_resigned' };
    };
    const mutex = mutexMap.get(id) ?? mutexMap.set(id, new Mutex()).get(id);
    if (mutex && mutex.isLocked()) {
      await mutex.waitForUnlock();
      checkAccess();
    }
    try {
      mutex.acquire();
      const newId = randomUUID();
      this.updateAccess(id, { resigned: true });
      const accessInfo = {
        id: newId,
        lastAccessTime: Date.now(),
        resigned: false,
      };
      this.accessMap.set(newId, accessInfo);
      return { status: 'success', id: newId };
    } finally {
      mutex.release();
    }
  };
  canAccess: AccessService['canAccess'] = (id) => {
    const accessInfo = this.accessMap.get(id);
    if (!accessInfo) return { allow: false, reason: 'access_id_not_exist' };
    const currTS = Date.now();
    if (currTS - accessInfo.lastAccessTime > this.config.maxInactiveInterval) {
      return { allow: false, reason: 'action_timeout' };
    }
    return { allow: true };
  };
}
