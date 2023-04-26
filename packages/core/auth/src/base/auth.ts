import { Context } from '@nocobase/actions';
import { Auth } from '../auth';
import { JwtOptions, JwtService } from './jwt-service';
import { Repository } from '@nocobase/database';

/**
 * BaseAuth
 * @description A base class with jwt provide some common methods.
 */
export class BaseAuth extends Auth {
  protected jwt: JwtService;
  protected userRepository: Repository;

  constructor(
    options: {
      jwt: JwtOptions;
      [key: string]: any;
    },
    userRepositoy: Repository,
    ctx: Context,
  ) {
    super(options, ctx);
    this.userRepository = userRepositoy;
    this.jwt = new JwtService(options.jwt);
  }

  async check() {
    const token = this.ctx.getBearerToken();
    if (!token) {
      return null;
    }
    try {
      const { userId } = await this.jwt.decode(token);
      const user = await this.userRepository.findOne({
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

  async getIdentity() {
    return this.ctx.state.currentUser;
  }
}
