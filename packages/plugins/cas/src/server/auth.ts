import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import { AuthModel } from '@nocobase/plugin-auth';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  nickname: string;
}

export class CASAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
  }

  async signOut() {
    const ctx = this.ctx;
    ctx.cookies.set('_sop_session_', '');
    // ctx.redirect('/signup?authType=loginOut');
  }

  getOptions() {
    return {
      callbackUrl: '',
    };
  }

  async validate() {
    const ctx = this.ctx;
    let user: Model;
    // const {
    //   values: { nickname },
    // } = ctx.action.params;
    const useID = await ctx.cookies.get('_sop_session_');
    const { nickname } = await (useID && (jwt.verify(useID, 'cas') as JwtPayload));
    if (nickname) {
      // History data compatible processing
      const userRepo = this.userCollection.repository;
      user = await userRepo.findOne({
        filter: { nickname },
      });
      if (user) {
        await this.authenticator.addUser(user, {
          through: {
            uuid: nickname,
          },
        });
        return user;
      }
    }
    // New data
    const { autoSignup } = this.authenticator.options?.public || {};
    const authenticator = this.authenticator as AuthModel;
    if (autoSignup) {
      user = await authenticator.findOrCreateUser(nickname, {
        nickname: nickname,
      });
      return user;
    }
    // user = await authenticator.findUser(nickname);
    // if (!user) {
    //   throw new Error(
    //     ctx.t("The phone number is not registered, please register first", {
    //       ns: namespace,
    //     })
    //   );
    // }
    return user;
  }
}
