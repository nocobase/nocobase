export default {
  name: 'dataSources.roles',
  actions: {
    async update(ctx, next) {
      const params = ctx.action.params;
      const { filterByTk: name, associatedIndex: dataSourceKey } = params;

      let connectionRoleRecord = await ctx.db.getRepository('dataSourcesRoles').findOne({
        filter: {
          roleName: name,
          dataSourceKey,
        },
      });

      if (!connectionRoleRecord) {
        connectionRoleRecord = await ctx.db.getRepository('dataSourcesRoles').create({
          values: {
            ...params.values,
            roleName: name,
            dataSourceKey,
          },
        });
      } else {
        await connectionRoleRecord.update({
          ...params.values,
        });
      }

      ctx.body = connectionRoleRecord.toJSON();

      await next();
    },

    async get(ctx, next) {
      const params = ctx.action.params;
      const { filterByTk: name, associatedIndex: dataSourceKey } = params;

      let connectionRoleRecord = await ctx.db.getRepository('dataSourcesRoles').findOne({
        filter: {
          roleName: name,
          dataSourceKey,
        },
      });

      if (!connectionRoleRecord) {
        connectionRoleRecord = await ctx.db.getRepository('dataSourcesRoles').create({
          values: {
            roleName: name,
            dataSourceKey,
          },
        });
      }

      ctx.body = connectionRoleRecord.toJSON();

      await next();
    },
  },
};
