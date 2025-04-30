/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Transaction } from '@nocobase/database';
import PluginLocalizationServer from '@nocobase/plugin-localization';
import { Plugin } from '@nocobase/server';
import { tval } from '@nocobase/utils';
import _ from 'lodash';

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
    const processRoleMobileRoutes = async (params: {
      models: Model[];
      action: 'create' | 'remove';
      transaction: Transaction;
    }) => {
      const { models, action, transaction } = params;
      if (!models.length) return;
      const parentIds = models.map((x) => x.mobileRouteId);
      const tabs: Model[] = await this.app.db.getRepository('mobileRoutes').find({
        where: { parentId: parentIds, hidden: true },
        transaction,
      });
      if (!tabs.length) return;
      const repository = this.app.db.getRepository('rolesMobileRoutes');
      const roleName = models[0].get('roleName');
      const tabIds = tabs.map((x) => x.get('id'));
      const where = { mobileRouteId: tabIds, roleName };
      if (action === 'create') {
        const exists = await repository.find({ where });
        const modelsByRouteId = _.keyBy(exists, (x) => x.get('mobileRouteId'));
        const createModels = tabs
          .map((x) => !modelsByRouteId[x.get('id')] && { mobileRouteId: x.get('id'), roleName })
          .filter(Boolean);
        for (const values of createModels) {
          await repository.firstOrCreate({
            values,
            filterKeys: ['mobileRouteId', 'roleName'],
            transaction,
          });
        }
        return;
      }

      if (action === 'remove') {
        return await repository.destroy({ filter: where, transaction });
      }
    };
    this.app.db.on('rolesMobileRoutes.afterBulkCreate', async (instances, options) => {
      await processRoleMobileRoutes({ models: instances, action: 'create', transaction: options.transaction });
    });

    this.app.db.on('rolesMobileRoutes.afterBulkDestroy', async (options) => {
      const models = await this.app.db.getRepository('rolesMobileRoutes').find({
        where: options.where,
      });
      await processRoleMobileRoutes({ models: models, action: 'remove', transaction: options.transaction });
    });
  }

  registerActionHandlers() {
    this.app.resourceManager.registerActionHandler('mobileRoutes:listAccessible', async (ctx, next) => {
      const mobileRoutesRepository = ctx.db.getRepository('mobileRoutes');
      const rolesRepository = ctx.db.getRepository('roles');

      if (ctx.state.currentRoles.includes('root')) {
        ctx.body = await mobileRoutesRepository.find({
          tree: true,
          ...ctx.query,
        });
        return await next();
      }

      const roles = await rolesRepository.find({
        filterByTk: ctx.state.currentRoles,
        appends: ['mobileRoutes'],
      });

      const mobileRoutesId = roles.flatMap((x) => x.get('mobileRoutes').map((x) => x.id));

      ctx.body = await mobileRoutesRepository.find({
        tree: true,
        ...ctx.query,
        filter: {
          id: mobileRoutesId,
        },
      });

      await next();
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
