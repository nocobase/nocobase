import { Model, ModelCtor } from '@nocobase/database';
import { flatToTree } from '../utils';
import { Op } from 'sequelize';

export function generateName(): string {
  return `${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
}

function toPaths(item) {
  if (!Array.isArray(item.children)) {
    return [];
  }
  if (item.children.length === 0) {
    return [];
  }
  let paths = [];
  for (const child of item.children) {
    if (child.path && !child.children) {
      paths.push(child.path);
    }
    if (child.children) {
      child.paths = toPaths(child);
      paths = paths.concat(child.paths);
    }
  }
  return paths;
}

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const [ Menu ] = ctx.db.getModels(['menus']) as ModelCtor<Model>[];
  const roles = ctx.ac ? await ctx.ac.getRoles() : [];
  const isRoot = ctx.ac.constructor.isRoot(roles);
  const MenuPermission = ctx.db.getModel('menus_permissions');
  const menu_permissions = await MenuPermission.findAll({
    menu_id: {
      [Op.in]: roles.map(role => role.id),
    }
  });
  const menuIds = menu_permissions.map(item => item.menu_id);
  const menus = await Menu.findAll(Menu.parseApiJson({
    filter: isRoot ? {
    } : {
      'id.in': menuIds,
    },
    sort: 'sort',
  }));
  const data = flatToTree(menus.map(item => {
    const json: any = item.toJSON();
    if (item.url) {
      json.path = item.url;
    } else {
      json.path = item.name;
    }
    return json;
  }), {
    id: 'id',
    parentId: 'parent_id',
    children: 'children',
  });
  const items = [];
  for (const item of data) {
    if (item.parent_id) {
      continue;
    }
    item.paths = toPaths(item);
    if (item.paths[0]) {
      item.path = item.paths[0];
    }
    items.push(item);
  }
  ctx.body = items;
  await next();
}
