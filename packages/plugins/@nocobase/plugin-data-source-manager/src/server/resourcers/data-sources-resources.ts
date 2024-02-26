export default {
  name: 'roles.dataSourceResources',
  actions: {
    async create(ctx, next) {
      const { associatedIndex: roleName } = ctx.action.params;

      const db = ctx.db;

      const transaction = await db.sequelize.transaction();

      const dataSourceKey = ctx.action.params.values.dataSourceKey;

      if (!dataSourceKey) {
        throw new Error('dataSourceKey is required');
      }

      const connectionRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: {
          roleName,
          dataSourceKey,
        },
        transaction,
      });

      if (!connectionRole) {
        await db.getRepository('dataSourcesRoles').create({
          values: {
            roleName,
            dataSourceKey,
          },
          transaction,
        });
      }

      const record = await db.getRepository('dataSourcesRolesResources').create({
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

      ctx.body = await ctx.db.getRepository('dataSourcesRolesResources').update({
        filter: {
          roleName,
          dataSourceKey: ctx.action.params.filter.dataSourceKey,
          name: ctx.action.params.filter.name,
        },
        values: ctx.action.params.values,
        updateAssociationValues: ['actions'],
      });

      await next();
    },

    async get(ctx, next) {
      const { associatedIndex: roleName } = ctx.action.params;

      const record = await ctx.db.getRepository('dataSourcesRolesResources').findOne({
        filter: {
          roleName,
          dataSourceKey: ctx.action.params.filter.dataSourceKey,
          name: ctx.action.params.filter.name,
        },
        appends: ctx.action.params.appends,
      });

      ctx.body = record;

      await next();
    },
  },
};
