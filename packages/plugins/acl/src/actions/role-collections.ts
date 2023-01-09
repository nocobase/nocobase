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
      const fieldRepository = db.getRepository('fields');

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

      const items = collections.map((collection, i) => {
        const exists = roleResourcesNames.includes(collection.get('name'));

        const usingConfig: UsingConfigType = roleResourceActionResourceNames.includes(collection.get('name'))
          ? 'resourceAction'
          : 'strategy';

        const c = db.getCollection(collection.get('name'));

        // const children = [...c.fields.values()]
        //   .filter(
        //     (f) => f.options.interface && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(f.options.type),
        //   )
        //   .map((f, j) => {
        //     const name = `${collection.get('name')}.${f.options.name}`;
        //     const usingConfig: UsingConfigType = roleResourceActionResourceNames.includes(name)
        //       ? 'resourceAction'
        //       : 'strategy';
        //     const exists = roleResourcesNames.includes(name);
        //     return {
        //       type: 'association',
        //       __index: `${i}.children.${j}`,
        //       name,
        //       collectionName: f.options.target,
        //       title: f.options?.uiSchema?.title,
        //       roleName: role,
        //       usingConfig,
        //       exists,
        //     };
        //   });

        return {
          type: 'collection',
          name: collection.get('name') as string,
          collectionName: collection.get('name'),
          title: collection.get('title') as string,
          roleName: role,
          usingConfig,
          exists,
          // children: children.length > 0 ? children : null,
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

export { roleCollectionsResource };
