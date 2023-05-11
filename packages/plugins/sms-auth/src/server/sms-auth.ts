import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import VerificationPlugin from '@nocobase/plugin-verification';
import { AuthModel } from '@nocobase/plugin-auth';

export class SMSAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
  }

  async validate() {
    const ctx = this.ctx;
    const verificationPlugin: VerificationPlugin = ctx.app.getPlugin('verification');
    if (!verificationPlugin) {
      throw new Error('sms-auth: @nocobase/plugin-verification is required');
    }
    let user: Model;
    await verificationPlugin.intercept(ctx, async () => {
      const {
        values: { phone },
      } = ctx.action.params;
      try {
        // History data compatible processing
        const userRepo = this.userCollection.repository;
        user = await userRepo.findOne({
          filter: { phone },
        });
        if (user) {
          await this.authenticator.addUser(user, {
            through: {
              uuid: phone,
            },
          });
          return;
        }
        // New data
        user = await (this.authenticator as AuthModel).findOrCreateUser(phone, {
          nickname: phone,
          phone,
        });
      } catch (err) {
        console.log(err);
        throw new Error(err.message);
      }
    });
    return user;
  }
}
