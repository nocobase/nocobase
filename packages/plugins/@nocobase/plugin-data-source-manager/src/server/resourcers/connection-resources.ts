export default {
  name: 'roles.connectionResources',
  actions: {
    async create(ctx, next) {
      const { associatedIndex: roleName } = ctx.action.params;

      const db = ctx.app.getDb();

      const transaction = await db.sequelize.transaction();

      const connectionName = ctx.action.params.values.connectionName;

      if (!connectionName) {
        throw new Error('connectionName is required');
      }

      const connectionRole = await db.getRepository('connectionsRoles').findOne({
        filter: {
          roleName,
          connectionName,
        },
        transaction,
      });

      if (!connectionRole) {
        await db.getRepository('connectionsRoles').create({
          values: {
            roleName,
            connectionName,
          },
          transaction,
        });
      }

      const record = await db.getRepository('connectionsRolesResources').create({
        values: {
          roleName,
          ...ctx.action.params.values,
        },
        transaction,
      });

      await transaction.commit();

      ctx.body = record.toJSON();

      await next();
    },

    async update(ctx, next) {
      const { associatedIndex: roleName } = ctx.action.params;

      ctx.body = await ctx.app
        .getDb()
        .getRepository('connectionsRolesResources')
        .update({
          filter: {
            roleName,
            connectionName: ctx.action.params.filter.connectionName,
            name: ctx.action.params.filter.name,
          },
          values: ctx.action.params.values,
          updateAssociationValues: ['actions'],
        });

      await next();
    },

    async get(ctx, next) {
      const { associatedIndex: roleName } = ctx.action.params;

      const record = await ctx.app
        .getDb()
        .getRepository('connectionsRolesResources')
        .findOne({
          filter: {
            roleName,
            connectionName: ctx.action.params.filter.connectionName,
            name: ctx.action.params.filter.name,
          },
          appends: ctx.action.params.appends,
        });

      ctx.body = record.toJSON();

      await next();
    },
  },
};
