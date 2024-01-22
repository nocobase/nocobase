import { Database } from '@nocobase/database';
import { FullDataRepository } from '../services/full-data-repository';

type UsingConfigType = 'strategy' | 'resourceAction';

function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}

const rolesRemoteCollectionsResourcer = {
  name: 'roles.remoteCollections',
  actions: {
    async list(ctx, next) {
      const role = ctx.action.params.associatedIndex;
      const { page = 1, pageSize = 20 } = ctx.action.params;

      const { connectionName } = ctx.action.params.filter;

      const db: Database = ctx.app.getDb(connectionName);

      const mainDb = ctx.app.getDb('main');

      const collectionRepository = new FullDataRepository([...db.collections.values()]);

      // all collections
      const [collections, count] = await collectionRepository.findAndCount();

      const roleResources = await mainDb.getRepository('connectionsRolesResources').find({
        filter: {
          roleName: role,
          connectionName: connectionName,
        },
      });

      // role collections
      const roleResourcesNames = roleResources.map((roleResource) => roleResource.get('name'));

      const roleResourceActionResourceNames = roleResources
        .filter((roleResources) => roleResources.get('usingActionsConfig'))
        .map((roleResources) => roleResources.get('name'));

      const items = collections.map((collection, i) => {
        const collectionName = collection.name;
        const exists = roleResourcesNames.includes(collectionName);

        const usingConfig: UsingConfigType = roleResourceActionResourceNames.includes(collectionName)
          ? 'resourceAction'
          : 'strategy';

        return {
          type: 'collection',
          name: collectionName,
          collectionName,
          title: collection.options.uiSchema?.title,
          roleName: role,
          usingConfig,
          exists,
          fields: [...collection.fields.values()].map((field) => {
            return field.options;
          }),
        };
      });

      ctx.body = {
        count,
        rows: items,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPage: totalPage(count, pageSize),
      };

      await next();
    },
  },
};

export { rolesRemoteCollectionsResourcer };
