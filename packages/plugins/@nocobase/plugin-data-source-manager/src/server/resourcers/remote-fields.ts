import { Database } from '@nocobase/database';

export default {
  name: 'dataSourcesCollections.fields',
  actions: {
    async list(ctx, next) {
      const { associatedIndex: collectionNameWithDataSourceKey } = ctx.action.params;
      const [dataSourceKey, collectionName] = collectionNameWithDataSourceKey.split('.');

      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);
      const collection = dataSource.collectionManager.getCollection(collectionName);

      const fields = collection.getFields();

      ctx.body = fields.map((field) => field.options);

      await next();
    },

    async get(ctx, next) {
      const databaseName = ctx.get('x-database');
      const remoteDb = ctx.app.getDb(databaseName) as Database;

      const { associatedIndex: collectionName, filterByTk: name } = ctx.action.params;

      const collection = remoteDb.getCollection(collectionName);

      const field = collection.getField(name);

      ctx.body = field.options;

      await next();
    },

    async update(ctx, next) {
      const databaseName = ctx.get('x-database');
      const params = ctx.action.params;
      const mainDb = ctx.app.getDb() as Database;

      const { associatedIndex: collectionName, filterByTk: name } = params;

      let fieldRecord = await mainDb.getRepository('remoteFields').findOne({
        filter: {
          name,
          collectionName,
          connectionName: databaseName,
        },
      });

      if (!fieldRecord) {
        fieldRecord = await mainDb.getRepository('remoteFields').create({
          values: {
            ...params.values,
            name,
            collectionName: collectionName,
            connectionName: databaseName,
          },
        });
      } else {
        await fieldRecord.update({
          ...params.values,
        });
      }

      ctx.body = fieldRecord.toJSON();

      await next();
    },

    async create(ctx, next) {
      const databaseName = ctx.get('x-database');
      const mainDb = ctx.app.getDb() as Database;
      const params = ctx.action.params;

      const { associatedIndex: collectionName } = params;

      const fieldRecord = await mainDb.getRepository('remoteFields').create({
        values: {
          ...params.values,
          collectionName,
          connectionName: databaseName,
        },
      });

      ctx.body = fieldRecord.toJSON();

      await next();
    },

    async destroy(ctx, next) {
      const databaseName = ctx.get('x-database');
      const mainDb = ctx.app.getDb() as Database;
      const params = ctx.action.params;

      const { associatedIndex: collectionName, filterByTk: name } = params;

      const fieldRecord = await mainDb.getRepository('remoteFields').findOne({
        filter: {
          name,
          collectionName,
          connectionName: databaseName,
        },
      });

      if (fieldRecord) {
        await fieldRecord.destroy();
      }

      ctx.body = 'ok';

      await next();
    },
  },
};
