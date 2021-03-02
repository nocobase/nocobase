import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';

export default async (ctx, next) => {
  const { resourceKey } = ctx.action.params;
  let primaryKey: any;
  let pageName: any;
  let collectionName: any;
  console.log({resourceKey});
  if (resourceKey.includes('.')) {
    const [ key1, key2 ] = resourceKey.split('.');
    collectionName = key1;
    pageName = key2;
  } else {
    primaryKey = resourceKey;
  }
  const Page = ctx.db.getModel('pages_v2') as ModelCtor<Model>;
  const page = await Page.findOne(Page.parseApiJson({
    filter: primaryKey ? {
      id: primaryKey,
    } : {
      name: pageName,
      collection_name: collectionName,
    },
  }));
  ctx.body = page;
  await next();
};
