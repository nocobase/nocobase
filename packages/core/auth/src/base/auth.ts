import { Auth, AuthConfig } from '../auth';
import { JwtOptions, JwtService } from './jwt-service';
import { Collection, Model } from '@nocobase/database';

/**
 * BaseAuth
 * @description A base class with jwt provide some common methods.
 */
export class BaseAuth extends Auth {
  protected jwt: JwtService;
  protected userCollection: Collection;

  constructor(
    config: AuthConfig & {
      userCollection: Collection;
    },
  ) {
    const { options, userCollection } = config;
    super(config);
    this.userCollection = userCollection;
    this.jwt = new JwtService(options.jwt as JwtOptions);
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
      const { userId } = await this.jwt.decode(token);
      const user = await this.userCollection.repository.findOne({
        filter: {
          id: userId,
        },
      });
      return user;
    } catch (err) {
      this.ctx.logger.error(err);
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
      console.log(err);
      this.ctx.throw(500, err.message);
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
}
