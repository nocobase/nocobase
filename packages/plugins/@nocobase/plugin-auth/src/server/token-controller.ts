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
import { issuedTokensCollectionName, tokenPolicyCollectionName, tokenPolicyRecordKey } from '../constants';

type TokenInfo = {
  id: string;
  userId: number;
  lastAccessTime: EpochTimeStamp;
  signInTime: EpochTimeStamp;
  resigned: boolean;
};
type TokenControlService = ITokenControlService<TokenInfo>;

const JTICACHEKEY = 'token-jti';
export class TokenController implements TokenControlService {
  cache: Cache;
  app: Application;
  db: Database;

  constructor({ cache, app }: { cache: Cache; app: Application }) {
    this.cache = cache;
    this.app = app;
  }
  get(id: string): Promise<TokenInfo | null> {
    return this.cache.wrap(`${JTICACHEKEY}:${id}`, async () => {
      const repo = this.app.db.getRepository<Repository<TokenInfo>>(issuedTokensCollectionName);
      const tokenInfo = await repo.findOne({ filterByTk: id });
      if (!tokenInfo) return null;
      else return tokenInfo.dataValues as TokenInfo;
    });
  }

  async setTokenInfo(id: string, value: TokenInfo): Promise<void> {
    const repo = this.app.db.getRepository<Repository<TokenInfo>>(issuedTokensCollectionName);
    await repo.updateOrCreate({ filterKeys: ['id'], values: value });
    await this.cache.set(`${JTICACHEKEY}:${id}`, value);
    return;
  }

  getConfig() {
    return this.cache.wrap<ITokenControlConfig>('config', async () => {
      const repo = this.app.db.getRepository(tokenPolicyCollectionName);
      const configRecord = await repo.findOne({ filterByTk: tokenPolicyRecordKey });
      if (!configRecord) return null;
      else return configRecord.config;
    });
  }
  setConfig(config: Partial<ITokenControlConfig>) {
    return this.cache.set('config', config);
  }
  async removeLoginExpiredTokens(userId: number) {
    const config = await this.getConfig();
    const issuedTokenRepo = this.app.db.getRepository(issuedTokensCollectionName);
    const currTS = Date.now();
    issuedTokenRepo.destroy({
      filter: {
        userId: userId,
        signInTime: {
          $lt: currTS - ms(config.maxTokenLifetime),
        },
      },
    });
  }
  async add({ userId }: { userId: number }) {
    const id = randomUUID();
    const currTS = Date.now();
    await this.setTokenInfo(id, {
      id,
      lastAccessTime: currTS,
      signInTime: currTS,
      resigned: false,
      userId,
    });
    return id;
  }
  async set(id: string, value: Partial<TokenInfo>) {
    const tokenInfo = await this.get(id);
    if (!tokenInfo) throw new Error('jti not found');
    return this.setTokenInfo(id, { ...tokenInfo, ...value });
  }

  renew: TokenControlService['renew'] = async (id) => {
    const lockKey = `plugin-auth:token-controller:renew:${id}`;
    const release = await this.app.lockManager.acquire(lockKey, 1000);
    try {
      const tokenInfo = await this.get(id);
      if (!tokenInfo) return { status: 'missing' };
      if (tokenInfo.resigned) return { status: 'renewed' };
      const preTokenInfo = await this.get(id);
      const newId = randomUUID();
      await this.set(id, { resigned: true });
      const newTokenInfo = {
        id: newId,
        lastAccessTime: Date.now(),
        resigned: false,
        signInTime: preTokenInfo.signInTime,
        userId: preTokenInfo.userId,
      };
      await this.setTokenInfo(newId, newTokenInfo);
      return { status: 'renewing', id: newId };
    } finally {
      release();
    }
  };
  check: TokenControlService['check'] = async (id) => {
    const tokenInfo = await this.get(id);
    if (!tokenInfo) return { status: 'missing' };

    if (tokenInfo.resigned) return { status: 'renewed' };

    const signInTime = tokenInfo.signInTime;
    const config = await this.getConfig();
    const currTS = Date.now();

    if (currTS - tokenInfo.lastAccessTime > ms(config.maxInactiveInterval)) {
      return { status: 'inactive' };
    }

    if (Date.now() - signInTime > ms(config.maxTokenLifetime)) {
      return { status: 'expired' };
    }

    return { status: 'valid' };
  };
}
