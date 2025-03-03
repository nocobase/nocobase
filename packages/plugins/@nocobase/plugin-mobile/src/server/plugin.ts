/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import PluginLocalizationServer from '@nocobase/plugin-localization';
import { tval } from '@nocobase/utils';
import actions, { Context } from '@nocobase/actions';

export class PluginMobileServer extends Plugin {
  async load() {
    this.registerActionHandlers();
    this.bindNewMenuToRoles();
    this.setACL();
    this.registerLocalizationSource();

    this.app.db.on('mobileRoutes.afterUpdate', async (instance: Model, { transaction }) => {
      if (instance.changed('enableTabs')) {
        const repository = this.app.db.getRepository('mobileRoutes');
        await repository.update({
          filter: {
            parentId: instance.id,
          },
          values: {
            hidden: !instance.enableTabs,
          },
          transaction,
        });
      }
    });
  }

  setACL() {
    this.app.acl.registerSnippet({
      name: `ui.mobile`,
      actions: ['mobileRoutes:create', 'mobileRoutes:update', 'mobileRoutes:move', 'mobileRoutes:destroy'],
    });

    this.app.acl.registerSnippet({
      name: `pm.mobile`,
      actions: ['mobileRoutes:list', 'roles.mobileRoutes:*'],
    });

    this.app.acl.allow('mobileRoutes', 'listAccessible', 'loggedIn');
  }

  /**
   * used to implement: roles with permission (allowNewMobileMenu is true) can directly access the newly created menu
   */
  bindNewMenuToRoles() {
    this.app.db.on('roles.beforeCreate', async (instance: Model) => {
      instance.set('allowNewMobileMenu', ['admin', 'member'].includes(instance.name));
    });
    this.app.db.on('mobileRoutes.afterCreate', async (instance: Model, { transaction }) => {
      const addNewMenuRoles = await this.app.db.getRepository('roles').find({
        filter: {
          allowNewMobileMenu: true,
        },
        transaction,
      });

      // @ts-ignore
      await this.app.db.getRepository('mobileRoutes.roles', instance.id).add({
        tk: addNewMenuRoles.map((role) => role.name),
        transaction,
      });
    });
  }

  registerActionHandlers() {
    this.app.resourceManager.registerActionHandler('mobileRoutes:listAccessible', async (ctx, next) => {
      const mobileRoutesRepository = ctx.db.getRepository('mobileRoutes');
      const rolesRepository = ctx.db.getRepository('roles');

      if (ctx.state.currentRole === 'root') {
        ctx.body = await mobileRoutesRepository.find({
          tree: true,
          ...ctx.query,
        });
        return await next();
      }

      const role = await rolesRepository.findOne({
        filterByTk: ctx.state.currentRole,
        appends: ['mobileRoutes'],
      });

      const mobileRoutesId = role.get('mobileRoutes').map((item) => item.id);

      ctx.body = await mobileRoutesRepository.find({
        tree: true,
        ...ctx.query,
        filter: {
          id: mobileRoutesId,
        },
      });

      await next();
    });
    const processRoleMobileRoutes = async (ctx: Context, next) => {
      const actionName = ctx.action.actionName;
      await actions[actionName](ctx, next);

      const tabs = await this.app.db.getRepository('mobileRoutes').find({
        where: {
          parentId: ctx.action.params.values,
        },
      });
      if (tabs.length > 1 || !tabs[0].hidden) {
        return;
      }
      const repository = this.app.db.getRepository('rolesMobileRoutes');
      const whereOrValues = {
        roleName: ctx.action.params.associatedIndex,
        mobileRouteId: tabs[0].id,
      };
      const rolesMobileRoute = await repository.findOne({ where: whereOrValues });

      if (actionName === 'add') {
        !rolesMobileRoute && (await repository.create({ values: whereOrValues }));
      }
      if (actionName === 'remove') {
        rolesMobileRoute && (await repository.destroy({ filter: whereOrValues }));
      }
    };
    this.app.resourceManager.registerActionHandlers({
      'roles.mobileRoutes:add': processRoleMobileRoutes,
      'roles.mobileRoutes:remove': processRoleMobileRoutes,
    });
  }

  registerLocalizationSource() {
    const localizationPlugin = this.app.pm.get('localization') as PluginLocalizationServer;
    if (!localizationPlugin) {
      return;
    }
    localizationPlugin.sourceManager.registerSource('mobile-routes', {
      title: tval('Mobile routes'),
      sync: async (ctx) => {
        const mobileRoutes = await ctx.db.getRepository('mobileRoutes').find({
          raw: true,
        });
        const resources = {};
        mobileRoutes.forEach((route: { title?: string }) => {
          if (route.title) {
            resources[route.title] = '';
          }
        });
        return {
          'lm-mobile-routes': resources,
        };
      },
      namespace: 'lm-mobile-routes',
      collections: [
        {
          collection: 'mobileRoutes',
          fields: ['title'],
        },
      ],
    });
  }
}

export default PluginMobileServer;
