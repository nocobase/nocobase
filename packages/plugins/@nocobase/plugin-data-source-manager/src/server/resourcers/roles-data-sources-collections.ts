import { FullDataRepository } from '../services/full-data-repository';

type UsingConfigType = 'strategy' | 'resourceAction';

function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}

const rolesRemoteCollectionsResourcer = {
  name: 'roles.dataSourcesCollections',
  actions: {
    async list(ctx, next) {
      const role = ctx.action.params.associatedIndex;
      const { page = 1, pageSize = 20 } = ctx.action.params;

      const { dataSourceKey } = ctx.action.params.filter;

      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);

      const collectionRepository = new FullDataRepository<any>(dataSource.collectionManager.getCollections());

      // all collections
      const [collections, count] = await collectionRepository.findAndCount();

      const roleResources = await ctx.app.db.getRepository('dataSourcesRolesResources').find({
        filter: {
          roleName: role,
          dataSourceKey,
        },
      });

      // role collections
      const roleResourcesNames = roleResources.map((roleResource) => roleResource.get('name'));

      const roleResourceActionResourceNames = roleResources
        .filter((roleResources) => roleResources.get('usingActionsConfig'))
        .map((roleResources) => roleResources.get('name'));

      const items = collections.map((collection, i) => {
        const collectionName = collection.options.name;
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
