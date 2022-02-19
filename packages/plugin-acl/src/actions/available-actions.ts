const availableActionResource = {
  name: 'availableActions',
  actions: {
    async list(ctx, next) {
      const acl = ctx.app.acl;
      const availableActions = acl.getAvailableActions();
      ctx.body = Array.from(availableActions.entries()).map(([, { name, options }]) => {
        return {
          ...options,
          name,
        };
      });
      await next();
    },
  },
};

export { availableActionResource };
