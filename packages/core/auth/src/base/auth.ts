import { Collection, Model, Repository } from '@nocobase/database';
import { Auth, AuthConfig } from '../auth';
import { JwtOptions, JwtService, SignPayload } from './jwt-service';

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
      const { userId, roleName } = await this.jwt.decode(token);

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

  async signIn(payload: SignPayload) {
    let user: Model;
    try {
      user = await this.validate();
    } catch (err) {
      console.log(err);
      this.ctx.throw(401, err.message);
    }
    if (!user) {
      this.ctx.throw(401, 'Unauthorized');
    }
    const token = this.jwt.sign({
      userId: user.id,
      ...payload,
    });

    const roleRepo = this.ctx.db.getRepository('users.roles', user.id);
    const roles = await (roleRepo as unknown as Repository).find();
    user.setDataValue('roles', roles);

    return {
      user,
      token,
    };
  }
}
