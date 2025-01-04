/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ITokenControlService, ITokenControlConfig, AuthError, TokenInfo } from '@nocobase/auth';
import { Cache } from '@nocobase/cache';
import { randomUUID } from 'crypto';
import ms from 'ms';
import Application from '@nocobase/server';
import Database, { Repository, Model } from '@nocobase/database';
import { issuedTokensCollectionName, tokenPolicyCollectionName, tokenPolicyRecordKey } from '../constants';

type TokenControlService = ITokenControlService;

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
          $lt: currTS - ms(config.sessionExpirationTime),
        },
      },
    });
  }
  async add({ userId }: { userId: number }) {
    const jti = randomUUID();
    const currTS = Date.now();
    const data = {
      jti,
      issuedTime: currTS,
      signInTime: currTS,
      renewed: false,
      userId,
    };
    await this.setTokenInfo(jti, data);
    return data;
  }
  async set(id: string, value: Partial<TokenInfo>) {
    const tokenInfo = await this.get(id);
    if (!tokenInfo) throw new Error('jti not found');
    return this.setTokenInfo(id, { ...tokenInfo, ...value });
  }
  renew: TokenControlService['renew'] = async (jti) => {
    const repo = this.app.db.getRepository<Repository<TokenInfo>>(issuedTokensCollectionName);
    const newId = randomUUID();
    const issuedTime = Date.now();
    const updated = await repo.update({ filter: { jti, renewed: false }, values: { jti: newId, issuedTime } });

    if (updated && updated.length === 1) {
      return updated[0].dataValues as TokenInfo;
    } else {
      throw new AuthError({ message: 'renew failed', type: 'RENEWED_TOKEN' });
    }
  };
}
