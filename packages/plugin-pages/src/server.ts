import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import getCollection from './actions/getCollection';
import getView from './actions/getView';
import getRoutes from './actions/getRoutes';
import getPageInfo from './actions/getPageInfo';
import * as rolesPagesActions from './actions/roles.pages';
import getCollections from './actions/getCollections';
import menusList from './actions/menus:list';
import getTree from './actions/getTree';
import getInfo from './actions/getInfo';
import viewGetInfo from './actions/views_v2:getInfo';
import { RANDOMSTRING } from './fields/randomString';
import { registerFields, registerModels } from '@nocobase/database';
import { BaseModel } from './models/BaseModel'

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  registerFields({
    RANDOMSTRING,
  });

  registerModels({
    BaseModelV2: BaseModel,
  });

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  resourcer.use(async (ctx, next) => {
    const { actionName, resourceName, resourceKey } = ctx.action.params;
    if (resourceName === 'system_settings' && actionName === 'get') {
      const SystemSetting = database.getModel('system_settings');
      let model = await SystemSetting.findOne();
      if (!model) {
        model = await SystemSetting.create();
      }
      ctx.action.mergeParams({
        resourceKey: model.id,
      });
    }
    await next();
  });

  resourcer.use(async (ctx, next) => {
    const { actionName, resourceName, values } = ctx.action.params;
    if (resourceName === 'menus' && ['create', 'update'].includes(actionName)) {
      if (values.parent) {
        delete values.parent.children;
        ctx.action.mergeParams({
          values: {...values},
        }, {
          payload: 'replace',
        });
      }
    }
    await next();
  });

  resourcer.registerActionHandler('getCollection', getCollection);
  resourcer.registerActionHandler('getView', getView);
  resourcer.registerActionHandler('getPageInfo', getPageInfo);
  resourcer.registerActionHandler('getCollections', getCollections);
  resourcer.registerActionHandler('pages:getRoutes', getRoutes);
  resourcer.registerActionHandler('menus:getTree', getTree);
  resourcer.registerActionHandler('menus:getInfo', getInfo);
  resourcer.registerActionHandler('views_v2:getInfo', viewGetInfo);

  resourcer.registerActionHandler('menus:list', menusList);

  Object.keys(rolesPagesActions).forEach(actionName => {
    resourcer.registerActionHandler(`roles.pages:${actionName}`, rolesPagesActions[actionName]);
  });

  database.getModel('menus').addHook('beforeSave', async (model) => {
    console.log(model.get('pageName'));
  });

  // database.getModel('pages_v2').addHook('beforeValidate', async (model) => {
  //   const collectionName = model.get('collection_name');
  //   const name = model.get('name');
  //   if (!model.get('path')) {
  //     model.set('path', `${collectionName||'global'}.${name}`);
  //   }
  // });

  // database.getModel('views_v2').addHook('beforeValidate', async (model) => {
  //   const collectionName = model.get('collection_name');
  //   const name = model.get('name');
  //   if (!model.get('path')) {
  //     model.set('path', `${collectionName||'global'}.${name}`);
  //   }
  // });
/*
  const [Collection, Page, View] = database.getModels(['collections', 'pages', 'views']);

  async function createCollectionPage(model, options) {
    // const { 
    //   transaction = await database.sequelize.transaction(),
    // } = options;
    if (model.get('internal')) {
      return;
    }
    const transaction = await database.sequelize.transaction();
    const parent = await Page.findOne({
      transaction,
      where: {
        path: '/collections',
      }
    });
    let page = await Page.findOne({
      transaction,
      where: {
        collection: model.get('name'),
        path: `/collections/${model.get('name')}`,
      },
    });
    if (!page) {
      page = await Page.create({
        type: 'collection',
        collection: model.get('name'),
        path: `/collections/${model.get('name')}`,
        sort: 100,
        parent_id: parent.id,
      }, {
        transaction,
      });
    }
    page.set({
      title: model.get('title'),
      icon: model.get('icon'),
      showInMenu: !!model.get('showInDataMenu'),
    });
    await page.save({
      transaction,
    });
    await Page.collectionPagesResort({transaction});
    await transaction.commit();
  }

  Collection.addHook('afterCreate', createCollectionPage);
  Collection.addHook('afterUpdate', createCollectionPage);
  Collection.addHook('afterDestroy', async (model, options) => {
    const { transaction } = options;
    // console.log('afterDestroy', model);
    await Page.destroy({
      transaction,
      where: {
        path: `/collections/${model.get('name')}`,
      },
    });
    await Page.collectionPagesResort({transaction});
  });

  async function syncViewCollectionPage(model, options) {
    const transaction = await database.sequelize.transaction();
    const parentPath = `/collections/${model.get('collection_name')}`;
    const currentPath = `${parentPath}/views/${model.get('name')}`;
    try {
      const parent = await Page.findOne({
        transaction,
        where: {
          path: parentPath,
        },
      });
      if (!parent) {
        await transaction.rollback();
        return;
      }
      let page = await Page.findOne({
        transaction,
        where: {
          collection: model.get('collection_name'),
          path: currentPath,
        },
      });
      if (!page) {
        page = await Page.create({
          type: 'collection',
          collection: model.get('collection_name'),
          path: currentPath,
          sort: 100,
          parent_id: parent.id,
        }, {
          transaction,
        });
      }
      page.set({
        title: model.get('title'),
        viewName: model.get('name'),
        viewId: model.get('id'),
        // icon: model.get('icon'),
        showInMenu: !!model.get('showInDataMenu'),
      });
      await page.save({
        transaction,
      });
    } catch (error) {
      await transaction.rollback();
      console.error(error);
    }
    await transaction.commit();
  }
  View.addHook('beforeValidate', (model) => {
    if (model.get('default')) {
      model.set('showInDataMenu', true);
    }
  });
  View.addHook('afterCreate', syncViewCollectionPage);
  View.addHook('afterUpdate', syncViewCollectionPage);
  View.addHook('afterDestroy', async (model, options) => {
    await Page.destroy({
      where: {
        viewId: model.get('id'),
      },
    });
  });
*/
}
