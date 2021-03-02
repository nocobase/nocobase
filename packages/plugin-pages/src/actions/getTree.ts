import { Model, ModelCtor } from '@nocobase/database';
import { flatToTree } from '../utils';

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
    if (child.path) {
      paths.push(child.path);
    }
    if (child.children) {
      paths = paths.concat(toPaths(child));
    }
  }
  return paths;
}

export default async (ctx, next) => {
  const { resourceName, resourceKey } = ctx.action.params;
  const [ Menu ] = ctx.db.getModels(['menus']) as ModelCtor<Model>[];
  const menus = await Menu.findAll(Menu.parseApiJson({
    // filter: {
    //   parent_id: null,
    // },
    sort: 'sort',
  }));
  const data = flatToTree(menus.map(item => {
    const json: any = item.toJSON();
    if (item.pageName) {
      json.path = `/admin/${item.pageName}`;
    }
    return json;
  }), {
    id: 'id',
    parentId: 'parent_id',
    children: 'children',
  });
  const items = [];
  for (const item of data) {
    item.paths = toPaths(item);
    item.path = item.paths[0] || '';
    items.push(item);
  }
  ctx.body = items;
  await next();
}
