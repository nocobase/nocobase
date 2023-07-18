import PluginMultiAppManager from '@nocobase/plugin-multi-app-manager';
import { AppSupervisor, Plugin } from '@nocobase/server';
import { lodash } from '@nocobase/utils';
import { resolve } from 'path';

const subAppFilteredPlugins = ['multi-app-manager'];

export class MultiAppShareCollectionPlugin extends Plugin {
  appCollectionBlacklist = [];

  async beforeEnable() {
    if (!this.db.inDialect('postgres')) {
      throw new Error('multi-app-share-collection plugin only support postgres');
    }
  }

  async subAppBeforeLoad() {
    const sharedCollectionGroups = [
      'audit-logs',
      'workflow',
      'charts',
      'collection-manager',
      'file-manager',
      'graph-collection-manager',
      'map',
      'sequence-field',
      'snapshot-field',
      'verification',
      'localization-management',
    ];

    const collectionGroups = (await AppSupervisor.getInstance().rpcCall('main', 'db.collectionGroupManager.getGroups'))
      .result;

    const mainSchema = (await AppSupervisor.getInstance().rpcCall('main', 'db.options.schema')).result;

    const sharedCollectionGroupsCollections = [];

    for (const group of collectionGroups) {
      if (sharedCollectionGroups.includes(group.namespace)) {
        sharedCollectionGroupsCollections.push(...group.collections);
      }
    }

    const sharedCollections = [...sharedCollectionGroupsCollections.flat(), 'users', 'users_jobs'];

    this.app.db.on('beforeDefineCollection', (options) => {
      const name = options.name;

      // 指向主应用的 系统schema
      if (sharedCollections.includes(name)) {
        options.schema = mainSchema || 'public';
      }
    });

    this.app.db.on('beforeUpdateCollection', (collection, newOptions) => {
      if (collection.name === 'roles') {
        newOptions.schema = this.app.db.options.schema;
      }
    });

    this.app.resourcer.use(async (ctx, next) => {
      const { actionName, resourceName } = ctx.action;
      if (actionName === 'list' && resourceName === 'applicationPlugins') {
        ctx.action.mergeParams({
          filter: {
            'name.$notIn': subAppFilteredPlugins,
          },
        });
      }

      if (actionName === 'list' && resourceName === 'collections') {
        if (this.appCollectionBlacklist.length > 0) {
          ctx.action.mergeParams({
            filter: {
              'name.$notIn': this.appCollectionBlacklist.map((item) => item.get('collectionName')),
            },
          });
        }
      }
      await next();
    });

    this.app.on('beforeStart', async () => {
      const mainAppPlugins = (
        await AppSupervisor.getInstance().rpcCall('main', 'db.callToRepository', 'applicationPlugins', 'find')
      ).result;

      const subAppPlugins = JSON.parse(JSON.stringify(await this.app.db.getRepository('applicationPlugins').find()));
      for (const mainPlugin of mainAppPlugins) {
        if (subAppFilteredPlugins.includes(mainPlugin.name)) {
          continue;
        }

        const subPlugin = subAppPlugins.find((item) => item.name === mainPlugin.name);

        if (!subPlugin) {
          // need install
        }

        if (subPlugin.enabled != mainPlugin.enabled) {
          if (mainPlugin.enabled) {
            await this.app.pm.enable(mainPlugin.name);
          } else {
            await this.app.pm.disable(mainPlugin.name);
          }
        }
      }
    });

    this.app.on('beforeInstall', async () => {
      const applicationPluginsCollection = this.app.db.getCollection('applicationPlugins');
      await this.app.db.sequelize.query(`TRUNCATE ${applicationPluginsCollection.quotedTableName()}`);

      const mainAppPlugins = (
        await AppSupervisor.getInstance().rpcCall('main', 'db.callToRepository', 'applicationPlugins', 'find')
      ).result;

      const appPlugins = mainAppPlugins.filter((item) => !subAppFilteredPlugins.includes(item.name));

      await applicationPluginsCollection.repository.create({
        values: appPlugins,
      });
    });

    this.app.on('rpc:afterEnablePlugin', async (pluginName) => {
      console.log('enable plugin at sub app');
      await this.app.pm.enable(pluginName);
    });

    this.app.on('rpc:afterDisablePlugin', async (pluginName) => {
      await this.app.pm.disable(pluginName);
    });

    this.app.on('rpc:collection:loaded', async ({ collectionName }) => {
      const collectionRecord = await this.app.db.getRepository('collections').findOne({
        filter: {
          name: collectionName,
        },
      });

      await collectionRecord.load();
    });

    this.app.on('rpc:field:loaded', async ({ fieldKey }) => {
      const fieldRecord = await this.db.getRepository('fields').findOne({
        filterByTk: fieldKey,
      });

      if (fieldRecord) {
        await fieldRecord.load();
      }
    });

    this.app.on('rpc:field.afterRemove', async ({ collectionName, fieldName }) => {
      const collection = this.db.getCollection(collectionName);
      if (!collection) {
        return;
      }

      collection.removeField(fieldName);
    });

    this.app.on('rpc:afterRemoveCollection', async ({ collectionName }) => {
      this.db.removeCollection(collectionName);
    });

    this.app.on('rpc:users.afterCreateAfterCommit', async ({ id }) => {
      const user = await this.app.db.getRepository('users').findOne({
        filter: {
          id,
        },
      });

      if (!user) {
        return;
      }

      const defaultRole = await this.app.db.getRepository('roles').findOne({
        filter: {
          default: true,
        },
      });

      if (defaultRole && (await user.countRoles()) == 0) {
        await user.addRoles(defaultRole);
      }
    });
  }

  async mainAppBeforeLoad() {
    const appSupervisor = AppSupervisor.getInstance();

    this.app.on('rpc:afterSubAppAdded', async ({ appName }) => {
      await AppSupervisor.getInstance().rpcCall(appName, 'pm.enable', 'multi-app-share-collection');
    });

    this.app.db.on('users.afterCreateAfterCommit', async (model) => {
      await appSupervisor.rpcBroadcast(this.app, 'users.afterCreateAfterCommit', {
        id: model.get('id'),
      });
    });

    this.app.db.on('collection:loadedAfterCommit', async ({ collection }) => {
      await appSupervisor.rpcBroadcast(this.app, 'collection:loaded', {
        collectionName: collection.name,
      });
    });

    this.app.db.on('field:loadedAfterCommit', async ({ fieldKey }) => {
      await appSupervisor.rpcBroadcast(this.app, 'field:loaded', {
        fieldKey,
      });
    });

    this.app.on('afterEnablePlugin', async (pluginName) => {
      if (subAppFilteredPlugins.includes(pluginName)) return;
      await appSupervisor.rpcBroadcast(this.app, 'afterEnablePlugin', pluginName);
    });

    this.app.on('afterDisablePlugin', async (pluginName) => {
      if (subAppFilteredPlugins.includes(pluginName)) return;
      await appSupervisor.rpcBroadcast(this.app, 'afterDisablePlugin', pluginName);
    });

    this.app.db.on('field.afterRemove', async (removeField) => {
      await appSupervisor.rpcBroadcast(this.app, 'field.afterRemove', {
        collectionName: removeField.collection.name,
        fieldName: removeField.name,
      });
    });

    this.app.db.on('afterRemoveCollection', async (collection) => {
      await appSupervisor.rpcBroadcast(this.app, 'afterRemoveCollection', { collectionName: collection.name });
    });
  }

  isMainApp() {
    return this.app.name == 'main';
  }

  async beforeLoad() {
    if (!this.db.inDialect('postgres')) {
      throw new Error('multi-app-share-collection plugin only support postgres');
    }

    if (this.isMainApp()) {
      await this.mainAppBeforeLoad();
    } else {
      await this.subAppBeforeLoad();
    }
  }

  async load() {
    if (!this.isMainApp()) {
      return;
    }

    const multiAppManager = this.app.getPlugin<any>('multi-app-manager');

    if (!multiAppManager) {
      this.app.log.warn('multi-app-share-collection plugin need multi-app-manager plugin enabled');
      return;
    }

    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.resourcer.registerActionHandlers({
      'applications:shareCollections': async (ctx, next) => {
        const { filterByTk, values } = ctx.action.params;
        ctx.body = {
          filterByTk,
          values,
        };
        await next();
      },
    });

    multiAppManager.setAppOptionsFactory((appName, mainApp) => {
      const mainAppDbConfig = PluginMultiAppManager.getDatabaseConfig(mainApp);

      const databaseOptions = {
        ...mainAppDbConfig,
        schema: appName,
      };

      const plugins = [...mainApp.pm.getPlugins().keys()].filter((name) => !subAppFilteredPlugins.includes(name));

      return {
        database: lodash.merge(databaseOptions, {
          dialectOptions: {
            application_name: `nocobase.${appName}`,
          },
        }),
        plugins: plugins.includes('nocobase') ? ['nocobase'] : plugins,
        resourcer: {
          prefix: '/api',
        },
        logger: {
          ...mainApp.options.logger,
          requestWhitelist: [
            'action',
            'header.x-role',
            'header.x-hostname',
            'header.x-timezone',
            'header.x-locale',
            'referer',
            'header.x-app',
          ],
        },
      };
    });

    multiAppManager.setAppDbCreator(async (app) => {
      app.logger.debug('app db creator called');
      const schema = app.options.database.schema;
      await this.app.db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    });
  }

  requiredPlugins(): any[] {
    if (this.app.name == 'main') {
      return ['multi-app-manager'];
    }

    return [];
  }
}

export default MultiAppShareCollectionPlugin;
