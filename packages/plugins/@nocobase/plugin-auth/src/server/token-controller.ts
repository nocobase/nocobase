/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ITokenControlService,
  TokenPolicyConfig,
  NumericTokenPolicyConfig,
  AuthError,
  AuthErrorCode,
  TokenInfo,
} from '@nocobase/auth';
import type { SystemLogger } from '@nocobase/logger';
import { Cache } from '@nocobase/cache';
import { randomUUID } from 'crypto';
import ms from 'ms';
import Application from '@nocobase/server';
import Database, { Repository } from '@nocobase/database';
import { issuedTokensCollectionName, tokenPolicyCollectionName, tokenPolicyRecordKey } from '../constants';

type TokenControlService = ITokenControlService;

const JTICACHEKEY = 'token-jti';
export class TokenController implements TokenControlService {
  cache: Cache;
  app: Application;
  db: Database;
  logger: SystemLogger;

  constructor({ cache, app, logger }: { cache: Cache; app: Application; logger: SystemLogger }) {
    this.cache = cache;
    this.app = app;
    this.logger = logger;
  }

  async setTokenInfo(id: string, value: TokenInfo): Promise<void> {
    const repo = this.app.db.getRepository<Repository<TokenInfo>>(issuedTokensCollectionName);
    await repo.updateOrCreate({ filterKeys: ['id'], values: value });
    await this.cache.set(`${JTICACHEKEY}:${id}`, value);
    return;
  }

  getConfig() {
    return this.cache.wrap<NumericTokenPolicyConfig>('config', async () => {
      const repo = this.app.db.getRepository(tokenPolicyCollectionName);
      const configRecord = await repo.findOne({ filterByTk: tokenPolicyRecordKey });
      if (!configRecord) return null;
      const config = configRecord.config as TokenPolicyConfig;
      return {
        tokenExpirationTime: ms(config.tokenExpirationTime),
        sessionExpirationTime: ms(config.sessionExpirationTime),
        expiredTokenRenewLimit: ms(config.expiredTokenRenewLimit),
      };
    });
  }
  setConfig(config: TokenPolicyConfig) {
    return this.cache.set('config', {
      tokenExpirationTime: ms(config.tokenExpirationTime),
      sessionExpirationTime: ms(config.sessionExpirationTime),
      expiredTokenRenewLimit: ms(config.expiredTokenRenewLimit),
    });
  }

  async removeSessionExpiredTokens(userId: number) {
    const config = await this.getConfig();
    const issuedTokenRepo = this.app.db.getRepository(issuedTokensCollectionName);
    const currTS = Date.now();
    return issuedTokenRepo.destroy({
      filter: {
        userId: userId,
        signInTime: {
          $lt: currTS - config.sessionExpirationTime,
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

    try {
      if (process.env.DB_DIALECT === 'sqlite') {
        // SQLITE does not support concurrent operations
        await this.removeSessionExpiredTokens(userId);
      } else {
        this.removeSessionExpiredTokens(userId);
      }
    } catch (err) {
      this.logger.error(err, { module: 'auth', submodule: 'token-controller', method: 'removeSessionExpiredTokens' });
    }

    return data;
  }

  renew: TokenControlService['renew'] = async (jti) => {
    const repo = this.app.db.getRepository(issuedTokensCollectionName);
    const model = this.app.db.getModel(issuedTokensCollectionName);
    const exists = await repo.findOne({ filter: { jti } });
    if (!exists) {
      throw new AuthError({ message: 'jti not found', code: AuthErrorCode.TOKEN_RENEW_FAILED });
    }
    const newId = randomUUID();
    const issuedTime = Date.now();

    const [count] = await model.update(
      { jti: newId, issuedTime },

      { where: { jti } },
    );

    if (count === 1) {
      return { jti: newId, issuedTime };
    } else {
      throw new AuthError({ message: 'renew failed', code: AuthErrorCode.TOKEN_RENEW_FAILED });
    }
  };
}
