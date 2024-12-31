/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Model } from '@nocobase/database';
import { Auth, AuthConfig } from '../auth';
import { JwtService } from './jwt-service';
import { ITokenControlService } from './token-control-service';
import { Cache } from '@nocobase/cache';

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

  get accessController(): ITokenControlService {
    return this.ctx.app.authManager.accessController;
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
    try {
      const result = {} as Awaited<ReturnType<Auth['check']>>;
      const token = this.ctx.getBearerToken();
      if (!token) {
        return { token: { status: 'empty' }, user: null };
      }

      const { status, payload } = await this.jwt.verify(token);
      const { userId, roleName, iat, temp, jti } = payload ?? {};

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
      result.user = user;

      result.token = { status, type: temp ? 'user' : 'API' };

      result.jti = await this.accessController.check(jti);

      if (temp) {
        if (user.passwordChangeTz && iat * 1000 < user.passwordChangeTz) {
          result.token.status = 'invalid';
        } else if (result.token.status === 'expired' && result.jti.status === 'valid') {
          const refreshedData = await this.accessController.renew(jti);
          if (refreshedData.status === 'renewed') {
            const expiresIn = (await this.accessController.getConfig()).tokenExpirationTime;
            const newToken = this.jwt.sign({ userId, roleName, temp }, { jwtid: refreshedData.id, expiresIn });
            result.token.newToken = newToken;
          }
          result.jti.status = refreshedData.status;
        }
      }

      return result;
    } catch (err) {
      this.ctx.logger.error(err, { method: 'check' });
      return { token: { status: 'invalid' }, message: err.message };
    }
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
      this.ctx.throw(401, 'Unauthorized');
    }
    const accessId = await this.accessController.add();
    const expiresIn = (await this.accessController.getConfig()).tokenExpirationTime;
    const token = this.jwt.sign(
      {
        userId: user.id,
        temp: true,
      },
      {
        jwtid: accessId,
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
