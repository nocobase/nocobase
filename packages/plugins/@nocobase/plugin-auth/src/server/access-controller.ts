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
import Database, { Repository, Model } from '@nocobase/database';
import { secAccessInfoListCollName } from '../constants';

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
  db: Database;
  private accessMap: {
    get(id: string): Promise<AccessInfo | null>;
    set(id: string, value: AccessInfo): Promise<void>;
  };
  constructor({ cache, app }: { cache: Cache; app: Application }) {
    this.cache = cache;
    this.app = app;
    this.accessMap = {
      get: (id) => {
        // return this.cache.get<AccessInfo>(`access:${id}`);
        return this.cache.wrap(`access:${id}`, async () => {
          const repo = this.app.db.getRepository<Repository<AccessInfo>>(secAccessInfoListCollName);
          const accessInfo = await repo.findOne({ filterByTk: id });
          if (!accessInfo) return null;
          else return accessInfo.dataValues as AccessInfo;
        });
      },
      set: async (id, value) => {
        // return this.cache.set(`access:${id}`, value);
        const createOrUpdate = async (id: string, value: AccessInfo) => {
          const repo = this.app.db.getRepository<Repository<AccessInfo>>(secAccessInfoListCollName);
          const exist = await repo.findOne({ filterByTk: id });
          if (exist) {
            await repo.update({ filterByTk: id, values: value });
          } else {
            await repo.create({ values: value });
          }
        };
        await Promise.all([this.cache.set(`access:${id}`, value), createOrUpdate(id, value)]);
        return;
      },
    };
  }

  getConfig() {
    return this.cache.get<IAccessControlConfig>('config');
  }
  setConfig(config: Partial<IAccessControlConfig>) {
    return this.cache.set('config', config);
  }
  async addAccess() {
    const id = randomUUID();
    const currTS = Date.now();
    await this.accessMap.set(id, {
      id,
      lastAccessTime: currTS,
      signInTime: currTS,
      resigned: false,
    });
    return id;
  }
  async updateAccess(id: string, value: Partial<AccessInfo>) {
    const accessInfo = await this.accessMap.get(id);
    if (!accessInfo) throw new Error('Access not found');
    return this.accessMap.set(id, { ...accessInfo, ...value });
  }

  renew: AccessService['renew'] = async (id) => {
    const lockKey = `plugin-auth:access-controller:renew:${id}`;
    const release = await this.app.lockManager.acquire(lockKey, 1000);
    try {
      const access = await this.accessMap.get(id);
      if (!access) return { status: 'missing' };
      if (access.resigned) return { status: 'unrenewable' };
      const preAccessInfo = await this.accessMap.get(id);
      const newId = randomUUID();
      await this.updateAccess(id, { resigned: true });
      const accessInfo = {
        id: newId,
        lastAccessTime: Date.now(),
        resigned: false,
        signInTime: preAccessInfo.signInTime,
      };
      await this.accessMap.set(newId, accessInfo);
      return { status: 'renewed', id: newId };
    } finally {
      release();
    }
  };
  check: AccessService['check'] = async (id) => {
    const tokenInfo = await this.accessMap.get(id);
    if (!tokenInfo) return { status: 'missing' };

    if (tokenInfo.resigned) return { status: 'unrenewable' };

    const signInTime = tokenInfo.signInTime;
    const config = await this.getConfig();
    const currTS = Date.now();

    if (currTS - tokenInfo.lastAccessTime > ms(config.maxInactiveInterval)) {
      return { status: 'idle' };
    }

    if (Date.now() - signInTime > ms(config.maxTokenLifetime)) {
      return { status: 'revoked' };
    }

    return { status: 'valid' };
  };
}
