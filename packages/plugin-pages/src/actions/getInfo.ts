import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';

export default async (ctx, next) => {
  const { resourceKey } = ctx.action.params;
  let primaryKey: any;
  let pageName: any;
  let collectionName: any;
  console.log({resourceKey});
  const Page = ctx.db.getModel('pages_v2') as ModelCtor<Model>;
  const page = await Page.findOne(Page.parseApiJson({
    filter: {
      path: resourceKey,
    },
  }));
  ctx.body = page;
  await next();
};
