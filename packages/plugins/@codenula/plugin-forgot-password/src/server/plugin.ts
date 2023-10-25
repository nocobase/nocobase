import { APIClient } from '@nocobase/client';
import { InstallOptions, Plugin } from '@nocobase/server';

export class PluginForgotPasswordServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.app.resource({
      name: 'forgot-password-api',
      actions: {
        async getUser(ctx, next) {
          const { email } = ctx.request.body;
          const postRepo = ctx.db.getRepository('users');
          const data = await postRepo.find({
            filter: {
              email,
            },
          });

          ctx.body = { data, ctx: ctx.request.origin };
          next();
        },
        async sendEmailWithToken(ctx, next) {
          const { email } = ctx.request.body;
          const data = await ctx.db.getRepository('users').find({
            filter: {
              email,
            },
          });

          // const token = userWithToken.resetToken;
          ctx.body = data;
          next();
        },
      },
    });
    this.app.acl.allow('forgot-password-api', 'getUser');
    this.app.acl.allow('forgot-password-api', 'sendEmailWithToken');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginForgotPasswordServer;
