import PluginMultiAppManager from '@nocobase/plugin-multi-app-manager';
import { Application, AppSupervisor, Plugin } from '@nocobase/server';
import lodash from 'lodash';
import { resolve } from 'path';

const subAppFilteredPlugins = ['multi-app-share-collection', 'multi-app-manager'];

class SubAppPlugin extends Plugin {
  appCollectionBlacklist = [];

  async beforeLoad() {
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
  }
}

export class MultiAppShareCollectionPlugin extends Plugin {
  afterAdd() {}

  async beforeEnable() {
    if (!this.db.inDialect('postgres')) {
      throw new Error('multi-app-share-collection plugin only support postgres');
    }
  }

  async beforeLoad() {
    if (!this.db.inDialect('postgres')) {
      throw new Error('multi-app-share-collection plugin only support postgres');
    }

    const traverseSubApps = async (
      callback: (subApp: Application) => void,
      options?: {
        loadFromDatabase: boolean;
      },
    ) => {
      if (lodash.get(options, 'loadFromDatabase')) {
        for (const application of await this.app.db.getCollection('applications').repository.find()) {
          const appName = application.get('name');
          const subApp = await AppSupervisor.getInstance().getApp(appName);
          await callback(subApp);
        }

        return;
      }

      const subApps = [...AppSupervisor.getInstance().subApps()];

      for (const subApp of subApps) {
        await callback(subApp);
      }
    };

    const self = this;

    AppSupervisor.getInstance().on('afterAppAdded', function AddSubAppPluginIntoSubApp(app: Application) {
      if (app.name == 'main') {
        return;
      }

      app.plugin(SubAppPlugin, { name: 'sub-app', mainApp: self.app });
    });

    this.app.db.on('users.afterCreateWithAssociations', async (model, options) => {
      await traverseSubApps(async (subApp) => {
        const { transaction } = options;
        const repository = subApp.db.getRepository('roles');

        const subAppUserModel = await subApp.db.getCollection('users').repository.findOne({
          filter: {
            id: model.get('id'),
          },
          transaction,
        });

        const defaultRole = await repository.findOne({
          filter: {
            default: true,
          },
          transaction,
        });

        if (defaultRole && (await subAppUserModel.countRoles({ transaction })) == 0) {
          await subAppUserModel.addRoles(defaultRole, { transaction });
        }
      });
    });

    this.app.db.on('collection:loaded', async ({ transaction, collection }) => {
      await traverseSubApps(async (subApp) => {
        const name = collection.name;

        const collectionRecord = await subApp.db.getRepository('collections').findOne({
          filter: {
            name,
          },
          transaction,
        });

        await collectionRecord.load({ transaction });
      });
    });

    this.app.db.on('field:loaded', async ({ transaction, fieldKey }) => {
      await traverseSubApps(async (subApp) => {
        const fieldRecord = await subApp.db.getRepository('fields').findOne({
          filterByTk: fieldKey,
          transaction,
        });

        if (fieldRecord) {
          await fieldRecord.load({ transaction });
        }
      });
    });

    this.app.on('afterEnablePlugin', async (pluginName) => {
      await traverseSubApps(
        async (subApp) => {
          if (subAppFilteredPlugins.includes(pluginName)) return;
          await subApp.pm.enable(pluginName);
        },
        {
          loadFromDatabase: true,
        },
      );
    });

    this.app.on('afterDisablePlugin', async (pluginName) => {
      await traverseSubApps(
        async (subApp) => {
          if (subAppFilteredPlugins.includes(pluginName)) return;
          await subApp.pm.disable(pluginName);
        },
        {
          loadFromDatabase: true,
        },
      );
    });

    this.app.db.on('field.afterRemove', (removedField) => {
      const subApps = [...AppSupervisor.getInstance().subApps()];
      for (const subApp of subApps) {
        const collectionName = removedField.collection.name;
        const collection = subApp.db.getCollection(collectionName);
        if (!collection) {
          subApp.log.warn(`collection ${collectionName} not found in ${subApp.name}`);
          continue;
        }

        collection.removeField(removedField.name);
      }
    });

    this.app.db.on(`afterRemoveCollection`, (collection) => {
      const subApps = [...AppSupervisor.getInstance().subApps()];
      for (const subApp of subApps) {
        subApp.db.removeCollection(collection.name);
      }
    });
  }

  async load() {
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

      const plugins = [...mainApp.pm.getPlugins().keys()].filter(
        (name) => name !== 'multi-app-manager' && name !== 'multi-app-share-collection',
      );

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

    // 子应用数据库创建
    multiAppManager.setAppDbCreator(async (app) => {
      app.logger.debug('app db creator called');
      const schema = app.options.database.schema;
      await this.app.db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    });
  }

  requiredPlugins(): any[] {
    return ['multi-app-manager'];
  }
}

export default MultiAppShareCollectionPlugin;
