import Database from '@nocobase/database';
import { ResourceOptions } from '@nocobase/resourcer';
import { flatToTree } from '../utils';
import { get } from 'lodash';

function pages2routes(pages: Array<any>) {
  let routes: any = {};
  pages.forEach(page => {
    const { children = [], ...restProps } = page;
    const route: any = {
      ...restProps,
    };
    // page.type === 'layout' && 
    if (!page.redirect && children.length) {
      const items = children.sort((a, b) => a.sort - b.sort);
      route.redirect = items[0].path;
    }
    if (page.type === 'layout' && children.length) {
      route.menu = children.map(child => ({
        ...child,
        title: child.title,
        path: child.path,
        sort: child.sort,
      }));
    }
    if (page.children) {
      routes = {...routes, ...pages2routes(page.children)};
    }
    routes[page.path] = route;
  });
  return routes;
}

export default async function getRoutes(ctx, next) {
  const database: Database = ctx.database;
  const Page = database.getModel('pages');
  let pages = await Page.findAll({
    where: {
      developerMode: ctx.state.developerMode,
    },
    order: [['sort', 'asc']],
  });
  const data = flatToTree(pages.map(row => row.toJSON()), {
    id: 'id',
    parentId: 'parent_id',
    children: 'children',
  });
  ctx.body = pages2routes(data);
  await next();
}
