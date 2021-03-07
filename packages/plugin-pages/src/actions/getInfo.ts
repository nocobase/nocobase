import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import _ from 'lodash';

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
  const body: any = {
    ...page.toJSON(),
  };
  if (body.views) {
    const views = [];
    for (const item of body.views) {
      let name: string;
      if (typeof item === 'object') {
        if (item.view) {
          item.name = item.view.name;
        }
        views.push(item);
      } else if (typeof item === 'string') {
        views.push({
          name: item,
          width: '100%',
        });
      }
    }
    body.views = views;
  }
  ctx.body = body;
  await next();
};
