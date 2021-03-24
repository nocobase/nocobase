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
import * as rolesMenusActions from './actions/roles.menus';
import _ from 'lodash';

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
      console.log({values});
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

  Object.keys(rolesMenusActions).forEach(actionName => {
    resourcer.registerActionHandler(`roles.menus:${actionName}`, rolesMenusActions[actionName]);
  });

  const createDetailsViews = async (model, options) => {
    const data = model.get();
    const View = database.getModel('views_v2');
    const tableDetials = _.get(data, 'x-table-props.details') || [];
    if (tableDetials.length) {
      const details = [];
      for (const item of tableDetials) {
        if (item.view) {
          if (!item.view.id) {
            const view = await View.create(item.view);
            await view.updateAssociations(item.view);
            item.view.id = view.id;
          } else {
            const view = await View.findByPk(item.view.id);
            await view.update(item.view);
            await view.updateAssociations(item.view);
          }
          const view = await View.findOne(View.parseApiJson({
            filter: {
              id: item.view.id,
            },
            fields: {
              appends: ['collection', 'targetField', 'targetView'],
            },
          }));
          if (view) {
            console.log({view});
            item.view = view.toJSON();
          }
        }
        details.push(item);
      }
      model.set('options.x-table-props.details', details);
    }
    const calendarDetials = _.get(data, 'x-calendar-props.details') || [];
    if (calendarDetials.length) {
      const details = [];
      for (const item of calendarDetials) {
        if (item.view) {
          if (!item.view.id) {
            const view = await View.create(item.view);
            await view.updateAssociations(item.view);
            item.view.id = view.id;
          } else {
            const view = await View.findByPk(item.view.id);
            await view.update(item.view);
            await view.updateAssociations(item.view);
          }
          const view = await View.findOne(View.parseApiJson({
            filter: {
              id: item.view.id,
            },
            fields: {
              appends: ['collection', 'targetField', 'targetView'],
            },
          }));
          if (view) {
            console.log({view});
            item.view = view.toJSON();
          }
        }
        details.push(item);
      }
      model.set('options.x-calendar-props.details', details);
    }
  };

  database.getModel('views_v2').addHook('beforeCreate', createDetailsViews);
  database.getModel('views_v2').addHook('beforeUpdate', createDetailsViews);

  database.getModel('menus').addHook('beforeSave', async (model, options) => {
    const { transaction } = options;
    // console.log('beforeSave', model.get('views'));
    const items = model.get('views');
    if (!Array.isArray(items)) {
      return;
    }
    const View = database.getModel('views_v2');
    const views = [];
    for (const item of items) {
      if (item.view) {
        if (!item.view.id) {
          const view = await View.create(item.view);
          await view.updateAssociations(item.view);
          item.view.id = view.id;
        } else {
          const view = await View.findByPk(item.view.id);
          await view.update(item.view);
          await view.updateAssociations(item.view);
        }
        const view = await View.findOne(View.parseApiJson({
          filter: {
            id: item.view.id,
          },
          fields: {
            appends: ['collection', 'targetField', 'targetView'],
          },
        }));
        if (view) {
          console.log({view});
          item.view = view.toJSON();
        }
      }
      views.push(item);
    }
    model.set('views', views);
    // @ts-ignore
    model.changed('views', true);
  });
}
