export default {
  name: 'databaseConnections.roles',
  actions: {
    async update(ctx, next) {
      const params = ctx.action.params;
      const { filterByTk: name, associatedIndex: databaseName } = params;

      let connectionRoleRecord = await ctx.db.getRepository('connectionsRoles').findOne({
        filter: {
          roleName: name,
          connectionName: databaseName,
        },
      });

      if (!connectionRoleRecord) {
        connectionRoleRecord = await ctx.db.getRepository('connectionsRoles').create({
          values: {
            ...params.values,
            roleName: name,
            connectionName: databaseName,
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
      const { filterByTk: name, associatedIndex: databaseName } = params;

      let connectionRoleRecord = await ctx.db.getRepository('connectionsRoles').findOne({
        filter: {
          roleName: name,
          connectionName: databaseName,
        },
      });

      if (!connectionRoleRecord) {
        connectionRoleRecord = await ctx.db.getRepository('connectionsRoles').create({
          values: {
            roleName: name,
            connectionName: databaseName,
          },
        });
      }

      ctx.body = connectionRoleRecord.toJSON();

      await next();
    },
  },
};
