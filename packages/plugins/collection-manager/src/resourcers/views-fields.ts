export default {
  name: 'dbViews.fields',
  actions: {
    async list(ctx, next) {
      const { associatedIndex } = ctx.action.params;

      const describeResult = await ctx.app.db.sequelize.getQueryInterface().describeTable(associatedIndex);
      ctx.body = Object.keys(describeResult).map((key) => {
        return {
          name: key,
          type: describeResult[key].type,
        };
      });
      await next();
    },
  },
};
