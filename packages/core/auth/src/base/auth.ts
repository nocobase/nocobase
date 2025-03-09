/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import { Collection, Model } from '@nocobase/database';
import jwt from 'jsonwebtoken';
import { Auth, AuthConfig, AuthError, AuthErrorCode } from '../auth';
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

  async checkToken(): Promise<{
    tokenStatus: 'valid' | 'expired' | 'invalid';
    user: Awaited<ReturnType<Auth['check']>>;
    jti?: string;
    temp: any;
    roleName?: any;
    signInTime?: number;
  }> {
    const cache = this.ctx.cache as Cache;
    const token = this.ctx.getBearerToken();
    if (!token) {
      this.ctx.throw(401, {
        message: this.ctx.t('Unauthenticated. Please sign in to continue.', { ns: localeNamespace }),
        code: AuthErrorCode.EMPTY_TOKEN,
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
          code: AuthErrorCode.INVALID_TOKEN,
        });
      }
    }

    const { userId, roleName, iat, temp, jti, exp, signInTime } = payload ?? {};

    const user = userId
      ? await cache.wrap(this.getCacheKey(userId), () =>
          this.userRepository.findOne({
            filter: {
              id: userId,
            },
            raw: true,
          }),
        )
      : null;

    if (!user) {
      this.ctx.throw(401, {
        message: this.ctx.t('User not found. Please sign in again to continue.', { ns: localeNamespace }),
        code: AuthErrorCode.NOT_EXIST_USER,
      });
    }

    if (roleName) {
      this.ctx.headers['x-role'] = roleName;
    }

    const blocked = await this.jwt.blacklist.has(jti ?? token);
    if (blocked) {
      this.ctx.throw(401, {
        message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
        code: AuthErrorCode.BLOCKED_TOKEN,
      });
    }

    // api token check first
    if (!temp) {
      if (tokenStatus === 'valid') {
        return { tokenStatus, user, temp };
      } else {
        this.ctx.throw(401, {
          message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
          code: AuthErrorCode.INVALID_TOKEN,
        });
      }
    }

    const tokenPolicy = await this.tokenController.getConfig();

    if (signInTime && Date.now() - signInTime > tokenPolicy.sessionExpirationTime) {
      this.ctx.throw(401, {
        message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
        code: AuthErrorCode.EXPIRED_SESSION,
      });
    }

    if (tokenStatus === 'valid' && Date.now() - iat * 1000 > tokenPolicy.tokenExpirationTime) {
      tokenStatus = 'expired';
    }

    if (tokenStatus === 'valid' && user.passwordChangeTz && iat * 1000 < user.passwordChangeTz) {
      this.ctx.throw(401, {
        message: this.ctx.t('User password changed, please signin again.', { ns: localeNamespace }),
        code: AuthErrorCode.INVALID_TOKEN,
      });
    }

    if (tokenStatus === 'expired') {
      if (tokenPolicy.expiredTokenRenewLimit > 0 && Date.now() - exp * 1000 > tokenPolicy.expiredTokenRenewLimit) {
        this.ctx.throw(401, {
          message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
          code: AuthErrorCode.EXPIRED_SESSION,
        });
      }

      this.ctx.logger.info('token renewing', {
        method: 'auth.check',
        url: this.ctx.originalUrl,
        currentJti: jti,
      });
      const isStreamRequest = this.ctx?.req?.headers?.accept === 'text/event-stream';

      if (isStreamRequest) {
        this.ctx.throw(401, {
          message: 'Stream api not allow renew token.',
          code: AuthErrorCode.SKIP_TOKEN_RENEW,
        });
      }

      if (!jti) {
        this.ctx.throw(401, {
          message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
          code: AuthErrorCode.INVALID_TOKEN,
        });
      }
      return { tokenStatus, user, jti, signInTime, temp };
    }

    return { tokenStatus, user, jti, signInTime, temp };
  }

  async check(): ReturnType<Auth['check']> {
    const { tokenStatus, user, jti, temp, signInTime, roleName } = await this.checkToken();

    if (tokenStatus === 'expired') {
      const tokenPolicy = await this.tokenController.getConfig();
      try {
        this.ctx.logger.info('token renewing', {
          method: 'auth.check',
          jti,
        });
        const isStreamRequest = this.ctx?.req?.headers?.accept === 'text/event-stream';

        if (isStreamRequest) {
          this.ctx.throw(401, {
            message: 'Stream api not allow renew token.',
            code: AuthErrorCode.SKIP_TOKEN_RENEW,
          });
        }

        if (!jti) {
          this.ctx.throw(401, {
            message: this.ctx.t('Your session has expired. Please sign in again.', { ns: localeNamespace }),
            code: AuthErrorCode.INVALID_TOKEN,
          });
        }

        const renewedResult = await this.tokenController.renew(jti);

        this.ctx.logger.info('token renewed', {
          method: 'auth.check',
          oldJti: jti,
          newJti: renewedResult.jti,
        });

        const expiresIn = Math.floor(tokenPolicy.tokenExpirationTime / 1000);
        const newToken = this.jwt.sign(
          { userId: user.id, roleName, temp, signInTime, iat: Math.floor(renewedResult.issuedTime / 1000) },
          { jwtid: renewedResult.jti, expiresIn },
        );
        this.ctx.res.setHeader('x-new-token', newToken);
      } catch (err) {
        this.ctx.logger.error('token renew failed', {
          method: 'auth.check',
          jti,
        });
        const options =
          err instanceof AuthError
            ? { code: err.code, message: err.message }
            : { message: err.message, code: err.code ?? AuthErrorCode.INVALID_TOKEN };

        this.ctx.throw(401, {
          message: this.ctx.t(options.message, { ns: localeNamespace }),
          code: options.code,
        });
      }
    }

    return user;
  }

  async validate(): Promise<Model> {
    return null;
  }

  async signNewToken(userId: number) {
    const tokenInfo = await this.tokenController.add({ userId });
    const expiresIn = Math.floor((await this.tokenController.getConfig()).tokenExpirationTime / 1000);
    const token = this.jwt.sign(
      {
        userId,
        temp: true,
        iat: Math.floor(tokenInfo.issuedTime / 1000),
        signInTime: tokenInfo.signInTime,
      },
      {
        jwtid: tokenInfo.jti,
        expiresIn,
      },
    );
    return token;
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
        code: AuthErrorCode.NOT_EXIST_USER,
      });
    }
    const token = await this.signNewToken(user.id);
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
