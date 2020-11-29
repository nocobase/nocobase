import { ResourceOptions } from "@nocobase/resourcer";

export default {
  name: 'users',
  middlewares: [
    {
      // only: ['check'],
      handler: async (ctx, next) => {
        const token = ctx.get('Authorization').replace(/^Bearer\s+/gi, '');
        console.log(ctx.action.params.actionName);
        const { actionName } = ctx.action.params;
        if (actionName !== 'check') {
          return next();
        }
        if (!token) {
          ctx.throw(401, 'Unauthorized');
        }
        const User = ctx.db.getModel('users');
        const user = await User.findOne({
          where: {
            token,
          },
        });
        if (!user) {
          ctx.throw(401, 'Unauthorized');
        }
        ctx.state.currentUser = user;
        await next();
      },
    },
  ],
} as ResourceOptions;
