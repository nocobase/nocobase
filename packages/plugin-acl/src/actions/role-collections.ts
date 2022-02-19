import { Database } from '@nocobase/database';

type UsingConfigType = 'strategy' | 'resourceAction';

const roleCollectionsResource = {
  name: 'roles.collections',
  actions: {
    async list(ctx, next) {
      const role = ctx.action.params.associatedIndex;

      const db: Database = ctx.db;
      const collectionRepository = db.getRepository('collections');

      // all collections
      const collections = await collectionRepository.find();

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

      ctx.body = collections
        .map((collection) => {
          const exists = roleResourcesNames.includes(collection.get('name'));

          const usingConfig: UsingConfigType = roleResourceActionResourceNames.includes(collection.get('name'))
            ? 'resourceAction'
            : 'strategy';

          return {
            name: collection.get('name') as string,
            title: collection.get('title') as string,
            usingConfig,
            exists,
          };
        })
        .sort((a, b) => (a.name > b.name ? 1 : -1));

      await next();
    },
  },
};

export { roleCollectionsResource };
