import { ResourceOptions } from '@nocobase/resourcer';
import { Model, ModelCtor } from '@nocobase/database';
import _ from 'lodash';
import { Op } from 'sequelize';

export default async (ctx, next) => {
  const { resourceKey } = ctx.action.params;
  let primaryKey: any;
  let pageName: any;
  let collectionName: any;
  const roles = ctx.ac ? await ctx.ac.getRoles() : [];
  const isRoot = ctx.ac.constructor.isRoot(roles);
  const MenuPermission = ctx.db.getModel('menus_permissions');
  const menu_permissions = await MenuPermission.findAll({
    menu_id: {
      [Op.in]: roles.map(role => role.id),
    }
  });
  const menuIds = menu_permissions.map(item => item.menu_id);
  console.log({resourceKey, roles, menuIds});
  const Menu = ctx.db.getModel('menus') as ModelCtor<Model>;
  const menu = await Menu.findOne({
    where: isRoot ? {
      name: resourceKey,
    } : {
      id: {
        [Op.in]: menuIds,
      },
      name: resourceKey,
    }
  });
  if (!menu) {
    ctx.throw(404, 'Not Found');
  }
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
