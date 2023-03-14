import PluginMultiAppManager from '@nocobase/plugin-multi-app-manager';
import { Application, InstallOptions, Plugin } from '@nocobase/server';
import lodash from 'lodash';

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
        const Collection = mainApp.db.getCollection('collections');
        const query = `
        select * from "${Collection.collectionSchema()}"."${Collection.model.tableName}"
        where (options->'syncToApps')::jsonb ? '${subApp.name}'
        `;

        const results = await mainApp.db.sequelize.query(query, { type: 'SELECT' });

        ctx.action.mergeParams({
          filter: {
            'name.$in': [...results.map((item) => item['name']), 'users', 'roles'],
          },
        });
      }
      await next();
    });
  }
}

export class MultiAppShareCollectionPlugin extends Plugin {
  afterAdd() {}

  async beforeLoad() {
    if (!this.db.inDialect('postgres')) {
      throw new Error('multi-app-share-collection plugin only support postgres');
    }

    const traverseSubApps = async (callback: (subApp: Application) => void) => {
      const subApps = [...this.app.appManager.applications.values()];

      for (const subApp of subApps) {
        await callback(subApp);
      }
    };

    const syncRelations = async (model, options) => {
      const { transaction } = options;
      const previousVal = model._previousDataValues.options?.syncToApps || [];
      const newSyncToApps = model.dataValues.options?.syncToApps || [];

      const addedApps = lodash.difference(newSyncToApps, previousVal);
      const removedApps = lodash.difference(previousVal, newSyncToApps);

      const collection = this.app.db.getCollection(model.name);

      if (addedApps.length) {
        const parentsCollection = this.app.db.inheritanceMap.getParents(collection.name);
        const relatedCollections = this.app.db.relationGraph
          .preOrder(collection.name)
          .filter((name) => name !== collection.name);

        const queryCollections = lodash.uniq([...relatedCollections, ...parentsCollection]);

        if (!queryCollections.length) {
          return;
        }

        const relatedCollectionRecords = await this.app.db.getRepository('collections').find({
          filter: {
            'name.$in': queryCollections,
          },
          transaction,
        });

        for (const addApp of addedApps) {
          for (const relatedCollectionRecord of relatedCollectionRecords) {
            const options = relatedCollectionRecord.get('options');
            const syncToApps = options?.syncToApps || [];
            if (!syncToApps.includes(addApp)) {
              syncToApps.push(addApp);
              await relatedCollectionRecord.update(
                {
                  options: {
                    ...options,
                    syncToApps,
                  },
                },
                { transaction },
              );
            }
          }
        }
      }

      if (removedApps.length) {
        const childrenCollections = this.app.db.inheritanceMap.getChildren(collection.name);

        const relatedCollections = this.app.db.relationGraph
          .preOrder(collection.name, {
            direction: 'reverse',
          })
          .filter((name) => name !== collection.name);

        const queryCollections = lodash.uniq([...relatedCollections, ...childrenCollections]);

        if (!queryCollections.length) {
          return;
        }

        const relatedCollectionRecords = await this.app.db.getRepository('collections').find({
          filter: {
            'name.$in': queryCollections,
          },
          transaction,
        });

        for (const removeApp of removedApps) {
          for (const relatedCollectionRecord of relatedCollectionRecords) {
            const options = relatedCollectionRecord.get('options');
            const syncToApps = options?.syncToApps || [];
            if (syncToApps.includes(removeApp)) {
              await relatedCollectionRecord.update(
                {
                  options: {
                    ...options,
                    syncToApps: syncToApps.filter((name) => name !== removeApp),
                  },
                },
                { transaction },
              );
              await relatedCollectionRecord.save({ transaction });
            }
          }
        }
      }
    };

    this.app.db.on('collections.afterUpdate', syncRelations);
    this.app.db.on('collections.afterCreateWithAssociations', syncRelations);

    this.app.on('beforeSubAppLoad', async ({ subApp }: { subApp: Application }) => {
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
      await traverseSubApps(async (subApp) => {
        if (subAppFilteredPlugins.includes(pluginName)) return;
        await subApp.pm.enable(pluginName);
      });
    });

    this.app.on('afterDisablePlugin', async (pluginName) => {
      await traverseSubApps(async (subApp) => {
        if (subAppFilteredPlugins.includes(pluginName)) return;
        await subApp.pm.disable(pluginName);
      });
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

    // 应用加载完之后，需要将子应用全部载入到内存中
    this.app.on('afterLoad', async () => {
      const subApplications = await this.db.getRepository('applications').find();
      for (const subApplication of subApplications) {
        await this.app.appManager.getApplication(subApplication.name);
      }
    });

    this.app.on('beforeSubAppInstall', async ({ subApp }) => {
      const subAppPluginsCollection = subApp.db.getCollection('applicationPlugins');
      const mainAppPluginsCollection = this.app.db.getCollection('applicationPlugins');

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

      const sequenceName = await subApp.db.sequelize.query(sequenceNameSql, { type: 'SELECT' });
      await subApp.db.sequelize.query(`
       SELECT setval('${
         sequenceName[0].pg_get_serial_sequence
       }', (SELECT max("id") FROM ${subAppPluginsCollection.quotedTableName()}));
      `);
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
        database: databaseOptions,
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

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {
    // test
  }

  async remove() {}
}

export default MultiAppShareCollectionPlugin;
