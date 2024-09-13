/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions from '@nocobase/actions';
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
    // this.interceptUnauthorizedSchemaRequests();
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
    this.app.acl.allow('uiSchemas', 'getMobileJsonSchema', 'loggedIn');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.roles`,
      actions: ['roles.mobileMenuUiSchemas:*'],
    });
  }

  /**
   * used to implement: roles with permission (allowNewMobileMenu is true) can directly access the newly created menu
   */
  bindNewMenuToRoles() {
    this.app.resourceManager.define({
      name: 'mobileRoutes',
      actions: {
        async create(ctx, next) {
          const addNewMenuRoles = await ctx.db.getRepository('roles').find({
            filter: {
              allowNewMobileMenu: true,
            },
          });

          return actions.create(ctx as any, async () => {
            for (const role of addNewMenuRoles) {
              await ctx.db.getRepository('roles.mobileMenuUiSchemas', role.get('name')).add({
                // the newly created instance is saved in ctx.body
                tk: ctx.body.get('id'),
              });
            }

            await next();
          });
        },
      },
    });
  }

  // interceptUnauthorizedSchemaRequests() {
  //   // Mobile needs to use uiSchemas:getMobileJsonSchema to get the schema, and will intercept schemas without access permission
  //   this.app.resourceManager.getResource('uiSchemas')?.addAction('getMobileJsonSchema', async (ctx, next) => {
  //     const allMobileRoutes = await ctx.db.getRepository('mobileRoutes').find({
  //       sort: 'sort',
  //     });
  //     const role = await ctx.db.getRepository('roles').findOne({
  //       filterByTk: ctx.state.currentRole,
  //       appends: ['mobileMenuUiSchemas'],
  //     });
  //     const uiSchemas = ctx.db.getRepository('uiSchemas');

  //     const accessibleSchemaUidList = role.get('mobileMenuUiSchemas').map((item) => item.schemaUid);
  //     const allSchemaUidList = allMobileRoutes.map((item) => item.schemaUid);

  //     if (
  //       accessibleSchemaUidList.includes(ctx.action.params.filterByTk) ||
  //       !allSchemaUidList.includes(ctx.action.params.filterByTk)
  //     ) {
  //       ctx.body = await uiSchemas.getJsonSchema(ctx.action.params.filterByTk);
  //       return await next();
  //     }

  //     ctx.body = {};
  //     await next();
  //   });
  // }

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
        appends: ['mobileMenuUiSchemas'],
      });

      const mobileMenuUiSchemas = role.get('mobileMenuUiSchemas').map((item) => item.id);
      const result = filterMobileRoutes(items, (item) => mobileMenuUiSchemas.includes(item.id));

      ctx.body = result;

      await next();
    });
  }
}

export default PluginMobileServer;
