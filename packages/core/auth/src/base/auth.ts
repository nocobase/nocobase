import { Context } from '@nocobase/actions';
import { Auth } from '../auth';
import { JwtOptions, JwtService } from './jwt-service';
import { Collection, Model } from '@nocobase/database';

/**
 * BaseAuth
 * @description A base class with jwt provide some common methods.
 */
export class BaseAuth extends Auth {
  protected jwt: JwtService;
  protected userCollection: Collection;
  protected authenticatorCollection?: Collection;
  protected roleCollection?: Collection;

  constructor(config: {
    ctx: Context;
    options: {
      jwt?: JwtOptions;
      [key: string]: any;
    };
    userCollection: Collection;
    authenticatorCollction?: Collection;
    roleCollection?: Collection;
  }) {
    const { options, userCollection, authenticatorCollction, roleCollection } = config;
    super(config);
    this.userCollection = userCollection;
    this.authenticatorCollection = authenticatorCollction;
    this.roleCollection = roleCollection;
    this.jwt = new JwtService(options.jwt);
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

  async findOrCreateUser(authenticator: string, uuid: string, userValues?: any) {
    let user: Model;
    const authenticatorModel = await this.authenticatorCollection.repository.findOne({
      filter: {
        name: authenticator,
      },
    });
    if (!authenticatorModel) {
      throw new Error(`findOrCreateUser: Authenticator [${authenticator}] not found`);
    }
    const users = await authenticatorModel.getUsers({
      through: {
        where: { uuid },
      },
    });
    if (users.length) {
      user = users[0];
      return user;
    }
    await this.ctx.db.sequelize.transaction(async (transaction) => {
      // Create a new user if not exists
      user = await authenticatorModel.createUser(
        userValues || {
          nickname: uuid,
        },
        {
          through: {
            uuid: uuid,
          },
          transaction,
        },
      );
      const roleRepo = this.roleCollection.repository;
      const defaultRole = await roleRepo.findOne({
        filter: {
          default: true,
        },
        transaction,
      });
      if (defaultRole && (await user.countRoles({ transaction })) == 0) {
        await user.addRoles(defaultRole, { transaction });
      }
    });
    return user;
  }
}
