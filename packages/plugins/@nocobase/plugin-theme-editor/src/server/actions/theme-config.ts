import { Context, Next } from '@nocobase/actions';

export default {
  setDefault: async (ctx: Context, next: Next) => {
    const {
      values: { themeId },
    } = ctx.action.params;
    const repo = ctx.db.getRepository('themeConfig');
    await ctx.db.sequelize.transaction(async (t) => {
      await repo.update({
        values: {
          default: false,
        },
        filter: {
          default: true,
        },
        transaction: t,
      });
      await repo.update({
        values: {
          default: true,
          optional: true,
        },
        filterByTk: themeId,
        transaction: t,
      });
    });
    await next();
  },
};
