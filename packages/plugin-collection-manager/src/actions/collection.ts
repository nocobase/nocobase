import { Context } from '@nocobase/actions';
import { CollectionManager } from '../collection-manager';

const collectionResource = {
  name: 'collections',
  actions: {
    async create(ctx: Context, next) {
      const { values } = ctx.action.params;
      const collectionManager = new CollectionManager(ctx.db);
      const collectionModel = await collectionManager.createCollection(values);
      await collectionModel.load();
    },
  },
};

export { collectionResource };
