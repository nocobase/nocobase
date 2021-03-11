import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import _ from 'lodash';

export default async (ctx, next) => {
  const { resourceKey } = ctx.action.params;
  let primaryKey: any;
  let pageName: any;
  let collectionName: any;
  console.log({resourceKey});
  const Menu = ctx.db.getModel('menus') as ModelCtor<Model>;
  const menu = await Menu.findOne({
    where: {
      name: resourceKey,
    }
  });
  const body: any = {
    ...menu.toJSON(),
  };
  if (body.views) {
    const views = [];
    for (const item of body.views) {
      let name: string;
      if (typeof item === 'object') {
        if (item.view) {
          item.name = item.view.collection_name ? `${item.view.collection_name}.${item.view.name}` : item.view.name;
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
