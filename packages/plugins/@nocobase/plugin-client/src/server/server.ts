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
import * as process from 'node:process';
import { resolve } from 'path';
import { getAntdLocale } from './antd';
import { getCronLocale } from './cron';
import { getCronstrueLocale } from './cronstrue';

async function getLang(ctx) {
  const SystemSetting = ctx.db.getRepository('systemSettings');
  const systemSetting = await SystemSetting.findOne();
  const enabledLanguages: string[] = systemSetting.get('enabledLanguages') || [];
  const currentUser = ctx.state.currentUser;
  let lang = enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
  if (enabledLanguages.includes(currentUser?.appLang)) {
    lang = currentUser?.appLang;
  }
  if (ctx.request.query.locale && enabledLanguages.includes(ctx.request.query.locale)) {
    lang = ctx.request.query.locale;
  }
  return lang;
}

export class PluginClientServer extends Plugin {
  async beforeLoad() {}

  async install() {
    const uiSchemas = this.db.getRepository<any>('uiSchemas');
    await uiSchemas.insert({
      type: 'void',
      'x-uid': 'nocobase-admin-menu',
      'x-component': 'Menu',
      'x-designer': 'Menu.Designer',
      'x-initializer': 'MenuItemInitializers',
      'x-component-props': {
        mode: 'mix',
        theme: 'dark',
        // defaultSelectedUid: 'u8',
        onSelect: '{{ onSelect }}',
        sideMenuRefScopeKey: 'sideMenuRef',
      },
      properties: {},
    });
  }

  async load() {
    this.app.localeManager.setLocaleFn('antd', async (lang) => getAntdLocale(lang));
    this.app.localeManager.setLocaleFn('cronstrue', async (lang) => getCronstrueLocale(lang));
    this.app.localeManager.setLocaleFn('cron', async (lang) => getCronLocale(lang));
    this.db.addMigrations({
      namespace: 'client',
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
    this.app.acl.allow('app', 'getLang');
    this.app.acl.allow('app', 'getInfo');
    this.app.acl.registerSnippet({
      name: 'app',
      actions: ['app:restart', 'app:clearCache'],
    });
    const dialect = this.app.db.sequelize.getDialect();

    this.app.resource({
      name: 'app',
      actions: {
        async getInfo(ctx, next) {
          const SystemSetting = ctx.db.getRepository('systemSettings');
          const systemSetting = await SystemSetting.findOne();
          const enabledLanguages: string[] = systemSetting.get('enabledLanguages') || [];
          const currentUser = ctx.state.currentUser;
          let lang = enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
          if (enabledLanguages.includes(currentUser?.appLang)) {
            lang = currentUser?.appLang;
          }

          const info: any = {
            database: {
              dialect,
            },
            version: await ctx.app.version.get(),
            lang,
            name: ctx.app.name,
            theme: currentUser?.systemSettings?.theme || systemSetting?.options?.theme || 'default',
          };

          if (process.env['EXPORT_LIMIT']) {
            info.exportLimit = parseInt(process.env['EXPORT_LIMIT']);
          }
          ctx.body = info;
          await next();
        },
        async getLang(ctx, next) {
          const lang = await getLang(ctx);
          const resources = await ctx.app.localeManager.get(lang);
          ctx.body = {
            lang,
            ...resources,
          };
          await next();
        },
        async clearCache(ctx, next) {
          await ctx.cache.reset();
          await next();
        },
        async restart(ctx, next) {
          ctx.app.runAsCLI(['restart'], { from: 'user' });
          await next();
        },
      },
    });

    this.app.auditManager.registerActions(['app:restart', 'app:clearCache']);

    this.registerActionHandlers();
    this.bindNewMenuToRoles();
    this.setACL();
  }

  setACL() {
    this.app.acl.registerSnippet({
      name: `ui.desktopRoutes`,
      actions: ['desktopRoutes:create', 'desktopRoutes:update', 'desktopRoutes:move', 'desktopRoutes:destroy'],
    });

    this.app.acl.registerSnippet({
      name: `pm.desktopRoutes`,
      actions: ['desktopRoutes:list', 'roles.desktopRoutes:*'],
    });

    this.app.acl.allow('desktopRoutes', 'listAccessible', 'loggedIn');
  }

  /**
   * used to implement: roles with permission (allowNewMenu is true) can directly access the newly created menu
   */
  bindNewMenuToRoles() {
    this.app.db.on('roles.beforeCreate', async (instance: Model) => {
      instance.set('allowNewMenu', ['admin', 'member'].includes(instance.name));
    });
    this.app.db.on('desktopRoutes.afterCreate', async (instance: Model, { transaction }) => {
      const addNewMenuRoles = await this.app.db.getRepository('roles').find({
        filter: {
          allowNewMenu: true,
        },
        transaction,
      });

      // @ts-ignore
      await this.app.db.getRepository('desktopRoutes.roles', instance.id).add({
        tk: addNewMenuRoles.map((role) => role.name),
        transaction,
      });
    });
  }

  registerActionHandlers() {
    this.app.resourceManager.registerActionHandler('desktopRoutes:listAccessible', async (ctx, next) => {
      const desktopRoutesRepository = ctx.db.getRepository('desktopRoutes');
      const rolesRepository = ctx.db.getRepository('roles');

      if (ctx.state.currentRole === 'root') {
        ctx.body = await desktopRoutesRepository.find({
          tree: true,
          ...ctx.query,
        });
        return await next();
      }

      const role = await rolesRepository.findOne({
        filterByTk: ctx.state.currentRole,
        appends: ['desktopRoutes'],
      });

      const desktopRoutesId = role.get('desktopRoutes').map((item) => item.id);

      ctx.body = await desktopRoutesRepository.find({
        tree: true,
        ...ctx.query,
        filter: {
          id: desktopRoutesId,
        },
      });

      await next();
    });
  }
}

export default PluginClientServer;
