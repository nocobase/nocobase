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
import _ from 'lodash';

const filterMobileRoutes = (items: any[], callback: (node: { id: number }) => boolean) => {
  // the children after filtering need to be converted to ordinary objects to take effect.
  // Otherwise, the front-end receives unfiltered children.
  const keepKeys = [
    'children',
    'createdAt',
    'icon',
    'id',
    'options',
    'parentId',
    'schemaUid',
    'sort',
    'title',
    'type',
    'updatedAt',
    'updatedById',
  ];

  for (const item of items) {
    if (Array.isArray(item.children)) {
      item.children = item.children.filter(callback).map((node) => _.pick(node, keepKeys));
    }
  }
  return items.filter(callback).map((node) => _.pick(node, keepKeys));
};

export class PluginMobileServer extends Plugin {
  async load() {
    this.registerActionHandlers();
    this.bindNewMenuToRoles();
    this.setACL();
  }

  setACL() {
    this.app.acl.registerSnippet({
      name: `ui.${this.name}`,
      actions: ['mobileRoutes:create', 'mobileRoutes:update', 'mobileRoutes:destroy'],
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
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
    this.app.db.on('mobileRoutes:afterCreate', async (instance: Model, { transaction }) => {
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
      const items = await mobileRoutesRepository.find({
        appends: ['children'],
        ...ctx.query,
      });

      if (ctx.state.currentRole === 'root') {
        ctx.body = items;
        return await next();
      }

      const role = await rolesRepository.findOne({
        filterByTk: ctx.state.currentRole,
        appends: ['mobileRoutes'],
      });

      const mobileRoutes = role.get('mobileRoutes').map((item) => item.id);
      const result = filterMobileRoutes(items, (item) => mobileRoutes.includes(item.id));

      ctx.body = result;

      await next();
    });
  }
}

export default PluginMobileServer;
