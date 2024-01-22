import lodash from 'lodash';

export default {
  name: 'remoteCollections',
  actions: {
    async list(ctx, next) {
      const databaseName = ctx.get('x-database');
      const database = ctx.app.getDb(databaseName);

      const { paginate, filter } = ctx.action.params;

      const filterTitle = lodash.get(filter, '$and.0.title.$includes');
      const filterName = lodash.get(filter, '$and.0.name.$includes');

      const collections = [...database.collections.values()].filter((collection) => {
        const cond = collection.options.introspected;

        return (
          cond &&
          (!filterTitle || lodash.get(collection, 'options.title')?.includes(filterTitle)) &&
          (!filterName || collection.options.name.includes(filterName))
        );
      });

      if (paginate === false || paginate === 'false') {
        ctx.body = collections.map((collection) => collection.options);
      } else {
        const { page = 1, pageSize = 20 } = ctx.action.params;

        ctx.withoutDataWrapping = true;

        ctx.body = {
          data: collections.slice((page - 1) * pageSize, page * pageSize).map((collection) => collection.options),
          meta: {
            count: collections.length,
            page,
            pageSize,
            totalPage: Math.ceil(collections.length / pageSize),
          },
        };
      }

      await next();
    },

    async update(ctx, next) {
      const params = ctx.action.params;
      const { filterByTk: name } = params;
      const databaseName = ctx.get('x-database');

      let remoteCollectionRecord = await ctx.db.getRepository('remoteCollections').findOne({
        filter: {
          name,
          connectionName: databaseName,
        },
      });

      if (!remoteCollectionRecord) {
        remoteCollectionRecord = await ctx.db.getRepository('remoteCollections').create({
          values: {
            ...params.values,
            name,
            connectionName: databaseName,
          },
        });
      } else {
        await remoteCollectionRecord.update({
          ...params.values,
        });
      }

      ctx.body = remoteCollectionRecord.toJSON();

      await next();
    },
  },
};
