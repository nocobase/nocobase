export default {
  name: 'dbViews.fields',
  actions: {
    async list(ctx, next) {
      const { associatedIndex } = ctx.action.params;
      await next();
    },
  },
};
