/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Model } from '@nocobase/database';
import { Cache } from '@nocobase/cache';
import jwt from 'jsonwebtoken';
import { Auth, AuthConfig, AuthErrorType, AuthError } from '../auth';
import { JwtService } from './jwt-service';
import { ITokenControlService } from './token-control-service';

const localeNamespace = 'auth';
/**
 * BaseAuth
 * @description A base class with jwt provide some common methods.
 */
export class BaseAuth extends Auth {
  protected userCollection: Collection;

  constructor(
    config: AuthConfig & {
      userCollection: Collection;
    },
  ) {
    const { userCollection } = config;
    super(config);
    this.userCollection = userCollection;
  }

  get userRepository() {
    return this.userCollection.repository;
  }

  /**
   * @internal
   */
  get jwt(): JwtService {
    return this.ctx.app.authManager.jwt;
  }

  get tokenController(): ITokenControlService {
    return this.ctx.app.authManager.tokenController;
  }

  set user(user: Model) {
    this.ctx.state.currentUser = user;
  }

  get user() {
    return this.ctx.state.currentUser;
  }

  /**
   * @internal
   */

  getCacheKey(userId: number) {
    return `auth:${userId}`;
  }

  /**
   * @internal
   */
  validateUsername(username: string) {
    return /^[^@.<>"'/]{1,50}$/.test(username);
  }

  async check(): ReturnType<Auth['check']> {
    const token = this.ctx.getBearerToken();

    if (!token) {
      this.ctx.throw(401, {
        message: this.ctx.t('Unauthenticated. Please sign in to continue.', { ns: localeNamespace }),
        code: 'EMPTY_TOKEN' satisfies AuthErrorType,
      });
    }

    let tokenStatus: 'valid' | 'expired' | 'invalid';
    let payload;
    try {
      payload = await this.jwt.decode(token);
      tokenStatus = 'valid';
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        tokenStatus = 'expired';
        payload = jwt.decode(token);
      } else {
        this.ctx.logger.error(err, { method: 'jwt.decode' });
        this.ctx.throw(401, {
          message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
          code: 'INVALID_TOKEN' satisfies AuthErrorType,
        });
      }
    }

    const { userId, roleName, iat, temp, jti, exp, signInTime } = payload ?? {};

    const blocked = await this.jwt.blacklist.has(jti ?? token);
    if (blocked) {
      this.ctx.throw(401, {
        message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
        code: 'BLOCKED_TOKEN' satisfies AuthErrorType,
      });
    }

    if (roleName) {
      this.ctx.headers['x-role'] = roleName;
    }

    const cache = this.ctx.cache as Cache;

    const user = await cache.wrap(this.getCacheKey(userId), () =>
      this.userRepository.findOne({
        filter: {
          id: userId,
        },
        raw: true,
      }),
    );

    if (!temp && tokenStatus !== 'valid') {
      this.ctx.throw(401, {
        message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
        code: 'INVALID_TOKEN' satisfies AuthErrorType,
      });
    }

    if (tokenStatus === 'valid' && user.passwordChangeTz && iat * 1000 < user.passwordChangeTz) {
      this.ctx.throw(401, {
        message: this.ctx.t('User password changed, please signin again.', { ns: localeNamespace }),
        code: 'INVALID_TOKEN' satisfies AuthErrorType,
      });
    }

    if (tokenStatus === 'expired') {
      const tokenPolicy = await this.tokenController.getConfig();
      if (!signInTime || Date.now() - signInTime > tokenPolicy.sessionExpirationTime) {
        this.ctx.throw(401, {
          message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
          code: 'EXPIRED_SESSION' satisfies AuthErrorType,
        });
      }

      if (tokenPolicy.expiredTokenRenewLimit > 0 && Date.now() - exp * 1000 > tokenPolicy.expiredTokenRenewLimit) {
        this.ctx.throw(401, {
          message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
          code: 'EXPIRED_SESSION' satisfies AuthErrorType,
        });
      }

      try {
        const renewedResult = await this.tokenController.renew(jti);
        const expiresIn = Math.floor(tokenPolicy.tokenExpirationTime / 1000);
        const newToken = this.jwt.sign({ userId, roleName, temp, signInTime }, { jwtid: renewedResult.jti, expiresIn });
        this.ctx.res.setHeader('x-new-token', newToken);
        return user;
      } catch (err) {
        const options =
          err instanceof AuthError
            ? { type: err.type, message: err.message }
            : { message: err.message, type: 'INVALID_TOKEN' as const };

        this.ctx.throw(401, {
          message: options.message,
          code: options.type satisfies AuthErrorType,
        });
      }
    }

    return user;
  }

  async validate(): Promise<Model> {
    return null;
  }

  async signIn() {
    let user: Model;
    try {
      user = await this.validate();
    } catch (err) {
      this.ctx.throw(err.status || 401, err.message, {
        ...err,
      });
    }
    if (!user) {
      this.ctx.throw(401, {
        message: this.ctx.t('User not found. Please sign in again to continue.', { ns: localeNamespace }),
        code: 'NOT_EXIST_USER' satisfies AuthErrorType,
      });
    }
    const tokenInfo = await this.tokenController.add({ userId: user.id });
    const expiresIn = Math.floor((await this.tokenController.getConfig()).tokenExpirationTime / 1000);
    const token = this.jwt.sign(
      {
        userId: user.id,
        temp: true,
        iat: Math.floor(tokenInfo.issuedTime / 1000),
        signInTime: tokenInfo.signInTime,
      },
      {
        jwtid: tokenInfo.jti,
        expiresIn,
      },
    );
    return {
      user,
      token,
    };
  }

  async signOut(): Promise<any> {
    const token = this.ctx.getBearerToken();
    if (!token) {
      return;
    }
    const { userId } = await this.jwt.decode(token);
    await this.ctx.app.emitAsync('cache:del:roles', { userId });
    await this.ctx.cache.del(this.getCacheKey(userId));
    return await this.jwt.block(token);
  }
}
