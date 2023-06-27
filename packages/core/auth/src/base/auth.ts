import { Collection, Model } from '@nocobase/database';
import { Auth, AuthConfig } from '../auth';

/**
 * BaseAuth
 * @description A base class with jwt provide some common methods.
 */
export class BaseAuth extends Auth {
  protected userCollection: Collection;

  get jwt() {
    return this.ctx.app.authManager.jwt;
  }

  constructor(
    config: AuthConfig & {
      userCollection: Collection;
    },
  ) {
    const { userCollection } = config;
    super(config);
    this.userCollection = userCollection;
  }

  set user(user: Model) {
    this.ctx.state.currentUser = user;
  }

  get user() {
    return this.ctx.state.currentUser;
  }

  async check() {
    const token = this.ctx.getBearerToken();
    if (!token) {
      return null;
    }
    try {
      const { userId, roleName } = await this.ctx.app.authManager.jwt.decode(token);

      if (roleName) {
        this.ctx.headers['X-Role'] = roleName;
      }

      return await this.userCollection.repository.findOne({
        filter: {
          id: userId,
        },
      });
    } catch (err) {
      this.ctx.logger.error(err);
      return null;
    }
  }

  async validate(): Promise<Model> {
    return null;
  }
}
