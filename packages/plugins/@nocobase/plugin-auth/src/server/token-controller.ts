/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ITokenControlService, ITokenControlConfig } from '@nocobase/auth';
import { Cache } from '@nocobase/cache';
import { randomUUID } from 'crypto';
import ms from 'ms';
import Application from '@nocobase/server';
import Database, { Repository, Model } from '@nocobase/database';
import { tokenInfoListCollName } from '../constants';

type TokenInfo = {
  id: string;
  lastAccessTime: EpochTimeStamp;
  signInTime: EpochTimeStamp;
  resigned: boolean;
};
type AccessService = ITokenControlService<TokenInfo>;
export class TokenController implements AccessService {
  cache: Cache;
  app: Application;
  db: Database;
  private tokenMap: {
    get(id: string): Promise<TokenInfo | null>;
    set(id: string, value: TokenInfo): Promise<void>;
  };
  constructor({ cache, app }: { cache: Cache; app: Application }) {
    this.cache = cache;
    this.app = app;
    this.tokenMap = {
      get: (id) => {
        // return this.cache.get<AccessInfo>(`access:${id}`);
        return this.cache.wrap(`access:${id}`, async () => {
          const repo = this.app.db.getRepository<Repository<TokenInfo>>(tokenInfoListCollName);
          const tokenInfo = await repo.findOne({ filterByTk: id });
          if (!tokenInfo) return null;
          else return tokenInfo.dataValues as TokenInfo;
        });
      },
      set: async (id, value) => {
        // return this.cache.set(`access:${id}`, value);
        const createOrUpdate = async (id: string, value: TokenInfo) => {
          const repo = this.app.db.getRepository<Repository<TokenInfo>>(tokenInfoListCollName);
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
    return this.cache.get<ITokenControlConfig>('config');
  }
  setConfig(config: Partial<ITokenControlConfig>) {
    return this.cache.set('config', config);
  }
  async add() {
    const id = randomUUID();
    const currTS = Date.now();
    await this.tokenMap.set(id, {
      id,
      lastAccessTime: currTS,
      signInTime: currTS,
      resigned: false,
    });
    return id;
  }
  async set(id: string, value: Partial<TokenInfo>) {
    const tokenInfo = await this.tokenMap.get(id);
    if (!tokenInfo) throw new Error('Access not found');
    return this.tokenMap.set(id, { ...tokenInfo, ...value });
  }

  renew: AccessService['renew'] = async (id) => {
    const lockKey = `plugin-auth:access-controller:renew:${id}`;
    const release = await this.app.lockManager.acquire(lockKey, 1000);
    try {
      const access = await this.tokenMap.get(id);
      if (!access) return { status: 'missing' };
      if (access.resigned) return { status: 'unrenewable' };
      const preTokenInfo = await this.tokenMap.get(id);
      const newId = randomUUID();
      await this.set(id, { resigned: true });
      const accessInfo = {
        id: newId,
        lastAccessTime: Date.now(),
        resigned: false,
        signInTime: preTokenInfo.signInTime,
      };
      await this.tokenMap.set(newId, accessInfo);
      return { status: 'renewed', id: newId };
    } finally {
      release();
    }
  };
  check: AccessService['check'] = async (id) => {
    const tokenInfo = await this.tokenMap.get(id);
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
