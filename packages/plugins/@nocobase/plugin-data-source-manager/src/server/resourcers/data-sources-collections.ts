import lodash from 'lodash';

export default {
  name: 'dataSources.collections',
  actions: {
    async list(ctx, next) {
      const params = ctx.action.params;

      const { associatedIndex: dataSourceKey } = params;
      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);
      if (!dataSource) {
        throw new Error(`dataSource ${dataSourceKey} not found`);
      }

      const { paginate, filter } = ctx.action.params;

      const filterTitle = lodash.get(filter, '$and.0.title.$includes');
      const filterName = lodash.get(filter, '$and.0.name.$includes');

      const collections = lodash.sortBy(
        dataSource.collectionManager.getCollections().filter((collection) => {
          return (
            (!filterTitle || lodash.get(collection, 'options.title')?.includes(filterTitle)) &&
            (!filterName || collection.options.name.includes(filterName))
          );
        }),
        'name',
      );

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
      const { filterByTk: collectionName, associatedIndex: dataSourceKey } = params;

      let dataSourceCollectionRecord = await ctx.db.getRepository('dataSourcesCollections').findOne({
        filter: {
          name: collectionName,
          dataSourceKey,
        },
      });

      if (!dataSourceCollectionRecord) {
        dataSourceCollectionRecord = await ctx.db.getRepository('dataSourcesCollections').create({
          values: {
            ...params.values,
            name: collectionName,
            dataSourceKey,
          },
        });
      } else {
        await dataSourceCollectionRecord.update({
          ...params.values,
        });
      }

      ctx.body = dataSourceCollectionRecord.toJSON();

      await next();
    },
  },
};
