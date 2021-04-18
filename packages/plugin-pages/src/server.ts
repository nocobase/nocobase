import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import getCollection from './actions/getCollection';
import getView from './actions/getView';
import getRoutes from './actions/getRoutes';
import getPageInfo from './actions/getPageInfo';
import * as rolesPagesActions from './actions/roles.pages';
import getCollections from './actions/getCollections';
import { list as menusList } from './actions/menus';
import getTree from './actions/getTree';
import getInfo from './actions/getInfo';
import { getInfo as viewGetInfo } from './actions/views_v2';
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

  resourcer.use(async (ctx, next) => {
    await next();
    const { actionName, resourceName } = ctx.action.params;
    if (resourceName === 'menus' && actionName === 'get') {
      const menu = ctx.body;
      const items = menu.get('views') || [];
      const View = database.getModel('views_v2');
      for (const item of items) {
        if (!(item.view && item.view.id)) {
          continue;
        }
        const view = await View.findOne(View.parseApiJson({
          filter: {
            id: item.view.id,
          },
          fields: {
            appends: ['collection', 'targetField', 'targetView'],
          },
        }));
        if (!view) {
          continue;
        }
        const details = view.get(`options.x-${view.type}-props.details`);
        if (!Array.isArray(details)) {
          item.view = view;
          continue;
        }
        for (const detail of details) {
          if (!(detail.view && detail.view.id)) {
            continue;
          }
          const detailView = await View.findOne(View.parseApiJson({
            filter: {
              id: detail.view.id,
            },
            fields: {
              appends: ['collection', 'targetField', 'targetView'],
            },
          }));
          if (!detailView) {
            continue;
          }
          detail.view = detailView;
        }
        view.set(`options.x-${view.type}-props.details`, details);
        item.view = view;
      }
      menu.set('views', items);
    }
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
    const types = ['table', 'calendar', 'kanban'];
    for (const type of types) {
      const items = _.get(data, `x-${type}-props.details`) || [];
      if (items.length) {
        const details = [];
        for (const item of items) {
          if (item.view) {
            if (!item.view.id) {
              const view = await View.create(item.view);
              await view.updateAssociations(item.view);
              item.view.id = view.id;
            } else {
              const view = await View.findByPk(item.view.id);
              if (view) {
                await view.update(item.view);
                await view.updateAssociations(item.view);
              }
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
        model.set(`options.x-${type}-props.details`, details);
      }
    }
  };

  database.getModel('views_v2').addHook('beforeCreate', createDetailsViews);
  database.getModel('views_v2').addHook('beforeUpdate', createDetailsViews);

  database.getModel('views_v2').addHook('beforeSave', async (model, options) => {
    const data = model.get();
    if (data.type !== 'kanban') {
      return;
    }
    let groupField = _.get(data, `x-kanban-props.groupField`);
    if (!groupField) {
      return;
    }
    if (typeof groupField === 'object' && groupField.name) {
      groupField = groupField.name;
    }
    const Field = database.getModel('fields');
    let field = await Field.findOne({
      where: {
        name: `${groupField}_sort`,
        collection_name: data.collection_name,
      },
    });
    if (field) {
      return;
    }
    await Field.create({
      interface: 'sort',
      type: 'sort',
      name: `${groupField}_sort`,
      // TODO: 不支持相关数据
      collection_name: data.collection_name,
      scope: [groupField],
      title: '看板分组排序',
      developerMode: true,
      component: {
        type: 'sort',
      },
    });
  });

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
