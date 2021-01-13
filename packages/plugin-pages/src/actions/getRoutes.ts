import Database from '@nocobase/database';
import { ResourceOptions } from '@nocobase/resourcer';
import { flatToTree } from '../utils';
import { get } from 'lodash';
import { Op } from 'sequelize';

function pages2routes(pages: Array<any>) {
  let routes: any = {};
  pages.forEach(page => {
    const { children = [], ...restProps } = page;
    const route: any = {
      ...restProps,
    };
    // page.type === 'layout' && 
    if (!page.redirect && children.length) {
      const items = children.filter(item => item.showInMenu).sort((a, b) => a.sort - b.sort);
      const redirect = get(items, [0, 'path']);
      if (redirect) {
        route.redirect = redirect;
      }
    }
    if (page.type === 'layout' && children.length) {
      const items = children.filter(item => item.showInMenu).sort((a, b) => a.sort - b.sort);
      route.menu = items.map(child => ({
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
  const Collection = database.getModel('collections');
  let pages = await Page.findAll(Page.parseApiJson(ctx.state.developerMode ? {
    filter: {
    },
    sort: ['sort'],
  } : {
    filter: {
      developerMode: {'$isFalsy': true},
    },
    sort: ['sort'],
  }));
  const items = [];
  for (const page of pages) {
    items.push(page.toJSON());
    if (page.get('path') === '/collections') {
      const collections = await Collection.findAll(Collection.parseApiJson(ctx.state.developerMode ? {
        filter: {
          showInDataMenu: true,
        },
        sort: ['sort'],
      }: {
        filter: {
          developerMode: {'$isFalsy': true},
          showInDataMenu: true,
        },
        sort: ['sort'],
      }));
      for (const collection of collections) {
        const pageId = `collection-${collection.id}`;
        items.push({
          id: pageId,
          type: 'collection',
          collection: collection.get('name'),
          title: collection.get('title'),
          icon: collection.get('icon'),
          path: `/collections/${collection.name}`,
          parent_id: page.id,
          showInMenu: true,
          sort: collection.get('sort'),
        });
        const views = await collection.getViews({
          where: {
            [Op.or]: [
              { showInDataMenu: true },
              { default: true }
            ]
          },
          order: [['sort', 'asc']]
        });
        if (views.length > 1) {
          for (const view of views) {
            items.push({
              id: `view-${view.get('id')}`,
              type: 'collection',
              collection: collection.get('name'),
              title: view.title,
              viewName: view.name,
              path: `/collections/${collection.name}/views/${view.name}`,
              parent_id: pageId,
              showInMenu: true,
              sort: view.get('sort'),
            });
          }
        }
      }
    }
  }
  const data = flatToTree(items, {
    id: 'id',
    parentId: 'parent_id',
    children: 'children',
  });
  ctx.body = pages2routes(data);
  await next();
}
