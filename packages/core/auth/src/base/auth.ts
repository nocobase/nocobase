import { Collection, Model } from '@nocobase/database';
import { Auth, AuthConfig } from '../auth';
import { JwtService } from './jwt-service';
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

  get jwt(): JwtService {
    return this.ctx.app.authManager.jwt;
  }

  set user(user: Model) {
    this.ctx.state.currentUser = user;
  }

  get user() {
    return this.ctx.state.currentUser;
  }

  getCacheKey(userId: number) {
    return `auth:${userId}`;
  }

  validateUsername(username: string) {
    return /^[^@.<>"'/]{2,16}$/.test(username);
  }

  async check() {
    const token = this.ctx.getBearerToken();
    if (!token) {
      return null;
    }
    try {
      const { userId, roleName } = await this.jwt.decode(token);

      if (roleName) {
        this.ctx.headers['x-role'] = roleName;
      }

      const cache = this.ctx.cache as Cache;
      return await cache.wrap(this.getCacheKey(userId), () =>
        this.userRepository.findOne({
          filter: {
            id: userId,
          },
          raw: true,
        }),
      );
    } catch (err) {
      this.ctx.logger.error(err, { method: 'check' });
      return null;
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
      this.ctx.throw(401, err.message);
    }
    if (!user) {
      this.ctx.throw(401, 'Unauthorized');
    }
    const token = this.jwt.sign({
      userId: user.id,
    });
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
    await this.ctx.app.emitAsync('beforeSignOut', { userId });
    await this.ctx.cache.del(this.getCacheKey(userId));
    return await this.jwt.block(token);
  }
}
