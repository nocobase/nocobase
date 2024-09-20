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

export class PluginMobileServer extends Plugin {
  async load() {
    this.registerActionHandlers();
    this.bindNewMenuToRoles();
    this.setACL();
  }

  setACL() {
    this.app.acl.registerSnippet({
      name: `ui.mobile`,
      actions: ['mobileRoutes:create', 'mobileRoutes:update', 'mobileRoutes:destroy'],
    });

    this.app.acl.registerSnippet({
      name: `pm.mobile`,
      actions: ['mobileRoutes:list'],
    });

    this.app.acl.allow('mobileRoutes', 'listAccessible', 'loggedIn');
    this.app.acl.registerSnippet({
      name: `pm.mobile`,
      actions: ['roles.mobileRoutes:*'],
    });
  }

  /**
   * used to implement: roles with permission (allowNewMobileMenu is true) can directly access the newly created menu
   */
  bindNewMenuToRoles() {
    this.app.db.on('mobileRoutes.afterCreate', async (instance: Model, { transaction }) => {
      const addNewMenuRoles = await this.app.db.getRepository('roles').find({
        filter: {
          allowNewMobileMenu: true,
        },
        transaction,
      });

      for (const role of addNewMenuRoles) {
        await this.app.db.getRepository('roles.mobileRoutes', role.get('name')).add({
          tk: instance.get('id'),
          transaction,
        });
      }
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
  }
}

export default PluginMobileServer;
