import { Collection } from '@nocobase/database';
import { sortBy } from 'lodash';

export default async function getDictAction(ctx, next) {
  ctx.withoutDataWrapping = true;
  let collectionNames = await ctx.db.getRepository('collections').find();
  collectionNames = collectionNames.map((item) => item.get('name'));
  const collections: any[] = [];
  for (const [name, collection] of ctx.db.collections as Map<string, Collection>) {
    // const columns: any[] = [];
    // for (const key in collection.model.rawAttributes) {
    //   if (Object.prototype.hasOwnProperty.call(collection.model.rawAttributes, key)) {
    //     const attribute = collection.model.rawAttributes[key];
    //     columns.push({
    //       realName: attribute.field,
    //       name: key,
    //     });
    //   }
    // }
    const item = {
      name,
      tableName: collection.model.tableName,
      title: collection.options.title,
      namespace: collection.options.namespace,
      duplicator: collection.options.duplicator,
      schema: collection.options.schema || process.env.DB_SCHEMA,
      // columns,
    };
    if (!item.namespace && collectionNames.includes(name)) {
      item.namespace = 'collection-manager.addon';
      if (!item.duplicator) {
        item.duplicator = 'optional';
      }
    }
    collections.push(item);
  }
  ctx.body = sortBy(collections, ['namespace', 'name']);
  await next();
}
