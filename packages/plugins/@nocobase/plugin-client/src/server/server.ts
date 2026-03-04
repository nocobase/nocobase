/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, MultipleRelationRepository, Transaction } from '@nocobase/database';
import PluginLocalizationServer from '@nocobase/plugin-localization';
import { Plugin } from '@nocobase/server';
import { tval } from '@nocobase/utils';
import _ from 'lodash';
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
    // const uiSchemas = this.db.getRepository<any>('uiSchemas');
    // await uiSchemas.insert({
    //   type: 'void',
    //   'x-uid': 'nocobase-admin-menu',
    //   'x-component': 'Menu',
    //   'x-designer': 'Menu.Designer',
    //   'x-initializer': 'MenuItemInitializers',
    //   'x-component-props': {
    //     mode: 'mix',
    //     theme: 'dark',
    //     // defaultSelectedUid: 'u8',
    //     onSelect: '{{ onSelect }}',
    //     sideMenuRefScopeKey: 'sideMenuRef',
    //   },
    //   properties: {},
    // });
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
      actions: ['app:restart', 'app:refresh', 'app:clearCache'],
    });
    const dialect = this.app.db.sequelize.getDialect();

    this.app.resourceManager.define({
      name: 'app',
      actions: {
        async getInfo(ctx, next) {
          const SystemSetting = ctx.db.getRepository('systemSettings');
          const systemSetting = await SystemSetting.findOne();
          const enabledLanguages: string[] = systemSetting?.get('enabledLanguages') || [];
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

          if (process.env['EXPORT_AUTO_MODE_THRESHOLD']) {
            info.exportAutoModeThreshold = parseInt(process.env['EXPORT_AUTO_MODE_THRESHOLD']);
          }

          if (process.env['EXPORT_ATTACHMENTS_AUTO_MODE_THRESHOLD']) {
            info.exportAttachmentsAutoModeThreshold = parseInt(process.env['EXPORT_ATTACHMENTS_AUTO_MODE_THRESHOLD']);
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
        async refresh(ctx, next) {
          ctx.app.runCommand('refresh');
          await next();
        },
      },
    });

    this.app.auditManager.registerActions(['app:restart', 'app:refresh', 'app:clearCache']);

    this.registerActionHandlers();
    this.bindNewMenuToRoles();
    this.setACL();
    this.registerLocalizationSource();

    this.app.db.on('desktopRoutes.afterUpdate', async (instance: Model, { transaction }) => {
      if (instance.changed('enableTabs')) {
        const repository = this.app.db.getRepository('desktopRoutes');
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
      name: `ui.desktopRoutes`,
      actions: [
        'desktopRoutes:create',
        'desktopRoutes:update',
        'desktopRoutes:move',
        'desktopRoutes:destroy',
        'desktopRoutes:updateOrCreate',
        'desktopRoutes:createV2',
        'desktopRoutes:destroyV2',
      ],
    });

    this.app.acl.registerSnippet({
      name: `pm.desktopRoutes`,
      actions: ['desktopRoutes:list', 'roles.desktopRoutes:*'],
    });

    this.app.acl.allow('desktopRoutes', ['listAccessible', 'getAccessible'], 'loggedIn');
  }

  /**
   * used to implement: roles with permission (allowNewMenu is true) can directly access the newly created menu
   */
  bindNewMenuToRoles() {
    this.app.db.on('roles.beforeCreate', async (instance: Model) => {
      instance.set(
        'allowNewMenu',
        instance.allowNewMenu === undefined ? ['admin', 'member'].includes(instance.name) : !!instance.allowNewMenu,
      );
    });
    this.db.on('desktopRoutes.afterDestroy', async (instance: Model, { transaction }) => {
      const r = this.db.getRepository('flowModels');
      if (r) {
        await r.destroy({
          filter: {
            uid: instance.get('schemaUid'),
          },
          transaction,
        });
      }
    });
    this.db.on('desktopRoutes.afterCreate', async (instance: Model, { transaction }) => {
      const r = this.db.getRepository('flowModels');
      if (r) {
        await r.create({
          transaction,
          values: {
            uid: instance.get('schemaUid'),
            name: instance.get('schemaUid'),
            schema: {
              use: 'RouteModel',
            },
          },
        });
      }
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

    const processRoleDesktopRoutes = async (params: {
      models: Model[];
      action: 'create' | 'remove';
      transaction: Transaction;
    }) => {
      const { models, action, transaction } = params;
      if (!models.length) return;
      const parentIds = models.map((x) => x.desktopRouteId);
      const tabs: Model[] = await this.app.db.getRepository('desktopRoutes').find({
        where: { parentId: parentIds, hidden: true },
        transaction,
      });
      if (!tabs.length) return;
      const repository = this.app.db.getRepository('rolesDesktopRoutes');
      const roleName = models[0].get('roleName');
      const tabIds = tabs.map((x) => x.get('id'));
      const where = { desktopRouteId: tabIds, roleName };
      if (action === 'create') {
        const exists = await repository.find({ where, transaction });
        const modelsByRouteId = _.keyBy(exists, (x) => x.get('desktopRouteId'));
        const createModels = tabs
          .map((x) => !modelsByRouteId[x.get('id')] && { desktopRouteId: x.get('id'), roleName })
          .filter(Boolean);
        for (const values of createModels) {
          await repository.firstOrCreate({
            values,
            filterKeys: ['desktopRouteId', 'roleName'],
            transaction,
          });
        }
        return;
      }

      if (action === 'remove') {
        return await repository.destroy({ filter: where, transaction });
      }
    };
    this.app.db.on('rolesDesktopRoutes.afterBulkCreate', async (instances, options) => {
      await processRoleDesktopRoutes({ models: instances, action: 'create', transaction: options.transaction });
    });

    this.app.db.on('rolesDesktopRoutes.afterBulkDestroy', async (options) => {
      const models = await this.app.db.getRepository('rolesDesktopRoutes').find({
        where: options.where,
      });
      await processRoleDesktopRoutes({ models: models, action: 'remove', transaction: options.transaction });
    });
  }

  registerActionHandlers() {
    this.app.resourceManager.registerActionHandler('desktopRoutes:listAccessible', async (ctx, next) => {
      const desktopRoutesRepository = ctx.db.getRepository('desktopRoutes');
      const rolesRepository = ctx.db.getRepository('roles');
      const { filter } = ctx.action.params;

      if (ctx.state.currentRoles.includes('root')) {
        ctx.body = await desktopRoutesRepository.find({
          tree: true,
          sort: 'sort',
          filter,
        });
        return await next();
      }

      const roles = await rolesRepository.find({
        filterByTk: ctx.state.currentRoles,
        appends: ['desktopRoutes'],
      });

      const desktopRoutesId = roles.flatMap((x) => x.get('desktopRoutes')).map((item) => item.id);

      if (desktopRoutesId) {
        const ids = (await Promise.all(desktopRoutesId)).flat();
        const result = await desktopRoutesRepository.find({
          tree: true,
          sort: 'sort',
          filter: {
            ...filter,
            id: ids,
          },
        });

        ctx.body = result;
      }

      await next();
    });

    this.app.resourceManager.registerActionHandler('desktopRoutes:getAccessible', async (ctx, next) => {
      const desktopRoutesRepository = ctx.db.getRepository('desktopRoutes');
      const rolesRepository = ctx.db.getRepository('roles');
      const { filter } = ctx.action.params;

      if (ctx.state.currentRoles.includes('root')) {
        ctx.body = await desktopRoutesRepository.findOne({
          sort: 'sort',
          ...ctx.action.params,
        });
        return await next();
      }

      const roles = await rolesRepository.find({
        filterByTk: ctx.state.currentRoles,
        appends: ['desktopRoutes'],
      });

      const desktopRoutesId = roles.flatMap((x) => x.get('desktopRoutes')).map((item) => item.id);

      if (desktopRoutesId && desktopRoutesId.length > 0) {
        const ids = (await Promise.all(desktopRoutesId)).flat();

        // 将权限检查与用户提供的 filter 合并
        const result = await desktopRoutesRepository.findOne({
          filter: {
            ...filter,
            id: ids,
          },
          ...ctx.action.params,
        });

        ctx.body = result;
      } else {
        ctx.body = null;
      }

      await next();
    });

    this.app.resourceManager.registerActionHandler('desktopRoutes:createV2', async (ctx, next) => {
      const { values } = ctx.action.params as any;
      const schemaUid = String(values?.schemaUid || '').trim();
      const title = String(values?.title || '').trim();
      const icon = values?.icon;
      const parentId = values?.parentId ?? null;

      if (!schemaUid) {
        return ctx.throw(400, { code: 'INVALID_PARAMS', message: "desktopRoutes:createV2 requires 'schemaUid'" });
      }
      if (!title) {
        return ctx.throw(400, { code: 'INVALID_PARAMS', message: "desktopRoutes:createV2 requires 'title'" });
      }

      const menuSchemaUid = `menu-${schemaUid}`;
      const tabSchemaUid = `tabs-${schemaUid}`;
      const tabSchemaName = `tab-${schemaUid}`;

      const desktopRoutesRepository = ctx.db.getRepository('desktopRoutes');
      const uiSchemasModel = ctx.db.getCollection('uiSchemas')?.model;
      const flowModelsRepository = ctx.db.getRepository('flowModels') as any;

      const transaction = await ctx.db.sequelize.transaction();

      const pickPage = (record: any) => ({
        id: record?.id,
        schemaUid: record?.schemaUid,
        title: record?.title,
        icon: record?.icon,
        parentId: record?.parentId ?? null,
        menuSchemaUid: record?.menuSchemaUid,
      });

      const pickTab = (record: any) =>
        record
          ? {
              id: record?.id,
              schemaUid: record?.schemaUid,
              tabSchemaName: record?.tabSchemaName,
            }
          : null;

      const isSameValue = (a: any, b: any) => String(a ?? '') === String(b ?? '');

      try {
        // 1) If page route exists, idempotently return it (do not backfill uiSchemas/flowModels)
        const existingPage = await desktopRoutesRepository.findOne({
          filter: { type: 'flowPage', schemaUid },
          transaction,
        });

        if (existingPage) {
          const pageJson = existingPage.toJSON?.() || existingPage;
          const conflict =
            !isSameValue(pageJson?.title, title) ||
            !isSameValue(pageJson?.icon, icon) ||
            !isSameValue(pageJson?.parentId ?? null, parentId ?? null);

          if (conflict) {
            ctx.throw(409, {
              code: 'CONFLICT',
              message: `desktopRoutes:createV2 schemaUid '${schemaUid}' already exists with different fields`,
              details: {
                expected: { title, icon, parentId: parentId ?? null },
                actual: { title: pageJson?.title, icon: pageJson?.icon, parentId: pageJson?.parentId ?? null },
              },
            });
          }

          const existingTab = await desktopRoutesRepository.findOne({
            filter: { parentId: pageJson?.id, type: 'tabs', hidden: true },
            transaction,
          });

          await transaction.commit();
          ctx.body = { page: pickPage(pageJson), defaultTab: pickTab(existingTab?.toJSON?.() || existingTab) };
          return await next();
        }

        // 2) Create path: use uiSchemas row as a per-page mutex to avoid duplicate routes without adding schemaUid unique index
        if (uiSchemasModel) {
          await uiSchemasModel.findOrCreate({
            where: { 'x-uid': schemaUid },
            defaults: {
              'x-uid': schemaUid,
              schema: {
                type: 'void',
                'x-component': 'FlowRoute',
                'x-uid': schemaUid,
              },
            },
            transaction,
          });
          const dialect = ctx.db.sequelize.getDialect();
          const supportsLock = dialect !== 'sqlite';
          await uiSchemasModel.findByPk(
            schemaUid,
            supportsLock ? { transaction, lock: transaction.LOCK.UPDATE } : { transaction },
          );
        }

        // re-check after lock
        const existingAfterLock = await desktopRoutesRepository.findOne({
          filter: { type: 'flowPage', schemaUid },
          transaction,
        });
        if (existingAfterLock) {
          const pageJson = existingAfterLock.toJSON?.() || existingAfterLock;
          const conflict =
            !isSameValue(pageJson?.title, title) ||
            !isSameValue(pageJson?.icon, icon) ||
            !isSameValue(pageJson?.parentId ?? null, parentId ?? null);

          if (conflict) {
            ctx.throw(409, {
              code: 'CONFLICT',
              message: `desktopRoutes:createV2 schemaUid '${schemaUid}' already exists with different fields`,
              details: {
                expected: { title, icon, parentId: parentId ?? null },
                actual: { title: pageJson?.title, icon: pageJson?.icon, parentId: pageJson?.parentId ?? null },
              },
            });
          }

          const existingTab = await desktopRoutesRepository.findOne({
            filter: { parentId: pageJson?.id, type: 'tabs', hidden: true },
            transaction,
          });

          await transaction.commit();
          ctx.body = { page: pickPage(pageJson), defaultTab: pickTab(existingTab?.toJSON?.() || existingTab) };
          return await next();
        }

        const createdPage = await desktopRoutesRepository.create({
          transaction,
          values: {
            type: 'flowPage',
            schemaUid,
            title,
            icon,
            parentId: parentId ?? null,
            menuSchemaUid,
            enableTabs: false,
          },
        });

        const createdTab = await desktopRoutesRepository.create({
          transaction,
          values: {
            type: 'tabs',
            parentId: createdPage.get('id'),
            schemaUid: tabSchemaUid,
            tabSchemaName,
            hidden: true,
          },
        });

        // 3) Precreate flowModels under anchors to avoid first-open findOne→save
        if (typeof flowModelsRepository?.ensureModel === 'function') {
          await flowModelsRepository.ensureModel(
            { parentId: schemaUid, subKey: 'page', subType: 'object', use: 'RootPageModel', async: true },
            { transaction },
          );
          await flowModelsRepository.ensureModel(
            { parentId: tabSchemaUid, subKey: 'grid', subType: 'object', use: 'BlockGridModel', async: true },
            { transaction },
          );
        }

        await transaction.commit();

        ctx.body = {
          page: pickPage(createdPage.toJSON()),
          defaultTab: pickTab(createdTab.toJSON()),
        };
        await next();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });

    this.app.resourceManager.registerActionHandler('desktopRoutes:destroyV2', async (ctx, next) => {
      const { values } = ctx.action.params as any;
      const schemaUid = String(values?.schemaUid || '').trim();

      if (!schemaUid) {
        return ctx.throw(400, { code: 'INVALID_PARAMS', message: "desktopRoutes:destroyV2 requires 'schemaUid'" });
      }

      const desktopRoutesRepository = ctx.db.getRepository('desktopRoutes');
      const uiSchemasRepository = ctx.db.getRepository('uiSchemas');

      const transaction = await ctx.db.sequelize.transaction();
      try {
        const page = await desktopRoutesRepository.findOne({
          filter: { type: 'flowPage', schemaUid },
          transaction,
        });

        if (page) {
          await desktopRoutesRepository.destroy({
            filterByTk: page.get('id'),
            transaction,
          });
        }

        await uiSchemasRepository.destroy({
          filterByTk: schemaUid,
          transaction,
        });

        await transaction.commit();
        ctx.body = { ok: true };
        await next();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });

    this.app.resourceManager.registerActionHandler('roles.desktopRoutes:set', async (ctx, next) => {
      let { values } = ctx.action.params;
      if (values.length) {
        const instances = await this.app.db.getRepository('desktopRoutes').find({
          filter: {
            $or: [{ id: { $in: values } }, { parentId: { $in: values } }],
          },
        });
        values = instances.map((instance) => instance.get('id'));
      }
      const { resourceName, sourceId } = ctx.action;
      const repository = this.app.db.getRepository<MultipleRelationRepository>(resourceName, sourceId);
      await repository['set'](values);

      ctx.status = 200;
      await next();
    });
  }

  registerLocalizationSource() {
    const localizationPlugin = this.app.pm.get('localization') as PluginLocalizationServer;
    if (!localizationPlugin) {
      return;
    }
    localizationPlugin.sourceManager.registerSource('desktop-routes', {
      title: tval('Desktop routes'),
      sync: async (ctx) => {
        const desktopRoutes = await ctx.db.getRepository('desktopRoutes').find({
          raw: true,
        });
        const resources = {};
        desktopRoutes.forEach((route: { title?: string }) => {
          if (route.title) {
            resources[route.title] = '';
          }
        });
        return {
          'lm-desktop-routes': resources,
        };
      },
      namespace: 'lm-desktop-routes',
      collections: [
        {
          collection: 'desktopRoutes',
          fields: ['title'],
        },
      ],
    });
  }
}

export default PluginClientServer;
