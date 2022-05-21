import { Database } from '@nocobase/database';

type UsingConfigType = 'strategy' | 'resourceAction';

function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}

const roleCollectionsResource = {
  name: 'roles.collections',
  actions: {
    async list(ctx, next) {
      const role = ctx.action.params.associatedIndex;
      const { page = 1, pageSize = 20 } = ctx.action.params;

      const db: Database = ctx.db;
      const collectionRepository = db.getRepository('collections');

      // all collections
      const [collections, count] = await collectionRepository.findAndCount({
        filter: ctx.action.params.filter,
        sort: 'sort',
      });

      // role collections
      const roleResources = await db.getRepository('rolesResources').find({
        filter: {
          roleName: role,
        },
      });

      // role collections
      const roleResourcesNames = roleResources.map((roleResource) => roleResource.get('name'));
      const roleResourceActionResourceNames = roleResources
        .filter((roleResources) => roleResources.get('usingActionsConfig'))
        .map((roleResources) => roleResources.get('name'));

      ctx.body = {
        count,
        rows: collections.map((collection) => {
          const exists = roleResourcesNames.includes(collection.get('name'));

          const usingConfig: UsingConfigType = roleResourceActionResourceNames.includes(collection.get('name'))
            ? 'resourceAction'
            : 'strategy';

          return {
            name: collection.get('name') as string,
            title: collection.get('title') as string,
            roleName: role,
            usingConfig,
            exists,
          };
        }),
        page: Number(page),
        pageSize: Number(pageSize),
        totalPage: totalPage(count, pageSize),
      };

      await next();
    },
  },
};

export { roleCollectionsResource };
