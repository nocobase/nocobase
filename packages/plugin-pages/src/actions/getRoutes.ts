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
  const View = database.getModel('views');
  const Collection = database.getModel('collections');
  const RoutePermission = database.getModel('routes_permissions');
  const roles = ctx.ac ? await ctx.ac.getRoles() : [];
  // TODO(optimize): isRoot 的判断需要在内部完成，尽量不要交给调用者
  const isRoot = true; // ctx.ac ? ctx.ac.constructor.isRoot(roles) : true;
  const routesPermissionsMap = new Map();
  if (!isRoot) {
    const routesPermissions = await RoutePermission.findAll({
      where: {
        role_id: roles.map(({ id }) => id)
      }
    });
    routesPermissions.forEach(permission => {
      routesPermissionsMap.set(`${permission.routable_type}:${permission.routable_id}`, permission);
    });
  }
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
    if (!isRoot
      && !routesPermissionsMap.has(`pages:${page.id}`)
      // 以下路径先临时处理
      && page.get('path') !== '/'
      && page.get('path') !== '/admin'
      && page.get('path') !== '/register'
      && page.get('path') !== '/login'
    ) {
      continue;
    }
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
        if (!isRoot && !routesPermissionsMap.has(`collections:${collection.id}`)) {
          continue;
        }
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
            if (!isRoot && !routesPermissionsMap.has(`views:${view.id}`)) {
              continue;
            }
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
    } else if (page.get('path') === '/users/users') {
      const userViews = await View.findAll(View.parseApiJson(ctx.state.developerMode ? {
        filter: {
          collection_name: 'users',
          showInDataMenu: true,
        },
        sort: ['sort'],
      }: {
        filter: {
          collection_name: 'users',
          developerMode: {'$isFalsy': true},
          showInDataMenu: true,
        },
        sort: ['sort'],
      }));
      if (userViews.length > 1) {
        for (const view of userViews) {
          if (!isRoot && !routesPermissionsMap.has(`views:${view.id}`)) {
            continue;
          }
          items.push({
            id: `view-${view.get('id')}`,
            type: 'collection',
            collection: 'users',
            title: view.title,
            viewName: view.name,
            path: `${page.get('path')}/views/${view.name}`,
            parent_id: page.id,
            showInMenu: true,
            sort: view.get('sort'),
          });
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
