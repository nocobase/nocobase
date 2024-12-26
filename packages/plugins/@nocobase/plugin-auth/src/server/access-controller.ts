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
import { Mutex } from 'async-mutex';
import ms from 'ms';
import Database from '@nocobase/database';
import Application from '@nocobase/server';
import { secAccessCtrlConfigCollName, secAccessCtrlConfigKey, secAccessCtrlConfigCacheKey } from '../constants';
import { SecurityAccessConfig } from '../types';

const mutexMap = new Map<string, Mutex>();
type AccessInfo = {
  id: string;
  lastAccessTime: EpochTimeStamp;
  signInTime: EpochTimeStamp;
  resigned: boolean;
};
type AccessService = IAccessControlService<AccessInfo>;
export class AccessController implements AccessService {
  cache: Cache;
  public config: IAccessControlConfig;
  private accessMap: Map<string, AccessInfo> = new Map();
  constructor({ cache, config }: { cache: Cache; config?: IAccessControlConfig }) {
    this.cache = cache;
    this.config = config ?? {
      tokenExpirationTime: '1h',
      maxTokenLifetime: '7d',
      maxInactiveInterval: '1h',
      opTimeoutControlEnabled: true,
    };
  }

  getConfig() {
    return this.config;
  }
  setConfig(config: Partial<IAccessControlConfig>): void {
    this.config = { ...this.config, ...config };
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
    const mutex = mutexMap.get(id) ?? mutexMap.set(id, new Mutex()).get(id);
    if (mutex && mutex.isLocked()) {
      await mutex.waitForUnlock();
    }
    try {
      const access = this.accessMap.get(id);
      if (!access) return { status: 'failed', reason: 'access_id_not_exist' };
      if (access.resigned) return { status: 'failed', reason: 'access_id_resigned' };
      const preAccessInfo = this.accessMap.get(id);
      mutex.acquire();
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
      mutex.release();
    }
  };
  canAccess: AccessService['canAccess'] = (id) => {
    const accessInfo = this.accessMap.get(id);
    const signInTime = accessInfo.signInTime;

    if (!accessInfo) return { allow: false, reason: 'access_id_not_exist' };
    const currTS = Date.now();
    if (currTS - accessInfo.lastAccessTime > ms(this.config.maxInactiveInterval)) {
      return { allow: false, reason: 'action_timeout' };
    }
    if (Date.now() - signInTime > ms(this.config.maxTokenLifetime)) {
      return { allow: false, reason: 'access_expired' };
    }
    return { allow: true };
  };
}

export const createAccessCtrlConfigRecord = async (db: Database) => {
  const repository = db.getRepository(secAccessCtrlConfigCollName);
  const res = await repository.findOne({ filterByTk: secAccessCtrlConfigKey });
  if (res.dataValues) {
    return;
  }
  const config: SecurityAccessConfig = {
    tokenExpirationTime: '1h',
    maxTokenLifetime: '7d',
    maxInactiveInterval: '1h',
    opTimeoutControlEnabled: true,
  };
  await repository.create({
    values: {
      key: secAccessCtrlConfigKey,
      config,
    },
  });
};

export const getAccessCtrlConfig = async (db: Database) => {
  const repository = db.getRepository(secAccessCtrlConfigCollName);

  const res = await repository.findOne({ filterByTk: secAccessCtrlConfigKey });
  return res?.config;
};

export const saveAccessCtrlConfigToCache = async (app: Application, db: Database, cache: Cache) => {
  try {
    const config = await getAccessCtrlConfig(db);
    if (config) {
      cache.set(secAccessCtrlConfigCacheKey, config);
    }
    db.on(`${secAccessCtrlConfigCollName}.afterUpdate`, async (model) => {
      cache.set(secAccessCtrlConfigCacheKey, model.config);
    });
  } catch (error) {
    app.logger.error('saveAccessCtrlConfigToCache error', error);
  }
};
