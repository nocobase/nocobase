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
import { merge } from '@nocobase/utils';
import { Auth, AuthConfig, AuthError } from '../auth';
import { JwtService } from './jwt-service';
import { ITokenControlService } from './token-control-service';

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
      throw new AuthError('Empty token', 'empty');
    }

    const { status: tokenStatus, payload } = await this.jwt.verify(token);
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
    const bolcked = await this.jwt.blacklist.has(jti ?? token);
    if (bolcked) {
      throw new AuthError('Token blocked', 'blocked');
    }

    if (temp) {
      if (tokenStatus === 'valid') {
        if (user.passwordChangeTz && iat * 1000 < user.passwordChangeTz) {
          this.ctx.throw(401, { message: 'User password changed', code: 'invalid' });
        } else {
          const { status: JtiStatus } = await this.tokenController.check(jti);
          if (JtiStatus === 'valid') {
            return user;
          } else {
            this.ctx.throw(401, { message: `${JtiStatus} token`, code: JtiStatus });
          }
        }
      } else if (tokenStatus === 'expired') {
        const { status: JtiStatus } = await this.tokenController.check(jti);
        if (JtiStatus === 'valid') {
          const renewedJti = await this.tokenController.renew(jti);
          if (renewedJti.status === 'renewed') {
            const expiresIn = (await this.tokenController.getConfig()).tokenExpirationTime;
            const newToken = this.jwt.sign({ userId, roleName, temp }, { jwtid: renewedJti.id, expiresIn });
            this.ctx.body = merge(this.ctx.body ?? {}, { meta: { newToken } });
            return user;
          } else {
            this.ctx.throw(401, { message: `${JtiStatus} token`, code: JtiStatus });
          }
        } else {
          this.ctx.throw(401, { message: `${JtiStatus} token`, code: JtiStatus });
        }
      } else {
        this.ctx.throw(401, { message: `${tokenStatus} token`, code: tokenStatus });
      }
    } else {
      if (tokenStatus === 'valid') return user;
      else throw new AuthError(`${tokenStatus} token`, `${tokenStatus}`);
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
    const jti = await this.tokenController.add();
    const expiresIn = (await this.tokenController.getConfig()).tokenExpirationTime;
    const token = this.jwt.sign(
      {
        userId: user.id,
        temp: true,
      },
      {
        jwtid: jti,
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
