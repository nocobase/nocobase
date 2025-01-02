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
import { Auth, AuthConfig, AuthErrorType } from '../auth';
import { JwtService } from './jwt-service';
import { ITokenControlService } from './token-control-service';

function getAuthErrorTypeFromStatus<Status extends string, Suffix extends string>(
  status: Status,
  suffix: Suffix,
): `${Uppercase<Status>}_${Suffix}` {
  return `${status.toUpperCase() as Uppercase<Status>}_${suffix}`;
}
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
      this.ctx.throw(401, { message: 'empty token', code: 'EMPTY_TOKEN' satisfies AuthErrorType });
    }

    const { status: tokenStatus, payload } = await this.jwt.verify(token);
    const { userId, roleName, iat, temp, jti } = payload ?? {};

    const bolcked = await this.jwt.blacklist.has(jti ?? token);
    if (bolcked) {
      this.ctx.throw(401, { message: 'token blocked', code: 'BLOCKED_TOKEN' satisfies AuthErrorType });
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

    if (!temp) {
      if (tokenStatus === 'valid') return user;
      // type B = `${}`
      const upperTokenStatus = `${tokenStatus}_token` as `${Uppercase<typeof tokenStatus>}_TOKEN`;
      // tokenStatus.toUpperCase() as Uppercase<
      // typeof tokenStatus;

      this.ctx.throw(401, {
        message: `${tokenStatus} token`,
        code: getAuthErrorTypeFromStatus(tokenStatus, 'TOKEN') satisfies AuthErrorType,
      });
    }

    if (tokenStatus === 'valid') {
      if (user.passwordChangeTz && iat * 1000 < user.passwordChangeTz) {
        this.ctx.throw(401, { message: 'User password changed', code: 'INVALID_TOKEN' satisfies AuthErrorType });
      } else {
        const { status: jtiStatus } = await this.tokenController.check(jti);
        if (jtiStatus === 'valid') {
          return user;
        } else {
          this.ctx.throw(401, {
            message: `${jtiStatus} session`,
            code: getAuthErrorTypeFromStatus(jtiStatus, 'SESSION') satisfies AuthErrorType,
          });
        }
      }
    } else if (tokenStatus === 'expired') {
      const { status: jtiStatus } = await this.tokenController.check(jti);
      if (jtiStatus === 'valid') {
        const renewedJti = await this.tokenController.renew(jti);
        if (renewedJti.status === 'renewing') {
          const expiresIn = (await this.tokenController.getConfig()).tokenExpirationTime;
          const newToken = this.jwt.sign({ userId, roleName, temp }, { jwtid: renewedJti.id, expiresIn });
          this.ctx.res.setHeader('x-new-token', newToken);
          return user;
        } else {
          this.ctx.throw(401, {
            message: `${jtiStatus} session`,
            code: getAuthErrorTypeFromStatus(renewedJti.status, 'SESSION') satisfies AuthErrorType,
          });
        }
      } else {
        this.ctx.throw(401, {
          message: `${jtiStatus} session`,
          code: getAuthErrorTypeFromStatus(jtiStatus, 'SESSION') satisfies AuthErrorType,
        });
      }
    } else {
      this.ctx.throw(401, {
        message: `${tokenStatus} token`,
        code: getAuthErrorTypeFromStatus(tokenStatus, 'TOKEN') satisfies AuthErrorType,
      });
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
