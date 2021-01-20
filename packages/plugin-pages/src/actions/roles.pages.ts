import { actions } from '@nocobase/actions';
import Database from '@nocobase/database';
import { flatToTree } from '../utils';
import { Op } from 'sequelize';

export async function list(ctx: actions.Context, next: actions.Next) {
  const database: Database = ctx.db;
  const { associatedKey } = ctx.action.params;
  const Page = database.getModel('pages');
  const Collection = database.getModel('collections');
  let pages = await Page.findAll(Page.parseApiJson(ctx.state.developerMode ? {
    filter: {
      'parent_id.$notNull': true,
    },
    sort: ['sort'],
  } : {
    filter: {
      'parent_id.$notNull': true,
      developerMode: {'$isFalsy': true},
    },
    sort: ['sort'],
  }));
  const items = [];
  for (const page of pages) {
    items.push({
      id: page.id,
      key: `page-${page.id}`,
      title: page.title,
      tableName: 'pages',
      parent_id: `page-${page.parent_id}`,
      associatedKey,
      accessible: false, // TODO 对接权限
    });
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
        items.push({
          associatedKey,
          id: collection.id,
          key: `collection-${collection.id}`,
          tableName: 'collections',
          title: collection.get('title'),
          parent_id: `page-${page.id}`,
          accessible: false, // TODO 对接权限
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
              associatedKey,
              id: view.id,
              tableName: 'views',
              title: view.title,
              key: `view-${view.id}`,
              parent_id: `collection-${collection.id}`,
              accessible: false, // TODO 对接权限
            });
          }
        }
      }
    }
  }
  const data = flatToTree(items, {
    id: 'key',
    parentId: 'parent_id',
    children: 'children',
  });
  ctx.body = data;
  // TODO: 暂时 action 中间件就这么写了
  // ctx.action.mergeParams({associated: null});
  // const { associatedKey } = ctx.action.params;
  // ctx.action.mergeParams({
  //   filter: {
  //     'parent_id.$notNull': true,
  //   }
  // })
  // const done = async () => {
  //   ctx.body.rows = ctx.body.rows.map(row => {
  //     row.setDataValue('tableName', 'pages');
  //     row.setDataValue('associatedKey', parseInt(associatedKey));
  //     return row.get();
  //   });
  //   console.log(ctx.body.rows);
  //   await next();
  // }
  // return actions.common.list(ctx, done);
}

export async function update(ctx: actions.Context, next: actions.Next) {
  const {
    associated,
    resourceKey,
    values: {
      tableName,
      accessible
    }
  } = ctx.action.params;

  console.log(ctx.action.params, resourceKey);
  let [route] = await associated.getRoutes({
    where: { type: tableName, target_id: resourceKey }
  });
  if (accessible) {
    if (!route) {
      route = await associated.createRoute({ type: tableName, target_id: resourceKey });
    }
    ctx.body = route;
  } else {
    if (route) {
      await route.destroy();
    }
  }

  await next();
}
