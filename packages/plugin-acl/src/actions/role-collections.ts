import { Database } from '@nocobase/database';

type UsingConfigType = 'strategy' | 'resourceAction';

const roleCollectionsResource = {
  name: 'roles.collections',
  actions: {
    async list(ctx, next) {
      const role = ctx.action.params.associatedIndex;

      const db: Database = ctx.db;
      const collectionRepository = db.getRepository('collections');
      const collections = await collectionRepository.find();

      const roleResources = await db.getRepository('rolesResources').find({
        filter: {
          roleName: role,
          usingActionsConfig: true,
        },
      });

      const roleResourcesNames = roleResources.map((roleResource) => roleResource.get('name'));

      ctx.body = collections
        .map((collection) => {
          const usingConfig: UsingConfigType = roleResourcesNames.includes(collection.get('name'))
            ? 'resourceAction'
            : 'strategy';

          return {
            name: collection.get('name') as string,
            title: collection.get('title') as string,
            roleName: role,
            usingConfig,
          };
        })
        .sort((a, b) => (a.name > b.name ? 1 : -1));

      await next();
    },
  },
};

export { roleCollectionsResource };
