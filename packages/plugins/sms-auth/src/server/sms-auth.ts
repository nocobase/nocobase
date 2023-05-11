import { Context } from '@nocobase/actions';
import { BaseAuth } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import VerificationPlugin from '@nocobase/plugin-verification';
import { AuthModel } from '@nocobase/plugin-auth';

export class SMSAuth extends BaseAuth {
  constructor(config: { options: { [key: string]: any }; ctx: Context }) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
      roleCollection: ctx.db.getCollection('roles'),
      authenticatorCollction: ctx.db.getCollection('authenticators'),
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
      const name = ctx.headers['x-authenticator'] as string;
      try {
        const repo = ctx.db.getRepository('authenticators');
        const authenticator: AuthModel = await repo.findOne({
          filter: {
            name,
          },
        });
        if (!authenticator) {
          throw new Error(`sms-auth: Authenticator [${name}] not found`);
        }
        user = await authenticator.findOrCreateUser(phone, {
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
