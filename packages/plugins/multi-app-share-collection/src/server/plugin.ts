import PluginMultiAppManager from '@nocobase/plugin-multi-app-manager';
import { Application, Plugin } from '@nocobase/server';
import lodash from 'lodash';
import { resolve } from 'path';

const subAppFilteredPlugins = ['multi-app-share-collection', 'multi-app-manager'];

class SubAppPlugin extends Plugin {
  beforeLoad() {
    const mainApp = this.options.mainApp;
    const subApp = this.app;

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

    const collectionGroups = mainApp.db.collectionGroupManager.getGroups();

    const sharedCollectionGroupsCollections = [];

    for (const group of collectionGroups) {
      if (sharedCollectionGroups.includes(group.namespace)) {
        sharedCollectionGroupsCollections.push(...group.collections);
      }
    }

    const sharedCollections = [...sharedCollectionGroupsCollections.flat(), 'users', 'users_jobs'];

    subApp.db.on('beforeDefineCollection', (options) => {
      const name = options.name;

      // 指向主应用的 系统schema
      if (sharedCollections.includes(name)) {
        options.schema = mainApp.db.options.schema || 'public';
      }
    });

    subApp.db.on('beforeUpdateCollection', (collection, newOptions) => {
      if (collection.name === 'roles') {
        newOptions.schema = subApp.db.options.schema;
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
        const appCollectionBlacklistCollection = mainApp.db.getCollection('appCollectionBlacklist');

        const blackList = await appCollectionBlacklistCollection.model.findAll({
          where: {
            applicationName: subApp.name,
          },
        });

        if (blackList.length > 0) {
          ctx.action.mergeParams({
            filter: {
              'name.$notIn': blackList.map((item) => item.get('collectionName')),
            },
          });
        }
      }
      await next();
    });

    // new subApp sync plugins from mainApp
    subApp.on('beforeInstall', async () => {
      const subAppPluginsCollection = subApp.db.getCollection('applicationPlugins');
      const mainAppPluginsCollection = mainApp.db.getCollection('applicationPlugins');

      // delete old collection
      await subApp.db.sequelize.query(`TRUNCATE ${subAppPluginsCollection.quotedTableName()}`);

      await subApp.db.sequelize.query(`
        INSERT INTO ${subAppPluginsCollection.quotedTableName()}
        SELECT *
        FROM ${mainAppPluginsCollection.quotedTableName()}
        WHERE "name" not in ('multi-app-manager', 'multi-app-share-collection');
      `);

      const sequenceNameSql = `SELECT pg_get_serial_sequence('"${subAppPluginsCollection.collectionSchema()}"."${
        subAppPluginsCollection.model.tableName
      }"', 'id')`;

      const sequenceName = (await subApp.db.sequelize.query(sequenceNameSql, { type: 'SELECT' })) as any;
      await subApp.db.sequelize.query(`
        SELECT setval('${
          sequenceName[0]['pg_get_serial_sequence']
        }', (SELECT max("id") FROM ${subAppPluginsCollection.quotedTableName()}));
      `);

      console.log(`sync plugins from ${mainApp.name} app to sub app ${subApp.name}`);
    });
  }
}

export class MultiAppShareCollectionPlugin extends Plugin {
  afterAdd() {}

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
          const subApp = await this.app.appManager.getApplication(appName);
          await callback(subApp);
        }

        return;
      }

      const subApps = [...this.app.appManager.applications.values()];

      for (const subApp of subApps) {
        await callback(subApp);
      }
    };

    this.app.on('afterSubAppAdded', (subApp) => {
      subApp.plugin(SubAppPlugin, { name: 'sub-app', mainApp: this.app });
    });

    this.app.db.on('users.afterCreateWithAssociations', async (model, options) => {
      await traverseSubApps(async (subApp) => {
        const { transaction } = options;
        const repository = subApp.db.getRepository('roles');
        const subAppModel = await subApp.db.getCollection('users').repository.findOne({
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

        if (defaultRole && (await subAppModel.countRoles({ transaction })) == 0) {
          await subAppModel.addRoles(defaultRole, { transaction });
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
      const subApps = [...this.app.appManager.applications.values()];
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
      const subApps = [...this.app.appManager.applications.values()];
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

    // this.db.addMigrations({
    //   namespace: 'multi-app-share-collection',
    //   directory: resolve(__dirname, './migrations'),
    // });

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

    // 子应用启动参数
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
        // pmSock: resolve(process.cwd(), 'storage', `${appName}.sock`),
      };
    });

    // 子应用数据库创建
    multiAppManager.setAppDbCreator(async (app) => {
      const schema = app.options.database.schema;
      await this.app.db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    });
  }

  requiredPlugins(): any[] {
    return ['multi-app-manager'];
  }
}

export default MultiAppShareCollectionPlugin;
