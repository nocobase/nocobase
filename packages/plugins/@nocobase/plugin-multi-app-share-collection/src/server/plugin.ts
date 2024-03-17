import Database from '@nocobase/database';
import PluginMultiAppManager from '@nocobase/plugin-multi-app-manager';
import { Application, AppSupervisor, Plugin } from '@nocobase/server';
import lodash from 'lodash';
import { resolve } from 'path';

const subAppFilteredPlugins = ['multi-app-share-collection', 'multi-app-manager'];
const unSyncPlugins = ['localization-management'];

class SubAppPlugin extends Plugin {
  beforeLoad() {
    const mainApp = this.options.mainApp;
    const subApp = this.app;

    const sharedCollections = [];

    for (const collection of (mainApp.db as Database).collections.values()) {
      if (collection.options.shared) {
        sharedCollections.push(collection.name);
      }
    }

    subApp.on('beforeLoadPlugin', (plugin) => {
      if (plugin.name === 'collection-manager') {
        plugin.setLoadFilter({
          'name.$ne': 'roles',
        });
      }
    });

    subApp.db.on('beforeDefineCollection', (options) => {
      const name = options.name;

      // 共享的Collection指向主应用的 系统schema
      if (sharedCollections.includes(name)) {
        options.schema = mainApp.db.options.schema || 'public';
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
      // sync applicationPlugins collection
      await subApp.db.sync();

      const subAppPluginsCollection = subApp.db.getCollection('applicationPlugins');
      const mainAppPluginsCollection = mainApp.db.getCollection('applicationPlugins');

      // delete old collection
      await subApp.db.sequelize.query(`TRUNCATE ${subAppPluginsCollection.quotedTableName()}`);

      const columnsInfo = await subApp.db.sequelize
        .getQueryInterface()
        .describeTable(subAppPluginsCollection.getTableNameWithSchema());

      const columns = Object.keys(columnsInfo).sort();

      const columnsInSql = columns.map((column) => `"${column}"`).join(', ');

      await subApp.db.sequelize.query(`
        INSERT INTO ${subAppPluginsCollection.quotedTableName()} (${columnsInSql})
        SELECT ${columnsInSql}
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

      await subApp.reload();

      console.log(`sync plugins from ${mainApp.name} app to sub app ${subApp.name}`);
    });
  }
}

export class MultiAppShareCollectionPlugin extends Plugin {
  afterAdd() {}

  async beforeEnable() {
    if (!this.db.inDialect('postgres')) {
      throw new Error('multi-app-share-collection plugin only support postgres');
    }
    const plugin = this.pm.get('multi-app-manager');
    if (!plugin.enabled) {
      throw new Error(`${this.name} plugin need multi-app-manager plugin enabled`);
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

    const mainApp = this.app;

    function addPluginToSubApp(app) {
      if (app.name !== 'main') {
        app.plugin(SubAppPlugin, { name: 'sub-app', mainApp });
      }
    }

    // if supervisor not has listen event, add listener
    if (
      AppSupervisor.getInstance()
        .listeners('afterAppAdded')
        .filter((f) => f.name == addPluginToSubApp.name).length == 0
    ) {
      AppSupervisor.getInstance().on('afterAppAdded', addPluginToSubApp);
    }

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

    this.app.on('__restarted', () => {
      traverseSubApps((subApp) => {
        subApp.runCommand('restart');
      });
    });

    this.app.on('afterEnablePlugin', (pluginNames) => {
      traverseSubApps((subApp) => {
        for (const pluginName of lodash.castArray(pluginNames)) {
          if (subAppFilteredPlugins.includes(pluginName)) return;
          subApp.runAsCLI(['pm', 'enable', pluginName], { from: 'user' });
        }
      });
    });

    this.app.on('afterDisablePlugin', (pluginNames) => {
      traverseSubApps((subApp) => {
        for (const pluginName of lodash.castArray(pluginNames)) {
          if (subAppFilteredPlugins.includes(pluginName)) return;
          subApp.runAsCLI(['pm', 'disable', pluginName], { from: 'user' });
        }
      });
    });

    this.app.db.on(`afterRemoveCollection`, (collection) => {
      const subApps = [...AppSupervisor.getInstance().subApps()];
      for (const subApp of subApps) {
        if (subApp.db.hasCollection(collection.name)) {
          subApp.db.removeCollection(collection.name);
        }
      }
    });
  }

  async load() {
    const multiAppManager = this.app.getPlugin<any>('multi-app-manager');

    if (!multiAppManager) {
      this.app.log.warn('multi-app-share-collection plugin need multi-app-manager plugin enabled');
      return;
    }

    await this.importCollections(resolve(__dirname, 'collections'));

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
    multiAppManager.setAppOptionsFactory((appName, mainApp: Application) => {
      const mainAppDbConfig = PluginMultiAppManager.getDatabaseConfig(mainApp);

      const databaseOptions = {
        ...mainAppDbConfig,
        schema: appName,
      };

      const plugins = [...mainApp.pm.getAliases()].filter(
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
          prefix: process.env.API_BASE_PATH,
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
}

export default MultiAppShareCollectionPlugin;
